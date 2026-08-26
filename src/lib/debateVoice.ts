import { createVoiceConnection, type VoiceConnection } from '@/lib/webrtcVoice'
import type { DebateMember, DebateTopic, DebateTransport } from '@/lib/debateSignaling'

// WebRTC mesh for a debate room: one peer connection per other member. The newest
// member dials everyone already present (isCaller=true via the 'room' event), while
// existing members answer the newcomer (isCaller=false via 'peer_joined'). Audio is
// fully peer-to-peer; the transport only relays SDP/ICE.

export type DebatePeerState = {
  id: string
  name: string
  userId: string
  stream: MediaStream | null
  connected: boolean
}

export type DebateMeshState = {
  roomId: string
  roomNumber: number
  capacity: number
  topic: DebateTopic | null
  peers: DebatePeerState[]
}

type PeerEntry = {
  member: DebateMember
  voice: VoiceConnection
  stream: MediaStream | null
  connected: boolean
}

export function createDebateMesh(opts: {
  transport: DebateTransport
  localStream: MediaStream
  onChange: (state: DebateMeshState) => void
  onError?: (message: string) => void
  onFatal?: (message: string) => void
}) {
  const peers = new Map<string, PeerEntry>()
  const pending = new Map<string, unknown[]>()
  let roomId = ''
  let roomNumber = 0
  let capacity = 5
  let topic: DebateTopic | null = null

  const emit = () => {
    opts.onChange({
      roomId,
      roomNumber,
      capacity,
      topic,
      peers: [...peers.values()].map((p) => ({
        id: p.member.id,
        name: p.member.name,
        userId: p.member.userId,
        stream: p.stream,
        connected: p.connected,
      })),
    })
  }

  const addPeer = (member: DebateMember, isCaller: boolean) => {
    if (peers.has(member.id)) return
    const entry: PeerEntry = { member, voice: null as unknown as VoiceConnection, stream: null, connected: false }
    const voice = createVoiceConnection({
      isCaller,
      sendSignal: (data) => opts.transport.sendSignal(member.id, data),
      onRemoteStream: (stream) => {
        entry.stream = stream
        emit()
      },
      onStateChange: (state) => {
        entry.connected = state === 'connected'
        emit()
      },
    })
    entry.voice = voice
    peers.set(member.id, entry)
    void voice.start(opts.localStream)
      .then(async () => {
        const buffered = pending.get(member.id)
        if (buffered) {
          pending.delete(member.id)
          for (const data of buffered) await voice.handleSignal(data)
        }
      })
      .catch(() => opts.onError?.(`Could not connect to ${member.name}.`))
    emit()
  }

  opts.transport.on((event) => {
    if (event.type === 'room') {
      roomId = event.roomId
      roomNumber = event.roomNumber
      capacity = event.capacity
      topic = event.topic
      event.members.forEach((m) => addPeer(m, true))
      emit()
    } else if (event.type === 'peer_joined') {
      addPeer(event.peer, false)
    } else if (event.type === 'signal') {
      const peer = peers.get(event.from)
      if (peer) {
        void peer.voice.handleSignal(event.data).catch(() => opts.onError?.(`Voice connection to ${peer.member.name} failed.`))
      } else {
        const arr = pending.get(event.from) ?? []
        arr.push(event.data)
        pending.set(event.from, arr)
      }
    } else if (event.type === 'peer_left') {
      const peer = peers.get(event.peerId)
      peer?.voice.close()
      peers.delete(event.peerId)
      emit()
    } else if (event.type === 'error') {
      opts.onFatal?.(event.message)
    }
  })

  return {
    start: () => opts.transport.join(),
    leave: () => {
      opts.transport.leave()
      peers.forEach((p) => p.voice.close())
      peers.clear()
      pending.clear()
      opts.transport.close()
    },
  }
}
