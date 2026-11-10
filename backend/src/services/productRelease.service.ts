import { prisma } from '../lib/prisma.js'

export const NOVA_RELEASE_ID = 'nova-studio-2026-11'
// Fixed when this announcement was requested. Later registrations are excluded,
// even when a server restarts or an existing learner signs in months later.
export const NOVA_EXISTING_ACCOUNT_CUTOFF = new Date('2026-11-10T12:00:08.000Z')
const receiptKey = `ivygoo:release:${NOVA_RELEASE_ID}:shown`

async function existingAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } })
  return Boolean(user && user.createdAt.getTime() < NOVA_EXISTING_ACCOUNT_CUTOFF.getTime())
}

export async function novaReleaseFor(userId: string) {
  if (!await existingAccount(userId)) return { releaseId: NOVA_RELEASE_ID, eligible: false }
  const receipt = await prisma.accountLearningData.findUnique({ where: { userId_key: { userId, key: receiptKey } }, select: { value: true } })
  return { releaseId: NOVA_RELEASE_ID, eligible: !receipt?.value }
}

/** Called only after the dialog is visible. The receipt follows the account across devices. */
export async function recordNovaReleaseShown(userId: string) {
  if (!await existingAccount(userId)) return { recorded: false }
  await prisma.accountLearningData.upsert({
    where: { userId_key: { userId, key: receiptKey } },
    create: { userId, key: receiptKey, value: new Date().toISOString() },
    update: {},
  })
  return { recorded: true }
}
