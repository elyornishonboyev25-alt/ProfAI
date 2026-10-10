import { useCallback, useEffect, useRef, useState } from 'react'
import { getSpeakingWebSocketUrl } from '@/lib/speakingWebSocketUrl'
import { createVoiceConnection, type VoiceConnection } from '@/lib/webrtcVoice'
import { useAuthStore } from '@/store/authStore'
import { fetchAccount } from '@/lib/profileApi'

export type SpeakingMember = { id: string; name: string; avatarUrl: string | null; role: 'speaker' | 'listener'; muted: boolean; hand: boolean; side: string }
export type SpeakingRoom = { id: string; title: string; topic: string; kind: string; level: string; capacity: number; maxParticipants: number; private: boolean; hostId: string; members: SpeakingMember[]; debate: { running: boolean; turnId: string | null; endsAt: number | null; round: number } }
export type SpeakingChat = { id: string; name: string; text: string; createdAt: string }
type Invitation = { id: string; from: SpeakingMember; expiresAt: number }
export type RoomDraft = { title: string; topic: string; kind: string; level: string; capacity: number; private: boolean }

export function useSpeakingCommunity(enabled: boolean) {
  const [connected, setConnected] = useState(false)
  const [rooms, setRooms] = useState<SpeakingRoom[]>([])
  const [online, setOnline] = useState(0)
  const [available, setAvailable] = useState<string[]>([])
  const [availablePeople, setAvailablePeople] = useState<{ name: string; avatarUrl: string | null }[]>([])
  const [room, setRoom] = useState<SpeakingRoom | null>(null)
  const [selfId, setSelfId] = useState('')
  const [selfName, setSelfName] = useState('')
  const [messages, setMessages] = useState<SpeakingChat[]>([])
  const [streams, setStreams] = useState<Record<string, MediaStream>>({})
  const [peerStates, setPeerStates] = useState<Record<string, string>>({})
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [outgoingInvitation, setOutgoingInvitation] = useState<{ nickname: string; expiresAt: number } | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [matching, setMatching] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const localRef = useRef<MediaStream | null>(null)
  const peersRef = useRef(new Map<string, { voice: VoiceConnection; ready: Promise<void>; chain: Promise<void> }>())
  const roomRef = useRef<SpeakingRoom | null>(null)
  const pendingRef = useRef(false)
  const generationRef = useRef(0)
  const timeoutRef = useRef(0)
  const pendingSignals = useRef(new Map<string, unknown[]>())
  const nextPartnerRef = useRef(false)
  const leavingRef = useRef(false)
  const send = useCallback((payload: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(payload))
  }, [])
  const stopMedia = useCallback(() => {
    generationRef.current += 1
    pendingRef.current = false
    window.clearTimeout(timeoutRef.current)
    peersRef.current.forEach(peer => peer.voice.close())
    peersRef.current.clear()
    pendingSignals.current.clear()
    localRef.current?.getTracks().forEach(track => track.stop())
    localRef.current = null
    roomRef.current = null
    setRoom(null)
    setStreams({})
    setPeerStates({})
    setMessages([])
    setBusy(false)
    setMatching(false)
    setOutgoingInvitation(null)
  }, [])
  const releaseMicrophone = useCallback(() => {
    generationRef.current += 1
    pendingRef.current = false
    window.clearTimeout(timeoutRef.current)
    localRef.current?.getTracks().forEach(track => track.stop())
    if (roomRef.current) localRef.current = new MediaStream()
    peersRef.current.forEach(peer => { void peer.ready.then(() => peer.voice.replaceAudioTrack(null)).catch(() => {}) })
    setBusy(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let disposed = false
    let retry = 0
    let attempts = 0
    const addPeer = (member: SpeakingMember, isCaller: boolean) => {
      if (!localRef.current || peersRef.current.has(member.id)) return
      try {
        const voice = createVoiceConnection({
          isCaller,
          sendSignal: data => send({ type: 'communitySignal', to: member.id, data }),
          onRemoteStream: stream => setStreams(current => ({ ...current, [member.id]: stream })),
          onStateChange: state => setPeerStates(current => ({ ...current, [member.id]: state })),
        })
        const ready = voice.start(localRef.current)
        const entry = { voice, ready, chain: ready }
        peersRef.current.set(member.id, entry)
        for (const data of pendingSignals.current.get(member.id) ?? []) entry.chain = entry.chain.then(() => voice.handleSignal(data))
        pendingSignals.current.delete(member.id)
        entry.chain.catch(() => setError('A voice connection failed. Leave and rejoin the room to retry.'))
      } catch { setError('Your browser could not start live audio. Please use a browser that supports WebRTC.') }
    }
    const connect = async () => {
      // The account request uses the existing session refresh flow before opening the socket.
      try { await fetchAccount() } catch (failure) {
        if (!disposed) {
          setError(failure instanceof Error ? failure.message : 'Please sign in to connect.')
          retry = window.setTimeout(connect, Math.min(1000 * 2 ** attempts++, 15_000))
        }
        return
      }
      if (disposed) return
      let socket: WebSocket
      try { socket = new WebSocket(getSpeakingWebSocketUrl()) } catch {
        setError('Speaking rooms could not connect. Please reload to retry.')
        retry = window.setTimeout(connect, Math.min(1000 * 2 ** attempts++, 15_000))
        return
      }
      socketRef.current = socket
      socket.onopen = () => { if (!disposed) socket.send(JSON.stringify({ type: 'communityHello', token: useAuthStore.getState().accessToken })) }
      socket.onmessage = event => {
        if (disposed) return
        let message
        try { message = JSON.parse(event.data) } catch { return }
        switch (message.type) {
          case 'communityReady': setConnected(true); setSelfId(message.selfId); setSelfName(message.name ?? ''); setError(''); attempts = 0; break
          case 'communityLobby': setRooms(message.rooms); setOnline(message.online); setAvailable(message.available); setAvailablePeople(message.availablePeople ?? []); break
          case 'communityJoined':
            if (!localRef.current) { send({ type: 'communityLeave' }); break }
            window.clearTimeout(timeoutRef.current)
            pendingRef.current = false
            setBusy(false)
            setNotice('')
            roomRef.current = message.room
            setRoom(message.room)
            setSelfId(message.selfId)
            setMessages(message.messages)
            setMatching(false)
            setOutgoingInvitation(null)
            message.room.members.filter((member: SpeakingMember) => member.id !== message.selfId).forEach((member: SpeakingMember) => addPeer(member, true))
            break
          case 'communityRoom':
            if (localRef.current) {
              roomRef.current = message.room; setRoom(message.room); setMessages(message.messages)
              const self = message.room.members.find((member: SpeakingMember) => member.id === message.selfId)
              localRef.current.getAudioTracks().forEach(track => { track.enabled = self?.role === 'speaker' && !self.muted })
              if (self?.role === 'speaker' && !self.muted && pendingRef.current && localRef.current.getAudioTracks().some(track => track.readyState === 'live')) { pendingRef.current = false; window.clearTimeout(timeoutRef.current); setBusy(false) }
            }
            break
          case 'communityPeerJoined': addPeer(message.peer, false); break
          case 'communityPeerLeft':
            peersRef.current.get(message.peerId)?.voice.close()
            peersRef.current.delete(message.peerId)
            pendingSignals.current.delete(message.peerId)
            setStreams(current => { const next = { ...current }; delete next[message.peerId]; return next })
            setPeerStates(current => { const next = { ...current }; delete next[message.peerId]; return next })
            break
          case 'communitySignal': {
            const peer = peersRef.current.get(message.from)
            if (peer) { peer.chain = peer.chain.then(() => peer.voice.handleSignal(message.data)); peer.chain.catch(() => setError('Audio connection interrupted. Leave and rejoin to retry.')) }
            else if (pendingSignals.current.size < 16) pendingSignals.current.set(message.from, [...(pendingSignals.current.get(message.from) ?? []), message.data].slice(-30))
            break
          }
          case 'communityChat': setMessages(current => [...current, message.message].slice(-80)); break
          case 'communityLeft':
            leavingRef.current = false
            stopMedia()
            if (message.message) setNotice(message.message)
            if (nextPartnerRef.current) { nextPartnerRef.current = false; void beginRoomRequest({ type: 'communityMatch' }) }
            break
          case 'communityInvitation': setInvitation(message); break
          case 'communityInvitationCancelled': setInvitation(current => current?.id === message.id ? null : current); break
          case 'communityMatching': window.clearTimeout(timeoutRef.current); setMatching(true); break
          case 'communityError': setError(message.message); if (!roomRef.current) stopMedia(); else if (pendingRef.current) releaseMicrophone(); break
          case 'communityNotice': setNotice(message.message); if (!message.message.startsWith('Invitation sent') && !roomRef.current && !leavingRef.current) stopMedia(); break
        }
      }
      socket.onerror = () => { if (!disposed) setError('Connection interrupted. Reconnecting to speaking rooms…') }
      socket.onclose = () => {
        if (disposed) return
        setConnected(false)
        setAvailable([])
        setAvailablePeople([])
        setRooms([])
        setInvitation(null)
        nextPartnerRef.current = false
        leavingRef.current = false
        stopMedia()
        if (!disposed) { setError('Connection interrupted. Your microphone has been turned off. Reconnecting…'); retry = window.setTimeout(connect, Math.min(1000 * 2 ** attempts++, 15_000)) }
      }
    }
    void connect()
    return () => {
      disposed = true
      window.clearTimeout(retry)
      socketRef.current?.close()
      socketRef.current = null
      setConnected(false)
      stopMedia()
    }
  }, [enabled, send, stopMedia, releaseMicrophone])

  useEffect(() => {
    if (!invitation) return
    const timeout = window.setTimeout(() => setInvitation(null), Math.max(0, invitation.expiresAt - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [invitation])

  const beginRoomRequest = async (payload: Record<string, unknown>, inviting = false) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN || pendingRef.current || roomRef.current || leavingRef.current) return
    pendingRef.current = true
    setBusy(true)
    setError('')
    setNotice('')
    setOutgoingInvitation(inviting && typeof payload.nickname === 'string' ? { nickname: payload.nickname, expiresAt: Date.now() + 60_000 } : null)
    try {
      // Negotiate a listening connection first. Only taking a seat requests a mic.
      localRef.current = new MediaStream()
      send(payload)
      timeoutRef.current = window.setTimeout(() => {
        if (!roomRef.current) {
          leave()
          setNotice(inviting ? 'Invitation expired. Try another online partner.' : 'The room did not respond. Please try again.')
        }
      }, inviting ? 65_000 : 15_000)
    } catch {
      stopMedia()
      setError('Your browser could not start live audio. Please use a browser that supports WebRTC.')
    }
  }
  const leave = () => {
    nextPartnerRef.current = false
    send({ type: 'communityLeave' })
    stopMedia()
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      leavingRef.current = true
      setBusy(true)
      timeoutRef.current = window.setTimeout(() => { leavingRef.current = false; nextPartnerRef.current = false; stopMedia(); setError('The room did not respond. Please try again.') }, 10_000)
    }
  }
  const self = room?.members.find(member => member.id === selfId)
  const takeSeat = async () => {
    const currentRoom = roomRef.current
    if (!currentRoom || pendingRef.current) return
    if (self?.role === 'listener' && currentRoom.members.filter(member => member.role === 'speaker').length >= currentRoom.capacity) { setError('The stage is full. You can keep listening until a seat opens.'); return }
    pendingRef.current = true
    const generation = generationRef.current
    setBusy(true)
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })
      if (generation !== generationRef.current || roomRef.current?.id !== currentRoom.id) { stream.getTracks().forEach(track => track.stop()); return }
      stream.getAudioTracks().forEach(track => { track.enabled = false })
      localRef.current?.getTracks().forEach(track => track.stop())
      localRef.current = stream
      await Promise.all([...peersRef.current.values()].map(async peer => { await peer.ready; await peer.voice.replaceAudioTrack(stream.getAudioTracks()[0]) }))
      if (generation !== generationRef.current) return
      send({ type: 'communityTakeSeat' })
      timeoutRef.current = window.setTimeout(() => { if (pendingRef.current) { releaseMicrophone(); send({ type: 'communityState', muted: true, hand: false, side: self?.side ?? '' }); setError('The stage did not respond. Please try again.') } }, 10_000)
    } catch {
      if (generation !== generationRef.current) return
      releaseMicrophone()
      setError('Allow microphone access in your browser, then try again.')
    }
  }
  const changeState = (change: Partial<Pick<SpeakingMember, 'muted' | 'hand' | 'side'>>) => {
    if (!self) return
    if (change.muted === false && (self.role === 'listener' || !localRef.current?.getAudioTracks().some(track => track.readyState === 'live'))) { void takeSeat(); return }
    const next = { ...self, ...change }
    localRef.current?.getAudioTracks().forEach(track => { track.enabled = next.role === 'speaker' && !next.muted })
    send({ type: 'communityState', muted: next.muted, hand: next.hand, side: next.side })
  }
  return {
    connected, rooms, online, available, availablePeople, room, selfId, selfName, self, messages, streams, peerStates, invitation, outgoingInvitation, error, notice, busy, matching,
    clearError: () => setError(''),
    create: (draft: RoomDraft) => beginRoomRequest({ type: 'communityCreate', ...draft }),
    join: (roomId: string) => beginRoomRequest({ type: 'communityJoin', roomId, listen: true }),
    takeSeat,
    stepDown: () => { send({ type: 'communityStepDown' }); releaseMicrophone() },
    invite: (nickname: string) => beginRoomRequest({ type: 'communityInvite', nickname }, true),
    match: () => beginRoomRequest({ type: 'communityMatch' }),
    nextPartner: () => { leave(); nextPartnerRef.current = true },
    reply: (accept: boolean) => {
      if (!invitation) return
      if (accept && (socketRef.current?.readyState !== WebSocket.OPEN || pendingRef.current || roomRef.current || leavingRef.current)) return
      const payload = { type: 'communityReply', id: invitation.id, accept }
      setInvitation(null)
      if (accept) return beginRoomRequest(payload)
      send(payload)
    },
    leave, changeState,
    chat: (text: string) => send({ type: 'communityChat', text }),
    remove: (peerId: string) => send({ type: 'communityRemove', peerId }),
    setMode: (kind: string) => send({ type: 'communityMode', kind }),
    setTopic: (topic: string) => send({ type: 'communityTopic', topic }),
    debateAction: (action: 'start' | 'pause' | 'next') => send({ type: 'communityDebate', action }),
  }
}

export type SpeakingCommunity = ReturnType<typeof useSpeakingCommunity>
