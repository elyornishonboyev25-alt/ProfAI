import { getSpeakingWebSocketUrl } from '@/lib/speakingWebSocketUrl'

// Signaling for group debate rooms. Same two-transport idea as the 1-1 partner
// layer: a BroadcastChannel transport for local cross-tab testing and a WebSocket
// transport for real cross-device rooms. Mesh role is simple — the member who joins
// LAST dials everyone already in the room, so no id comparison is needed.

export type DebateMember = { id: string; userId: string; name: string }
export type DebateTopic = {
  motion: string
  warmup: string
  followUps: string[]
  vocabulary: string[]
}

export type DebateEvent =
  | { type: 'room'; roomId: string; roomNumber: number; capacity: number; topic: DebateTopic; members: DebateMember[] }
  | { type: 'peer_joined'; peer: DebateMember }
  | { type: 'peer_left'; peerId: string }
  | { type: 'signal'; from: string; data: unknown }
  | { type: 'error'; message: string }

export interface DebateTransport {
  join(): void
  sendSignal(to: string, data: unknown): void
  leave(): void
  on(listener: (event: DebateEvent) => void): void
  close(): void
}

const DEBATE_TOPICS: DebateTopic[] = [
  {
    motion: 'Social media does more harm than good.',
    warmup: 'What is the strongest effect social media has on young people?',
    followUps: ['Should governments regulate recommendation algorithms?', 'Can social media improve education?'],
    vocabulary: ['digital wellbeing', 'misinformation', 'social connection'],
  },
  {
    motion: 'University education should be free for everyone.',
    warmup: 'Who should pay for higher education, and why?',
    followUps: ['Would free tuition reduce inequality?', 'Should every subject receive the same funding?'],
    vocabulary: ['equal access', 'taxpayer funding', 'social mobility'],
  },
  {
    motion: 'Online learning is as effective as classroom learning.',
    warmup: 'Which parts of learning require face-to-face contact?',
    followUps: ['Does online learning improve access?', 'How can teachers keep remote learners engaged?'],
    vocabulary: ['accessibility', 'learner engagement', 'self-discipline'],
  },
]

// ── BroadcastChannel (local, cross-tab) ─────────────────────────────────────
type BCMsg =
  | { kind: 'hello'; from: string; userId: string; name: string }
  | { kind: 'here'; from: string; userId: string; name: string; to: string; topic: DebateTopic }
  | { kind: 'signal'; from: string; to: string; data: unknown }
  | { kind: 'bye'; from: string }

export class BroadcastChannelDebateTransport implements DebateTransport {
  private channel: BroadcastChannel
  private selfId = `bd-${Math.random().toString(36).slice(2, 10)}`
  private identity: { userId: string; name: string }
  private listener: ((e: DebateEvent) => void) | null = null
  private phase: 'idle' | 'joining' | 'in' = 'idle'
  private members = new Map<string, DebateMember>()
  private topic: DebateTopic = DEBATE_TOPICS[0]

  constructor(identity: { userId: string; name: string }) {
    this.identity = identity
    this.channel = new BroadcastChannel('smarttest-debate-signaling')
    this.channel.onmessage = (ev: MessageEvent<BCMsg>) => this.handle(ev.data)
  }

