import WebSocket from 'ws'
import { AiGenerationError } from './aiProvider.service.js'

const endpoint = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'
type OpenSocket = (url: string, options: WebSocket.ClientOptions) => WebSocket

/** Authenticate server-side and require an accepted model setup before streaming. */
export async function openGeminiLive(setup: unknown, keys: string[], signal?: AbortSignal,
  openSocket: OpenSocket = (url, options) => new WebSocket(url, options)) {
  for (const key of keys.slice(0, 5)) {
    signal?.throwIfAborted()
    const socket = openSocket(endpoint, { headers: { 'x-goog-api-key': key }, handshakeTimeout: 12000, maxPayload: 2_000_000 })
    const ready = await new Promise<boolean>(resolve => {
      let done = false
      const finish = (accepted: boolean) => {
        if (done) return
        done = true; clearTimeout(timer); signal?.removeEventListener('abort', aborted)
        socket.off('message', message); socket.off('close', closed); socket.off('error', failed)
        // ws can emit an error while a connecting socket is being closed.
        if (!accepted) { socket.on('error', () => {}); socket.close() }
        resolve(accepted)
      }
      const timer = setTimeout(() => finish(false), 15000)
      const aborted = () => finish(false), closed = () => finish(false), failed = () => finish(false)
      const message = (raw: WebSocket.RawData) => {
        try { const event = JSON.parse(String(raw)); if (event.setupComplete) finish(true); else if (event.error) finish(false) } catch { /* Ignore unrelated provider messages. */ }
      }
      signal?.addEventListener('abort', aborted, { once: true })
      socket.once('open', () => { if (!done) socket.send(JSON.stringify(setup)) })
      socket.on('message', message); socket.once('close', closed); socket.once('error', failed)
      if (signal?.aborted) aborted()
    })
    if (signal?.aborted) { socket.on('error', () => {}); socket.close(); signal.throwIfAborted() }
    if (ready) return socket
  }
  throw new AiGenerationError(502, 'GEMINI_LIVE_CONNECTION_FAILED', 'Gemini 3.8 Live could not connect. Please retry; check model access and quota if this continues.')
}
