import { useAuthStore } from '@/store/authStore'
import { captureAnalyticsEvent } from '@/lib/analytics'
import { claimStoredGuestDiagnostic, peekGuestDiagnosticDestination, takeGuestDiagnosticDestination } from '@/lib/guestDiagnostic'
import type { EmailAuthSession } from '@/components/auth/EmailCodeForm'

export async function finishAccountAccess(payload: EmailAuthSession, redirectPath = '/dashboard', method = 'email_code') {
  try { sessionStorage.removeItem('ivygoo:email-code-challenge') } catch { /* Optional pending challenge. */ }
  useAuthStore.getState().setSession(payload)
  const diagnosticClaimed = await claimStoredGuestDiagnostic()
  captureAnalyticsEvent(payload.isNewUser ? 'signup_completed' : 'login_completed', { method })
  if (diagnosticClaimed) captureAnalyticsEvent('diagnostic_claimed', { method })
  const destination = peekGuestDiagnosticDestination() ? takeGuestDiagnosticDestination(redirectPath) : redirectPath
  window.location.replace(destination)
}
