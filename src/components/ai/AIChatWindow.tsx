import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  AudioLines,
  BrainCircuit,
  Check,
  Copy,
  History,
  ImagePlus,
  Maximize2,
  Mic,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import AiMessageContent from '@/components/ai/AiMessageContent'
import { useAiTutor } from '@/components/ai/useAiTutor'
import VoiceOrb from '@/components/ai/VoiceOrb'
import type { ChatLocale } from '@/types/platform'

type ChatWindowVariant = 'floating' | 'page' | 'analysis'

type AIChatWindowProps = {
  variant?: ChatWindowVariant
  onClose?: () => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        })
      }}
      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-500 opacity-60 shadow-sm backdrop-blur transition hover:border-blue-200 hover:text-blue-700 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
      aria-label="Copy message"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const STATUS_TEXT: Record<ChatLocale, Record<string, string>> = {
  uz: {
    idle: 'Yordamga tayyor',
    listening: 'Tinglayapman…',
    thinking: 'O‘ylayapman…',
    speaking: 'Gapiryapman…',
  },
  en: {
    idle: 'Ready to help',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
  },
}

export function AIChatWindow({ variant = 'floating', onClose }: AIChatWindowProps) {
  const navigate = useNavigate()
  const openTalk = useAiAssistantStore((s) => s.openTalk)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const tutor = useAiTutor()
  const {
    user, hasPremium, messages, isSending, error,
    draft, setDraft, images, addImages, removeImage,
    send, preferredLocale, preferredName,
    workspace, pendingActions, approveAction, dismissAction,
    voiceState, voiceLevel, voiceSupported, isListening,
    interimTranscript, startVoice, stopVoice,
    voiceLang, setVoiceLang, voiceError,
    chatThreads, activeThread, activeThreadId, threadsLoading, memories,
    createNewChat, selectChat, renameChat, deleteChat, forgetMemory,
  } = tutor

  const VOICE_LANGS = [
    { id: 'en', label: 'EN' },
    { id: 'uz', label: 'UZ' },
    { id: 'ru', label: 'RU' },
  ] as const

  const isPage = variant === 'page'
  const [panel, setPanel] = useState<'chats' | 'memory' | null>(null)
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const beginRename = (threadId: string, title: string) => {
    setEditingThreadId(threadId)
    setEditingTitle(title)
  }

  const finishRename = () => {
    if (editingThreadId && editingTitle.trim()) void renameChat(editingThreadId, editingTitle)
    setEditingThreadId(null)
    setEditingTitle('')
  }

  const confirmDeleteChat = (threadId: string, title: string) => {
    const prompt = voiceLang === 'uz'
      ? `"${title}" chatini butunlay o'chirasizmi?`
      : voiceLang === 'ru'
        ? `Удалить чат «${title}» безвозвратно?`
        : `Permanently delete "${title}"?`
    if (window.confirm(prompt)) void deleteChat(threadId)
  }

  const confirmForgetMemory = (memoryId: string) => {
    const prompt = voiceLang === 'uz'
      ? "Bu xotirani butunlay o'chirasizmi?"
      : voiceLang === 'ru'
        ? 'Удалить эту запись из памяти?'
        : 'Delete this memory?'
    if (window.confirm(prompt)) void forgetMemory(memoryId)
  }

  const [hero, setHero] = useState(true)
  useEffect(() => {
    if (messages.length > 0) setHero(false)
  }, [messages.length])

  const welcomeMessage = useMemo(() => {
    const name = preferredName ? `, ${preferredName}` : ''
    return preferredLocale === 'uz'
      ? `Salom${name}! Men ProfAI — shaxsiy o'qituvchingizman. Sahifadagi o'quv kontekstidan foydalanaman, testlarni vaqt bilan ochaman, rasm/skrinshotlarni tushunaman va ovozli gaplasha olaman. Qaysi tilda yozsangiz, o'sha tilda javob beraman.`
      : `Hi${name}! I'm ProfAI — your personal tutor. I use the learning context from your current page, open timed tests, understand screenshots, and talk with you by voice. I reply in the language you use.`
  }, [preferredLocale, preferredName])

  const statusText =
    (STATUS_TEXT[preferredLocale] ?? STATUS_TEXT.en)[voiceState] ?? STATUS_TEXT.en.idle
  const quickChips = workspace.starters[preferredLocale] ?? workspace.starters.en

  useEffect(() => {
    const viewport = messagesViewportRef.current
    if (!viewport) return
    window.requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
    })
  }, [messages, isSending])

  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const resetTextareaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const doSend = (text?: string) => {
    void send(text ? { text } : undefined)
    resetTextareaHeight()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline (professional chat behaviour).
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      doSend()
    }
  }

  const autoGrow = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  const onPaste = (event: React.ClipboardEvent) => {
    const files = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)
    if (files.length > 0) {
      event.preventDefault()
      void addImages(files)
    }
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer?.files?.length) void addImages(event.dataTransfer.files)
  }

  const onPickImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      void addImages(event.target.files)
    }
    event.target.value = ''
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-4 text-slate-900">
        <h3 className="text-sm font-semibold">AI Study Buddy</h3>
        <p className="mt-1 text-xs text-slate-600">Sign in to chat with your AI tutor.</p>
      </section>
    )
  }

  if (!hasPremium) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-4 text-slate-900">
        <h3 className="text-sm font-semibold">Premium AI Tutor</h3>
        <p className="mt-2 text-xs leading-5 text-slate-600">The AI tutor is available for Premium users.</p>
      </section>
    )
  }

  const showHero = hero && messages.length === 0

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault()
        if (!dragging) setDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false)
      }}
      onDrop={onDrop}
      className={`relative flex min-w-0 max-w-full flex-col overflow-hidden border bg-white text-slate-900 ${
        isPage
          ? 'h-full rounded-[1.4rem] border-slate-200/80 bg-white/92 shadow-sm backdrop-blur-2xl'
          : 'rounded-[1.4rem] border-slate-200 shadow-xl'
      }`}
    >
      <AnimatePresence>
        {dragging ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-red-400 bg-red-50/90 backdrop-blur-sm"
          >
            <ImagePlus className="h-8 w-8 text-red-500" />
            <p className="text-sm font-bold text-red-700">
              {preferredLocale === 'uz' ? 'Rasmni shu yerga tashlang' : 'Drop your image here'}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {panel ? (
          <>
            <motion.button
              type="button"
              aria-label="Close panel"
              className="absolute inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanel(null)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 z-40 flex w-[min(88%,20rem)] flex-col border-r border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {panel === 'chats'
                      ? voiceLang === 'uz' ? 'Chatlar' : voiceLang === 'ru' ? 'Чаты' : 'Chats'
                      : voiceLang === 'uz' ? 'Xotira' : voiceLang === 'ru' ? 'Память' : 'Memory'}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {panel === 'chats'
                      ? voiceLang === 'uz' ? 'Alohida saqlangan suhbatlar' : voiceLang === 'ru' ? 'Отдельно сохранённые диалоги' : 'Your saved conversations'
                      : voiceLang === 'uz' ? 'Barcha chatlarda ishlatiladi' : voiceLang === 'ru' ? 'Доступна во всех чатах' : 'Available across every chat'}
                  </p>
                </div>
                <button type="button" onClick={() => setPanel(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {panel === 'chats' ? (
                <>
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => { void createNewChat(); setPanel(null) }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      {voiceLang === 'uz' ? 'Yangi chat' : voiceLang === 'ru' ? 'Новый чат' : 'New chat'}
                    </button>
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
                    {threadsLoading ? <p className="px-3 py-4 text-xs text-slate-500">Loading chats…</p> : null}
                    {chatThreads.map((thread) => {
                      const selected = thread.id === activeThreadId
                      const editing = thread.id === editingThreadId
                      return (
                        <div key={thread.id} className={`group rounded-xl border px-2 py-2 transition ${selected ? 'border-red-200 bg-red-50' : 'border-transparent hover:bg-slate-50'}`}>
                          {editing ? (
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              onBlur={finishRename}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') finishRename()
                                if (event.key === 'Escape') setEditingThreadId(null)
                              }}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-red-300"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => { selectChat(thread.id); setPanel(null) }}
                                className="min-w-0 flex-1 px-1 py-0.5 text-left"
                              >
                                <span className="block truncate text-xs font-bold text-slate-800">{thread.title}</span>
                                <span className="mt-0.5 block text-[9px] font-semibold text-slate-400">
                                  {new Date(thread.updatedAt).toLocaleDateString()} · {thread.messages.length} messages
                                </span>
                              </button>
                              <button type="button" onClick={() => beginRename(thread.id, thread.title)} className="rounded-lg p-1.5 text-slate-400 opacity-0 hover:bg-white hover:text-slate-700 group-hover:opacity-100" aria-label="Rename chat">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => confirmDeleteChat(thread.id, thread.title)} className="rounded-lg p-1.5 text-slate-400 opacity-0 hover:bg-white hover:text-red-600 group-hover:opacity-100" aria-label="Delete chat">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="mb-3 rounded-xl border border-violet-100 bg-violet-50 p-3 text-[11px] leading-5 text-violet-900">
                    {voiceLang === 'uz'
                      ? '“Eslab qol…” deb ayting. ProfAI muhim maqsad va afzalliklaringizni keyingi chatlarda ham eslaydi.'
                      : voiceLang === 'ru'
                        ? 'Скажите: «Запомни…» ProfAI использует важные цели и предпочтения в следующих чатах.'
                        : 'Say “Remember that…” and ProfAI will use important goals and preferences in future chats.'}
                  </div>
                  {memories.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-500">
                      {voiceLang === 'uz' ? 'Hali saqlangan xotira yo‘q.' : voiceLang === 'ru' ? 'Память пока пуста.' : 'No saved memories yet.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {memories.map((memory) => (
                        <div key={memory.id} className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[9px] font-black uppercase tracking-wide text-violet-600">{memory.key.replace(/_/g, ' ')}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-700">{memory.value}</p>
                            </div>
                            <button type="button" onClick={() => confirmForgetMemory(memory.id)} className="rounded-lg p-1.5 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label="Forget memory">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Header with the live orb */}
      <header className="relative flex shrink-0 items-center justify-between gap-2 border-b border-white/80 bg-white/80 px-3 py-2.5 backdrop-blur-2xl sm:px-4">
        <div className="flex items-center gap-2.5">
          <VoiceOrb state={voiceState} level={voiceLevel} size={isPage ? 48 : 40} />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-black text-slate-900">
              ProfAI Coach
              <Sparkles className="h-3 w-3 text-red-500" />
            </p>
            <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500/80">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  voiceState === 'idle' ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'
                }`}
              />
              {statusText}
            </p>
            <p className="mt-0.5 max-w-[16rem] truncate text-[10px] font-bold text-slate-400">
              {activeThread?.title ?? `${workspace.shortTitle} mode`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void createNewChat()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[11px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            aria-label="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">
              {voiceLang === 'uz' ? 'Yangi chat' : voiceLang === 'ru' ? 'Новый чат' : 'New chat'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === 'chats' ? null : 'chats')}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition ${panel === 'chats' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white/80 text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}
            aria-label="Chat history"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">History</span>
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === 'memory' ? null : 'memory')}
            className={`relative inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition ${panel === 'memory' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white/80 text-slate-600 hover:border-violet-200 hover:text-violet-700'}`}
            aria-label="Memory"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Memory</span>
            {memories.length > 0 ? <span className="absolute -right-1 -top-1 min-w-3.5 rounded-full bg-violet-600 px-1 text-center text-[8px] font-black leading-3.5 text-white">{Math.min(memories.length, 99)}</span> : null}
          </button>
          <button
            type="button"
            onClick={openTalk}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-2.5 text-[11px] font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            aria-label="Talk to ProfAI"
          >
            <AudioLines className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{preferredLocale === 'uz' ? 'Gaplashish' : 'Talk'}</span>
          </button>
          {!isPage ? (
            <button
              type="button"
              onClick={() => navigate('/ai-tutor')}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Open full page"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesViewportRef}
        className={`min-h-0 flex-1 overscroll-contain bg-[linear-gradient(145deg,rgba(248,250,252,.76),rgba(239,246,255,.42),rgba(255,241,242,.34))] px-3 py-4 sm:px-5 ${
          isPage ? 'overflow-y-auto' : 'max-h-[22rem] min-h-[14rem] overflow-y-auto'
        }`}
      >
        {showHero ? (
          <div className="flex flex-col items-center px-2 py-6 text-center">
            <VoiceOrb state={voiceState} level={voiceLevel} size={isPage ? 128 : 96} />
            <h3 className="mt-5 text-xl font-black text-slate-900 sm:text-2xl">
              {preferredName ? `${preferredName},` : ''} {preferredLocale === 'uz' ? 'qanday yordam beray?' : 'how can I help?'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{welcomeMessage}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            {messages.map((message) => (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative max-w-[94%] rounded-2xl border text-sm ${
                  message.role === 'assistant'
                    ? 'border-white/90 bg-white/[0.82] px-4 py-3.5 pr-12 text-slate-800 shadow-[0_16px_42px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-5 sm:py-4 sm:pr-14'
                    : 'ml-auto border-slate-900 bg-slate-950 px-4 py-2.5 leading-6 text-white shadow-sm'
                }`}
              >
                {message.images && message.images.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {message.images.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt="attachment"
                        className="h-20 w-20 rounded-lg border border-white/40 object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                {message.role === 'assistant' ? <AiMessageContent content={message.content} /> : <p className="whitespace-pre-wrap">{message.content}</p>}
                {message.role === 'assistant' && message.content ? <CopyButton text={message.content} /> : null}
              </motion.article>
            ))}
            {isSending ? (
              <div className="inline-flex items-center gap-2.5 rounded-2xl border border-red-100 bg-white px-3.5 py-2.5 text-xs text-red-600 shadow-sm">
                <span className="flex items-center gap-1" aria-hidden>
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-red-500"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
                    />
                  ))}
                </span>
                {preferredLocale === 'uz' ? 'O‘ylayapman…' : 'Thinking…'}
              </div>
            ) : null}
            <AnimatePresence>
              {pendingActions.map((pending) => (
                <motion.div
                  key={pending.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="max-w-md rounded-2xl border border-amber-200 bg-amber-50/90 p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900">
                        {preferredLocale === 'uz' ? 'Ruxsat kerak' : 'Your permission'}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{pending.label}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => approveAction(pending.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800"
                        >
                          {preferredLocale === 'uz' ? 'Ruxsat berish' : 'Allow'}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissAction(pending.id)}
                          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-amber-50"
                        >
                          {preferredLocale === 'uz' ? 'Bekor qilish' : 'Dismiss'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-white/80 bg-white/[0.82] px-3 py-2.5 backdrop-blur-2xl sm:px-4">
        {/* Quick chips */}
        <div className="no-scrollbar mb-2 flex max-w-full flex-nowrap gap-1.5 overflow-x-auto pb-0.5">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => doSend(chip)}
              disabled={isSending}
              className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Image previews */}
        {images.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((src, index) => (
              <div key={index} className="relative">
                <img src={src} alt="upload" className="h-14 w-14 rounded-lg border border-red-200 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-900 text-white"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Listening preview */}
        <AnimatePresence>
          {isListening ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
            >
              {interimTranscript || (preferredLocale === 'uz' ? 'Gapiring…' : 'Speak now…')}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {voiceError ? (
          <div className="mb-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900" role="status">
            <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p>{voiceError}</p>
              {voiceSupported ? (
                <button
                  type="button"
                  onClick={() => void startVoice()}
                  className="mt-1.5 rounded-lg bg-amber-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-800"
                >
                  {preferredLocale === 'uz' ? 'Mikrofonni qayta yoqish' : 'Enable microphone'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {voiceSupported ? (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {voiceLang === 'uz' ? 'Til' : voiceLang === 'ru' ? 'Язык' : 'Language'}
            </span>
            {VOICE_LANGS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setVoiceLang(lang.id)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-black transition ${
                  voiceLang === lang.id
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex min-w-0 items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-50"
            aria-label="Attach image"
          >
            <ImagePlus className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={draft}
            rows={1}
            onChange={(event) => {
              setDraft(event.target.value)
              autoGrow()
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={
              preferredLocale === 'uz'
                ? 'Yozing, rasm tashlang yoki mikrofonni bosing…'
                : 'Type, paste an image, or tap the mic…'
            }
            className="max-h-[120px] min-h-[44px] min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            disabled={isSending}
          />

          {voiceSupported ? (
            <button
              type="button"
              onClick={() => (isListening ? stopVoice() : startVoice())}
              className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition ${
                isListening
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-r from-slate-700 to-slate-900 hover:brightness-110'
              }`}
              aria-label={isListening ? 'Stop voice' : 'Start voice'}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-xl bg-emerald-400/50 animate-ping" />
                  <Square className="relative h-4 w-4" />
                </>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => doSend()}
            disabled={isSending || (!draft.trim() && images.length === 0)}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="mt-2 text-xs font-medium text-red-600" role="status" aria-live="polite">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default AIChatWindow
