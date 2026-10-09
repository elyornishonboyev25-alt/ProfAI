import { randomUUID } from 'node:crypto'
import { WebSocket, type WebSocketServer } from 'ws'

export type CommunityIdentity = { userId: string; name: string; avatarUrl: string | null; public: boolean }
export type CommunityAuthenticator = (token: string) => Promise<CommunityIdentity | null>
type Member = CommunityIdentity & { id: string; ws: WebSocket; roomId: string | null; role: 'speaker' | 'listener'; muted: boolean; hand: boolean; side: string; lastMessage: number }
type Chat = { id: string; name: string; text: string; createdAt: string }
type Room = { id: string; title: string; topic: string; kind: string; level: string; capacity: number; private: boolean; hostId: string; members: Member[]; messages: Chat[]; createdAt: string }

/** Live rooms exist while occupied. Private rooms are discoverable only through their unguessable link. */
export function attachCommunitySignaling(wss: WebSocketServer, authenticate?: CommunityAuthenticator) {
  const members = new Set<Member>()
  const rooms = new Map<string, Room>()
  const invites = new Map<string, { from: Member; to: Member; expiresAt: number }>()
  const send = (member: Member, payload: unknown) => {
    if (member.ws.readyState === WebSocket.OPEN) member.ws.send(JSON.stringify(payload))
  }
  const person = (member: Member) => ({ id: member.id, name: member.name, avatarUrl: member.avatarUrl, role: member.role, muted: member.muted, hand: member.hand, side: member.side })
  const summary = (room: Room) => ({ id: room.id, title: room.title, topic: room.topic, kind: room.kind, level: room.level, capacity: room.capacity, maxParticipants: room.private ? room.capacity : 16, private: room.private, hostId: room.hostId, members: room.members.map(person), createdAt: room.createdAt })
  const lobby = () => {
    const people = [...members].filter(m => m.public)
    const payload = { type: 'communityLobby', rooms: [...rooms.values()].filter(r => !r.private).map(summary), online: [...new Set(people.map(m => m.userId))].length, available: [...new Set(people.filter(m => !m.roomId).map(m => m.name))] }
    members.forEach(m => send(m, payload))
  }
  const update = (room: Room) => {
    room.members.forEach(m => send(m, { type: 'communityRoom', room: summary(room), selfId: m.id, messages: room.messages }))
    lobby()
  }
  const error = (member: Member, message: string) => send(member, { type: 'communityError', message })
  const leave = (member: Member) => {
    const room = rooms.get(member.roomId ?? '')
    member.roomId = null
    member.hand = false
    member.side = ''
    if (!room) return
    room.members = room.members.filter(m => m !== member)
    if (!room.members.length) rooms.delete(room.id)
    else {
      if (room.hostId === member.id) {
        const host = room.members.find(m => m.role === 'speaker') ?? room.members[0]
        room.hostId = host.id
        if (host.role === 'listener') { host.role = 'speaker'; host.muted = true }
      }
      room.members.forEach(m => send(m, { type: 'communityPeerLeft', peerId: member.id }))
      update(room)
    }
  }
  const join = (member: Member, room: Room, listen = false) => {
    if (member.roomId === room.id) return
    if (room.members.length >= (room.private ? room.capacity : 16) || (!listen && room.members.filter(m => m.role === 'speaker').length >= room.capacity)) return error(member, 'This room is full. Choose another room or create your own.')
    if (room.members.some(m => m.userId === member.userId)) return error(member, 'You already joined this room in another tab.')
    leave(member)
    member.roomId = room.id
    member.muted = true
    member.role = listen ? 'listener' : 'speaker'
    send(member, { type: 'communityJoined', room: summary(room), selfId: member.id, messages: room.messages })
    room.members.forEach(m => send(m, { type: 'communityPeerJoined', peer: person(member) }))
    room.members.push(member)
    update(room)
  }
  const create = (member: Member, data: Record<string, unknown>, isPrivate = false) => {
    const title = typeof data.title === 'string' ? data.title.trim().slice(0, 70) : ''
    const topic = typeof data.topic === 'string' ? data.topic.trim().slice(0, 200) : ''
    if (!title || !topic) { error(member, 'Add a room name and a conversation topic.'); return }
    if (rooms.size >= 300 && !member.roomId) { error(member, 'The community is busy. Please join an existing room.'); return }
    const room: Room = { id: randomUUID(), title, topic, kind: ['conversation', 'debate', 'ielts'].includes(String(data.kind)) ? String(data.kind) : 'conversation', level: ['all', 'beginner', 'intermediate', 'advanced'].includes(String(data.level)) ? String(data.level) : 'all', capacity: Math.max(2, Math.min(8, Number.isInteger(data.capacity) ? Number(data.capacity) : 5)), private: isPrivate || data.private === true, hostId: member.id, members: [], messages: [], createdAt: new Date().toISOString() }
    rooms.set(room.id, room)
    join(member, room)
    return room
  }
  wss.on('connection', ws => {
    let member: Member | null = null
    let authenticating = false
    let closed = false
    let windowStart = Date.now()
    let count = 0
    ws.on('message', async raw => {
      const payload = raw.toString()
      if (payload.length > 64_000) return
      let data: Record<string, unknown>
      try { data = JSON.parse(payload) } catch { return }
      if (!data || typeof data.type !== 'string' || !data.type.startsWith('community')) return
      if (Date.now() - windowStart > 10_000) { count = 0; windowStart = Date.now() }
      if (++count > 200) return
      if (data.type === 'communityHello') {
        if (member || authenticating) return
        authenticating = true
        let identity: CommunityIdentity | null = null
        try { identity = await authenticate?.(typeof data.token === 'string' ? data.token : '') ?? null } catch { /* Invalid session or unavailable account. */ }
        authenticating = false
        if (closed) return
        if (!identity) { ws.send(JSON.stringify({ type: 'communityError', message: 'Please sign in again to connect to speaking rooms.' })); return }
        member = { ...identity, id: randomUUID(), ws, roomId: null, role: 'speaker', muted: true, hand: false, side: '', lastMessage: 0 }
        members.add(member)
        send(member, { type: 'communityReady', selfId: member.id })
        lobby()
        return
      }
      if (!member) return
      const room = rooms.get(member.roomId ?? '')
      switch (data.type) {
        case 'communityCreate': create(member, data); break
        case 'communityJoin': {
          const target = rooms.get(String(data.roomId))
          if (target) join(member, target, data.listen === true)
          else error(member, 'This room has ended. Create a new room or join another conversation.')
          break
        }
        case 'communityLeave': leave(member); send(member, { type: 'communityLeft' }); lobby(); break
        case 'communitySignal': {
          const target = room?.members.find(m => m.id === data.to && m !== member)
          if (target) send(target, { type: 'communitySignal', from: member.id, data: data.data })
          break
        }
        case 'communityState':
          if (room) { member.muted = member.role === 'listener' || data.muted !== false; member.hand = data.hand === true; member.side = ['for', 'against'].includes(String(data.side)) ? String(data.side) : ''; update(room) }
          break
        case 'communityTakeSeat':
          if (room) {
            if (member.role === 'listener' && room.members.filter(m => m.role === 'speaker').length >= room.capacity) { error(member, 'The stage is full. You can keep listening until a seat opens.'); break }
            member.role = 'speaker'; member.muted = false; member.hand = false; update(room)
          }
          break
        case 'communityStepDown':
          if (room) { member.role = 'listener'; member.muted = true; member.hand = false; update(room) }
          break
        case 'communityChat':
          if (room && typeof data.text === 'string' && data.text.trim() && Date.now() - member.lastMessage >= 500) {
            member.lastMessage = Date.now()
            const message = { id: randomUUID(), name: member.name, text: data.text.trim().slice(0, 500), createdAt: new Date().toISOString() }
            room.messages = [...room.messages, message].slice(-80)
            room.members.forEach(m => send(m, { type: 'communityChat', message }))
          }
          break
        case 'communityRemove': {
          const target = room?.members.find(m => m.id === data.peerId && m !== member)
          if (room?.hostId === member.id && target) { leave(target); send(target, { type: 'communityLeft', message: 'The host removed you from this room.' }); lobby() }
          break
        }
        case 'communityInvite': {
          for (const [id, invite] of invites) if (invite.expiresAt < Date.now()) invites.delete(id)
          if (!member.public || member.roomId) { error(member, 'Leave your current room before inviting a partner.'); break }
          if ([...invites.values()].some(i => i.from.userId === member!.userId)) { error(member, 'You already have a pending invitation. Please wait for a reply.'); break }
          const target = [...members].find(m => m.public && m.name === data.nickname && m.userId !== member!.userId && !m.roomId)
          if (!target) { error(member, 'This learner is no longer available for a call.'); break }
          const id = randomUUID()
          invites.set(id, { from: member, to: target, expiresAt: Date.now() + 60_000 })
          send(target, { type: 'communityInvitation', id, from: person(member), expiresAt: Date.now() + 60_000 })
          send(member, { type: 'communityNotice', message: 'Invitation sent. Your partner has one minute to respond.' })
          break
        }
        case 'communityReply': {
          const invite = invites.get(String(data.id))
          if (!invite || invite.to !== member) break
          invites.delete(String(data.id))
          if (invite.expiresAt < Date.now() || !members.has(invite.from)) { error(member, 'This invitation has expired.'); break }
          if (data.accept !== true || member.roomId || invite.from.roomId) { send(invite.from, { type: 'communityNotice', message: 'Your partner is unavailable or declined the invitation.' }); break }
          const target = create(invite.from, { title: `${invite.from.name} & ${member.name}`, topic: 'Introduce yourself, share your interests and practise English together.', capacity: 2 }, true)
          if (target) join(member, target)
          break
        }
      }
    })
    ws.on('close', () => {
      closed = true
      if (!member) return
      leave(member)
      members.delete(member)
      for (const [id, invite] of invites) if (invite.from === member || invite.to === member) invites.delete(id)
      lobby()
    })
  })
}
