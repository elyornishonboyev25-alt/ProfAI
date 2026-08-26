import { getSpeakingWebSocketUrl } from '@/lib/speakingWebSocketUrl'

// Signaling layer for live partner matchmaking. Two interchangeable transports
// behind one interface:
//   - BroadcastChannelTransport: peer-to-peer matchmaking across tabs of the SAME
//     browser/origin. Needs no server, so the whole live flow can be tested locally.
//   - WebSocketTransport: talks to the backend signaling server for real
//     cross-device matchmaking in production.
// Both emit identical events, so the UI and WebRTC code don't care which is used.

export type SignalingIdentity = {
  userId: string
  name: string
}

export type QueueParams = {
  part: number
  level: string
}

export type SignalEvent =
  | { type: 'queued' }
  | { type: 'matched'; isCaller: boolean; peerId: string; peerUserId: string; peerName: string }
  | { type: 'signal'; data: unknown }
  | { type: 'peer_left' }
  | { type: 'error'; message: string }

export interface SignalingTransport {
  queue(params: QueueParams): void
  sendSignal(data: unknown): void
  leave(): void
  on(listener: (event: SignalEvent) => void): void
  close(): void
}

// ── BroadcastChannel (local, cross-tab) ─────────────────────────────────────
type BCMessage =
  | { kind: 'looking'; from: string; userId: string; name: string; bucket: string; ts: number }
  | { kind: 'match'; from: string; to: string; callerId: string; userId: string; name: string }
  | { kind: 'signal'; from: string; to: string; data: unknown }
  | { kind: 'leave'; from: string; to: string }

export class BroadcastChannelTransport implements SignalingTransport {
  private channel: BroadcastChannel
  private selfId = `bc-${Math.random().toString(36).slice(2, 10)}`
  private identity: SignalingIdentity
  private bucket = ''
  private listener: ((event: SignalEvent) => void) | null = null
  private lookingTimer = 0
  private peerId: string | null = null
  private matched = false

  constructor(identity: SignalingIdentity) {
    this.identity = identity
    this.channel = new BroadcastChannel('smarttest-speaking-signaling')
    this.channel.onmessage = (ev: MessageEvent<BCMessage>) => this.handle(ev.data)
  }

  queue(params: QueueParams) {
    this.bucket = `${params.part}:${params.level}`
    this.matched = false
    this.peerId = null
    this.listener?.({ type: 'queued' })
    this.broadcastLooking()
    this.lookingTimer = window.setInterval(() => this.broadcastLooking(), 1200)
  }

  private broadcastLooking() {
    if (this.matched) return
    this.post({
      kind: 'looking',
      from: this.selfId,
      userId: this.identity.userId,
      name: this.identity.name,
      bucket: this.bucket,
      ts: Date.now(),
    })
  }

  private handle(msg: BCMessage) {
    if (!msg || (msg as { from?: string }).from === this.selfId) return

    if (msg.kind === 'looking') {
      if (this.matched || msg.bucket !== this.bucket) return
      // Deterministic role: the lexicographically smaller id is the caller.
      const callerId = this.selfId < msg.from ? this.selfId : msg.from
      this.lockMatch(msg.from, callerId, msg.userId, msg.name)
      this.post({
        kind: 'match',
        from: this.selfId,
        to: msg.from,
        callerId,
        userId: this.identity.userId,
        name: this.identity.name,
      })
      return
    }

    if (msg.kind === 'match' && msg.to === this.selfId) {
      if (this.matched) return
      this.lockMatch(msg.from, msg.callerId, msg.userId, msg.name)
      return
    }

    if (msg.kind === 'signal' && msg.to === this.selfId && msg.from === this.peerId) {
      this.listener?.({ type: 'signal', data: msg.data })
      return
    }

    if (msg.kind === 'leave' && msg.to === this.selfId && msg.from === this.peerId) {
      this.listener?.({ type: 'peer_left' })
    }
  }

