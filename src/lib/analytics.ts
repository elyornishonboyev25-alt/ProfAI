import type { AuthUser } from '@/types/platform'

type Primitive = string | number | boolean
export type AnalyticsProperties = Record<string, Primitive | null | undefined>
export type AnalyticsConsent = 'granted' | 'denied'

export type AnalyticsEventName =
  | 'app_session_started'
  | 'landing_viewed'
  | 'page_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'login_completed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'diagnostic_started'
  | 'diagnostic_step_completed'
  | 'diagnostic_completed'
  | 'diagnostic_signup_started'
  | 'diagnostic_claimed'
  | 'study_session_started'
  | 'first_value_reached'
  | 'upgrade_viewed'
  | 'upgrade_started'

type Attribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  creator_code?: string
  partner_code?: string
  referral_code?: string
  referring_domain?: string
}

type StoredAttribution = {
  firstTouch: Attribution
  lastTouch: Attribution
}

type PostHogClient = (typeof import('posthog-js'))['default']

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const CONSENT_KEY = 'profai-analytics-consent-v1'
const ATTRIBUTION_KEY = 'profai-attribution-v1'
const SESSION_KEY = 'profai-analytics-session-v1'
const CONSENT_EVENT = 'profai:analytics-consent'
const OPEN_PREFERENCES_EVENT = 'profai:open-analytics-preferences'
const MAX_VALUE_LENGTH = 120

const env = import.meta.env as Record<string, string | undefined>
const config = {
  enabled: env.VITE_ANALYTICS_ENABLED === 'true',
  ga4MeasurementId: env.VITE_GA4_MEASUREMENT_ID?.trim() ?? '',
  posthogKey: env.VITE_POSTHOG_KEY?.trim() ?? '',
  posthogHost: env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
}

let posthogClient: PostHogClient | null = null
let initialization: Promise<void> | null = null
let identifiedUserId: string | null = null

function safeGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // Analytics must never make the product unusable when storage is blocked.
  }
}

function safeRemove(storage: Storage, key: string) {
  try {
    storage.removeItem(key)
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function sanitizeValue(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._~\- ]/g, '').slice(0, MAX_VALUE_LENGTH)
}

function readCurrentAttribution(): Attribution {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  const read = (...keys: string[]) => {
    const raw = keys.map((key) => params.get(key)).find(Boolean)
    return raw ? sanitizeValue(raw) || undefined : undefined
  }

  let referringDomain: string | undefined
  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer)
      if (referrer.hostname !== window.location.hostname) referringDomain = sanitizeValue(referrer.hostname)
    } catch {
      referringDomain = undefined
    }
  }

  return {
    utm_source: read('utm_source'),
    utm_medium: read('utm_medium'),
    utm_campaign: read('utm_campaign'),
    utm_content: read('utm_content'),
    utm_term: read('utm_term'),
    creator_code: read('creator', 'creator_code'),
    partner_code: read('partner', 'partner_code'),
    referral_code: read('ref', 'referral', 'referral_code'),
    referring_domain: referringDomain,
  }
}

function hasAttribution(value: Attribution) {
  return Object.values(value).some(Boolean)
}

function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === 'undefined') return null
  const raw = safeGet(window.localStorage, ATTRIBUTION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredAttribution
    return parsed?.firstTouch && parsed?.lastTouch ? parsed : null
  } catch {
    return null
  }
}

function persistAttribution(): StoredAttribution {
  const current = readCurrentAttribution()
  const stored = readStoredAttribution()
  const next: StoredAttribution = {
    firstTouch: stored?.firstTouch ?? current,
    lastTouch: hasAttribution(current) ? current : (stored?.lastTouch ?? current),
  }

  if (typeof window !== 'undefined') safeSet(window.localStorage, ATTRIBUTION_KEY, JSON.stringify(next))
  return next
}

function attributionProperties(): AnalyticsProperties {
  const stored = readStoredAttribution() ?? persistAttribution()
  return {
    first_utm_source: stored.firstTouch.utm_source,
    first_utm_medium: stored.firstTouch.utm_medium,
    first_utm_campaign: stored.firstTouch.utm_campaign,
    first_creator_code: stored.firstTouch.creator_code,
    first_partner_code: stored.firstTouch.partner_code,
    first_referral_code: stored.firstTouch.referral_code,
    first_referring_domain: stored.firstTouch.referring_domain,
    ...stored.lastTouch,
  }
}

