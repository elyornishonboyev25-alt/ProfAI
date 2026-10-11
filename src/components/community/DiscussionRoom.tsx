import { useEffect, useRef, useState } from 'react'
import { CircleHelp, GraduationCap, Loader2, MessageCircleMore, MoreHorizontal, Pencil, RefreshCw, Reply, Send, Sparkles, Trash2, Users, WifiOff } from 'lucide-react'
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
  editedAt?: string
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
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [actionPending, setActionPending] = useState<string | null>(null)
  const actionRef = useRef<{ id: string; type: 'discussionEdit' | 'discussionDelete' } | null>(null)
  const actionTimerRef = useRef(0)
  const pendingRef = useRef<string | null>(null)
  const sendTimerRef = useRef(0)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const nearBottomRef = useRef(true)
  const transportRef = useRef<WebSocket | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const name = user?.nickname ?? user?.fullName ?? 'Guest learner'
  const userId = user?.id ?? `guest-${name.toLowerCase().replace(/\W+/g, '-').slice(0, 30)}`
  const draftKey = `community-draft:${userId}:${roomId}`
  const isQuestions = roomId === 'hard-questions'
  const Icon = isQuestions ? CircleHelp : GraduationCap
  const starters = isQuestions ? [
    ['IELTS', 'How can I improve my IELTS speaking score?'],
    ['SAT', 'Can someone explain how to approach a difficult SAT question?'],
    ['Study tips', 'What helps you stay consistent with studying?'],
  ] : [
    ['Scholarships', 'How do you find scholarships for international students?'],
    ['Applications', 'What should I include in my university application?'],
    ['University life', 'What do you wish you knew before studying abroad?'],
  ]

  useEffect(() => {
    try { setDraft(sessionStorage.getItem(draftKey) ?? '') } catch { /* Storage can be unavailable. */ }
  }, [draftKey])
  const updateDraft = (value: string) => {
    setDraft(value)
    try { if (value) sessionStorage.setItem(draftKey, value); else sessionStorage.removeItem(draftKey) } catch { /* Keep the draft in memory. */ }
  }
  const startDraft = (value: string) => { updateDraft(value.slice(0, 500)); composerRef.current?.focus() }

  useEffect(() => {
    let active = true
    let reconnectTimer = 0
    let attempts = 0
    let handshakeTimer = 0
    const receive = (payload: { type?: string; roomId?: string; messages?: DiscussionMessage[]; message?: DiscussionMessage; messageId?: string; online?: number }) => {
      if (!active || payload.roomId !== roomId) return
      if (payload.type === 'discussionSnapshot') { window.clearTimeout(handshakeTimer); attempts = 0; setMessages(payload.messages ?? []); setConnection('online') }
      if (payload.type === 'discussionMessage' && payload.message) {
        setMessages((current) => current.some((item) => item.id === payload.message!.id) ? current : [...current, payload.message!].slice(-80))
        if (payload.message.userId === userId && payload.message.text === pendingRef.current) {
          pendingRef.current = null
          window.clearTimeout(sendTimerRef.current)
          setSending(false)
          setSendError('')
          updateDraft('')
          nearBottomRef.current = true
        }
      }
      if (payload.type === 'discussionPresence') setOnline(Math.max(0, payload.online ?? 0))
      if (payload.type === 'discussionMessageUpdated' && payload.message) {
        setMessages(current => current.map(item => item.id === payload.message!.id ? payload.message! : item))
      }
      if (payload.type === 'discussionMessageDeleted') {
        setMessages(current => current.filter(item => item.id !== payload.messageId))
        setEditingId(current => current === payload.messageId ? null : current)
      }
      const pending = actionRef.current
      const actionId = payload.message?.id ?? payload.messageId
      if (pending && pending.id === actionId && (
        payload.type === 'discussionActionError' ||
        (pending.type === 'discussionEdit' && payload.type === 'discussionMessageUpdated') ||
        (pending.type === 'discussionDelete' && payload.type === 'discussionMessageDeleted')
      )) {
        window.clearTimeout(actionTimerRef.current)
        actionRef.current = null
        setActionPending(null)
        if (payload.type === 'discussionActionError') setSendError('Could not update this message. Please reconnect and try again.')
        else { setSendError(''); setEditingId(current => current === actionId ? null : current) }
      }
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
      handshakeTimer = window.setTimeout(() => socket.close(), 10_000)
      socket.onopen = () => {
        if (!active) { socket.close(); return }
        socket.send(JSON.stringify({ type: 'hello', userId, name }))
        socket.send(JSON.stringify({ type: 'joinDiscussion', roomId }))
      }
      socket.onmessage = (event) => {
        try { receive(JSON.parse(event.data)) } catch { /* Ignore malformed realtime payloads. */ }
      }
      socket.onerror = () => {}
      socket.onclose = () => {
        window.clearTimeout(handshakeTimer)
        if (!active) return
        transportRef.current = null
        setConnection('offline')
        setOnline(0)
        if (actionRef.current) setSendError('Message change was not confirmed. Reconnect and check the conversation before trying again.')
        actionRef.current = null
        window.clearTimeout(actionTimerRef.current)
        setActionPending(null)
        if (pendingRef.current) setSendError('Message was not confirmed. Your draft is saved; check the conversation before sending again.')
        pendingRef.current = null
        window.clearTimeout(sendTimerRef.current)
        setSending(false)
        scheduleReconnect()
      }
    }

    connect()
    return () => {
      active = false
      window.clearTimeout(reconnectTimer)
      window.clearTimeout(handshakeTimer)
      window.clearTimeout(sendTimerRef.current)
      window.clearTimeout(actionTimerRef.current)
      const socket = transportRef.current
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'leaveDiscussion' }))
      socket?.close()
      transportRef.current = null
    }
  }, [name, reconnectKey, roomId, userId])

  useEffect(() => {
    if (nearBottomRef.current) viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    const text = draft.trim().slice(0, 500)
    const transport = transportRef.current
    if (!text || pendingRef.current || connection !== 'online' || transport?.readyState !== WebSocket.OPEN) return
    pendingRef.current = text
    setSending(true)
    setSendError('')
    try {
      transport.send(JSON.stringify({ type: 'discussionMessage', roomId, text }))
      sendTimerRef.current = window.setTimeout(() => transport.close(), 8_000)
    } catch { transport.close() }
  }

  const changeMessage = (messageId: string, type: 'discussionEdit' | 'discussionDelete') => {
    const transport = transportRef.current
    const token = useAuthStore.getState().accessToken
    if (actionRef.current || connection !== 'online' || transport?.readyState !== WebSocket.OPEN) return
    if (!token) { setSendError('Could not update this message. Please reconnect and try again.'); return }
    const text = editText.trim().slice(0, 500)
    if (type === 'discussionEdit' && !text) return
    actionRef.current = { id: messageId, type }
    setActionPending(messageId)
    setSendError('')
    try {
      transport.send(JSON.stringify({ type, roomId, messageId, token, ...(type === 'discussionEdit' ? { text } : {}) }))
      actionTimerRef.current = window.setTimeout(() => transport.close(), 8_000)
    } catch { transport.close() }
  }

  return (
    <section className={cn('discussion-room', isQuestions ? 'is-questions' : 'is-admissions')} aria-label={t(title)}>
      <header className="discussion-header">
        <div className="discussion-title"><span><Icon size={25} /></span><div><span className="community-eyebrow">{t('Learn together')}</span><h2>{t(title)}</h2><p>{t(description)}</p></div></div>
        <div className="discussion-status"><span className={cn('hub-connection', connection === 'online' && 'is-live')} role="status">{connection === 'connecting' ? <Loader2 size={14} className="animate-spin" /> : connection === 'online' ? <Users size={14} /> : <WifiOff size={14} />}{connection === 'online' ? online + ' ' + t('online') : t(connection === 'connecting' ? 'Connecting...' : 'Offline')}</span>{connection === 'offline' ? <button type="button" className="hub-button" onClick={() => setReconnectKey(value => value + 1)} aria-label={t('Reconnect')}><RefreshCw size={15} /></button> : null}</div>
      </header>
      <div className="discussion-layout"><div className="discussion-conversation">
        <div className="discussion-thread-label"><MessageCircleMore size={16} /><b>{t('Conversation')}</b><span>{messages.length} {t('messages')}</span></div>
        <div ref={viewportRef} className="discussion-messages" onScroll={() => { const view = viewportRef.current; if (view) nearBottomRef.current = view.scrollHeight - view.scrollTop - view.clientHeight < 80 }} role="log" aria-live="polite" aria-label={t('Messages')} tabIndex={0}>
          {messages.length === 0 ? <div className="community-empty"><span className="discussion-empty-icon"><Icon size={30} /></span><h2>{t('Start the conversation')}</h2><p>{t('Share a clear question or useful experience. Everyone currently in this room can reply.')}</p><div className="discussion-topic-chips">{starters.map(([label, question]) => <button type="button" key={label} disabled={sending} onClick={() => startDraft(t(question))}><Sparkles size={14} />{t(label)}</button>)}</div></div> : messages.map(message => (
            <article key={message.id} className={cn('discussion-message', message.userId === userId && 'is-self')}>
              <div className="discussion-message-meta"><strong>{message.userId === userId ? t('You') : '@' + message.name}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{message.editedAt ? <span className="discussion-edited">{t('Edited')}</span> : null}</time></div>
              {editingId === message.id ? (
                <div className="discussion-message-editor">
                  <textarea autoFocus value={editText} maxLength={500} rows={3} aria-label={t('Edit message')} disabled={actionPending === message.id} onChange={event => setEditText(event.target.value)} onKeyDown={event => {
                    if (event.key === 'Escape' && !actionPending) setEditingId(null)
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); changeMessage(message.id, 'discussionEdit') }
                  }} />
                  <div className="discussion-edit-controls"><button type="button" disabled={!!actionPending} onClick={() => setEditingId(null)}>{t('Cancel')}</button><button type="button" disabled={!!actionPending || !editText.trim() || connection !== 'online'} onClick={() => changeMessage(message.id, 'discussionEdit')}>{actionPending === message.id ? <Loader2 size={14} className="animate-spin" /> : t('Save changes')}</button></div>
                </div>
              ) : <p>{message.text}</p>}
              {message.userId === userId && editingId !== message.id ? (
                <footer className="discussion-message-footer">
                  <details className="discussion-message-actions" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
                    <summary aria-label={t('Message options')}><MoreHorizontal size={18} /></summary>
                    <div className="discussion-action-menu">
                      <button type="button" disabled={!!actionPending || connection !== 'online'} onClick={event => { event.currentTarget.closest('details')!.open = false; setEditingId(message.id); setEditText(message.text); setSendError('') }}><Pencil size={14} />{t('Edit message')}</button>
                      <button type="button" className="is-delete" disabled={!!actionPending || connection !== 'online'} onClick={() => changeMessage(message.id, 'discussionDelete')}>{actionPending === message.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}{t('Delete message')}</button>
                    </div>
                  </details>
                </footer>
              ) : message.userId !== userId ? <button type="button" className="discussion-reply" onClick={() => startDraft(`@${message.name} ${draft}`)}><Reply size={13} />{t('Reply')}</button> : null}
            </article>
          ))}
        </div>
        <div className="discussion-composer">{connection !== 'online' ? <p role="status">{t(connection === 'offline' ? 'Live connection was interrupted. We will keep retrying automatically.' : 'Connecting...')}</p> : null}{sendError ? <p role="alert">{t(sendError)}</p> : null}<div><textarea ref={composerRef} value={draft} disabled={sending} onChange={event => updateDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); sendMessage() } }} rows={2} maxLength={500} placeholder={t('Write a message')} aria-label={t('Write a message')} /><button type="button" onClick={sendMessage} disabled={sending || !draft.trim() || connection !== 'online'} aria-label={t('Send message')}>{sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button></div><footer><span>{t('Enter to send · Shift+Enter for a new line')}</span><span>{draft.length}/500</span></footer></div>
      </div><aside className="discussion-guide"><span className="community-eyebrow"><Sparkles size={14} />{t('A good place to start')}</span><h3>{t(isQuestions ? 'Every question is welcome.' : 'Plan your next chapter.')}</h3><p>{t('Choose a topic below, add your details and ask the community.')}</p><div>{starters.map(([label, question]) => <button type="button" key={label} disabled={sending} onClick={() => startDraft(t(question))}><b>{t(label)}</b><span>{t(question)}</span><Reply size={16} /></button>)}</div><p className="discussion-guide-note">{t('Be kind, share useful context and keep personal details private.')}</p></aside></div>
    </section>
  )
}
