const STORAGE_KEY = 'profai-referral-code'
const CODE_PATTERN = /^[A-Za-z0-9]{4,32}$/

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private windows.
  }
}

/** Remembers an invitation or promo link until the visitor has an account. */
export function captureReferralFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('promo') ?? params.get('ref')
    if (code && CODE_PATTERN.test(code)) localStorage.setItem(STORAGE_KEY, code.toUpperCase())
  } catch {
    // Ignore unavailable storage.
  }
}

/** Applies the remembered invitation to the signed-in account; every outcome ends the attempt. */
export async function claimPendingReferral() {
  const code = read()
  if (!code) return
  try {
    const { apiClient } = await import('@/lib/apiClient')
    await apiClient.post('/promo/redeem', { code })
  } catch {
    // Invalid, expired or already-claimed invitations are not retried.
  }
  clear()
}

captureReferralFromUrl()
