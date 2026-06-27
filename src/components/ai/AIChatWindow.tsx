import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AudioLines, Check, Copy, ImagePlus, Maximize2, Mic, Send, Sparkles, Square, Trash2, X } from 'lucide-react'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAiTutor } from '@/components/ai/useAiTutor'
import VoiceOrb from '@/components/ai/VoiceOrb'
import type { ChatLocale } from '@/types/platform'

type ChatWindowVariant = 'floating' | 'page' | 'analysis'

type AIChatWindowProps = {
  variant?: ChatWindowVariant
  onClose?: () => void
}

// Render **bold** and preserve line breaks — without unsafe HTML injection.
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
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
      className="absolute -bottom-2.5 right-2 inline-flex items-center gap-1 rounded-full border border-red-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600"
      aria-label="Copy message"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const QUICK_CHIPS: Record<ChatLocale, string[]> = {
  uz: [
    'Shu sahifada nima deyilganini tushuntir',
    'Ishlamagan reading testimni och',
    'Listening test 2 ni 20 daqiqaga och',
    "Xatolarimni ko'rsat",
  ],
  en: [
    "Explain what's on my screen",
    "Open a reading test I haven't done",
    'Open listening test 2 for 20 min',
    'Show my mistakes',
  ],
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const tutor = useAiTutor()
  const {
    user, hasPremium, messages, isSending, error,
    draft, setDraft, images, addImages, removeImage,
    send, clear, preferredLocale, preferredName,
    voiceState, voiceLevel, voiceSupported, isListening,
    interimTranscript, startVoice, stopVoice,
  } = tutor

  const isPage = variant === 'page'

  const [hero, setHero] = useState(true)
  useEffect(() => {
    if (messages.length > 0) setHero(false)
  }, [messages.length])

  const welcomeMessage = useMemo(() => {
    const name = preferredName ? `, ${preferredName}` : ''
    return preferredLocale === 'uz'
      ? `Salom${name}! Men ProfAI — shaxsiy o'qituvchingizman. Ekraningizni ko'rib turaman, testlarni vaqt bilan ochaman, rasm/skrinshot yuborsangiz tushunaman va ovozli gaplashsak ham bo'ladi. Qaysi tilda yozsangiz, o'sha tilda javob beraman.`
      : `Hi${name}! I'm ProfAI — your personal tutor. I can see your screen, open tests with a timer, understand screenshots you send, and talk with you by voice. I reply in whatever language you write in.`
  }, [preferredLocale, preferredName])

  const statusText =
    (STATUS_TEXT[preferredLocale] ?? STATUS_TEXT.en)[voiceState] ?? STATUS_TEXT.en.idle
  const quickChips = QUICK_CHIPS[preferredLocale] ?? QUICK_CHIPS.en

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
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
      className={`relative flex flex-col overflow-hidden border bg-white text-slate-900 ${
        isPage
          ? 'h-full rounded-[1.6rem] border-red-100 shadow-[0_30px_70px_-30px_rgba(239,68,68,0.45)]'
          : 'rounded-[1.4rem] border-red-100 shadow-[0_24px_55px_-20px_rgba(239,68,68,0.4)]'
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

      {/* Header with the live orb */}
      <header className="relative flex items-center justify-between gap-2 border-b border-red-100 bg-gradient-to-r from-red-50 via-rose-50/60 to-white px-4 py-3">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />
        <div className="flex items-center gap-2.5">
          <VoiceOrb state={voiceState} level={voiceLevel} size={isPage ? 48 : 40} />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-black text-slate-900">
              ProfAI Tutor
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
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openTalk}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
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
          <button
            type="button"
            onClick={clear}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
        className={`flex-1 overflow-y-auto bg-gradient-to-b from-white via-rose-50/30 to-white px-4 py-3 ${
          isPage ? 'min-h-[20rem]' : 'max-h-[22rem] min-h-[14rem]'
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
          <div className="space-y-3">
            {messages.map((message) => (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative max-w-[88%] whitespace-pre-wrap rounded-2xl border px-3.5 py-2.5 text-sm leading-6 ${
                  message.role === 'assistant'
                    ? 'border-red-100 bg-white text-slate-800 shadow-sm'
                    : 'ml-auto border-transparent bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20'
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
                {renderRich(message.content)}
                {message.role === 'assistant' && message.content ? <CopyButton text={message.content} /> : null}
              </motion.article>
            ))}
            {isSending ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                {preferredLocale === 'uz' ? 'O‘ylayapman…' : 'Thinking…'}
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-red-100 bg-white px-4 py-3">
        {/* Quick chips */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => doSend(chip)}
              disabled={isSending}
              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
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

        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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
            className="max-h-[140px] min-h-[40px] flex-1 resize-none rounded-xl border border-red-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-200"
            disabled={isSending}
          />

          {voiceSupported ? (
            <button
              type="button"
              onClick={() => (isListening ? stopVoice() : startVoice())}
              className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition ${
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
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
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