  private lockMatch(peerId: string, callerId: string, peerUserId: string, peerName: string) {
    this.matched = true
    this.peerId = peerId
    window.clearInterval(this.lookingTimer)
    this.listener?.({
      type: 'matched',
      isCaller: callerId === this.selfId,
      peerId,
      peerUserId,
      peerName,
    })
  }

  sendSignal(data: unknown) {
    if (!this.peerId) return
    this.post({ kind: 'signal', from: this.selfId, to: this.peerId, data })
  }

  leave() {
    window.clearInterval(this.lookingTimer)
    if (this.peerId) this.post({ kind: 'leave', from: this.selfId, to: this.peerId })
    this.matched = false
    this.peerId = null
  }

  on(listener: (event: SignalEvent) => void) {
    this.listener = listener
  }

  close() {
    window.clearInterval(this.lookingTimer)
    try {
      this.channel.close()
    } catch {
      // ignore
    }
  }

  private post(msg: BCMessage) {
    this.channel.postMessage(msg)
  }
}

// ── WebSocket (production, cross-device) ────────────────────────────────────
type WSInbound =
  | { type: 'queued' }
  | { type: 'matched'; isCaller: boolean; peerId: string; peerUserId: string; peerName: string }
  | { type: 'signal'; data: unknown }
  | { type: 'peer_left' }
  | { type: 'error'; message: string }

export class WebSocketTransport implements SignalingTransport {
  private ws: WebSocket | null = null
  private url: string
  private identity: SignalingIdentity
  private listener: ((event: SignalEvent) => void) | null = null
  private pendingQueue: QueueParams | null = null
  // True once the server has acknowledged us (queued/matched). Used to decide whether
  // a socket close is a real failure or just a normal end-of-session disconnect.
  private settled = false

  constructor(url: string, identity: SignalingIdentity) {
    this.url = url
    this.identity = identity
  }

  private connect() {
    if (this.ws) return
    let ws: WebSocket
    try {
      ws = new WebSocket(this.url)
    } catch {
      this.listener?.({ type: 'error', message: 'Could not reach the live server. Please try again in a moment.' })
      return
    }
    this.ws = ws
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'hello', userId: this.identity.userId, name: this.identity.name }))
      if (this.pendingQueue) {
        ws.send(JSON.stringify({ type: 'queue', ...this.pendingQueue }))
      }
    }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WSInbound
        if (msg.type === 'queued' || msg.type === 'matched') this.settled = true
        this.listener?.(msg as SignalEvent)
      } catch {
        // ignore malformed
      }
    }
    // onerror always precedes onclose; let onclose decide what to surface so we don't
    // show a scary "connection error" for a transient blip.
    ws.onerror = () => {}
    ws.onclose = () => {
      const wasSettled = this.settled
      this.ws = null
      // Only treat a close as an error if we never even managed to join the queue.
      // Once matched, audio runs peer-to-peer, so a signaling drop is harmless.
      if (!wasSettled && this.pendingQueue) {
        this.listener?.({ type: 'error', message: 'Couldn’t reach the live matchmaking server. Please try again shortly.' })
      }
    }
  }

  queue(params: QueueParams) {
    this.pendingQueue = params
    this.connect()
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'queue', ...params }))
    }
  }

  sendSignal(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'signal', data }))
    }
  }

  leave() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'leave' }))
    }
  }

  on(listener: (event: SignalEvent) => void) {
    this.listener = listener
  }

  close() {
    try {
      this.ws?.close()
    } catch {
      // ignore
    }
    this.ws = null
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────
/**
 * Real rooms always use the backend so dev and production share the exact same
 * matchmaking behaviour. BroadcastChannel remains available as an explicit
 * offline fallback for UI demos.
 */
export function createSignalingTransport(identity: SignalingIdentity): SignalingTransport {
  const localFallback = (import.meta.env as Record<string, string | undefined>).VITE_SPEAKING_LOCAL_FALLBACK === 'true'
  return localFallback
    ? new BroadcastChannelTransport(identity)
    : new WebSocketTransport(getSpeakingWebSocketUrl(), identity)
}
