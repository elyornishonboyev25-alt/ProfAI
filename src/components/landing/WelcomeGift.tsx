import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'

const copy = {
  "en": {
    "label": "A welcome gift for you",
    "title": "150 welcome coins to get started",
    "open": "Open your gift",
    "detail": "Create an account and receive 150 coins. Try IELTS, SAT, podcast and shadowing. Your saved results and free activities stay available.",
    "action": "Claim 150 coins"
  },
  "uz": {
    "label": "Siz uchun sovg‘a",
    "title": "Boshlash uchun 150 sovg‘a tanga",
    "open": "Sovg‘ani ochish",
    "detail": "Akkaunt oching va 150 tanga oling. IELTS, SAT, podcast va shadowingni sinang. Natijalar va bepul mashqlar doim ochiq qoladi.",
    "action": "150 tangani olish"
  },
  "ru": {
    "label": "Подарок для вас",
    "title": "150 приветственных монет",
    "open": "Открыть подарок",
    "detail": "Создайте аккаунт и получите 150 монет. Попробуйте IELTS, SAT, подкасты и шэдоуинг. Результаты и бесплатные занятия всегда доступны.",
    "action": "Получить 150 монет"
  }
} as const

export default function WelcomeGift({ onClaim }: { onClaim: () => void }) {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.slice(0, 2) ?? i18n.language.slice(0, 2)
  const c = copy[language === 'uz' || language === 'ru' ? language : 'en']
  const reducedMotion = useReducedMotion()
  const [opened, setOpened] = useState(false)

  function openGift() {
    setOpened(value => !value)
  }

  return <aside className={`landing-welcome-gift ${opened ? 'is-open' : ''}`} aria-label={c.label}>
    <button type="button" className="landing-welcome-gift-trigger" aria-expanded={opened} onClick={openGift}>
      <span className="landing-welcome-gift-icon" aria-hidden="true"><Gift size={22} /></span>
      <span><small><Sparkles size={13} /> {c.label}</small><strong>{c.title}</strong></span>
      <span className="landing-welcome-gift-open">{c.open} <ArrowRight size={16} /></span>
    </button>
    <AnimatePresence initial={false}>{opened && <motion.div className="landing-welcome-gift-detail" initial={reducedMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reducedMotion ? undefined : { opacity: 0, height: 0 }} transition={{ duration: reducedMotion ? 0 : .22 }}><p>{c.detail}</p><button type="button" className="landing-button landing-button-primary" onClick={onClaim}>{c.action} <ArrowRight size={17} /></button></motion.div>}</AnimatePresence>
  </aside>
}
