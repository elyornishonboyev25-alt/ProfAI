import { syncStoredSession, useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'
import { notifyXpAward } from '@/store/xpNotificationStore'

const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = configuredApiUrl?.replace(/\/$/, '') ?? '/api/v1'

export function publicApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  expectedUserId?: string
  auth?: boolean
  retryOnUnauthorized?: boolean
  responseType?: 'json' | 'raw'
}

type AuthResponse = {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

/** Error thrown for non-OK API responses — carries the HTTP status and an
 *  optional machine-readable `code` (e.g. 'ACCOUNT_NOT_FOUND') so callers can
 *  branch on the exact failure without string-matching the message. */
export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type RefreshResult = 'refreshed' | 'rejected' | 'unavailable' | 'superseded'

const refreshInFlight = new Map<string, Promise<RefreshResult>>()

async function ensureRefreshed(refreshToken: string): Promise<RefreshResult> {
  let pending = refreshInFlight.get(refreshToken)
  if (!pending) {
    const refresh = async (): Promise<RefreshResult> => {
      syncStoredSession()
      if (useAuthStore.getState().refreshToken !== refreshToken) return 'superseded'
      return refreshSession(refreshToken)
    }
    // Serialize token rotation across tabs as well as within this tab. Read
    // storage inside the lock, after any previous tab has saved its new tokens.
    pending = (async (): Promise<RefreshResult> => {
      if (typeof navigator !== 'undefined' && navigator.locks) {
        return await navigator.locks.request('profai:auth-refresh', refresh)
      }
      return refresh()
    })().finally(() => { refreshInFlight.delete(refreshToken) })
    refreshInFlight.set(refreshToken, pending)
  }
  return pending
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { expectedUserId, auth = true, retryOnUnauthorized = true, headers, body, responseType = 'json', ...rest } = options
  const initiatingOwner = useAuthStore.getState().user?.id
  if (auth) syncStoredSession()
  const authState = useAuthStore.getState()

  const owner = expectedUserId ?? initiatingOwner
  if (auth && authState.user?.id !== owner) throw new ApiError('Account changed.', 409)
  if (auth && expectedUserId && authState.user?.id !== expectedUserId) throw new ApiError('Account changed.', 409)

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Content-Type', 'application/json')

  if (auth && authState.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${authState.accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (rest.signal?.aborted) throw error
    throw new Error('Unable to connect. Check your connection and try again.')
  }

  if (auth) syncStoredSession()
  if (auth && useAuthStore.getState().user?.id !== owner) throw new ApiError('Account changed.', 409)

  if (response.status === 401 && auth) {
    syncStoredSession()
    const current = useAuthStore.getState()
    const sameUser = current.user?.id === authState.user?.id
    if (retryOnUnauthorized && sameUser && current.refreshToken) {
      // A delayed 401 may refer to the token used before another request rotated
      // it. Retry with the current token without rotating the old token again.
      const result = current.accessToken !== authState.accessToken
        ? 'superseded'
        : await ensureRefreshed(current.refreshToken)
      const latest = useAuthStore.getState()
      if ((result === 'refreshed' || result === 'superseded') &&
          latest.user?.id === authState.user?.id && latest.accessToken &&
          latest.refreshToken !== authState.refreshToken) {
        return request<T>(path, { ...options, expectedUserId: owner, retryOnUnauthorized: false })
      }
      if (result === 'unavailable') {
        throw new Error('Backend is temporarily unavailable. Your session is saved and will retry automatically.')
      }
    }

    // Endpoint-specific 401s and stale responses are not proof that the current
    // session is invalid. Only a rejected refresh may clear that exact session.
    throw new ApiError('Login required. Please sign in again.', 401)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Unexpected API error.' }))
    if (['PREMIUM_REQUIRED', 'CLASS_PLAN_REQUIRED', 'TEACHER_PLAN_REQUIRED'].includes(payload.code)) window.dispatchEvent(new CustomEvent('profai:premium-required', { detail: payload.message }))
    throw new ApiError(payload.message ?? 'API request failed.', response.status, payload.code)
  }

  if (response.status === 204) {
    return {} as T
  }

  if (responseType === 'raw') return response as T

  if ((path.startsWith('/ai/') || path.startsWith('/billing/')) && rest.method === 'POST') window.dispatchEvent(new Event('profai:billing-updated'))
  const payload = await response.json() as T
  if (auth) syncStoredSession()
  if (auth && useAuthStore.getState().user?.id !== owner) throw new ApiError('Account changed.', 409)
  if (auth && owner && rest.method === 'POST') notifyXpAward(owner, payload, path, body)
  return payload
}

async function refreshSession(refreshToken: string): Promise<RefreshResult> {
  try {
    const payload = await request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      auth: false,
      retryOnUnauthorized: false,
      body: { refreshToken },
    })

    syncStoredSession()
    if (useAuthStore.getState().refreshToken !== refreshToken) return 'superseded'
    useAuthStore.getState().setSession(payload)
    return 'refreshed'
  } catch (error) {
    syncStoredSession()
    if (useAuthStore.getState().refreshToken !== refreshToken) return 'superseded'
    if (error instanceof ApiError && error.status === 401) {
      useAuthStore.getState().clearSession()
      return 'rejected'
    }
    return 'unavailable'
  }
}

export const apiClient = {
  postStream: (path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body' | 'responseType'> = {}) =>
    request<Response>(path, { ...options, method: 'POST', body, responseType: 'raw' }),
  get: <T>(path: string, options: Omit<RequestOptions, 'method'> = {}) => request<T>(path, options),
  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options: Omit<RequestOptions, 'method'> = {}) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
