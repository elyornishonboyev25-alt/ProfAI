// Tracks whether someone is actually using this browser, so an idle or hidden
// tab does not keep the account locked against the owner's other devices.
const IDLE_AFTER_MS = 15 * 60_000
const TABS_KEY = 'profai-open-tabs-v1'
const TAB_STALE_MS = 15_000
const tabId = Math.random().toString(36).slice(2)
let lastInteraction = Date.now()
let started = false

function mediaPlaying() {
  return Array.from(document.querySelectorAll('audio, video')).some(media => {
    const element = media as HTMLMediaElement
    return !element.paused && !element.ended && element.readyState > 2
  })
}

/** True while a visible tab has been left alone with no audio or video playing. */
export function isDeviceIdle() {
  if (typeof document === 'undefined') return false
  if (mediaPlaying()) return false
  return document.hidden || Date.now() - lastInteraction > IDLE_AFTER_MS
}

function readTabs(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(TABS_KEY) || '{}') as Record<string, number> } catch { return {} }
}

function writeTabs(update: (tabs: Record<string, number>) => void) {
  try {
    const tabs = readTabs()
    const now = Date.now()
    for (const [id, seen] of Object.entries(tabs)) if (now - seen > TAB_STALE_MS) delete tabs[id]
    update(tabs)
    localStorage.setItem(TABS_KEY, JSON.stringify(tabs))
  } catch { /* Without storage every tab simply keeps its lease until it expires. */ }
}

/** Starts tracking once. `onLastTabClosed` runs synchronously on pagehide. */
export function startDeviceActivity(onLastTabClosed: () => void) {
  if (started || typeof window === 'undefined') return
  started = true
  const wake = () => {
    const wasIdle = Date.now() - lastInteraction > IDLE_AFTER_MS
    lastInteraction = Date.now()
    if (wasIdle) window.dispatchEvent(new Event('profai:device-active'))
  }
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const) {
    window.addEventListener(type, wake, { passive: true, capture: true })
  }
  const beat = () => writeTabs(tabs => { tabs[tabId] = Date.now() })
  beat()
  window.setInterval(beat, 5_000)
  window.addEventListener('pageshow', beat)
  window.addEventListener('pagehide', () => {
    let others = false
    writeTabs(tabs => { delete tabs[tabId]; others = Object.keys(tabs).length > 0 })
    if (!others) onLastTabClosed()
  })
}
