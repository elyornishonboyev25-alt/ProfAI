export type NovaAudioOwner = 'coach' | 'original' | 'recording' | 'pronunciation' | 'replay'
type Lease = { owner: NovaAudioOwner; token: symbol; cancel: () => void }
let active: Lease | null = null
const listeners = new Set<() => void>()
const publish = () => { for (const listener of listeners) listener() }
export function novaAudioOwner() { return active?.owner ?? null }
export function subscribeNovaAudio(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
/** Detach the previous lease before cancellation: late callbacks cannot release its successor. */
export function acquireNovaAudio(owner: NovaAudioOwner, cancel: () => void) {
  const previous = active
  active = null
  previous?.cancel()
  const token = Symbol(owner)
  active = { owner, token, cancel }
  publish()
  return () => { if (active?.token === token) { active = null; publish() } }
}
export function interruptNovaAudio() {
  const previous = active
  active = null
  previous?.cancel()
  publish()
}
const media = new WeakMap<HTMLMediaElement, () => void>()
export function ownNovaMedia(element: HTMLMediaElement, owner: NovaAudioOwner = 'recording') {
  if (media.has(element)) return
  let release = () => {}
  const done = () => {
    release(); media.delete(element)
    for (const event of ['pause', 'ended', 'error', 'emptied']) element.removeEventListener(event, done)
  }
  release = acquireNovaAudio(owner, () => { element.pause(); done() })
  media.set(element, done)
  for (const event of ['pause', 'ended', 'error', 'emptied']) element.addEventListener(event, done)
}
if (typeof window !== 'undefined') window.addEventListener('nova:interrupt', interruptNovaAudio)
