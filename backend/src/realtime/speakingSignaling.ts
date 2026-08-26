import type { Server } from 'http'
import { WebSocketServer, WebSocket } from 'ws'

// Live-partner matchmaking + WebRTC signaling relay.
// The server never touches audio — it only pairs two learners who are searching in
// the same bucket (`part:level`) and forwards their SDP/ICE messages to each other.
// Audio flows peer-to-peer over WebRTC. Attaches to the existing HTTP server so it
// shares the same origin/port (works behind Railway's TLS as wss://.../ws/speaking).

type Client = {
  id: string
  userId: string
  name: string
  ws: WebSocket
  bucket: string | null
  peer: Client | null
  debateRoom: DebateRoom | null
  discussionRoom: string | null
  subscribedToRoomStats: boolean
}

type DebateTopic = {
  motion: string
  warmup: string
  followUps: string[]
  vocabulary: string[]
}

type DebateRoom = { id: string; number: number; topic: DebateTopic; members: Client[] }

const waiting = new Map<string, Client[]>()
const debateRooms = new Map<string, DebateRoom>()
const discussionRooms = new Map<string, Client[]>()
const discussionHistory = new Map<string, Array<{ id: string; userId: string; name: string; text: string; createdAt: string }>>()
const clients = new Set<Client>()

const DEBATE_ROOM_SIZE = 5
let nextDebateRoomNumber = 1
const DEBATE_TOPICS: DebateTopic[] = [
  {
    motion: 'Social media does more harm than good.',
    warmup: 'What is the strongest effect social media has on young people?',
    followUps: ['Should governments regulate recommendation algorithms?', 'Can social media improve education and civic participation?'],
    vocabulary: ['digital wellbeing', 'misinformation', 'social connection'],
  },
  {
    motion: 'University education should be free for everyone.',
    warmup: 'Who should pay for higher education, and why?',
    followUps: ['Would free tuition reduce educational inequality?', 'Should every subject receive the same public funding?'],
    vocabulary: ['equal access', 'taxpayer funding', 'social mobility'],
  },
  {
    motion: 'Working from home is better than working in an office.',
    warmup: 'Which environment helps people do their best work?',
    followUps: ['How does remote work affect teamwork?', 'Should employees have the legal right to work remotely?'],
    vocabulary: ['productivity', 'work-life balance', 'collaboration'],
  },
  {
    motion: 'Technology is making people less social.',
    warmup: 'Does online communication strengthen or weaken real relationships?',
    followUps: ['Are virtual friendships as meaningful as face-to-face ones?', 'How should parents manage children’s screen time?'],
    vocabulary: ['human interaction', 'social isolation', 'digital literacy'],
  },
  {
    motion: 'Exams are not a fair way to measure ability.',
    warmup: 'What should schools measure besides exam performance?',
    followUps: ['Are projects more reliable than timed tests?', 'Can standardised exams ever be truly fair?'],
    vocabulary: ['assessment', 'academic pressure', 'practical ability'],
  },
  {
    motion: 'Tourism harms more than it helps local communities.',
    warmup: 'What makes tourism sustainable for local residents?',
    followUps: ['Should popular cities limit visitor numbers?', 'Who should receive the profits from tourism?'],
    vocabulary: ['overtourism', 'local economy', 'cultural preservation'],
  },
  {
    motion: 'A four-day working week should become the standard.',
    warmup: 'Can people produce the same results in fewer working days?',
    followUps: ['Which industries could not adopt this model?', 'Would a shorter week improve public health?'],
    vocabulary: ['compressed schedule', 'employee wellbeing', 'output'],
  },
  {
    motion: 'Online learning is as effective as classroom learning.',
    warmup: 'Which parts of learning require face-to-face contact?',
    followUps: ['Does online learning make education more accessible?', 'How can teachers keep remote learners engaged?'],
    vocabulary: ['accessibility', 'learner engagement', 'self-discipline'],
  },
  {
    motion: 'Cities should ban private cars from their centres.',
    warmup: 'How would a car-free centre change daily life?',
    followUps: ['Must public transport improve before a ban?', 'How should disabled residents be accommodated?'],
    vocabulary: ['public transport', 'air quality', 'urban planning'],
  },
  {
    motion: 'Celebrities have a responsibility to be good role models.',
    warmup: 'Should public figures be judged differently from other people?',
    followUps: ['Does fame create a duty to influence responsibly?', 'What responsibility belongs to fans and the media?'],
    vocabulary: ['public influence', 'accountability', 'media scrutiny'],
  },
]

function pickTopic() {
  return DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)]
}

