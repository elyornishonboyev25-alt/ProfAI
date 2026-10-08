import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'

const copy = {
  "en": {
    "label": "Your first week is on us",
    "title": "7 days of IELTS, SAT and AI · $0",
    "open": "Explore your free week",
    "detail": "Start for free. No card required. Try IELTS, SAT and AI for 7 days, once per account. Then continue from $3/month. Classes require a paid plan.",
    "action": "Start for free"
  },
  "uz": {
    "label": "Birinchi hafta bizdan",
    "title": "IELTS, SAT va AI — 7 kun · $0",
    "open": "Bepul haftani ko‘rish",
    "detail": "Bepul boshlang. Karta talab etilmaydi. IELTS, SAT va AIni har akkauntga bir marta 7 kun sinang. Keyin oyiga $3 dan davom eting. Classes uchun pullik tarif kerak.",
    "action": "Bepul boshlang"
  },
  "ru": {
    "label": "Первая неделя за наш счёт",
    "title": "7 дней IELTS, SAT и AI · $0",
    "open": "Узнать о бесплатной неделе",
    "detail": "Начните бесплатно. Карта не нужна. Попробуйте IELTS, SAT и AI 7 дней, один раз на аккаунт. Далее от $3/мес. Для классов нужен платный тариф.",
    "action": "Начать бесплатно"
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
