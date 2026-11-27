BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '90s';

-- Keep the historical snapshot, restoration and ledger backfill atomic while
-- existing application instances may still be serving requests.
LOCK TABLE "User", "XpEvent" IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE "LearningStreakRestoration" (
  "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "previousCurrent" INTEGER NOT NULL,
  "previousLongest" INTEGER NOT NULL,
  "restoredStreak" INTEGER NOT NULL,
  "restoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "LearningStreakRestoration" ("userId", "previousCurrent", "previousLongest", "restoredStreak")
SELECT u."id", u."currentStreak", u."longestStreak",
       GREATEST(0, u."currentStreak", u."longestStreak", COALESCE(a.best, 0))
FROM "User" u
LEFT JOIN (SELECT "userId", MAX("streakAtCompletion") AS best FROM "TestAttempt" GROUP BY "userId") a
  ON a."userId" = u."id";

-- Preserve actual historical calendar days, including legacy login rewards.
-- Missing days are never fabricated and this backfill awards no additional XP.
WITH zones AS (
  SELECT u."id", COALESCE(tz.name, 'Asia/Tashkent') AS zone
  FROM "User" u LEFT JOIN "UserProfile" p ON p."userId" = u."id"
  LEFT JOIN pg_timezone_names tz ON tz.name = p."timezone"
), activity AS (
  SELECT e."userId", (e."earnedAt" AT TIME ZONE 'UTC' AT TIME ZONE z.zone)::date AS day, e."earnedAt" AS seen
  FROM "XpEvent" e JOIN zones z ON z."id" = e."userId"
  UNION ALL
  SELECT e."userId", CASE WHEN pg_input_is_valid(substring(e."eventKey" FROM 13), 'date')
    THEN substring(e."eventKey" FROM 13)::date END, e."earnedAt"
  FROM "XpEvent" e WHERE e."source" = 'DAILY_LOGIN' AND e."eventKey" ~ '^DAILY_LOGIN:[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  UNION ALL
  SELECT a."userId", (a."completedAt" AT TIME ZONE 'UTC' AT TIME ZONE z.zone)::date, a."completedAt"
  FROM "TestAttempt" a JOIN zones z ON z."id" = a."userId"
  UNION ALL
  SELECT s."userId", (s."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE z.zone)::date, s."createdAt"
  FROM "SpeakingSession" s JOIN zones z ON z."id" = s."userId"
  UNION ALL
  SELECT s."userId", (s."loginAt" AT TIME ZONE 'UTC' AT TIME ZONE z.zone)::date, s."loginAt"
  FROM "AuthSession" s JOIN zones z ON z."id" = s."userId"
  UNION ALL
  SELECT s."userId", (s."lastSeenAt" AT TIME ZONE 'UTC' AT TIME ZONE z.zone)::date, s."lastSeenAt"
  FROM "AuthSession" s JOIN zones z ON z."id" = s."userId"
  UNION ALL
  SELECT u."id", (u."lastActiveDate" AT TIME ZONE 'UTC' AT TIME ZONE z.zone)::date, u."lastActiveDate"
  FROM "User" u JOIN zones z ON z."id" = u."id" WHERE u."lastActiveDate" IS NOT NULL
), days AS (
  SELECT a."userId", a.day, MIN(a.seen) AS seen
  FROM activity a JOIN zones z ON z."id" = a."userId"
  WHERE a.day <= (CURRENT_TIMESTAMP AT TIME ZONE z.zone)::date
  GROUP BY a."userId", a.day
)
INSERT INTO "XpEvent" ("id", "userId", "source", "eventKey", "amount", "metadata", "earnedAt", "createdAt")
SELECT md5("userId" || ':STREAK_DAY:' || day::text), "userId", 'STREAK_DAY', 'STREAK_DAY:' || day::text,
       0, '{"reason":"historical_streak_restoration"}'::jsonb, seen, CURRENT_TIMESTAMP
FROM days ON CONFLICT ("userId", "eventKey") DO NOTHING;

-- Recover a longer provable historical run too, when its old cached counter
-- had already been reduced. Historical rows retain their original dates.
WITH numbered AS (
  SELECT "userId", substring("eventKey" FROM 12)::date AS day,
         row_number() OVER (PARTITION BY "userId" ORDER BY "eventKey")::int AS ordinal
  FROM "XpEvent" WHERE "source" = 'STREAK_DAY'
), runs AS (
  SELECT "userId", COUNT(*)::int AS length FROM numbered GROUP BY "userId", day - ordinal
), best AS (
  SELECT "userId", MAX(length) AS length FROM runs GROUP BY "userId"
)
UPDATE "LearningStreakRestoration" r SET "restoredStreak" = GREATEST(r."restoredStreak", best.length)
FROM best WHERE best."userId" = r."userId";

UPDATE "User" u SET "currentStreak" = r."restoredStreak",
  "longestStreak" = GREATEST(u."longestStreak", r."restoredStreak"), "updatedAt" = CURRENT_TIMESTAMP
FROM "LearningStreakRestoration" r WHERE r."userId" = u."id";

-- Database enforcement also protects against stale responses, concurrent
-- transactions and an older application instance trying to reset a counter.
CREATE FUNCTION preserve_learning_streak() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."currentStreak" := GREATEST(0, OLD."currentStreak", OLD."longestStreak", NEW."currentStreak");
  NEW."longestStreak" := GREATEST(OLD."longestStreak", NEW."longestStreak", NEW."currentStreak");
  RETURN NEW;
END;
$$;
CREATE TRIGGER preserve_learning_streak BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION preserve_learning_streak();

CREATE FUNCTION lock_learning_streak_day() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Every writer takes the account lock before the unique ledger key. This
  -- keeps concurrent requests and test-result transactions in the same order.
  PERFORM 1 FROM "User" WHERE "id" = NEW."userId" FOR UPDATE;
  RETURN NEW;
END;
$$;
CREATE TRIGGER lock_learning_streak_day BEFORE INSERT ON "XpEvent"
FOR EACH ROW WHEN (NEW."source" = 'STREAK_DAY') EXECUTE FUNCTION lock_learning_streak_day();

CREATE FUNCTION increment_learning_streak_day() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "User" SET "currentStreak" = GREATEST("currentStreak", "longestStreak") + 1,
    "longestStreak" = GREATEST("currentStreak", "longestStreak") + 1, "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = NEW."userId";
  RETURN NEW;
END;
$$;
CREATE TRIGGER increment_learning_streak_day AFTER INSERT ON "XpEvent"
FOR EACH ROW WHEN (NEW."source" = 'STREAK_DAY') EXECUTE FUNCTION increment_learning_streak_day();

COMMIT;