function genId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function send(client: Client, payload: unknown) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload))
  }
}

function roomStatsPayload() {
  const liveDebateRooms = [...debateRooms.values()]
    .map((room) => room.members.filter((member) => member.ws.readyState === WebSocket.OPEN).length)
    .filter((online) => online > 0)

  return {
    type: 'roomStats',
    rooms: {
      debate: {
        online: liveDebateRooms.reduce((total, online) => total + online, 0),
        activeRooms: liveDebateRooms.length,
        capacity: DEBATE_ROOM_SIZE,
        openSeats: liveDebateRooms.reduce((total, online) => total + DEBATE_ROOM_SIZE - online, 0),
      },
      questions: { online: discussionRooms.get('hard-questions')?.length ?? 0 },
      admissions: { online: discussionRooms.get('study-abroad')?.length ?? 0 },
      partner: { online: [...clients].filter((client) => client.bucket !== null || client.peer !== null).length },
    },
  }
}

function broadcastRoomStats() {
  const payload = roomStatsPayload()
  for (const client of clients) {
    if (client.subscribedToRoomStats) send(client, payload)
  }
}

function removeFromQueue(client: Client) {
  if (!client.bucket) return
  const list = waiting.get(client.bucket)
  if (!list) return
  const next = list.filter((c) => c.id !== client.id)
  if (next.length > 0) waiting.set(client.bucket, next)
  else waiting.delete(client.bucket)
}

function pair(a: Client, b: Client) {
  a.peer = b
  b.peer = a
  a.bucket = null
  b.bucket = null
  // `a` was already waiting → make it the caller (it initiates the WebRTC offer).
  send(a, { type: 'matched', isCaller: true, peerId: b.id, peerUserId: b.userId, peerName: b.name })
  send(b, { type: 'matched', isCaller: false, peerId: a.id, peerUserId: a.userId, peerName: a.name })
}

function enqueue(client: Client, part: number, level: string) {
  // Leaving any previous state first.
  removeFromQueue(client)
  unpair(client, false)

  const bucket = `${part}:${level}`
  client.bucket = bucket

  const list = waiting.get(bucket) ?? []
  // Find the first still-connected waiting peer that isn't this client.
  let match: Client | null = null
  while (list.length > 0) {
    const candidate = list.shift()!
    if (candidate.id !== client.id && candidate.ws.readyState === WebSocket.OPEN) {
      match = candidate
      break
    }
  }
  if (list.length > 0) waiting.set(bucket, list)
  else waiting.delete(bucket)

  if (match) {
    pair(match, client)
  } else {
    const current = waiting.get(bucket) ?? []
    current.push(client)
    waiting.set(bucket, current)
    send(client, { type: 'queued' })
  }
  broadcastRoomStats()
}

function unpair(client: Client, notify: boolean) {
  const peer = client.peer
  if (peer) {
    peer.peer = null
    if (notify) send(peer, { type: 'peer_left' })
  }
  client.peer = null
}

// ── Debate rooms (group voice, up to 5) ─────────────────────────────────────
// Fill an open room or open a fresh one; when someone leaves, the next searcher
// naturally lands in the room with free space (back-fill). Audio is a peer-to-peer
// mesh; the server only relays SDP/ICE between members.
function joinDebate(client: Client) {
  leaveDebate(client, true)

  let room: DebateRoom | undefined
  for (const r of debateRooms.values()) {
    r.members = r.members.filter((member) => member.ws.readyState === WebSocket.OPEN)
    if (r.members.length < DEBATE_ROOM_SIZE) {
      room = r
      break
    }
  }
  if (!room) {
    room = { id: genId(), number: nextDebateRoomNumber++, topic: pickTopic(), members: [] }
    debateRooms.set(room.id, room)
  }

  // Tell the joiner who is already here (so it can dial them), then announce the
  // joiner to everyone already in the room.
  send(client, {
    type: 'debateRoom',
    roomId: room.id,
    roomNumber: room.number,
    capacity: DEBATE_ROOM_SIZE,
    topic: room.topic,
    members: room.members.map((m) => ({ id: m.id, userId: m.userId, name: m.name })),
  })
  for (const m of room.members) {
    send(m, { type: 'debatePeerJoined', peer: { id: client.id, userId: client.userId, name: client.name } })
  }
  room.members.push(client)
  client.debateRoom = room
  broadcastRoomStats()
}

