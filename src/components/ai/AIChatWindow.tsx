import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ArrowDown,
  AudioLines,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  Copy,
  GraduationCap,
  History,
  ImagePlus,
  Menu,
  Maximize2,
  Mic,
  Pencil,
  PenLine,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sigma,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import AiMessageContent from '@/components/ai/AiMessageContent'
import { useAiTutor } from '@/components/ai/useAiTutor'
import VoiceOrb from '@/components/ai/VoiceOrb'
import CoachControls from './CoachControls'
import NovaWelcome from './NovaWelcome'
import { coachCopy } from '@/services/ai/coachPreferences'
import { useCopy } from '@/i18n/interface'
import { premiumLanguage } from '@/i18n/premium'
import { AI_WORKSPACES, type AiWorkspaceId } from '@/services/ai/workspaces'
import './coach-studio.css'

type ChatWindowVariant = 'floating' | 'page' | 'analysis'

type AIChatWindowProps = {
  variant?: ChatWindowVariant
  onClose?: () => void
}

function CopyButton({ text }: { text: string }) {
  const { c } = useCopy()
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
      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-500 opacity-60 shadow-sm backdrop-blur transition hover:border-red-200 hover:text-red-700 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
      aria-label={c('Copy message')}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? c('Copied') : c('Copy')}
    </button>
  )
}