  join() {
    this.phase = 'joining'
    this.members.clear()
    this.topic = DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)]
    this.post({ kind: 'hello', from: this.selfId, userId: this.identity.userId, name: this.identity.name })
    // Collect "here" replies briefly, then finalise the room.
    window.setTimeout(() => {
      if (this.phase !== 'joining') return
      this.phase = 'in'
      this.listener?.({
        type: 'room',
        roomId: 'local-room',
        roomNumber: 1,
        capacity: 5,
        topic: this.topic,
        members: [...this.members.values()],
      })
    }, 700)
  }

  private handle(msg: BCMsg) {
    if (!msg || (msg as { from?: string }).from === this.selfId) return

    if (msg.kind === 'hello') {
      if (this.phase === 'idle') return
      // Announce myself to the newcomer and adopt them as a peer (I'm the callee).
      this.post({ kind: 'here', from: this.selfId, userId: this.identity.userId, name: this.identity.name, to: msg.from, topic: this.topic })
      if (this.phase === 'in') {
        this.listener?.({ type: 'peer_joined', peer: { id: msg.from, userId: msg.userId, name: msg.name } })
      }
      return
    }

    if (msg.kind === 'here' && msg.to === this.selfId) {
      if (this.phase === 'joining') {
        this.topic = msg.topic || this.topic
        this.members.set(msg.from, { id: msg.from, userId: msg.userId, name: msg.name })
      } else if (this.phase === 'in') {
        this.listener?.({ type: 'peer_joined', peer: { id: msg.from, userId: msg.userId, name: msg.name } })
      }
      return
    }

    if (msg.kind === 'signal' && msg.to === this.selfId) {
      this.listener?.({ type: 'signal', from: msg.from, data: msg.data })
      return
    }

    if (msg.kind === 'bye') {
      this.listener?.({ type: 'peer_left', peerId: msg.from })
    }
  }

  sendSignal(to: string, data: unknown) {
    this.post({ kind: 'signal', from: this.selfId, to, data })
  }

  leave() {
    if (this.phase !== 'idle') this.post({ kind: 'bye', from: this.selfId })
    this.phase = 'idle'
    this.members.clear()
  }

  on(listener: (e: DebateEvent) => void) {
    this.listener = listener
  }

  close() {
    this.leave()
    try {
      this.channel.close()
    } catch {
      // ignore
    }
  }

  private post(msg: BCMsg) {
    this.channel.postMessage(msg)
  }
}

// ── WebSocket (production, cross-device) ────────────────────────────────────
export class WebSocketDebateTransport implements DebateTransport {
  private ws: WebSocket | null = null
  private url: string
  private identity: { userId: string; name: string }
  private listener: ((e: DebateEvent) => void) | null = null
  private joined = false

  constructor(url: string, identity: { userId: string; name: string }) {
    this.url = url
    this.identity = identity
  }

  join() {
    this.joined = true
    if (this.ws) return
    let ws: WebSocket
    try {
      ws = new WebSocket(this.url)
    } catch {
      this.listener?.({ type: 'error', message: 'Could not reach the debate server.' })
      return
    }
    this.ws = ws
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'hello', userId: this.identity.userId, name: this.identity.name }))
      ws.send(JSON.stringify({ type: 'joinDebate' }))
    }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        switch (msg.type) {
          case 'debateRoom':
            this.listener?.({
              type: 'room',
              roomId: msg.roomId,
              roomNumber: Number(msg.roomNumber) || 1,
              capacity: Number(msg.capacity) || 5,
              topic: msg.topic,
              members: msg.members ?? [],
            })
            break
          case 'debatePeerJoined':
            this.listener?.({ type: 'peer_joined', peer: msg.peer })
            break
          case 'debatePeerLeft':
            this.listener?.({ type: 'peer_left', peerId: msg.peerId })
            break
          case 'debateSignal':
            this.listener?.({ type: 'signal', from: msg.from, data: msg.data })
            break
          default:
            break
        }
      } catch {
        // ignore malformed
      }
    }
    ws.onerror = () => {}
    ws.onclose = () => {
      this.ws = null
      if (this.joined) {
        this.listener?.({ type: 'error', message: 'The live debate connection was interrupted. Please rejoin the room.' })
      }
    }
  }

  sendSignal(to: string, data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'debateSignal', to, data }))
    }
  }

  leave() {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'leaveDebate' }))
    this.joined = false
  }

  on(listener: (e: DebateEvent) => void) {
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

export function createDebateTransport(identity: { userId: string; name: string }): DebateTransport {
  const localFallback = (import.meta.env as Record<string, string | undefined>).VITE_SPEAKING_LOCAL_FALLBACK === 'true'
  return localFallback
    ? new BroadcastChannelDebateTransport(identity)
    : new WebSocketDebateTransport(getSpeakingWebSocketUrl(), identity)
}
