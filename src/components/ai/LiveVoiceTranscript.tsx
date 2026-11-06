import { useEffect, useRef } from 'react'
import type { AiAssistantMessage } from '@/store/aiAssistantStore'

export default function LiveVoiceTranscript({ messages, caption, language }: {
  messages: AiAssistantMessage[]
  caption: string
  language: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const turns = messages.filter(message => message.delivery === 'voice').slice(-8)
  const last = turns[turns.length - 1]
  const text = (en: string, uz: string, ru: string) => language === 'uz' ? uz : language === 'ru' ? ru : en
  useEffect(() => {
    if (panel.current && follow.current) panel.current.scrollTop = panel.current.scrollHeight
  }, [last?.id, last?.content, caption])
  return <div ref={panel} role="log" aria-live="off" aria-label={text('Conversation transcript', 'Suhbat matni', 'Текст разговора')}
    className="max-h-56 space-y-3 overflow-y-auto text-left" onScroll={() => {
      const node = panel.current
      if (node) follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 60
    }}>
    {turns.length ? turns.map(turn => <div key={turn.id} className={`rounded-2xl px-4 py-3 ${turn.role === 'user' ? 'ml-8 bg-white/10' : 'mr-8 bg-rose-400/10'}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-400">{turn.role === 'user' ? text('You', 'Siz', 'Вы') : 'Nova'}</span>
      <p className="whitespace-pre-wrap text-base leading-7 text-slate-200">{turn.content}</p>
    </div>) : <p className="text-center text-base leading-7 text-slate-200">{caption || text('What would you like to work on?', 'Nima ustida ishlaymiz?', 'Над чем поработаем?')}</p>}
  </div>
}
