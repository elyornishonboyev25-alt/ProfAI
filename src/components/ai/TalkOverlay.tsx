import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Minimize2, Square, X } from 'lucide-react'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAiTutor } from '@/components/ai/useAiTutor'
import VoiceOrb from '@/components/ai/VoiceOrb'

const EASE = [0.22, 1, 0.36, 1] as const

// Immersive, full-screen "talk to ProfAI" experience. Mounted once at the app root so
// it keeps running while the learner navigates. Can be docked to the corner (animated
// via a shared layoutId) and re-expanded — it never stops listening or speaking.
export function TalkOverlay() {
  const talkOpen = useAiAssistantStore((s) => s.talkOpen)
  const closeTalk = useAiAssistantStore((s) => s.closeTalk)
  const [docked, setDocked] = useState(false)

  const tutor = useAiTutor()
  const {
    hasPremium, messages, voiceState, voiceLevel, voiceSupported,
    isListening, interimTranscript, startVoice, stopVoice, preferredLocale,
    voiceLang, setVoiceLang,
  } = tutor

  const VOICE_LANGS = [
    { id: 'en', label: 'English' },
    { id: 'uz', label: "O'zbek" },
    { id: 'ru', label: 'Русский' },
  ] as const

  // Reset to expanded each time it is opened fresh.
  useEffect(() => {
    if (talkOpen) setDocked(false)
  }, [talkOpen])

  // Hands-free conversation: auto-listen when the overlay opens and again each time the
  // tutor finishes speaking — so it's a natural back-and-forth, no button pressing.
  const prevVoiceState = useRef(voiceState)
  useEffect(() => {
    const prev = prevVoiceState.current
    prevVoiceState.current = voiceState
    if (!talkOpen || docked || !voiceSupported) return
    // Start only when idle and we did NOT just stop listening/thinking (avoids loops).
    if (voiceState === 'idle' && prev !== 'listening' && prev !== 'thinking') {
      const timer = window.setTimeout(() => startVoice(), 500)
      return () => window.clearTimeout(timer)
    }
  }, [voiceState, talkOpen, docked, voiceSupported, startVoice])

  // When the immersive view is up: Escape minimizes to the corner, and the page
  // behind it is locked from scrolling.
  useEffect(() => {
    if (!talkOpen || docked) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setDocked(true)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [talkOpen, docked])

  if (!talkOpen || !hasPremium) return null

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

  const status =
    voiceState === 'listening'
      ? preferredLocale === 'uz' ? 'Tinglayapman…' : 'Listening…'
      : voiceState === 'thinking'
        ? preferredLocale === 'uz' ? 'O‘ylayapman…' : 'Thinking…'
        : voiceState === 'speaking'
          ? preferredLocale === 'uz' ? 'Gapiryapman…' : 'Speaking…'
          : preferredLocale === 'uz' ? 'Mikrofonni bosing va gapiring' : 'Tap the mic and speak'

  // ── Docked: a small living orb in the corner, persists across pages ──────────
  if (docked) {
    return (
      <motion.button
        type="button"
        onClick={() => setDocked(false)}
        className="fixed bottom-5 right-5 z-[200] inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/90 py-2 pl-2 pr-4 shadow-[0_18px_40px_rgba(220,38,38,0.3)] backdrop-blur"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
      >
        <motion.span layoutId="profai-talk-orb" transition={{ duration: 0.5, ease: EASE }}>
          <VoiceOrb state={voiceState} level={voiceLevel} size={44} />
        </motion.span>
        <span className="text-left">
          <span className="block text-xs font-black text-slate-900">ProfAI</span>
          <span className="block text-[10px] font-semibold text-red-500">{status}</span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation()
            closeTalk()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.stopPropagation()
              closeTalk()
            }
          }}
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="End voice"
        >
          <X className="h-3.5 w-3.5" />
        </span>
      </motion.button>
    )
  }

  // ── Expanded: full-screen immersive talk ────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(30,10,20,0.7),rgba(2,6,12,0.92))] backdrop-blur-xl" />

        {/* Top controls */}
        <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDocked(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Minimize to corner"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={closeTalk}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="End voice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.span layoutId="profai-talk-orb" transition={{ duration: 0.5, ease: EASE }}>
            <VoiceOrb state={voiceState} level={voiceLevel} size={240} />
          </motion.span>

          <motion.h2
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-2xl font-black text-white sm:text-3xl"
          >
            {status}
          </motion.h2>

          {/* Live transcript / last exchange */}
          <div className="mt-4 min-h-[3.5rem] max-w-xl">
            {isListening && interimTranscript ? (
              <p className="text-base text-emerald-200">{interimTranscript}</p>
            ) : voiceState === 'speaking' && lastAssistant ? (
              <p className="line-clamp-3 text-base leading-7 text-slate-200">{lastAssistant}</p>
            ) : lastUser || lastAssistant ? (
              <p className="line-clamp-2 text-sm leading-6 text-slate-400">
                {lastAssistant || lastUser}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                {preferredLocale === 'uz'
                  ? 'Masalan: “Grammatikani tushuntir” yoki “Reading testimni och”.'
                  : 'Try: “Explain this grammar” or “Open my reading test”.'}
              </p>
            )}
          </div>

          {/* Language switcher */}
          {voiceSupported ? (
            <div className="mt-8 flex items-center gap-2">
              {VOICE_LANGS.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setVoiceLang(lang.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    voiceLang === lang.id
                      ? 'border-white bg-white text-slate-900'
                      : 'border-white/25 bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          ) : null}

          {/* Big mic */}
          {voiceSupported ? (
            <motion.button
              type="button"
              onClick={() => (isListening ? stopVoice() : startVoice())}
              whileTap={{ scale: 0.92 }}
              className={`mt-10 inline-flex h-20 w-20 items-center justify-center rounded-full text-white shadow-2xl transition ${
                isListening
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-red-500 to-rose-600 hover:brightness-110'
              }`}
              aria-label={isListening ? 'Stop' : 'Speak'}
            >
              {isListening ? (
                <>
                  <span className="absolute h-20 w-20 rounded-full bg-emerald-400/40 animate-ping" />
                  <Square className="relative h-7 w-7" />
                </>
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </motion.button>
          ) : (
            <p className="mt-10 max-w-sm text-sm text-amber-200">
              {preferredLocale === 'uz'
                ? 'Bu brauzer ovozni qo‘llab-quvvatlamaydi. Chrome yoki Edge’dan foydalaning, yoki yozib muloqot qiling.'
                : 'Voice input isn’t supported in this browser. Use Chrome/Edge, or chat by typing.'}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TalkOverlay