function cleanProperties(properties: AnalyticsProperties): Record<string, Primitive> {
  const blockedKey = /(email|name|password|token|secret|document|essay|cv|content|answer|prompt|message)/i
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key, value]) => !blockedKey.test(key) && value !== null && value !== undefined)
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, MAX_VALUE_LENGTH) : value]),
  ) as Record<string, Primitive>
}

function stripQuery(value: string) {
  if (!value) return ''
  return value.split('?')[0].split('#')[0]
}

function initializeGa4() {
  if (!config.ga4MeasurementId || typeof window === 'undefined') return
  if (!window.gtag) {
    window.dataLayer = window.dataLayer ?? []
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4MeasurementId)}`
    script.dataset.profaiAnalytics = 'ga4'
    document.head.appendChild(script)
    window.gtag('js', new Date())
  }

  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  })
  window.gtag('config', config.ga4MeasurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
}

async function initializePostHog() {
  if (!config.posthogKey || typeof window === 'undefined' || posthogClient) return
  const { default: posthog } = await import('posthog-js')

  posthog.init(config.posthogKey, {
    api_host: config.posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: 'identified_only',
    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: false,
    secure_cookie: window.location.protocol === 'https:',
    ip: false,
    autocapture: {
      dom_event_allowlist: ['click', 'submit'],
      element_allowlist: ['a', 'button', 'form'],
      css_selector_ignorelist: ['.ph-no-capture', '[data-ph-no-capture]', '[data-private]'],
    },
    mask_all_text: true,
    mask_all_element_attributes: true,
    disable_session_recording: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
      blockSelector: '.ph-no-capture, [data-ph-no-capture], [data-private], [data-sensitive]',
      maskCapturedNetworkRequestFn: (request) => {
        request.name = stripQuery(request.name)
        return request
      },
    },
    before_send: (event) => {
      if (event?.properties) {
        event.properties.$current_url = stripQuery(String(event.properties.$current_url ?? ''))
        delete event.properties.$referrer
        delete event.properties.$referring_domain
      }
      return event
    },
  })
  posthog.opt_in_capturing()
  posthogClient = posthog
}

export function isAnalyticsConfigured() {
  return config.enabled && Boolean(config.ga4MeasurementId || config.posthogKey)
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null
  const value = safeGet(window.localStorage, CONSENT_KEY)
  return value === 'granted' || value === 'denied' ? value : null
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  if (typeof window === 'undefined') return
  safeSet(window.localStorage, CONSENT_KEY, consent)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }))
}

export function openAnalyticsPreferences() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))
}

export const analyticsPreferenceEvents = {
  consent: CONSENT_EVENT,
  open: OPEN_PREFERENCES_EVENT,
} as const

export async function initializeAnalytics() {
  if (!isAnalyticsConfigured() || getAnalyticsConsent() !== 'granted') return
  if (initialization) {
    await initialization
    initializeGa4()
    posthogClient?.opt_in_capturing()
    return
  }

  initialization = Promise.resolve().then(async () => {
    persistAttribution()
    initializeGa4()
    await initializePostHog()
  }).catch(() => {
    // Provider or ad-blocker failures must not affect the application.
  })

  return initialization
}

export function disableAnalytics() {
  posthogClient?.stopSessionRecording()
  posthogClient?.opt_out_capturing()
  posthogClient?.reset()
  identifiedUserId = null
  if (window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
  }
}

export function clearAnalyticsStorage() {
  if (typeof window === 'undefined') return
  safeRemove(window.localStorage, ATTRIBUTION_KEY)
  safeRemove(window.sessionStorage, SESSION_KEY)
}

export function captureAnalyticsEvent(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (!isAnalyticsConfigured() || getAnalyticsConsent() !== 'granted') return
  void initializeAnalytics().then(() => {
    const payload = cleanProperties({ ...attributionProperties(), ...properties })
    posthogClient?.capture(eventName, payload)
    window.gtag?.('event', eventName, payload)
  })
}

export function identifyAnalyticsUser(user: AuthUser | null) {
  if (!isAnalyticsConfigured() || getAnalyticsConsent() !== 'granted') return
  void initializeAnalytics().then(() => {
    if (!user) {
      if (identifiedUserId) posthogClient?.reset()
      identifiedUserId = null
      return
    }
    if (identifiedUserId === user.id) return
    identifiedUserId = user.id
    const properties = {
      role: user.role,
      premium: user.premium,
      onboarding_completed: user.onboardingCompleted,
    }
    posthogClient?.identify(user.id, properties)
    window.gtag?.('set', 'user_properties', properties)
  })
}

export function normalizeAnalyticsPath(pathname: string) {
  const rules: Array<[RegExp, string]> = [
    [/^\/results\/[^/]+(?:\/review)?$/, '/results/:id'],
    [/^\/shared\/results\/[^/]+$/, '/shared/results/:id'],
    [/^\/tests\/[^/]+\/attempt$/, '/tests/:id/attempt'],
    [/^\/test\/[^/]+$/, '/test/:id'],
    [/^\/articles\/[^/]+$/, '/articles/:slug'],
    [/^\/admission\/lessons\/[^/]+$/, '/admission/lessons/:slug'],
    [/^\/admission\/universities\/[^/]+$/, '/admission/universities/:slug'],
    [/^\/speaker\/[^/]+$/, '/speaker/:id'],
    [/^\/u\/[^/]+$/, '/u/:id'],
  ]
  return rules.find(([pattern]) => pattern.test(pathname))?.[1] ?? pathname
}

export function routeArea(pathname: string) {
  if (pathname === '/') return 'landing'
  if (pathname === '/diagnostic') return 'diagnostic'
  if (pathname === '/dashboard') return 'journey_home'
  if (/^\/(test-preparation|ielts|sat|mock|tests|test|results)/.test(pathname)) return 'test_preparation'
  if (/^\/(academic-skills|vocabulary|articles|podcast|shadowing-lab|writing-lab|speaking-lab)/.test(pathname)) return 'academic_skills'
  if (pathname.startsWith('/admission/universities')) return 'universities'
  if (pathname.startsWith('/admission')) return 'applications'
  if (pathname.startsWith('/ai-tutor')) return 'ai_coach'
  if (pathname === '/premium') return 'premium'
  if (pathname === '/register' || pathname === '/login') return 'authentication'
  if (pathname === '/onboarding') return 'onboarding'
  return 'other'
}

export function capturePageView(pathname: string) {
  const path = normalizeAnalyticsPath(pathname)
  const area = routeArea(pathname)
  captureAnalyticsEvent('page_viewed', { path, area })

  if (pathname === '/') captureAnalyticsEvent('landing_viewed', { path, area })
  if (pathname === '/register') captureAnalyticsEvent('signup_started', { method: 'page' })
  if (pathname === '/onboarding') captureAnalyticsEvent('onboarding_started')
  if (pathname === '/premium') captureAnalyticsEvent('upgrade_viewed')
  if (/^\/results\//.test(pathname)) captureAnalyticsEvent('first_value_reached', { value_type: 'test_result' })

  const studyAreas = new Set(['test_preparation', 'academic_skills', 'universities', 'applications', 'ai_coach'])
  if (studyAreas.has(area) && typeof window !== 'undefined') {
    const sessionId = safeGet(window.sessionStorage, SESSION_KEY)
    if (!sessionId) {
      safeSet(window.sessionStorage, SESSION_KEY, String(Date.now()))
      captureAnalyticsEvent('study_session_started', { area, entry_path: path })
    }
  }
}

export function captureAppSession() {
  if (typeof window === 'undefined') return
  const key = `${SESSION_KEY}:app`
  if (safeGet(window.sessionStorage, key)) return
  safeSet(window.sessionStorage, key, '1')
  captureAnalyticsEvent('app_session_started')
}

export function setSessionReplayForPath(pathname: string) {
  if (!posthogClient || getAnalyticsConsent() !== 'granted') return
  const sensitive = /^\/(login|register|onboarding|diagnostic|account|profile|writing-lab|ai-tutor)(?:\/|$)/.test(pathname)
  if (sensitive) posthogClient.stopSessionRecording()
  else posthogClient.startSessionRecording()
}
