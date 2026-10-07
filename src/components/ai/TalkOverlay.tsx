import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, MicOff, Minimize2, Square, X, RotateCcw, AudioLines } from 'lucide-react'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAiTutor, type AiTutorController } from '@/components/ai/useAiTutor'
import { useRealtimeCoach } from './useRealtimeCoach'
import { apiClient } from '@/lib/apiClient'
import CoachMascot from '@/components/ai/CoachMascot'
import CoachControls from './CoachControls'
import { useCopy } from '@/i18n/interface'

const EASE = [0.22, 1, 0.36, 1] as const

// Immersive, full-screen "talk to ProfAI" experience. Mounted once at the app root so
// it keeps running while the learner navigates. Can be docked to the corner (animated
// via a shared layoutId) and re-expanded — it never stops listening or speaking.
function StandardTalkOverlay({ tutor }: { tutor: AiTutorController }) {
  const { c } = useCopy()
  const talkOpen = useAiAssistantStore((s) => s.talkOpen)
  const closeTalk = useAiAssistantStore((s) => s.closeTalk)
  const [docked, setDocked] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)

  const {
    hasPremium, messages, voiceState, voiceLevel, voiceSupported,
    isListening, interimTranscript, startVoice, stopVoice,
    voiceLang, setVoiceLang, voiceError, cancelVoice,
  } = tutor

  const endTalk = () => {
    cancelVoice()
    closeTalk()
  }
  const endTalkRef = useRef(endTalk)
  endTalkRef.current = endTalk

  useEffect(() => {
    if (!talkOpen || docked) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') endTalkRef.current()
      if (event.key !== 'Tab') return
      const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') ?? [])]
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', key); previousFocus?.focus() }
  }, [talkOpen, docked])

  const VOICE_LANGS = [
    { id: 'en', label: c('English') },
    { id: 'uz', label: c('Uzbek') },
    { id: 'ru', label: c('Russian') },
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
    if (!talkOpen || !voiceSupported || voiceError) return
    // Start only when idle and we did NOT just stop listening/thinking (avoids loops).
    if (voiceState === 'idle' && prev !== 'listening' && prev !== 'thinking') {
      const timer = window.setTimeout(() => startVoice(), 500)
      return () => window.clearTimeout(timer)
    }
  }, [voiceState, talkOpen, docked, voiceSupported, voiceError, startVoice])

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

  const status = c(voiceState === 'listening' ? 'Listening…' : voiceState === 'thinking' ? 'Thinking…' : voiceState === 'speaking' ? 'Speaking…' : 'Tap the mic and speak')

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
          <CoachMascot state={voiceState} level={voiceLevel} size={44} />
        </motion.span>
        <span className="text-left">
          <span className="block text-xs font-black text-slate-900">Nova · ProfAI</span>
          <span className="block text-[10px] font-semibold text-red-500">{status}</span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation()
            endTalk()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.stopPropagation()
              endTalk()
            }
          }}
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label={c('End voice')}
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
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={c('Speak')}
        className="coach-voice-stage fixed inset-0 z-[200] flex flex-col items-center justify-start overflow-y-auto px-6 py-20 md:justify-center"
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
            aria-label={c('Minimize to corner')}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={endTalk}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label={c('End voice')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.span layoutId="profai-talk-orb" transition={{ duration: 0.5, ease: EASE }}>
            <CoachMascot state={voiceState} level={voiceLevel} size={240} />
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
            {voiceError ? (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm leading-6 text-amber-100"><p>{voiceError}</p>{tutor.canReplayVoice ? <button type="button" onClick={tutor.retryVoiceReply} className="mt-3 min-h-11 rounded-full border border-amber-200/40 px-4 font-semibold">{c('Retry audio')}</button> : null}</div>
            ) : isListening && interimTranscript ? (
              <p className="text-base text-emerald-200">{interimTranscript}</p>
            ) : voiceState === 'speaking' && lastAssistant ? (
              <p className="line-clamp-3 text-base leading-7 text-slate-200">{lastAssistant}</p>
            ) : lastUser || lastAssistant ? (
              <p className="line-clamp-2 text-sm leading-6 text-slate-400">
                {lastAssistant || lastUser}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                {c('Try: “Explain this grammar” or “Open my reading test”.')}
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
              aria-label={c(isListening ? 'Stop' : 'Speak')}
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
              {c('Voice input isn’t supported in this browser. Use Chrome/Edge, or chat by typing.')}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function TalkOverlay() {
  const { language: uiLanguage } = useCopy()
  const tutor = useAiTutor()
  const talkOpen = useAiAssistantStore((s) => s.talkOpen)
  const closeTalk = useAiAssistantStore((s) => s.closeTalk)
  const [standard, setStandard] = useState(false)
  const [mode, setMode] = useState<'coach' | 'examiner'>('coach')
  const [docked, setDocked] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [capabilityError, setCapabilityError] = useState(false)
  const [capabilityRetry, setCapabilityRetry] = useState(0)
  const dialog = useRef<HTMLDivElement>(null)
  const live = useRealtimeCoach(tutor, talkOpen && !standard && available === true, mode)
  const lang = tutor.voiceLang
  const t = (en: string, uz: string, ru: string) => uiLanguage === 'uz' ? uz : uiLanguage === 'ru' ? ru : en

  useEffect(() => {
    if (!talkOpen) { setStandard(false); setDocked(false); return }
    if (!tutor.hasPremium) return
    const controller = new AbortController()
    setAvailable(null); setCapabilityError(false)
    void apiClient.get<{ naturalVoice: boolean; spokenReplies?: boolean }>('/ai/voice/capabilities', { signal: controller.signal })
      .then((result) => {
        setAvailable(result.naturalVoice)
        if (result.spokenReplies && tutor.voiceSupported) setStandard(true)
      })
      .catch(() => { if (!controller.signal.aborted) { setAvailable(false); setCapabilityError(true) } })
    return () => controller.abort()
  }, [talkOpen, tutor.hasPremium, tutor.user?.id, capabilityRetry])

  useEffect(() => {
    if (!talkOpen || docked || standard) return
    const previous = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDocked(true)
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), summary, a[href], [tabindex="0"]')
        if (!buttons?.length) return
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key); previousFocus?.focus() }
  }, [talkOpen, docked, standard])

  if (!talkOpen || !tutor.hasPremium) return null
  if (standard) return <StandardTalkOverlay tutor={tutor} />
  const end = () => { live.stop(); tutor.cancelVoice(); closeTalk() }
  const status = available === null ? t('Connecting…', 'Ulanmoqda…', 'Подключение…')
    : live.error || !available ? t('Voice needs attention', 'Ovozli ulanishni tekshiring', 'Проверьте голосовое соединение')
    : live.muted ? t('Microphone muted', 'Mikrofon o‘chirilgan', 'Микрофон выключен')
    : tutor.voiceState === 'speaking' ? t('Speaking', 'Gapiryapti', 'Говорит')
    : tutor.voiceState === 'thinking' ? t('Thinking', 'O‘ylayapti', 'Думает')
    : t('Listening', 'Tinglayapti', 'Слушает')

  if (docked) return <div className="fixed bottom-5 right-5 z-[200] flex items-center rounded-full border border-red-200 bg-white p-2 shadow-xl">
    <button onClick={() => setDocked(false)} className="flex items-center gap-2 pr-3" aria-label={t('Expand voice', 'Ovozni kengaytirish', 'Развернуть голосовой чат')}><CoachMascot state={tutor.voiceState} level={tutor.voiceLevel} size={44} /><span className="text-left text-xs font-bold">Nova · ProfAI<span className="block text-[10px] font-medium text-slate-500">{status}</span></span></button>
    <button onClick={end} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-red-50" aria-label={t('End voice', 'Suhbatni tugatish', 'Завершить разговор')}><X size={18} /></button>
  </div>

  return <div ref={dialog} role="dialog" aria-modal="true" aria-label="ProfAI voice" className="coach-voice-stage fixed inset-0 z-[200] overflow-y-auto bg-slate-950 text-white">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(159,18,57,.28),transparent_65%)]" />
    <div className="relative mx-auto flex min-h-full max-w-3xl flex-col items-center px-5 pb-10 pt-5 text-center">
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-sm font-bold">Nova · ProfAI <span className="ml-1 text-slate-400">{t('Voice', 'Ovozli suhbat', 'Голосовой чат')}</span></span>
        <div className="flex gap-2"><button onClick={() => setDocked(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10" aria-label={t('Minimize', 'Kichraytirish', 'Свернуть')}><Minimize2 size={18} /></button><button onClick={end} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10" aria-label={t('End voice', 'Suhbatni tugatish', 'Завершить разговор')}><X size={20} /></button></div>
      </div>
      <div className="mb-7 mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label={t('Conversation mode', 'Suhbat rejimi', 'Режим разговора')}>
        {(['coach', 'examiner'] as const).map((choice) => <button key={choice} onClick={() => setMode(choice)} aria-pressed={mode === choice} className={`min-h-11 rounded-full border px-5 text-sm font-semibold ${mode === choice ? 'border-white bg-white text-slate-950' : 'border-white/20 text-slate-300 hover:bg-white/10'}`}>{choice === 'coach' ? t('Personal coach', 'Shaxsiy murabbiy', 'Личный наставник') : t('IELTS examiner', 'IELTS imtihon oluvchi', 'Экзаменатор IELTS')}</button>)}
      </div>
      <CoachMascot state={tutor.voiceState} level={tutor.voiceLevel} size={240} />
      {mode === 'coach' ? <CoachControls compact /> : null}
      <h2 className="mt-6 text-2xl font-bold" aria-live="polite">{status}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{mode === 'coach' ? t('Speak naturally. You can interrupt me. Your conversation stays in your chat.', 'Bemalol gapiring. Gapimni bo‘lishingiz mumkin. Suhbat chat tarixida saqlanadi.', 'Говорите свободно. Вы можете перебить меня. Разговор сохраняется в чате.') : t('English speaking practice with feedback at the end. Open Speaking tests for a timed full mock.', 'Inglizcha Speaking mashqi; fikr-mulohaza yakunda beriladi. Vaqtli to‘liq mock uchun Speaking testlarini oching.', 'Практика Speaking на английском с обратной связью в конце. Полный тест с таймером доступен в Speaking tests.')}</p>
      <div className="mt-5 min-h-20 w-full max-w-xl" aria-live="polite" aria-atomic="true">
        {live.error || available === false || !live.supported ? <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><p>{!live.supported ? t('This browser cannot start natural voice. Try an updated browser or type in chat.', 'Bu brauzer tabiiy ovozli suhbatni ocholmaydi. Yangilangan brauzer yoki yozma chatdan foydalaning.', 'Этот браузер не поддерживает голосовой чат. Обновите браузер или используйте текстовый чат.') : live.error ?? (capabilityError ? t('Voice could not connect. Retry or use standard voice.', 'Ovozli ulanish amalga oshmadi. Qayta urining yoki oddiy ovozdan foydalaning.', 'Не удалось подключить голос. Повторите попытку или используйте обычный голос.') : t('Natural voice is not connected yet. You can continue with standard voice or text chat.', 'Tabiiy ovozli suhbat hali ulanmagan. Oddiy ovoz yoki yozma chatdan foydalanishingiz mumkin.', 'Естественный голос пока не подключён. Используйте обычный голос или текстовый чат.'))}</p><div className="mt-3 flex flex-wrap justify-center gap-2"><button onClick={() => { live.reconnect(); setCapabilityRetry((value) => value + 1) }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-200/40 px-4"><RotateCcw size={15} />{t('Retry', 'Qayta urinish', 'Повторить')}</button>{tutor.voiceSupported ? <button onClick={() => { live.stop(); setStandard(true) }} className="min-h-11 rounded-full bg-white px-4 font-semibold text-slate-950">{t('Use standard voice', 'Oddiy ovozdan foydalanish', 'Обычный голос')}</button> : null}</div></div> : <p className="max-h-40 overflow-y-auto text-base leading-7 text-slate-200">{live.caption || t('What would you like to work on?', 'Nima ustida ishlaymiz?', 'Над чем поработаем?')}</p>}
      </div>
      <div className="mt-6 flex gap-2" role="group" aria-label={t('Language', 'Til', 'Язык')}>{([{ id: 'en', label: t('English', 'Inglizcha', 'Английский') }, { id: 'uz', label: t('Uzbek', 'O‘zbekcha', 'Узбекский') }, { id: 'ru', label: t('Russian', 'Ruscha', 'Русский') }] as const).map((language) => <button key={language.id} onClick={() => tutor.setVoiceLang(language.id)} aria-pressed={lang === language.id} className={`min-h-11 rounded-full border px-4 text-xs font-semibold ${lang === language.id ? 'border-white bg-white text-slate-950' : 'border-white/20 text-slate-300'}`}>{language.label}</button>)}</div>
      {available && !live.error ? <div className="mt-6 flex gap-3"><button onClick={live.toggleMute} aria-pressed={live.muted} aria-label={t('Mute microphone', 'Mikrofonni o‘chirish', 'Выключить микрофон')} className={`flex h-14 w-14 items-center justify-center rounded-full ${live.muted ? 'bg-slate-700' : 'bg-red-600 hover:bg-red-500'}`}>{live.muted ? <MicOff /> : <Mic />}</button><button onClick={live.interrupt} aria-label={t('Stop speaking', 'Javobni to‘xtatish', 'Остановить ответ')} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 hover:bg-white/10"><Square size={20} /></button></div> : null}
      {tutor.pendingActions.map((pending) => <div key={pending.id} className="mt-4 flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/5 p-4 text-left"><p className="text-sm">{pending.label}</p><div className="flex gap-2"><button onClick={() => tutor.approveAction(pending.id)} className="min-h-11 rounded-full bg-red-600 px-4 text-xs font-bold">{t('Allow', 'Ruxsat berish', 'Разрешить')}</button><button onClick={() => tutor.dismissAction(pending.id)} className="min-h-11 rounded-full border border-white/25 px-4 text-xs">{t('Dismiss', 'Bekor qilish', 'Отклонить')}</button></div></div>)}
      {mode === 'examiner' && available && !live.error ? <button onClick={live.requestFeedback} className="mt-5 min-h-11 rounded-full border border-white/25 px-5 text-sm font-semibold">{t('Finish practice and get feedback', 'Mashqni tugatib, tahlil olish', 'Завершить практику и получить отзыв')}</button> : null}
      <button onClick={end} className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><AudioLines size={16} />{t('Return to chat', 'Chatga qaytish', 'Вернуться в чат')}</button>
    </div>
  </div>
}

export default TalkOverlay