const STATUS_TEXT: Record<string, string> = { idle: 'Ready to help', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…' }
const WORKSPACE_ICONS: Record<AiWorkspaceId, typeof BrainCircuit> = {
  general: BrainCircuit, ielts: PenLine, sat: Sigma, english: BookOpen, admission: GraduationCap,
}

export function AIChatWindow({ variant = 'floating', onClose }: AIChatWindowProps) {
  const { c, language } = useCopy()
  const uiLanguage = premiumLanguage(language)
  const studioText = coachCopy(language)
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const openTalk = useAiAssistantStore((s) => s.openTalk)
  const setWorkspace = useAiAssistantStore((s) => s.setActiveWorkspace)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const tutor = useAiTutor()
  const {
    user, hasPremium, messages, isSending, error,
    draft, setDraft, images, addImages, removeImage,
    send, cancelSend, preferredName,
    workspace, pendingActions, approveAction, dismissAction,
    voiceState, voiceLevel, voiceSupported, isListening,
    interimTranscript, startVoice,
    voiceError,
    chatThreads, activeThread, activeThreadId, threadsLoading, memories,
    createNewChat, selectChat, renameChat, deleteChat, forgetMemory,
  } = tutor

  const isPage = variant === 'page'
  const savedChats = chatThreads.filter((thread) => thread.messages.length > 0)
  const chatTitle = (title: string) => ['New chat', 'Yangi chat', 'Новый чат', 'Previous conversation'].includes(title) ? c(title === 'Previous conversation' ? 'Previous conversation' : 'New chat') : title
  const followLatestRef = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const [creatingChat, setCreatingChat] = useState(false)
  const [panel, setPanel] = useState<'chats' | 'memory' | 'settings' | null>(null)
  const panelId = useId()
  const panelRef = useRef<HTMLElement | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const chatContentRef = useRef<HTMLDivElement | null>(null)
  const panelOpen = panel !== null
  useEffect(() => {
    if (!panelOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const content = chatContentRef.current
    content?.setAttribute('inert', '')
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      content?.removeAttribute('inert')
      const restoreFocus = menuButtonRef.current ?? previousFocus
      restoreFocus?.focus()
    }
  }, [panelOpen])
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
    const prompt = uiLanguage === 'uz'
      ? `"${title}" chatini butunlay o'chirasizmi?`
      : uiLanguage === 'ru'
        ? `Удалить чат «${title}» безвозвратно?`
        : `Permanently delete "${title}"?`
    if (window.confirm(prompt)) void deleteChat(threadId)
  }

  const confirmForgetMemory = (memoryId: string) => {
    const prompt = uiLanguage === 'uz'
      ? "Bu xotirani butunlay o'chirasizmi?"
      : uiLanguage === 'ru'
        ? 'Удалить эту запись из памяти?'
        : 'Delete this memory?'
    if (window.confirm(prompt)) void forgetMemory(memoryId)
  }

  const statusText = c(STATUS_TEXT[voiceState] ?? STATUS_TEXT.idle)
  const quickChips = workspace.starters[uiLanguage]
  const WorkspaceIcon = WORKSPACE_ICONS[workspace.id]

  useEffect(() => {
    followLatestRef.current = true
    setShowJump(false)
  }, [activeThreadId])

  useEffect(() => {
    const viewport = messagesViewportRef.current
    if (!viewport || !followLatestRef.current) return
    const frame = window.requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, isSending])

  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const resetTextareaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const doSend = (text?: string) => {
    followLatestRef.current = true
    setShowJump(false)
    void send(text ? { text } : undefined)
    resetTextareaHeight()
  }

  const startNewChat = async () => {
    if (creatingChat || threadsLoading) return
    setCreatingChat(true)
    try {
      await createNewChat()
      setPanel(null)
      window.requestAnimationFrame(() => textareaRef.current?.focus())
    } finally {
      setCreatingChat(false)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline (professional chat behaviour).
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      doSend()
    }
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const resize = () => {
      el.style.height = 'auto'
      const height = el.scrollHeight + el.offsetHeight - el.clientHeight
      el.style.height = `${isPage ? height : Math.min(height, 140)}px`
    }
    resize()
    if (typeof ResizeObserver === 'undefined') return
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (width === el.clientWidth) return
      width = el.clientWidth
      resize()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [draft, isPage])

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

  const showHero = messages.length === 0

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
      className={`ai-chat-window relative flex min-w-0 max-w-full flex-col overflow-hidden border bg-white text-slate-900 ${
        isPage
          ? 'ai-chat-window--studio h-full rounded-[1.4rem] border-white/90 bg-white/85 shadow-[0_18px_46px_rgba(73,43,52,.07),inset_0_1px_0_white] backdrop-blur-2xl'
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
              {c('Drop your image here')}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {panel ? (
          <>
            <motion.button
              type="button"
              aria-label={c('Close panel')}
              className="absolute inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanel(null)}
            />
            <motion.aside
              initial={{ x: reducedMotion ? 0 : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: reducedMotion ? 0 : '-100%' }}
              transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={c(panel === 'chats' ? 'Chat history' : panel === 'memory' ? 'Memory' : studioText.preferences)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') { event.stopPropagation(); setPanel(null) }
                if (event.key !== 'Tab') return
                const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
                const first = controls[0], last = controls[controls.length - 1]
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
              }}
              className="coach-drawer absolute inset-y-0 left-0 z-40 flex w-[min(92%,24rem)] flex-col border-r shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="coach-drawer-brand">
                  <VoiceOrb state={voiceState} level={voiceLevel} size={48}/>
                  <div>
                  <p className="text-sm font-black text-slate-950">
                    ProfAI
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {studioText.studio}
                  </p>
                  </div>
                </div>
                <button type="button" onClick={() => setPanel(null)} aria-label={c('Close panel')} className="coach-icon-button">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="coach-drawer-nav" aria-label={c('Chat menu')}>
                {([
                  { id: 'chats', label: c('History'), icon: History },
                  { id: 'memory', label: c('Memory'), icon: BrainCircuit },
                  { id: 'settings', label: studioText.preferences, icon: Settings2 },
                ] as const).map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={panel === id ? 'page' : undefined} onClick={() => setPanel(id)}><Icon size={17}/><span>{label}</span>{id === 'memory' && memories.length > 0 ? <b>{memories.length}</b> : null}</button>)}
              </nav>

              <h2 className="coach-drawer-title">{panel === 'chats' ? c('Your saved conversations') : panel === 'memory' ? c('Available across every chat') : studioText.preferences}</h2>

              {panel === 'chats' ? (
                <>
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => void startNewChat()}
                      disabled={creatingChat || threadsLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-500 px-3 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(185,28,47,.17)] hover:brightness-105"
                    >
                      <Plus className="h-4 w-4" />
                      {c('New chat')}
                    </button>
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
                    {!threadsLoading && savedChats.length === 0 ? <p className="px-3 py-6 text-center text-xs text-slate-500">{c('No saved conversations yet.')}</p> : null}
                    {threadsLoading ? <p className="px-3 py-4 text-xs text-slate-500">{c('Loading chats…')}</p> : null}
                    {savedChats.map((thread) => {
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
                                <span className="block truncate text-xs font-bold text-slate-800">{chatTitle(thread.title)}</span>
                                <span className="mt-0.5 block text-[9px] font-semibold text-slate-400">
                                  {new Date(thread.updatedAt).toLocaleDateString(uiLanguage === 'uz' ? 'uz-UZ' : uiLanguage === 'ru' ? 'ru-RU' : 'en-US')} · {thread.messages.length} {thread.messages.length === 1 ? c('message') : c('messages')}
                                </span>
                              </button>
                              <button type="button" onClick={() => beginRename(thread.id, chatTitle(thread.title))} className="rounded-lg p-1.5 text-slate-400 opacity-0 hover:bg-white hover:text-slate-700 group-hover:opacity-100 focus:opacity-100" aria-label={c('Rename chat')}>
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => confirmDeleteChat(thread.id, chatTitle(thread.title))} className="rounded-lg p-1.5 text-slate-400 opacity-0 hover:bg-white hover:text-red-600 group-hover:opacity-100 focus:opacity-100" aria-label={c('Delete chat')}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : panel === 'memory' ? (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="mb-3 rounded-xl border border-red-100 bg-red-50/70 p-3 text-[11px] leading-5 text-red-900">
                    {uiLanguage === 'uz'
                      ? '“Eslab qol…” deb ayting. ProfAI muhim maqsad va afzalliklaringizni keyingi chatlarda ham eslaydi.'
                      : uiLanguage === 'ru'
                        ? 'Скажите: «Запомни…» ProfAI использует важные цели и предпочтения в следующих чатах.'
                        : 'Say “Remember that…” and ProfAI will use important goals and preferences in future chats.'}
                  </div>
                  {memories.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-500">
                      {c('No saved memories yet.')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {memories.map((memory) => (
                        <div key={memory.id} className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[9px] font-black uppercase tracking-wide text-red-700">{memory.key.replace(/_/g, ' ')}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-700">{memory.value}</p>
                            </div>
                            <button type="button" onClick={() => confirmForgetMemory(memory.id)} className="rounded-lg p-1.5 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label={c('Forget memory')}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="coach-drawer-settings min-h-0 flex-1 overflow-y-auto p-4">
                  <section className="coach-glass coach-focus-card">
                    <h2><AudioLines size={15}/>{studioText.focus}</h2>
                    <div className="coach-focus-list">{AI_WORKSPACES.map(({ id }) => {
                      const Icon = WORKSPACE_ICONS[id]
                      return <button key={id} type="button" className="coach-focus-button" aria-pressed={workspace.id === id} onClick={() => setWorkspace(id)}>
                        <span className="coach-focus-icon"><Icon size={16}/></span>
                        <span className="min-w-0 flex-1"><b>{studioText[id]}</b><small>{studioText[`${id}Detail`]}</small></span>
                        {workspace.id === id ? <Check size={15}/> : null}
                      </button>
                    })}</div>
                  </section>
                  <CoachControls/>
                </div>
              )}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div ref={chatContentRef} className="coach-chat-content flex min-h-0 flex-1 flex-col">
      {isPage ? <header className="coach-chat-toolbar">
        <div className="flex min-w-0 items-center gap-3">
          <button ref={menuButtonRef} type="button" className="coach-icon-button" aria-label={c('Chat menu')} aria-haspopup="dialog" aria-expanded={panelOpen} aria-controls={panelId} onClick={() => setPanel('chats')}><Menu size={21}/></button>
          <div className="coach-workspace-picker">
            <WorkspaceIcon size={16} aria-hidden="true"/>
            <select aria-label={studioText.focus} value={workspace.id} onChange={(event) => setWorkspace(event.target.value as AiWorkspaceId)}>
              {AI_WORKSPACES.map(({ id }) => <option key={id} value={id}>{studioText[id]}</option>)}
            </select>
            <ChevronDown size={13} aria-hidden="true"/>
          </div>
        </div>
        <button type="button" className="coach-icon-button coach-new-chat" onClick={() => void startNewChat()} disabled={creatingChat || threadsLoading} aria-label={c('New chat')} title={c('New chat')}><Plus size={19}/><span>{c('New chat')}</span></button>
      </header> : <>
      {/* Header with the live orb */}
      <header className="relative flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200/70 bg-[linear-gradient(115deg,rgba(255,255,255,.96),rgba(249,246,247,.89))] px-3 py-2.5 backdrop-blur-2xl sm:px-4">
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
              {activeThread?.title ?? `${c(workspace.shortTitle)} ${c('mode')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void createNewChat()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-700 to-red-500 px-3 text-[11px] font-bold text-white shadow-[0_7px_17px_rgba(185,28,47,.18)] transition hover:-translate-y-0.5 hover:brightness-105"
            aria-label={c('New chat')}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">
              {c('New chat')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === 'chats' ? null : 'chats')}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition ${panel === 'chats' ? 'border-red-200 bg-red-50 text-red-700' : 'border-zinc-200 bg-white/80 text-slate-600 hover:border-red-200 hover:text-red-700'}`}
            aria-label={c('Chat history')}
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{c('History')}</span>
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === 'memory' ? null : 'memory')}
            className={`relative inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold transition ${panel === 'memory' ? 'border-red-200 bg-red-50 text-red-700' : 'border-zinc-200 bg-white/80 text-slate-600 hover:border-red-200 hover:text-red-700'}`}
            aria-label={c('Memory')}
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{c('Memory')}</span>
            {memories.length > 0 ? <span className="absolute -right-1 -top-1 min-w-3.5 rounded-full bg-red-600 px-1 text-center text-[8px] font-black leading-3.5 text-white">{Math.min(memories.length, 99)}</span> : null}
          </button>
          <button
            type="button"
            onClick={openTalk}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-2.5 text-[11px] font-bold text-slate-700 transition hover:border-red-200 hover:text-red-700"
            aria-label={c('Talk to ProfAI')}
          >
            <AudioLines className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{c('Talk')}</span>
          </button>
          {!isPage ? (
            <button
              type="button"
              onClick={() => navigate('/ai-tutor')}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label={c('Open full page')}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label={c('Close chat')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>
      <CoachControls compact />
      </>}

      <div className={`relative ${isPage ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
      {/* Messages */}
      <div
        ref={messagesViewportRef}
        onScroll={() => {
          const viewport = messagesViewportRef.current
          if (!viewport) return
          const following = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 72
          followLatestRef.current = following
          setShowJump(!following)
        }}
        className={`min-h-0 flex-1 overscroll-contain bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.95),transparent_45%),linear-gradient(145deg,rgba(249,247,248,.92),rgba(235,233,236,.64),rgba(255,240,242,.55))] px-3 py-4 sm:px-5 ${
          isPage ? 'coach-messages-viewport overflow-y-auto' : 'max-h-[22rem] min-h-[14rem] overflow-y-auto'
        }`}
      >
        {showHero && isPage ? <NovaWelcome preferredName={preferredName}/> : showHero ? (
          <div className="ai-chat-hero flex min-h-full flex-col items-center justify-center px-2 py-6 text-center">
            <>
            <span className="mb-5 rounded-full border border-red-100 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-red-700 shadow-sm">{c('Your study companion')}</span>
            <VoiceOrb state={voiceState} level={voiceLevel} size={80} className="ai-chat-hero-orb" />
            </>
            <h3 className="mt-5 text-xl font-black text-slate-900 sm:text-2xl">
              {preferredName ? `${preferredName}, ` : ''}{studioText.welcome}
            </h3>
            {!isPage ? <><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{studioText.welcomeDetail}</p><span className="mt-4 text-[10px] font-semibold tracking-wide text-slate-400">{studioText.lessonDetail}</span></> : null}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            {messages.map((message) => (
              <motion.article
                key={message.id}
                data-role={message.role}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative max-w-[94%] rounded-2xl border text-sm ${
                  message.role === 'assistant'
                    ? 'border-white/90 bg-white/[0.82] px-4 py-3.5 pr-12 text-slate-800 shadow-[0_16px_42px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-5 sm:py-4 sm:pr-14'
                    : 'ml-auto border-red-400/45 bg-gradient-to-br from-red-700 to-red-500 px-4 py-2.5 leading-6 text-white shadow-[0_9px_24px_rgba(185,28,47,.17)]'
                }`}
              >
                {message.images && message.images.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {message.images.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={c('Attachment')}
                        className="h-20 w-20 rounded-lg border border-white/40 object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                {message.role === 'assistant' ? <><span className="coach-answer-author">Nova</span><AiMessageContent content={message.content} /></> : <p className="whitespace-pre-wrap">{message.content}</p>}
                {message.role === 'assistant' && message.content ? <CopyButton text={message.content} /> : null}
                {message.status === 'interrupted' ? <p className="mt-2 text-xs text-amber-700">{uiLanguage === 'uz' ? 'Javob to‘xtatildi' : uiLanguage === 'ru' ? 'Ответ остановлен' : 'Response stopped'}</p> : null}
              </motion.article>
            ))}
            {isSending && !messages.some((message) => message.status === 'streaming' && message.content) ? (
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
                {c('Thinking…')}
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
                        {c('Your permission')}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{pending.label}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => approveAction(pending.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-700 to-red-500 px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-105"
                        >
                          {c('Allow')}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissAction(pending.id)}
                          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-amber-50"
                        >
                          {c('Dismiss')}
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
      {isPage && showJump ? <button type="button" className="coach-jump-latest" onClick={() => {
        followLatestRef.current = true
        setShowJump(false)
        const viewport = messagesViewportRef.current
        viewport?.scrollTo({ top: viewport.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
      }} aria-label={c('Jump to latest')}><ArrowDown size={16}/>{c('Jump to latest')}</button> : null}
      </div>

      {/* Composer */}
      <div className={`shrink-0 border-t border-zinc-200/70 bg-[linear-gradient(115deg,rgba(255,255,255,.96),rgba(250,246,247,.91))] px-3 py-2.5 backdrop-blur-2xl sm:px-4 ${isPage ? 'coach-composer' : ''}`}>
        {/* Quick chips */}
        {!isPage ? <div className="no-scrollbar mb-2 flex max-w-full flex-nowrap gap-1.5 overflow-x-auto pb-0.5">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => doSend(chip)}
              disabled={isSending}
              className="shrink-0 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-700 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div> : null}

        {/* Image previews */}
        {images.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((src, index) => (
              <div key={index} className="relative">
                <img src={src} alt={c('Upload preview')} className="h-14 w-14 rounded-lg border border-red-200 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-red-700 text-white"
                  aria-label={c('Remove image')}
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
              {interimTranscript || c('Speak now…')}
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
                  {c('Enable microphone')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
          {!isPage ? <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white/90 text-slate-600 transition hover:border-red-200 hover:text-red-700 disabled:opacity-50"
            aria-label={c('Attach image')}
          >
            <ImagePlus className="h-4 w-4" />
          </button> : null}

          <textarea
            ref={textareaRef}
            aria-label={c('Ask ProfAI...')}
            value={draft}
            rows={1}
            onChange={(event) => {
              setDraft(event.target.value)
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={
              isPage
                ? c('Ask ProfAI...')
                : c('Type, paste an image, or tap the mic…')
            }
            className={`${isPage ? 'coach-composer-input' : 'max-h-[140px]'} min-h-[44px] min-w-0 flex-1 resize-none rounded-xl border border-zinc-200 bg-white/90 px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-50`}
            disabled={isSending || threadsLoading}
          />

          {(voiceSupported || typeof RTCPeerConnection !== 'undefined') ? (
            <button
              type="button"
              onClick={() => { cancelSend(); openTalk() }}
              className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition ${
                isListening
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-r from-zinc-500 to-red-700 hover:brightness-110'
              }`}
              aria-label={c(isListening ? 'Stop voice' : 'Start voice')}
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
            onClick={() => isSending ? cancelSend() : doSend()}
            disabled={!isSending && (threadsLoading || (!draft.trim() && images.length === 0))}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-red-700 to-red-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(185,28,47,.24)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-50"
            aria-label={isSending ? (uiLanguage === 'uz' ? 'Javobni to‘xtatish' : uiLanguage === 'ru' ? 'Остановить ответ' : 'Stop response') : c('Send')}
          >
            {isSending ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {error ? (
          <p className="mt-2 text-xs font-medium text-red-600" role="status" aria-live="polite">
            {error}
          </p>
        ) : null}
      </div>
      </div>
    </section>
  )
}

export default AIChatWindow
