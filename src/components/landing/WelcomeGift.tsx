import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'

const copy = {
  "en": {
    "label": "Free forever · no card",
    "title": "IELTS, SAT and AI every month · $0",
    "open": "See what Free includes",
    "detail": "Start with the first 5 tests in each IELTS skill, 5 IELTS full mocks and 5 SAT mocks, plus their vocabulary. Articles, podcasts and shadowing are free. Unlock every test with IvyGoo Pro ($5.99) or IvyGoo Elite ($11.99).",
    "action": "Start for free"
  },
  "uz": {
    "label": "Doimiy bepul · karta kerak emas",
    "title": "Har oy IELTS, SAT va AI · $0",
    "open": "Free tarifda nimalar bor",
    "detail": "Har bir IELTS skillida dastlabki 5 ta test, 5 ta IELTS full mock va 5 ta SAT mock lug‘atlari bilan bepul. Maqola, podcast va shadowing ham bepul. Barcha testlar uchun IvyGoo Pro ($5.99) yoki IvyGoo Elite ($11.99) ni tanlang.",
    "action": "Bepul boshlang"
  },
  "ru": {
    "label": "Бесплатно навсегда · без карты",
    "title": "IELTS, SAT и AI каждый месяц · $0",
    "open": "Что входит в Free",
    "detail": "Первые 5 тестов каждого навыка IELTS, 5 полных IELTS и 5 SAT со словарями бесплатны. Статьи, подкасты и шэдоуинг тоже бесплатны. Все тесты доступны с IvyGoo Pro ($5.99) или IvyGoo Elite ($11.99).",
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
