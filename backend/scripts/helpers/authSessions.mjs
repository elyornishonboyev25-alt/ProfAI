import { signAccessToken } from '../../dist/utils/jwt.js'

// Route suites need tracked sessions as well as JWTs. These fixtures never
// query a database; device admission and concurrency have their own tests.
export function fixtureAccessToken(payload) {
  return signAccessToken({ ...payload, sid: `fixture:${payload.sub}` })
}

export function installSessionFixtures(prisma) {
  const original = { transaction: prisma.$transaction, queryRaw: prisma.$queryRaw,
    findUnique: prisma.authSession.findUnique, findMany: prisma.authSession.findMany, update: prisma.authSession.update }
  const session = id => ({ id, userId: id.slice('fixture:'.length), deviceId: 'unknown-test-profile',
    endedAt: null, expiresAt: new Date(Date.now() + 86400000) })
  const authSession = {
    findUnique: async ({ where }) => where.id?.startsWith('fixture:') ? session(where.id) : null,
    findMany: async () => [],
    update: async ({ where, data }) => ({ ...session(where.id), ...data }),
  }
  Object.assign(prisma.authSession, authSession)
  prisma.$queryRaw = async () => []
  prisma.$transaction = async operation => typeof operation === 'function'
    ? original.transaction.call(prisma, tx => operation({ ...tx, authSession, $queryRaw: async () => [] }))
    : original.transaction.call(prisma, operation)
  return () => {
    prisma.$transaction = original.transaction
    prisma.$queryRaw = original.queryRaw
    Object.assign(prisma.authSession, { findUnique: original.findUnique, findMany: original.findMany, update: original.update })
  }
}
