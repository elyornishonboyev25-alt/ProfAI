import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Copy,
  Crown,
  Flame,
  Gauge,
  Gem,
  Infinity as InfinityIcon,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { BrandMark } from '@/components/brand/BrandLogo'

const TELEGRAM_USERNAME = 'nishonboyv7'
const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`
const CARD_NUMBER = '5614 6827 0376 3088'
const CARD_NUMBER_RAW = CARD_NUMBER.replace(/\s/g, '')

type Plan = {
  id: string
  name: string
  price: string
  period: string
  tokens: string
  tagline: string
  icon: typeof Crown
  accent: string
  badge?: string
  highlighted?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$3.99',
    period: '/month',
    tokens: '200,000 tokens',
    tagline: 'A focused starting plan for consistent self-study.',
    icon: Zap,
    accent: 'from-emerald-500 to-green-600',
    features: [
      '200K AI tokens every month',
      'AI Speaking & Writing practice',
      'Daily challenges & streaks',
      '5 full mock unlocks each month',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$8.99',
    period: '/month',
    tokens: '1,000,000 tokens',
    tagline: 'The best balance of practice, feedback and analytics.',
    icon: Rocket,
    accent: 'from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]',
    badge: 'MOST POPULAR',
    highlighted: true,
    features: [
      '1M AI tokens every month',
      'Everything in Basic',
      'All 30 full mocks',
      'IELTS + SAT weak-point analysis',
      'Priority feedback on mistakes',
      'Advanced progress statistics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$16.99',
    period: '/month',
    tokens: '3,000,000 tokens',
    tagline: 'For ambitious learners targeting competitive scores.',
    icon: Gem,
    accent: 'from-violet-500 to-purple-700',
    features: [
      '3M AI tokens every month',
      'Everything in Standard',
      'Adaptive day-by-day study plan',
      'University application roadmap',
      'Scholarship & portfolio tips',
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$29.99',
    period: '/month',
    tokens: '8,000,000 tokens',
    tagline: 'Maximum AI capacity and priority support for intensive prep.',
    icon: Crown,
    accent: 'from-amber-500 via-orange-500 to-blue-600',
    badge: 'PREMIUM',
    features: [
      '8M AI tokens every month',
      'Everything in Pro',
      'Priority AI model & faster replies',
      'No hard daily stress (soft limits)',
      'Early access to new features',
    ],
  },
]

const PAYMENT_STEPS = [
  {
    icon: Gauge,
    title: 'Choose your plan',
    description: 'Pick the plan that fits your study goals from the options above.',
  },
  {
    icon: Copy,
    title: 'Pay to the card',
    description: 'Transfer the plan amount to the card number below.',
  },
  {
    icon: Send,
    title: 'Send the screenshot',
    description: 'Send the payment receipt screenshot to our Telegram and your premium is activated.',
  },
]

export default function Premium() {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const [copied, setCopied] = useState(false)

  const handleCopyCard = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER_RAW)
      setCopied(true)
      pushToast({ type: 'success', title: 'Card copied', message: 'Card number copied to clipboard.' })
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      pushToast({ type: 'error', title: 'Copy failed', message: 'Please copy the card number manually.' })
    }
  }

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-6xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="route-back-button mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        {/* Hero */}
        <motion.header
          initial={minimalMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0.14 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-blue-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.12)]">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            ProfAI Premium
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-[#1F2937] sm:text-5xl">
            Unlock your{' '}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-amber-500 bg-clip-text text-transparent">
              full potential
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-[#6B7280]">
            Invest in adaptive feedback, mistake intelligence and a plan that changes with your progress—not access
            to basic exam information. Built for targets up to <span className="font-bold text-blue-600">IELTS 9.0</span>{' '}
            and <span className="font-bold text-blue-600">SAT 1600</span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: Bot, label: 'AI Study Assistant' },
              { icon: Flame, label: 'Streaks & XP' },
              { icon: Star, label: 'Real Results' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </motion.header>

        {/* Plans */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon
            return (
              <motion.div
                key={plan.id}
                initial={minimalMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: minimalMotion ? 0 : 0.06 * index, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={minimalMotion ? undefined : { y: -6 }}
                className={`group relative flex flex-col rounded-[1.6rem] border p-6 ${
                  plan.highlighted
                    ? 'border-blue-300 bg-gradient-to-b from-white to-blue-50/60 shadow-[0_30px_70px_rgba(37,99,235,0.22)] lg:scale-[1.03]'
                    : 'border-blue-100/80 bg-white/95 shadow-[0_18px_44px_rgba(15,23,42,0.08)]'
                }`}
              >
                {plan.highlighted ? (
                  <span
                    aria-hidden
                    className="fx-glow-breath pointer-events-none absolute -inset-[2px] -z-10 rounded-[1.7rem] bg-gradient-to-br from-blue-400/50 via-indigo-300/30 to-blue-400/50 blur-md"
                  />
                ) : null}
                {plan.badge ? (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r ${plan.accent} px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg`}
                  >
                    {plan.badge}
                  </span>
                ) : null}

                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.accent} text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-lg font-black tracking-tight text-[#1F2937]">{plan.name}</h3>
                <p className="mt-1 min-h-[40px] text-xs leading-5 text-[#6B7280]">{plan.tagline}</p>

                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-black tracking-tight text-[#1F2937]">{plan.price}</span>
                  <span className="mb-1 text-xs font-semibold text-slate-400">{plan.period}</span>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                  <Sparkles className="h-3 w-3" />
                  {plan.tokens}
                </div>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] leading-5 text-slate-700">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-blue-500' : 'text-emerald-500'}`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`${TELEGRAM_URL}?text=${encodeURIComponent(`Salom! Men ProfAI ${plan.name} (${plan.price}/oy) premium tarifini sotib olmoqchiman.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`interactive-lift mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    plan.highlighted
                      ? 'cta-sheen bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_14px_28px_rgba(37,99,235,0.36)] hover:shadow-[0_18px_36px_rgba(37,99,235,0.46)]'
                      : 'border border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  Choose {plan.name}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            )
          })}
        </div>

        {/* Free tier note */}
        <motion.div
          initial={minimalMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-center sm:flex-row sm:text-left"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <InfinityIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-[#1F2937]">Free plan</p>
              <p className="text-xs text-slate-500">
                Try the platform with limited practice attempts. Upgrade anytime to unlock everything.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">$0 forever</span>
        </motion.div>

        {/* Payment instructions */}
        <motion.section
          initial={minimalMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="panel-surface relative mt-12 overflow-hidden rounded-[2rem] border border-blue-100/90 bg-white/95 p-7 shadow-[0_28px_70px_rgba(30,64,175,0.16)] sm:p-9"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              <ShieldCheck className="h-3 w-3" />
              How to activate premium
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
              Activate in 3 simple steps
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#6B7280]">
              Payment is verified manually by our team to keep your account secure.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PAYMENT_STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative">
                  <div className="relative h-full overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-5 shadow-[0_12px_28px_rgba(30,64,175,0.08)]">
                    <span className="pointer-events-none absolute -right-3 -top-4 text-6xl font-black text-blue-50">{index + 1}</span>
                    <div className="relative flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_10px_22px_rgba(37,99,235,0.3)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-black text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="relative mt-3 text-sm font-black text-[#1F2937]">{step.title}</h3>
                    <p className="relative mt-1 text-xs leading-5 text-[#6B7280]">{step.description}</p>
                  </div>
                  {index < PAYMENT_STEPS.length - 1 ? (
                    <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:flex">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-400 shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Card + Telegram */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            {/* Premium payment card */}
            <motion.div
              whileHover={minimalMotion ? undefined : { y: -5 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="group relative flex aspect-[1.74/1] flex-col justify-between overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,#7F1D1D_0%,#1D4ED8_40%,#2563EB_68%,#991B1B_100%)] p-6 text-white shadow-[0_30px_60px_rgba(30,64,175,0.5)]"
            >
              {/* depth + sheen */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(255,255,255,0.3),transparent_42%),radial-gradient(circle_at_88%_90%,rgba(0,0,0,0.28),transparent_48%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.1] bg-[repeating-linear-gradient(115deg,#fff_0_1px,transparent_1px_8px)]" />
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-y-12 -left-1/4 w-1/4 rotate-[18deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]"
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">Payment card</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-black tracking-wide">
                    <Crown className="h-4 w-4 text-amber-300" />
                    ProfAI Premium
                  </p>
                </div>
                <BrandMark size={38} />
              </div>

              {/* Chip + contactless */}
              <div className="relative flex items-center gap-3">
                <svg viewBox="0 0 48 36" className="h-9 w-12 drop-shadow">
                  <defs>
                    <linearGradient id="chip-gold" x1="0" y1="0" x2="48" y2="36" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FDE68A" />
                      <stop offset="55%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#B45309" />
                    </linearGradient>
                  </defs>
                  <rect x="1" y="1" width="46" height="34" rx="6" fill="url(#chip-gold)" />
                  <g stroke="rgba(120,53,15,0.55)" strokeWidth="1.4" fill="none">
                    <line x1="16" y1="1" x2="16" y2="35" />
                    <line x1="32" y1="1" x2="32" y2="35" />
                    <line x1="1" y1="12" x2="47" y2="12" />
                    <line x1="1" y1="24" x2="47" y2="24" />
                    <rect x="16" y="12" width="16" height="12" />
                  </g>
                </svg>
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-white/65" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 8a7 7 0 0 1 0 8" />
                  <path d="M12.5 5.5a11 11 0 0 1 0 13" />
                  <path d="M16 3a15 15 0 0 1 0 18" />
                </svg>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-lg font-bold tracking-[0.18em] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] sm:text-2xl">
                    {CARD_NUMBER}
                  </p>
                  <button
                    onClick={handleCopyCard}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
                  >
                    {copied ? <BadgeCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="mt-3.5 flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55">Card holder</p>
                    <p className="text-sm font-bold tracking-wide text-white/95">PREMIUM ACCESS</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55">Status</p>
                    <p className="inline-flex items-center gap-1 text-sm font-black tracking-wide text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      ACTIVE
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Telegram receipt */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-blue-100 bg-gradient-to-br from-white to-sky-50/40 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/35 blur-2xl" />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.32)]">
                  <Send className="h-5 w-5" />
                </span>
                <h3 className="mt-3.5 text-lg font-black text-[#1F2937]">Send your receipt</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#6B7280]">
                  After paying, send the receipt screenshot to{' '}
                  <span className="font-bold text-blue-600">@{TELEGRAM_USERNAME}</span> on Telegram. Premium is usually
                  activated within a few hours.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {['Manual review', 'No card details stored', 'Fast activation'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="interactive-lift mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(37,99,235,0.32)] transition hover:shadow-[0_18px_36px_rgba(37,99,235,0.42)]"
              >
                <Send className="h-4 w-4" />
                Message @{TELEGRAM_USERNAME}
              </a>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            Secure manual verification • Your data stays private
          </p>
        </motion.section>
      </div>
    </div>
  )
}
