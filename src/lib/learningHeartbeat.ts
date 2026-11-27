/** Save a visit promptly when a sleeping tab returns or a connection recovers. */
export function startLearningHeartbeat<T>(send: (recalculate: boolean) => Promise<T | null>, apply: (reward: T) => void) {
  let disposed = false
  let pending = false
  const heartbeat = (recalculate = false) => {
    if (disposed || pending || document.hidden) return
    pending = true
    void Promise.resolve().then(() => send(recalculate)).then(reward => {
      if (!disposed && reward) apply(reward)
    }).catch(() => {
      // The next timer, reconnect or focus event retries an interrupted write.
    }).finally(() => { pending = false })
  }
  const resume = () => heartbeat(true)
  heartbeat(true)
  const timer = window.setInterval(() => heartbeat(), 60_000)
  window.addEventListener('focus', resume)
  window.addEventListener('online', resume)
  document.addEventListener('visibilitychange', resume)
  return () => {
    disposed = true
    window.clearInterval(timer)
    window.removeEventListener('focus', resume)
    window.removeEventListener('online', resume)
    document.removeEventListener('visibilitychange', resume)
  }
}
