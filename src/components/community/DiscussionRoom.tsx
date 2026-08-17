import { useEffect, useRef, useState } from 'react'
import { MessageCircleMore, Send, Users } from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'

type DiscussionMessage = {
  id: string
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

function createMessage(name: string, text: string): DiscussionMessage {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    text,
    createdAt: new Date().toISOString(),
    self: true,
  }
}

export default function DiscussionRoom({ roomId, title, description }: DiscussionRoomProps) {
  const user = useAuthStore((state: AuthState) => state.user)
  const [messages, setMessages] = useState<DiscussionMessage[]>([])
  const [draft, setDraft] = useState('')
  const [online, setOnline] = useState(1)
  const [connection, setConnection] = useState<'connecting' | 'online' | 'offline'>('connecting')
  const transportRef = useRef<WebSocket | BroadcastChannel | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const name = user?.nickname ?? user?.fullName ?? 'Guest learner'
  const userId = user?.id ?? `guest-${name.toLowerCase().replace(/\W+/g, '-').slice(0, 30)}`

  useEffect(() => {
    let active = true
    const receive = (payload: { type?: string; roomId?: string; messages?: DiscussionMessage[]; message?: DiscussionMessage; online?: number }) => {
      if (!active || payload.roomId !== roomId) return
      if (payload.type === 'discussionSnapshot') setMessages(payload.messages ?? [])
      if (payload.type === 'discussionMessage' && payload.message) {
        setMessages((current) => current.some((item) => item.id === payload.message!.id) ? current : [...current, payload.message!].slice(-80))
      }
      if (payload.type === 'discussionPresence') setOnline(Math.max(1, payload.online ?? 1))
    }

    if (import.meta.env.DEV && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`profai-discussion-${roomId}`)
      channel.onmessage = (event) => receive(event.data)
      transportRef.current = channel
      setConnection('online')
      return () => {
        active = false
        channel.close()
        transportRef.current = null
      }
    }

    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${scheme}://${window.location.host}/ws/speaking`)
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'hello', userId, name }))
      socket.send(JSON.stringify({ type: 'joinDiscussion', roomId }))
      setConnection('online')
    }
    socket.onmessage = (event) => {
      try { receive(JSON.parse(event.data)) } catch { /* Ignore malformed realtime payloads. */ }
    }
    socket.onerror = () => setConnection('offline')
    socket.onclose = () => active && setConnection('offline')
    transportRef.current = socket
    return () => {
      active = false
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'leaveDiscussion' }))
      socket.close()
      transportRef.current = null
    }
  }, [name, roomId, userId])

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    const text = draft.trim().slice(0, 500)
    if (!text || connection !== 'online') return
    const localMessage = createMessage(name, text)
    const transport = transportRef.current
    if (transport instanceof BroadcastChannel) {
      setMessages((current) => [...current, localMessage].slice(-80))
      transport.postMessage({ type: 'discussionMessage', roomId, message: { ...localMessage, self: false } })
    } else if (transport?.readyState === WebSocket.OPEN) {
      transport.send(JSON.stringify({ type: 'discussionMessage', roomId, text }))
    }
    setDraft('')
  }

  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-white/90 bg-white/75 shadow-[0_24px_60px_rgba(30,64,175,.11)] backdrop-blur-md">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-red-50/70 via-white to-blue-50/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,.24)]"><MessageCircleMore className="h-5 w-5" /></span>
          <div><h2 className="font-black text-slate-950">{title}</h2><p className="text-xs text-slate-500">{description}</p></div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><Users className="h-3.5 w-3.5" /> {online} online</span>
      </header>

      <div ref={viewportRef} className="h-[26rem] space-y-3 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center"><div><MessageCircleMore className="mx-auto h-9 w-9 text-blue-400" /><h3 className="mt-3 font-black text-slate-900">Start the conversation</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Share a clear question or useful experience. Everyone currently in this room can reply.</p></div></div>
        ) : messages.map((message) => (
          <article key={message.id} className={`max-w-[86%] rounded-2xl border px-4 py-3 ${message.self || message.name === name ? 'ml-auto border-red-100 bg-red-50/80' : 'border-blue-100 bg-blue-50/70'}`}>
            <div className="flex items-center justify-between gap-4"><strong className="text-xs text-slate-900">{message.self || message.name === name ? 'You' : message.name}</strong><time className="text-[10px] text-slate-400">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.text}</p>
          </article>
        ))}
      </div>

      <div className="border-t border-slate-200/70 p-4">
        {connection === 'offline' ? <p className="mb-2 text-xs font-semibold text-red-600">Live room is temporarily offline. Reopen the room to reconnect.</p> : null}
        <div className="flex items-end gap-2 rounded-2xl border border-blue-100 bg-white p-2 shadow-inner">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} rows={2} maxLength={500} placeholder="Write your message…" className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none" />
          <button type="button" onClick={sendMessage} disabled={!draft.trim() || connection !== 'online'} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,.22)] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  )
}