function leaveDebate(client: Client, notify: boolean) {
  const room = client.debateRoom
  if (!room) return
  room.members = room.members.filter((m) => m.id !== client.id)
  client.debateRoom = null
  if (notify) {
    for (const m of room.members) send(m, { type: 'debatePeerLeft', peerId: client.id })
  }
  if (room.members.length === 0) debateRooms.delete(room.id)
  broadcastRoomStats()
}

function relayDebateSignal(client: Client, to: string, data: unknown) {
  const room = client.debateRoom
  if (!room) return
  const target = room.members.find((m) => m.id === to)
  if (target) send(target, { type: 'debateSignal', from: client.id, data })
}

function leaveDiscussion(client: Client) {
  const roomId = client.discussionRoom
  if (!roomId) return
  const remaining = (discussionRooms.get(roomId) ?? []).filter((member) => member.id !== client.id)
  if (remaining.length) discussionRooms.set(roomId, remaining)
  else discussionRooms.delete(roomId)
  client.discussionRoom = null
  for (const member of remaining) send(member, { type: 'discussionPresence', roomId, online: remaining.length })
  broadcastRoomStats()
}

function joinDiscussion(client: Client, roomId: string) {
  leaveDiscussion(client)
  const safeRoomId = roomId === 'hard-questions' ? roomId : 'study-abroad'
  const members = (discussionRooms.get(safeRoomId) ?? []).filter((member) => member.ws.readyState === WebSocket.OPEN)
  members.push(client)
  discussionRooms.set(safeRoomId, members)
  client.discussionRoom = safeRoomId
  send(client, { type: 'discussionSnapshot', roomId: safeRoomId, messages: discussionHistory.get(safeRoomId) ?? [] })
  for (const member of members) send(member, { type: 'discussionPresence', roomId: safeRoomId, online: members.length })
  broadcastRoomStats()
}

function postDiscussion(client: Client, roomId: string, text: string) {
  if (client.discussionRoom !== roomId) return
  const message = {
    id: genId(),
    userId: client.userId,
    name: client.name,
    text: text.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  }
  if (!message.text) return
  const history = [...(discussionHistory.get(roomId) ?? []), message].slice(-80)
  discussionHistory.set(roomId, history)
  for (const member of discussionRooms.get(roomId) ?? []) {
    send(member, { type: 'discussionMessage', roomId, message })
  }
}

function attach(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/speaking' })

  wss.on('connection', (ws: WebSocket) => {
    const client: Client = {
      id: genId(),
      userId: 'anon',
      name: 'Guest',
      ws,
      bucket: null,
      peer: null,
      debateRoom: null,
      discussionRoom: null,
      subscribedToRoomStats: false,
    }
    clients.add(client)

    ws.on('message', (raw) => {
      let msg: { type?: string; userId?: string; name?: string; part?: number; level?: string; to?: string; data?: unknown; roomId?: string; text?: string }
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }

      switch (msg.type) {
        case 'hello':
          client.userId = typeof msg.userId === 'string' ? msg.userId.slice(0, 120) : 'anon'
          client.name = typeof msg.name === 'string' ? msg.name.slice(0, 80) : 'Guest'
          break
        case 'subscribeRoomStats':
          client.subscribedToRoomStats = true
          send(client, roomStatsPayload())
          break
        case 'queue':
          if (typeof msg.part === 'number' && typeof msg.level === 'string') {
            enqueue(client, msg.part, msg.level.slice(0, 24))
          }
          break
        case 'signal':
          if (client.peer) send(client.peer, { type: 'signal', data: msg.data })
          break
        case 'leave':
          removeFromQueue(client)
          unpair(client, true)
          client.bucket = null
          broadcastRoomStats()
          break
        case 'joinDebate':
          joinDebate(client)
          break
        case 'debateSignal':
          if (typeof msg.to === 'string') relayDebateSignal(client, msg.to, msg.data)
          break
        case 'leaveDebate':
          leaveDebate(client, true)
          break
        case 'joinDiscussion':
          if (typeof msg.roomId === 'string') joinDiscussion(client, msg.roomId)
          break
        case 'discussionMessage':
          if (typeof msg.roomId === 'string' && typeof msg.text === 'string') postDiscussion(client, msg.roomId, msg.text)
          break
        case 'leaveDiscussion':
          leaveDiscussion(client)
          break
        default:
          break
      }
    })

    const cleanup = () => {
      removeFromQueue(client)
      unpair(client, true)
      leaveDebate(client, true)
      leaveDiscussion(client)
      clients.delete(client)
      broadcastRoomStats()
    }
    ws.on('close', cleanup)
    ws.on('error', cleanup)
  })

  return wss
}

export const attachSpeakingSignaling = attach
