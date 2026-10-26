import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Copy, Gift, Share2, Sparkles, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from '@/features/billing/store'
import { useBillingText } from '@/features/billing/copy'
import './launch-gift.css'

type GiftStats = { capacity: number; issued: number; remaining: number; valueUsd: number; months: number }
type AccountGift = GiftStats & { eligible: boolean; rank: number | null; claimedAt: string | null; expiresAt: string | null; extended: boolean; referralCode: string | null }

const CAMPAIGN_SIZE = 1000
const CAMPAIGN_VALUE_USD = 6000
const OPEN_DELAY_MS = 1000
// Guests see the invitation once per browsing session.
const GUEST_SEEN_KEY = 'smarttest-launch-gift-guest-seen'

function guestAlreadySaw() {
  try { return sessionStorage.getItem(GUEST_SEEN_KEY) === '1' } catch { return false }
}
function rememberGuestSaw() {
  try { sessionStorage.setItem(GUEST_SEEN_KEY, '1') } catch { /* storage unavailable */ }
}

function useCountUp(target: number, run: boolean, instant: boolean) {
  const [value, setValue] = useState(instant ? target : 0)
  useEffect(() => {
    if (!run) return
    if (instant) { setValue(target); return }
    let frame = 0
    const started = performance.now()
    const tick = (time: number) => {
      const progress = Math.min(1, (time - started) / 1400)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, run, instant])
  return value
}

/** Launch campaign: one month of Pro for the first 1,000 students, announced one second after the site opens. */
export default function LaunchGift({ enabled }: { enabled: boolean }) {
  const user = useAuthStore(state => state.user)
  const accessToken = useAuthStore(state => state.accessToken)
  const hydrated = useAuthStore(state => state.hydrated)
  const [gift, setGift] = useState<AccountGift | null>(null)
  const [stats, setStats] = useState<GiftStats | null>(null)
  const [open, setOpen] = useState(false)
  const checked = useRef<string | null>(null)
  const signedIn = Boolean(user && accessToken)

  useEffect(() => {
    if (!enabled || !hydrated) return
    const owner = signedIn ? user!.id : 'guest'
    if (checked.current === owner) return
    checked.current = owner
    let cancelled = false
    let timer = 0
    setOpen(false)
    if (signedIn) {
      setStats(null)
      apiClient.get<AccountGift>('/launch-gift').then(result => {
        if (cancelled || !result.eligible || result.claimedAt) return
        setGift(result)
        timer = window.setTimeout(() => {
          setOpen(true)
          // The gift is activated as soon as it is shown; a failed claim is retried on the next visit.
          apiClient.post<AccountGift>('/launch-gift/claim').then(claimed => {
            if (cancelled) return
            setGift(claimed)
            void useBillingStore.getState().refresh()
          }).catch(() => undefined)
        }, OPEN_DELAY_MS)
      }).catch(() => undefined)
    } else {
      setGift(null)
      if (guestAlreadySaw()) return
      apiClient.get<GiftStats>('/launch-gift/stats', { auth: false }).then(result => {
        if (cancelled || result.remaining <= 0) return
        setStats(result)
        timer = window.setTimeout(() => { setOpen(true); rememberGuestSaw() }, OPEN_DELAY_MS)
      }).catch(() => undefined)
    }
    return () => { cancelled = true; window.clearTimeout(timer); if (checked.current === owner) checked.current = null }
  }, [enabled, hydrated, signedIn, user?.id])

  const close = useCallback(() => setOpen(false), [])
  const data = gift ?? stats
  return <AnimatePresence>{open && data ? <GiftDialog key="launch-gift" gift={gift} stats={data} onClose={close} /> : null}</AnimatePresence>
}

function GiftDialog({ gift, stats, onClose }: { gift: AccountGift | null; stats: GiftStats; onClose: () => void }) {
  const text = useBillingText()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const reduceMotion = Boolean(useReducedMotion())
  const primary = useRef<HTMLButtonElement>(null)
  const [shared, setShared] = useState<'idle' | 'copied'>('idle')
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2)
  const locale = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US'
  const groupLocale = language === 'en' ? 'en-US' : 'ru-RU'
  const number = (value: number) => new Intl.NumberFormat(groupLocale).format(value)
  const isGuest = !gift
  const capacity = Math.max(CAMPAIGN_SIZE, stats.capacity)
  const remaining = Math.max(0, stats.remaining)
  const issued = Math.min(capacity, stats.issued)
  const rank = useCountUp(gift?.rank ?? 0, Boolean(gift?.rank), reduceMotion)
  const value = useCountUp(CAMPAIGN_VALUE_USD, true, reduceMotion)
  const until = gift?.expiresAt ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(gift.expiresAt)) : null

  useEffect(() => {
    primary.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); root.style.overflow = previous }
  }, [onClose])

  const shareUrl = `${window.location.origin}/${gift?.referralCode ? `?ref=${encodeURIComponent(gift.referralCode)}` : ''}`
  const shareMessage = text(
    `ProfAI is giving 1 month of Pro free to the first 1,000 students. Only ${number(remaining)} gifts left — get yours:`,
    `ProfAI birinchi 1 000 o‘quvchiga 1 oylik Pro’ni bepul beryapti. Atigi ${number(remaining)} ta sovg‘a qoldi — o‘zingiznikini oling:`,
    `ProfAI дарит месяц Pro бесплатно первым 1 000 ученикам. Осталось всего ${number(remaining)} подарков — заберите свой:`,
  )
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'ProfAI', text: shareMessage, url: shareUrl }); return } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareMessage} ${shareUrl}`)
      setShared('copied')
      window.setTimeout(() => setShared('idle'), 2400)
    } catch {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer')
    }
  }
  const receive = () => { onClose(); navigate('/register') }

  const perks = [
    text('Unlimited IELTS & SAT practice tests', 'Cheksiz IELTS va SAT mashq testlari', 'Безлимитные тесты IELTS и SAT'),
    text('AI feedback on Writing & Speaking', 'Writing va Speaking uchun AI baholash', 'AI-проверка Writing и Speaking'),
    text('Full mock exams with score reports', 'Natija hisoboti bilan to‘liq mock imtihonlar', 'Полные пробные экзамены с отчётом'),
  ]
  const spring = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 260, damping: 24 }
  const rise = (delay: number) => reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: .45, ease: [0.22, 1, 0.36, 1] as const } }

  return (
    <motion.div className="launch-gift-overlay" data-lenis-prevent onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .3 }}>
      <motion.section className="launch-gift-card" role="dialog" aria-modal="true" aria-labelledby="launch-gift-title" aria-describedby="launch-gift-intro"
        initial={reduceMotion ? false : { opacity: 0, y: 40, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: .96 }} transition={spring}>
        <span className="launch-gift-sheen" aria-hidden="true" />
        <button type="button" className="launch-gift-close" aria-label={text('Close', 'Yopish', 'Закрыть')} onClick={onClose}><X size={18} /></button>

        <header className="launch-gift-hero">
          <div className="launch-gift-medal" aria-hidden="true">
            <span className="launch-gift-ring" />
            {!reduceMotion ? Array.from({ length: 10 }, (_, index) => (
              <motion.i key={index} className="launch-gift-spark" style={{ '--angle': `${index * 36}deg` } as CSSProperties}
                initial={{ opacity: 0, scale: .2 }} animate={{ opacity: [0, 1, 0], scale: [.2, 1, .6] }}
                transition={{ delay: .35 + index * .04, duration: 1.4, repeat: Infinity, repeatDelay: 2.6 }} />
            )) : null}
            <motion.span className="launch-gift-core" initial={reduceMotion ? false : { rotate: -18, scale: .4 }} animate={{ rotate: 0, scale: 1 }} transition={{ ...spring, delay: reduceMotion ? 0 : .15 }}>
              <Gift size={34} strokeWidth={1.9} />
            </motion.span>
          </div>
          <motion.p className="launch-gift-eyebrow" {...rise(.2)}><Sparkles size={13} />{text('ProfAI launch gift', 'ProfAI sovg‘asi', 'Подарок от ProfAI')}</motion.p>
          <motion.h2 id="launch-gift-title" className="launch-gift-title" {...rise(.28)}>
            <span className="launch-gift-amount">${number(value)}</span>
            <span className="launch-gift-subtitle">{text('in free Premium for the first 1,000 students', 'jami bepul Premium — birinchi 1 000 o‘quvchiga', 'в бесплатном Premium — первым 1 000 ученикам')}</span>
          </motion.h2>
          <motion.p id="launch-gift-intro" className="launch-gift-intro" {...rise(.36)}>
            {isGuest
              ? text('Create your free account and get 1 month of ProfAI Pro — a $6 plan — at no cost. No card needed.',
                'Bepul ro‘yxatdan o‘ting va 1 oylik ProfAI Pro’ni ($6 lik tarif) tekinga oling. Karta kerak emas.',
                'Создайте бесплатный аккаунт и получите месяц ProfAI Pro (тариф за $6) без оплаты. Карта не нужна.')
              : gift?.extended
                ? text('Thank you for being with us. We added 1 extra month of Pro ($6) on top of your current plan.',
                  'Biz bilan bo‘lganingiz uchun rahmat. Joriy tarifingiz ustiga yana 1 oylik Pro ($6) qo‘shdik.',
                  'Спасибо, что вы с нами. Мы добавили ещё 1 месяц Pro ($6) к вашему текущему тарифу.')
                : text('Thank you for joining early. Your account now has 1 month of ProfAI Pro ($6) — completely free.',
                  'Erta qo‘shilganingiz uchun rahmat. Akkauntingizda endi 1 oylik ProfAI Pro ($6) bor — butunlay bepul.',
                  'Спасибо, что присоединились рано. На вашем аккаунте теперь месяц ProfAI Pro ($6) — полностью бесплатно.')}
          </motion.p>
        </header>

        <motion.div className="launch-gift-rank" {...rise(.44)}>
          {gift?.rank ? (
            <div className="launch-gift-rank-head">
              <span className="launch-gift-rank-number">#{number(rank)}<small>/ {number(capacity)}</small></span>
              <span className="launch-gift-rank-label">{text(`You are one of the first ${number(capacity)} students to receive Premium`, `Siz Premium olgan birinchi ${number(capacity)} o‘quvchidan birisiz`, `Вы среди первых ${number(capacity)} учеников, получивших Premium`)}</span>
            </div>
          ) : (
            <div className="launch-gift-rank-head">
              <span className="launch-gift-rank-number">{number(remaining)}<small>/ {number(capacity)}</small></span>
              <span className="launch-gift-rank-label">{text('gifts are still available', 'ta sovg‘a hali bor', 'подарков ещё доступно')}</span>
            </div>
          )}
          <div className="launch-gift-meter" role="progressbar" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={issued}
            aria-label={text('Gifts given', 'Berilgan sovg‘alar', 'Выдано подарков')}>
            <motion.span initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${Math.max(3, (issued / capacity) * 100)}%` }} transition={{ delay: reduceMotion ? 0 : .55, duration: reduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <p className="launch-gift-meter-note">{text(`${number(issued)} given · ${number(remaining)} left`, `${number(issued)} ta berildi · ${number(remaining)} ta qoldi`, `${number(issued)} выдано · ${number(remaining)} осталось`)}</p>
          {gift ? (
            <p className="launch-gift-status"><Check size={15} />{until
              ? text(`Pro is active until ${until}`, `Pro ${until} gacha faol`, `Pro активен до ${until}`)
              : text('Activating your Pro plan…', 'Pro tarifingiz faollashtirilmoqda…', 'Активируем ваш тариф Pro…')}</p>
          ) : null}
        </motion.div>

        <motion.ul className="launch-gift-perks" {...rise(.52)}>
          {perks.map(perk => <li key={perk}><Check size={14} strokeWidth={2.6} />{perk}</li>)}
        </motion.ul>

        <motion.div className="launch-gift-actions" {...rise(.6)}>
          {isGuest ? (
            <>
              <button ref={primary} type="button" className="launch-gift-primary" onClick={receive}>
                <Gift size={18} />{text('Receive your gift', 'Sovg‘ani olish', 'Получить подарок')}<ArrowRight size={17} />
              </button>
              <p className="launch-gift-hint">{text('Sign up in 30 seconds — Pro turns on automatically.', '30 soniyada ro‘yxatdan o‘ting — Pro avtomatik yoqiladi.', 'Регистрация за 30 секунд — Pro включится автоматически.')}</p>
              <button type="button" className="launch-gift-secondary" onClick={onClose}>{text('Maybe later', 'Keyinroq', 'Позже')}</button>
            </>
          ) : (
            <>
              <div className="launch-gift-share">
                <div>
                  <strong>{text('Share with friends', 'Do‘stlaringizga ulashing', 'Поделитесь с друзьями')}</strong>
                  <span>{text(`Only ${number(remaining)} gifts left — let them claim one too.`, `Atigi ${number(remaining)} ta sovg‘a qoldi — ular ham ulgurib qolsin.`, `Осталось всего ${number(remaining)} подарков — пусть друзья тоже успеют.`)}</span>
                </div>
                <button type="button" onClick={share}>
                  {shared === 'copied' ? <Copy size={16} /> : <Share2 size={16} />}
                  {shared === 'copied' ? text('Link copied', 'Havola nusxalandi', 'Ссылка скопирована') : text('Share', 'Ulashish', 'Поделиться')}
                </button>
              </div>
              <button ref={primary} type="button" className="launch-gift-primary" onClick={onClose}>
                {text('Start learning with Pro', 'Pro bilan o‘qishni boshlash', 'Начать учиться с Pro')}<ArrowRight size={17} />
              </button>
            </>
          )}
        </motion.div>
      </motion.section>
    </motion.div>
  )
}
