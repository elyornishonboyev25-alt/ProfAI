import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Gift, Sparkles, X } from 'lucide-react'

const STORAGE_KEY = 'profai:welcome-gift-seen:v1'

const copy = {
  en: { eyebrow: 'A WELCOME GIFT FOR YOU', title: 'Your first month is on us.', hint: 'Tap the gift to reveal what is inside', revealed: '1 month of Premium. Free.', detail: 'Create a new account and your full Premium access starts automatically. No card required. Valid for one month from registration.', action: 'Claim my free month', close: 'Close welcome gift', open: 'Open your gift', label: 'Welcome gift' },
  uz: { eyebrow: 'SIZ UCHUN SOVG‘A', title: 'Birinchi oy bizdan sovg‘a.', hint: 'Sovg‘ani ochish uchun bosing', revealed: '1 oylik Premium. Bepul.', detail: 'Yangi akkaunt oching va to‘liq Premium xizmati avtomatik faollashadi. Karta kerak emas. Ro‘yxatdan o‘tgan kundan boshlab bir oy amal qiladi.', action: 'Bepul oyni olish', close: 'Sovg‘ani yopish', open: 'Sovg‘ani ochish', label: 'Xush kelibsiz sovg‘asi' },
  ru: { eyebrow: 'ПОДАРОК ДЛЯ ВАС', title: 'Первый месяц за наш счёт.', hint: 'Нажмите, чтобы открыть подарок', revealed: '1 месяц Premium. Бесплатно.', detail: 'Создайте новый аккаунт, и полный доступ Premium включится автоматически. Карта не нужна. Срок действия — один месяц с регистрации.', action: 'Получить бесплатный месяц', close: 'Закрыть подарок', open: 'Открыть подарок', label: 'Приветственный подарок' },
} as const

export default function WelcomeGift({ onClaim }: { onClaim: () => void }) {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.slice(0, 2) ?? i18n.language.slice(0, 2)
  const c = copy[language === 'uz' || language === 'ru' ? language : 'en']
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [opened, setOpened] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const dismiss = useCallback(() => {
    try { window.localStorage.setItem(STORAGE_KEY, '1') } catch { /* Dismiss for this visit. */ }
    setVisible(false)
  }, [])

  useEffect(() => {
    try { if (window.localStorage.getItem(STORAGE_KEY)) return } catch { /* Storage can be unavailable. */ }
    const timer = window.setTimeout(() => setVisible(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
      if (event.key !== 'Tab') return
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!buttons?.length) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown) }
  }, [visible, dismiss])

  function claim() {
    dismiss()
    onClaim()
  }

  return <AnimatePresence>
    {visible && <motion.div className="landing-gift-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .25 }} onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss() }}>
      <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label={c.label} className="landing-gift-dialog" initial={reducedMotion ? false : { opacity: 0, y: 28, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: 18, scale: .96 }} transition={{ type: 'spring', stiffness: 260, damping: 25 }}>
        <button ref={closeButtonRef} type="button" className="landing-gift-close" aria-label={c.close} onClick={dismiss}><X size={19} /></button>
        <div className="landing-gift-orbit landing-gift-orbit-one" aria-hidden="true" /><div className="landing-gift-orbit landing-gift-orbit-two" aria-hidden="true" />
        <span className="landing-gift-eyebrow"><Sparkles size={15} /> {c.eyebrow}</span>
        <h2>{opened ? c.revealed : c.title}</h2>
        <p className="landing-gift-subtitle">{opened ? c.detail : c.hint}</p>
        <motion.button type="button" className={`landing-gift-box ${opened ? 'is-open' : ''}`} aria-label={opened ? c.revealed : c.open} onClick={() => setOpened(true)} whileHover={reducedMotion ? undefined : { scale: 1.045 }} whileTap={reducedMotion ? undefined : { scale: .97 }}>
          <span className="landing-gift-rays" aria-hidden="true" />
          <span className="landing-gift-lid"><span className="landing-gift-bow" /></span>
          <span className="landing-gift-base"><span className="landing-gift-ribbon" /><Gift size={54} strokeWidth={1.4} /></span>
          {opened && <span className="landing-gift-spark landing-gift-spark-one">✦</span>}
          {opened && <span className="landing-gift-spark landing-gift-spark-two">✦</span>}
        </motion.button>
        <div className="landing-gift-footer">
          {opened ? <button type="button" className="landing-arena-button" onClick={claim}>{c.action} <ArrowRight size={18} /></button> : <button type="button" className="landing-gift-open-link" onClick={() => setOpened(true)}>{c.open} <ArrowRight size={17} /></button>}
          <span>ProfAI Premium · IELTS · SAT · AI</span>
        </div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>
}
