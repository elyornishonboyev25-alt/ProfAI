export const COMPANION_KEY = 'ivygoo:companion:v1'
export const TELEGRAM_DELAY_MS = 2 * 24 * 60 * 60 * 1000
export type CompanionState = {
  firstSeenAt: number | null
  installShownAt: number | null
  installed: boolean
  telegramShown: Record<string, number>
}
const empty = (): CompanionState => ({ firstSeenAt: null, installShownAt: null, installed: false, telegramShown: {} })
let memory = empty()
const timestamp = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

export function readCompanionState(): CompanionState {
  try {
    const raw = localStorage.getItem(COMPANION_KEY)
    if (!raw) return memory
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return memory
    memory = {
      firstSeenAt: timestamp(data.firstSeenAt) ? data.firstSeenAt : null,
      installShownAt: timestamp(data.installShownAt) ? data.installShownAt : null,
      installed: data.installed === true,
      telegramShown: Object.fromEntries(Object.entries(data.telegramShown ?? {}).filter(([, value]) => timestamp(value))) as Record<string, number>,
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
  if (!state.installShownAt && !state.installed && !installed) return 'install'
  const anchor = state.installShownAt ?? state.firstSeenAt
  if (owner && anchor && now >= anchor + TELEGRAM_DELAY_MS && !state.telegramShown[owner]) return 'telegram'
  return null
}
