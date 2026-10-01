import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'

const copy = {
  en: { label: 'A welcome gift for you', title: 'Your first month of Premium is free', open: 'Open your gift', detail: 'Create a new account to unlock full Premium automatically for one month. No card and no automatic renewal.', action: 'Claim your free month' },
  uz: { label: 'Siz uchun sovg‘a', title: 'Premiumning birinchi oyi bepul', open: 'Sovg‘ani ochish', detail: 'Yangi hisob oching va bir oylik to‘liq Premium avtomatik faollashadi. Karta va avtomatik yangilanish yo‘q.', action: 'Bepul oyni olish' },
  ru: { label: 'Подарок для вас', title: 'Первый месяц Premium бесплатно', open: 'Открыть подарок', detail: 'Создайте аккаунт, чтобы автоматически получить полный Premium на месяц. Карта не нужна, автоматического продления нет.', action: 'Получить бесплатный месяц' },
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
