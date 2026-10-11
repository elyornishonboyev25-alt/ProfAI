import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircleMore, RefreshCw, Send, Users, WifiOff } from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { getSpeakingWebSocketUrl } from '@/lib/speakingWebSocketUrl'
import { useCommunityCopy } from '@/i18n/community'
import { cn } from '@/components/ui/utils'

type DiscussionMessage = {
  id: string
  userId: string
  name: string
  text: string
  createdAt: string
  self?: boolean
}

type DiscussionRoomProps = {
  roomId: 'hard-questions' | 'study-abroad'
  title: string
  description: string
}

export default function DiscussionRoom({ roomId, title, description }: DiscussionRoomProps) {
  const t = useCommunityCopy()
  const user = useAuthStore((state: AuthState) => state.user)
  const [messages, setMessages] = useState<DiscussionMessage[]>([])
  const [draft, setDraft] = useState('')
  const [online, setOnline] = useState(0)
  const [connection, setConnection] = useState<'connecting' | 'online' | 'offline'>('connecting')
  const [reconnectKey, setReconnectKey] = useState(0)
  const transportRef = useRef<WebSocket | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const name = user?.nickname ?? user?.fullName ?? 'Guest learner'
  const userId = user?.id ?? `guest-${name.toLowerCase().replace(/\W+/g, '-').slice(0, 30)}`

  useEffect(() => {
    let active = true
    let reconnectTimer = 0
    let attempts = 0
    const receive = (payload: { type?: string; roomId?: string; messages?: DiscussionMessage[]; message?: DiscussionMessage; online?: number }) => {
      if (!active || payload.roomId !== roomId) return
      if (payload.type === 'discussionSnapshot') { setMessages(payload.messages ?? []); setConnection('online') }
      if (payload.type === 'discussionMessage' && payload.message) {
        setMessages((current) => current.some((item) => item.id === payload.message!.id) ? current : [...current, payload.message!].slice(-80))
      }
      if (payload.type === 'discussionPresence') setOnline(Math.max(0, payload.online ?? 0))
    }

    const scheduleReconnect = () => {
      const delay = Math.min(1_000 * 2 ** attempts++, 10_000)
      reconnectTimer = window.setTimeout(connect, delay)
    }
    const connect = () => {
      if (!active) return
      setConnection('connecting')
      let socket: WebSocket
      try {
        socket = new WebSocket(getSpeakingWebSocketUrl())
      } catch {
        setConnection('offline')
        scheduleReconnect()
        return
      }
      transportRef.current = socket
      socket.onopen = () => {
        if (!active) { socket.close(); return }
        attempts = 0
        socket.send(JSON.stringify({ type: 'hello', userId, name }))
        socket.send(JSON.stringify({ type: 'joinDiscussion', roomId }))
      }
      socket.onmessage = (event) => {
        try { receive(JSON.parse(event.data)) } catch { /* Ignore malformed realtime payloads. */ }
      }
      socket.onerror = () => {}
      socket.onclose = () => {
        if (!active) return
        transportRef.current = null
        setConnection('offline')
        setOnline(0)
        scheduleReconnect()
      }
    }

    connect()
    return () => {
      active = false
      window.clearTimeout(reconnectTimer)
      const socket = transportRef.current
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'leaveDiscussion' }))
      socket?.close()
      transportRef.current = null
    }
  }, [name, reconnectKey, roomId, userId])

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    const text = draft.trim().slice(0, 500)
    const transport = transportRef.current
    if (!text || connection !== 'online' || transport?.readyState !== WebSocket.OPEN) return
    transport.send(JSON.stringify({ type: 'discussionMessage', roomId, text }))
    setDraft('')
  }

  return (
    <section className="discussion-room" aria-label={t(title)}>
      <header className="discussion-header">
        <div className="discussion-title"><span><MessageCircleMore size={21} /></span><div><h2>{t(title)}</h2><p>{t(description)}</p></div></div>
        <div className="discussion-status"><span className={cn('hub-connection', connection === 'online' && 'is-live')} role="status">{connection === 'connecting' ? <Loader2 size={14} className="animate-spin" /> : connection === 'online' ? <Users size={14} /> : <WifiOff size={14} />}{connection === 'online' ? online + ' ' + t('online') : t(connection === 'connecting' ? 'Connecting...' : 'Offline')}</span>{connection === 'offline' ? <button type="button" className="hub-button" onClick={() => setReconnectKey(value => value + 1)} aria-label={t('Reconnect')}><RefreshCw size={15} /></button> : null}</div>
      </header>
      <div ref={viewportRef} className="discussion-messages" role="log" aria-live="polite" aria-label={t('Messages')} tabIndex={0}>
        {messages.length === 0 ? <div className="community-empty"><MessageCircleMore size={36} /><h2>{t('Start the conversation')}</h2><p>{t('Share a clear question or useful experience. Everyone currently in this room can reply.')}</p></div> : messages.map(message => <article key={message.id} className={cn('discussion-message', message.userId === userId && 'is-self')}><div><strong>{message.userId === userId ? t('You') : message.name}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></article>)}
      </div>
      <div className="discussion-composer">{connection === 'offline' ? <p role="status">{t('Live connection was interrupted. We will keep retrying automatically.')}</p> : null}<div><textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); sendMessage() } }} rows={2} maxLength={500} placeholder={t('Write a message')} aria-label={t('Write a message')} /><button type="button" onClick={sendMessage} disabled={!draft.trim() || connection !== 'online'} aria-label={t('Send message')}><Send size={18} /></button></div></div>
    </section>
  )
}
