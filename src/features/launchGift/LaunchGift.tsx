import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
// Matches the exit animation in launch-gift.css.
const EXIT_MS = 280
// Guests see the invitation once per browsing session.
const GUEST_SEEN_KEY = 'smarttest-launch-gift-guest-seen'

function guestAlreadySaw() {
  try { return sessionStorage.getItem(GUEST_SEEN_KEY) === '1' } catch { return false }
}
function rememberGuestSaw() {
  try { sessionStorage.setItem(GUEST_SEEN_KEY, '1') } catch { /* storage unavailable */ }
}

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/**
 * Counts up by writing straight to the DOM, so the dialog never re-renders per
 * frame. A hidden copy of the final value reserves the width and stops the
 * heading from reflowing while the digits change.
 */
function CountUp({ to, format, instant, delay = 0 }: { to: number; format: (value: number) => string; instant: boolean; delay?: number }) {
  const live = useRef<HTMLSpanElement>(null)
  const formatRef = useRef(format)
  formatRef.current = format
  useLayoutEffect(() => {
    const node = live.current
    if (!node) return
    const write = (value: number) => { node.textContent = formatRef.current(value) }
    if (instant || !to) { write(to); return }
    write(0)
    let frame = 0
    const started = performance.now() + delay
    const tick = (time: number) => {
      const progress = Math.min(1, Math.max(0, (time - started) / 1300))
      write(Math.round(to * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, instant, delay])
  return <span className="launch-gift-count"><span className="launch-gift-count-ghost" aria-hidden="true">{format(to)}</span><span ref={live} aria-hidden="true" /><span className="sr-only">{format(to)}</span></span>
}

/** Launch campaign: one month of Pro for the first 1,000 students, announced one second after the site opens. */
export default function LaunchGift({ enabled }: { enabled: boolean }) {
  const user = useAuthStore(state => state.user)
  const accessToken = useAuthStore(state => state.accessToken)
  const hydrated = useAuthStore(state => state.hydrated)
  const [gift, setGift] = useState<AccountGift | null>(null)
  const [stats, setStats] = useState<GiftStats | null>(null)
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const checked = useRef<string | null>(null)
  const claimed = useRef(false)
  const signedIn = Boolean(user && accessToken)

  useEffect(() => {
    if (!enabled || !hydrated) return
    const owner = signedIn ? user!.id : 'guest'
    if (checked.current === owner) return
    checked.current = owner
    let cancelled = false
    let timer = 0
    let idle = 0
    let onLoad: (() => void) | null = null
    // Open one second after the page has finished loading, in its first idle
    // moment, so the entrance never competes with the page's own startup work.
    const showSoon = (show: () => void) => {
      const schedule = () => {
        onLoad = null
        timer = window.setTimeout(() => {
          if ('requestIdleCallback' in window) idle = window.requestIdleCallback(show, { timeout: 1500 })
          else show()
        }, OPEN_DELAY_MS)
      }
      if (document.readyState === 'complete') schedule()
      else { onLoad = schedule; window.addEventListener('load', schedule, { once: true }) }
    }
    setPhase('closed')
    if (signedIn) {
      setStats(null)
      apiClient.get<AccountGift>('/launch-gift').then(result => {
        if (cancelled || !result.eligible || result.claimedAt) return
        setGift(result)
        showSoon(() => {
          setPhase('open')
          // The gift is activated as soon as it is shown; a failed claim is retried on the next visit.
          apiClient.post<AccountGift>('/launch-gift/claim').then(saved => {
            if (cancelled) return
            claimed.current = true
            setGift(saved)
            // If the dialog stays open, update the plan once the entrance has finished.
            window.setTimeout(() => {
              if (!claimed.current) return
              claimed.current = false
              void useBillingStore.getState().refresh()
            }, 3000)
          }).catch(() => undefined)
        })
      }).catch(() => undefined)
    } else {
      setGift(null)
      if (guestAlreadySaw()) return
      apiClient.get<GiftStats>('/launch-gift/stats', { auth: false }).then(result => {
        if (cancelled || result.remaining <= 0) return
        setStats(result)
        showSoon(() => { setPhase('open'); rememberGuestSaw() })
      }).catch(() => undefined)
    }
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (idle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idle)
      if (onLoad) window.removeEventListener('load', onLoad)
      if (checked.current === owner) checked.current = null
    }
  }, [enabled, hydrated, signedIn, user?.id])

  const close = useCallback(() => {
    setPhase(current => current === 'open' ? 'closing' : current)
    window.setTimeout(() => setPhase(current => current === 'closing' ? 'closed' : current), EXIT_MS)
    // Updating the plan re-renders the whole workspace; do it after the exit animation.
    if (claimed.current) {
      claimed.current = false
      window.setTimeout(() => { void useBillingStore.getState().refresh() }, EXIT_MS + 150)
    }
  }, [])
  const data = gift ?? stats
  return phase !== 'closed' && data ? <GiftDialog gift={gift} stats={data} closing={phase === 'closing'} onClose={close} /> : null
}

function GiftDialog({ gift, stats, closing, onClose }: { gift: AccountGift | null; stats: GiftStats; closing: boolean; onClose: () => void }) {
  const text = useBillingText()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [reduceMotion] = useState(prefersReducedMotion)
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
  const until = gift?.expiresAt ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(gift.expiresAt)) : null

  // Lock page scroll before the first frame is painted, keeping the scrollbar's
  // width so the page behind never shifts or reflows during the entrance.
  useLayoutEffect(() => {
    const root = document.documentElement
    const previous = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
    const gutter = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (gutter > 0) root.style.paddingRight = `${gutter}px`
    root.setAttribute('data-launch-gift-open', '')
    return () => {
      root.style.overflow = previous.overflow
      root.style.paddingRight = previous.paddingRight
      root.removeAttribute('data-launch-gift-open')
    }
  }, [])

  useEffect(() => {
    primary.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
  // The entrance is pure CSS keyframes on transform and opacity: the browser runs
  // them on the compositor thread, so they stay smooth even while the page is busy.
  const rise = (delay: number) => ({ '--rise-delay': `${delay}s` } as CSSProperties)
  const fill = { '--fill': `${-(1 - Math.max(.03, issued / capacity)) * 100}%` } as CSSProperties

  return (
    <div className={`launch-gift-overlay${closing ? ' is-closing' : ''}`} data-lenis-prevent onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="launch-gift-card" role="dialog" aria-modal="true" aria-labelledby="launch-gift-title" aria-describedby="launch-gift-intro">
        <span className="launch-gift-sheen" aria-hidden="true" />
        <button type="button" className="launch-gift-close" aria-label={text('Close', 'Yopish', 'Закрыть')} onClick={onClose}><X size={18} /></button>

        <header className="launch-gift-hero">
          <div className="launch-gift-medal" aria-hidden="true">
            <span className="launch-gift-ring" />
            {!reduceMotion ? Array.from({ length: 6 }, (_, index) => (
              <i key={index} className="launch-gift-spark" style={{ '--angle': `${index * 60 + 30}deg`, '--delay': `${.5 + index * .06}s` } as CSSProperties} />
            )) : null}
            <span className="launch-gift-core">
              <Gift size={34} strokeWidth={1.9} />
            </span>
          </div>
          <p className="launch-gift-eyebrow launch-gift-rise" style={rise(.18)}><Sparkles size={13} />{text('ProfAI launch gift', 'ProfAI sovg‘asi', 'Подарок от ProfAI')}</p>
          <h2 id="launch-gift-title" className="launch-gift-title launch-gift-rise" style={rise(.24)}>
            <span className="launch-gift-amount"><CountUp to={CAMPAIGN_VALUE_USD} format={value => `$${number(value)}`} instant={reduceMotion} delay={250} /></span>
            <span className="launch-gift-subtitle">{text('in free Premium for the first 1,000 students', 'jami bepul Premium — birinchi 1 000 o‘quvchiga', 'в бесплатном Premium — первым 1 000 ученикам')}</span>
          </h2>
          <p id="launch-gift-intro" className="launch-gift-intro launch-gift-rise" style={rise(.3)}>
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
          </p>
        </header>

        <div className="launch-gift-rank launch-gift-rise" style={rise(.36)}>
          {gift?.rank ? (
            <div className="launch-gift-rank-head">
              <span className="launch-gift-rank-number"><CountUp to={gift.rank} format={value => `#${number(value)}`} instant={reduceMotion} delay={450} /><small>/ {number(capacity)}</small></span>
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
            <span style={fill} />
          </div>
          <p className="launch-gift-meter-note">{text(`${number(issued)} given · ${number(remaining)} left`, `${number(issued)} ta berildi · ${number(remaining)} ta qoldi`, `${number(issued)} выдано · ${number(remaining)} осталось`)}</p>
          {gift ? (
            <p className="launch-gift-status"><Check size={15} />{until
              ? text(`Pro is active until ${until}`, `Pro ${until} gacha faol`, `Pro активен до ${until}`)
              : text('Activating your Pro plan…', 'Pro tarifingiz faollashtirilmoqda…', 'Активируем ваш тариф Pro…')}</p>
          ) : null}
        </div>

        <ul className="launch-gift-perks launch-gift-rise" style={rise(.42)}>
          {perks.map(perk => <li key={perk}><Check size={14} strokeWidth={2.6} />{perk}</li>)}
        </ul>

        <div className="launch-gift-actions launch-gift-rise" style={rise(.48)}>
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
        </div>
      </section>
    </div>
  )
}
