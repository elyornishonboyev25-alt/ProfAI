import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

// Run the actual production SQL on an isolated PostgreSQL engine. These tests
// never read DATABASE_URL, connect to Railway or modify a real user account.
test('persistent streak restoration and database enforcement', async t => {
  let db = await PGlite.create()
  t.after(() => db.close())
  await db.exec(`
    CREATE TABLE "User" (id TEXT PRIMARY KEY, "currentStreak" INT NOT NULL DEFAULT 0,
      "longestStreak" INT NOT NULL DEFAULT 0, xp INT NOT NULL DEFAULT 0,
      "lastActiveDate" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) DEFAULT NOW());
    CREATE TABLE "UserProfile" ("userId" TEXT PRIMARY KEY REFERENCES "User"(id), timezone TEXT);
    CREATE TABLE "XpEvent" (id TEXT PRIMARY KEY, "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
      source TEXT NOT NULL, "eventKey" TEXT NOT NULL, amount INT NOT NULL,
      metadata JSONB, "earnedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      UNIQUE("userId", "eventKey"));
    CREATE TABLE "TestAttempt" ("userId" TEXT REFERENCES "User"(id), "completedAt" TIMESTAMP(3), "streakAtCompletion" INT);
    CREATE TABLE "SpeakingSession" ("userId" TEXT REFERENCES "User"(id), "createdAt" TIMESTAMP(3));
    CREATE TABLE "AuthSession" ("userId" TEXT REFERENCES "User"(id), "loginAt" TIMESTAMP(3), "lastSeenAt" TIMESTAMP(3));
    INSERT INTO "User"(id,"currentStreak","longestStreak",xp,"lastActiveDate") VALUES
      ('restored',2,37,300,'2020-01-01 20:00:00'),
      ('test-history',3,5,100,NULL), ('day-history',0,0,20,NULL), ('new-user',0,0,0,NULL);
    INSERT INTO "UserProfile" VALUES ('restored','Asia/Tashkent'),('test-history','Invalid/Zone');
    INSERT INTO "TestAttempt" VALUES ('test-history','2020-01-01 12:00:00',42);
    INSERT INTO "XpEvent"(id,"userId",source,"eventKey",amount,"earnedAt") VALUES
      ('h1','day-history','DAILY_LOGIN','DAILY_LOGIN:2020-01-01',5,'2020-01-01 18:00:00'),
      ('h2','day-history','DAILY_LOGIN','DAILY_LOGIN:2020-01-02',5,'2020-01-02 18:00:00'),
      ('h3','day-history','DAILY_LOGIN','DAILY_LOGIN:2020-01-03',5,'2020-01-03 18:00:00'),
      ('h4','day-history','DAILY_LOGIN','DAILY_LOGIN:2020-01-04',5,'2020-01-04 18:00:00'),
      ('invalid','day-history','DAILY_LOGIN','DAILY_LOGIN:2020-02-30',0,'2020-01-01 12:00:00'),
      ('future','day-history','DAILY_LOGIN','DAILY_LOGIN:2100-01-01',0,'2100-01-01 12:00:00');
  `)
  const sql = await readFile(new URL('../prisma/migrations/20261127173000_durable_learning_streaks/migration.sql', import.meta.url), 'utf8')
  await db.exec(sql)
  const streak = async userId => (await db.query('SELECT "currentStreak","longestStreak",xp FROM "User" WHERE id=$1', [userId])).rows[0]
  let serial = 0
  const visit = (userId, day) => db.query(`INSERT INTO "XpEvent" (id,"userId",source,"eventKey",amount,"earnedAt")
    VALUES ($1,$2,'STREAK_DAY',$3,0,$4) ON CONFLICT("userId","eventKey") DO NOTHING`,
  [`visit-${++serial}`, userId, `STREAK_DAY:${day}`, `${day} 12:00:00`])

  await t.test('all historical records are restored without changing XP or inventing missed days', async () => {
    assert.deepEqual(await streak('restored'), { currentStreak: 37, longestStreak: 37, xp: 300 })
    assert.equal((await streak('test-history')).currentStreak, 42)
    assert.equal((await streak('day-history')).currentStreak, 4)
    assert.equal((await streak('new-user')).currentStreak, 0)
    const audit = (await db.query('SELECT * FROM "LearningStreakRestoration" WHERE "userId"=$1', ['restored'])).rows[0]
    assert.equal(audit.previousCurrent, 2)
    assert.equal(audit.previousLongest, 37)
    assert.equal(audit.restoredStreak, 37)
    const invalidDays = await db.query(`SELECT "eventKey" FROM "XpEvent" WHERE source='STREAK_DAY' AND ("eventKey" LIKE '%02-30' OR "eventKey" LIKE '%2100%')`)
    assert.equal(invalidDays.rows.length, 0)
  })
  await t.test('historical visits and concurrent duplicate requests do not increment a day twice', async () => {
    await visit('restored', '2020-01-02') // The legacy UTC timestamp was 01:00 Tashkent.
    assert.equal((await streak('restored')).currentStreak, 37)
    await Promise.all(Array.from({ length: 20 }, () => visit('restored', '2020-01-05')))
    assert.equal((await streak('restored')).currentStreak, 38)
  })
  await t.test('a later active day adds one even after a long absence; stale writes cannot reset it', async () => {
    await visit('restored', '2020-06-15')
    await db.query('UPDATE "User" SET "currentStreak"=2,"longestStreak"=2 WHERE id=$1', ['restored'])
    assert.deepEqual(await streak('restored'), { currentStreak: 39, longestStreak: 39, xp: 300 })
  })
  await t.test('a failed transaction rolls back the day and counter together and can be retried', async () => {
    await db.exec('BEGIN')
    await visit('restored', '2020-06-16')
    assert.equal((await streak('restored')).currentStreak, 40)
    await db.exec('ROLLBACK')
    assert.equal((await streak('restored')).currentStreak, 39)
    await visit('restored', '2020-06-16')
    assert.equal((await streak('restored')).currentStreak, 40)
    await visit('new-user', '2020-06-16')
    assert.equal((await streak('new-user')).currentStreak, 1)
  })
  await t.test('database reload preserves the restoration, ledger and protection', async () => {
    const data = await db.dumpDataDir()
    await db.close()
    db = await PGlite.create({ loadDataDir: data })
    await visit('restored', '2020-06-16')
    assert.equal((await streak('restored')).currentStreak, 40)
    await db.query('UPDATE "User" SET "currentStreak"=0 WHERE id=$1', ['restored'])
    assert.equal((await streak('restored')).currentStreak, 40)
    assert.equal((await db.query('SELECT count(*)::int AS count FROM "LearningStreakRestoration"')).rows[0].count, 4)
  })
})
