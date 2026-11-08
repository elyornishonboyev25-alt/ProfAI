// The old browser-wide display flag could hide the invitation before someone
// signed in. Start a fresh campaign for each existing or new account.
export const COMPANION_KEY = 'ivygoo:companion:v2'
const LEGACY_KEY = 'ivygoo:companion:v1'
export const TELEGRAM_DELAY_MS = 2 * 24 * 60 * 60 * 1000
export type CompanionAudience = {
  firstSeenAt: number
  installShownAt: number | null
  telegramShownAt: number | null
}
export type CompanionState = {
  installed: boolean
  audiences: Record<string, CompanionAudience>
}
const empty = (): CompanionState => ({ installed: false, audiences: {} })
let memory = empty()
const timestamp = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
export const companionAudienceKey = (owner?: string) => owner ? `account:${owner}` : 'guest'

export function readCompanionState(): CompanionState {
  try {
    const raw = localStorage.getItem(COMPANION_KEY)
    if (!raw) {
      // Keep actual installation evidence; legacy impressions are intentionally
      // not migrated, so current members also receive the new invitation.
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null')
      if (legacy?.installed === true) memory = { ...memory, installed: true }
      return memory
    }
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return memory
    memory = {
      installed: data.installed === true,
      audiences: Object.fromEntries(Object.entries(data.audiences ?? {}).flatMap(([key, value]) => {
        if (!value || typeof value !== 'object') return []
        const audience = value as Partial<CompanionAudience>
        if (!timestamp(audience.firstSeenAt)) return []
        return [[key, {
          firstSeenAt: audience.firstSeenAt,
          installShownAt: timestamp(audience.installShownAt) ? audience.installShownAt : null,
          telegramShownAt: timestamp(audience.telegramShownAt) ? audience.telegramShownAt : null,
        }]]
      })),
    }
  } catch { /* Keep this visit usable when browser storage is blocked. */ }
  return memory
}

export function updateCompanionState(patch: Partial<CompanionState>) {
  memory = { ...readCompanionState(), ...patch }
  try { localStorage.setItem(COMPANION_KEY, JSON.stringify(memory)) } catch { /* Once per visit in private storage. */ }
  return memory
}

export function nextCompanionOffer(state: CompanionState, now: number, owner?: string, installed = false): 'install' | 'telegram' | null {
  const audience = state.audiences[companionAudienceKey(owner)]
  if (!audience?.installShownAt && !state.installed && !installed) return 'install'
  const anchor = audience?.installShownAt ?? audience?.firstSeenAt
  if (owner && anchor && now >= anchor + TELEGRAM_DELAY_MS && !audience?.telegramShownAt) return 'telegram'
  return null
}

export function beginCompanionVisit(owner: string | undefined, now: number) {
  const state = readCompanionState()
  const key = companionAudienceKey(owner)
  if (state.audiences[key]) return state
  return updateCompanionState({ audiences: { ...state.audiences, [key]: {
    firstSeenAt: now, installShownAt: null, telegramShownAt: null,
  } } })
}

export function markCompanionOfferShown(offer: 'install' | 'telegram', owner: string | undefined, now: number) {
  const state = beginCompanionVisit(owner, now)
  const key = companionAudienceKey(owner)
  const audience = state.audiences[key]
  const field = offer === 'install' ? 'installShownAt' : 'telegramShownAt'
  if (audience[field]) return state
  return updateCompanionState({ audiences: { ...state.audiences, [key]: { ...audience, [field]: now } } })
}
