export function microphoneError(failure: unknown): string {
  const name = failure instanceof Error ? failure.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone access is blocked. Allow the microphone in your browser site settings, then try again.'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No microphone found. Connect a microphone and try again.'
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'Your microphone is busy. Close other apps using it, then try again.'
  if (name === 'TimeoutError') return 'Microphone permission is still waiting. Check your browser permission prompt, then try again.'
  return failure instanceof Error ? failure.message : 'Your microphone could not start. Check your input device and try again.'
}

/** Release a late permission response, so leaving never leaves an unseen mic recording. */
export async function requestMicrophone(): Promise<MediaStream> {
  if (!window.isSecureContext && !navigator.mediaDevices) throw new Error('Microphone access needs a secure connection. Open the site using HTTPS.')
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Your browser does not support microphone access. Open this page in Chrome, Edge, Firefox or Safari.')
  let expired = false
  let timer = 0
  const capture = (async () => {
    try { return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }) }
    catch (failure) {
      if (failure instanceof Error && failure.name === 'OverconstrainedError' && !expired) return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      throw failure
    }
  })().then(stream => {
    if (expired) { stream.getTracks().forEach(track => track.stop()); throw new DOMException('Permission timed out', 'TimeoutError') }
    if (!stream.getAudioTracks().some(track => track.readyState === 'live')) { stream.getTracks().forEach(track => track.stop()); throw new Error('No working audio input was found. Check your microphone and try again.') }
    return stream
  })
  try {
    return await Promise.race([capture, new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => { expired = true; reject(new DOMException('Permission timed out', 'TimeoutError')) }, 25_000)
    })])
  } finally { window.clearTimeout(timer) }
}
