import assert from 'node:assert/strict'
import test from 'node:test'

process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/community_test'
process.env.ACCESS_TOKEN_SECRET = 'community-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET = 'community-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { signAccessToken } = await import('../dist/utils/jwt.js')
const { default: router } = await import('../dist/routes/profile.routes.js')
const { default: express } = await import('express')

function learner(id, xp, profile = { isPublic: true, showLeaderboard: true }) {
  return { id, nickname: id, xp, profile, avatarUrl: null, currentStreak: 2, createdAt: new Date('2026-01-01'), lastActiveDate: new Date(), level: 2, _count: { skillBadges: 1 } }
}
let users = []
// Upstream authentication now verifies that the account still exists.
prisma.user.findUnique = async ({ where }) => ({ id: where.id, role: 'USER' })
prisma.user.findMany = async ({ where }) => users.filter(user => user.id !== where.id.not && (!where.nickname || user.nickname?.toLowerCase().includes(where.nickname.contains.toLowerCase())) && user.profile?.isPublic !== false).slice(0, 24)
prisma.user.findFirst = async ({ where, orderBy }) => {
  assert.equal(where.xp.gt, 0)
  assert.equal(where.nickname.not, null)
  assert.deepEqual(where.OR, [{ profile: { is: null } }, { profile: { is: { isPublic: true, showLeaderboard: true } } }])
  assert.equal(where.id, undefined, 'The current learner is eligible too')
  assert.equal(where.country, undefined, 'Discovery filters cannot change the crown')
  return users.filter(user => user.nickname && user.xp > 0 && (!user.profile || user.profile.isPublic && user.profile.showLeaderboard))
    .sort((a, b) => {
      for (const order of orderBy) {
        const [key, direction] = Object.entries(order)[0]
        const delta = typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : Number(a[key]) - Number(b[key])
        if (delta) return direction === 'desc' ? -delta : delta
      }
      return 0
    })[0] ?? null
}

test('Community crown is global, follows current earned XP, respects privacy and resolves ties', async () => {
  const app = express()
  app.use('/profile', router)
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const request = async (id = 'Viewer', query = '') => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/profile/search?${query}`, { headers: { Authorization: `Bearer ${signAccessToken({ sub: id, role: 'USER' })}` } })
    assert.equal(response.status, 200)
    return response.json()
  }
  try {
    users = [learner('Leader', 900), learner('Partner', 800), learner('Private', 3000, { isPublic: false, showLeaderboard: true }), learner('HiddenRank', 4000, { isPublic: true, showLeaderboard: false }), { ...learner('NoHandle', 5000), nickname: null }]
    const initial = await request()
    assert.equal(initial.topLearner.nickname, 'Leader')
    assert.equal(initial.results.find(row => row.nickname === 'Leader').dailyChampion, true)
    const filtered = await request('Viewer', 'q=Partner')
    assert.equal(filtered.topLearner.nickname, 'Leader')
    assert.equal(filtered.results[0].dailyChampion, false, 'A filter must not crown another learner')
    const own = await request('Leader')
    assert.equal(own.topLearner.nickname, 'Leader')
    assert.ok(!own.results.some(row => row.nickname === 'Leader'))
    users[1].xp = 950
    assert.equal((await request()).topLearner.nickname, 'Partner', 'A same-day XP overtake updates immediately')
    users[0].xp = 950
    users[0].currentStreak = 5
    assert.equal((await request()).topLearner.nickname, 'Leader', 'XP ties use streak')
    users[1].currentStreak = 5
    users[1].createdAt = new Date('2025-12-01')
    assert.equal((await request()).topLearner.nickname, 'Partner', 'Remaining ties use membership date')
    users = [learner('NewAccount', 0)]
    assert.equal((await request()).topLearner, null, 'No fabricated crown before XP is earned')
  } finally { await new Promise(resolve => server.close(resolve)); await prisma.$disconnect() }
})
