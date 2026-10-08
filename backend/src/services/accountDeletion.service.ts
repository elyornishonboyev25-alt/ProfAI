import { prisma } from '../lib/prisma.js'
import { clearDeletedAccountRuntimeData } from './accountLifecycle.js'

export async function permanentlyDeleteAccount(user: { id: string; email: string }) {
  const email = user.email.trim().toLowerCase()
  await prisma.$transaction(async (tx) => {
    // Remove restrictive classroom links before deleting the user. Direct
    // assignments must disappear rather than becoming assignments for everyone.
    await tx.learningCenter.deleteMany({ where: { createdById: user.id } })
    await tx.learningCenterInvitation.deleteMany({ where: { OR: [
      { invitedById: user.id }, { email: { equals: email, mode: 'insensitive' } },
    ] } })
    await tx.learningCenterAssignment.deleteMany({ where: { OR: [
      { createdById: user.id }, { studentId: user.id },
    ] } })

    // These records are keyed by email or use SetNull, so user cascades alone
    // cannot erase their personal data.
    await tx.authVerificationCode.deleteMany({ where: { email: { equals: email, mode: 'insensitive' } } })
    await tx.freeTrial.deleteMany({ where: { email: { equals: email, mode: 'insensitive' } } })
    await tx.guestDiagnostic.deleteMany({ where: { claimedById: user.id } })
    await tx.premiumGrant.updateMany({ where: { grantedBy: user.id }, data: { grantedBy: null } })
    await tx.paymentRequest.updateMany({ where: { reviewedBy: user.id }, data: { reviewedBy: null } })

    // Cascades erase attempts and answers, learning data, recordings and share
    // links, AI threads, vocabulary, plans, badges, XP, billing and memberships.
    // Shared test/media catalogs keep their content and lose the author link.
    await tx.user.delete({ where: { id: user.id } })
  }, { maxWait: 10_000, timeout: 60_000 })
  await clearDeletedAccountRuntimeData(user.id)
}
