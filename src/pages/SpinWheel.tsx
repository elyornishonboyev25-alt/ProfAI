import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useCountdown } from '@/features/billing/useWheelDiscount'
import { WheelSound } from '@/features/wheel/wheelSound'
import '@/styles/spin-wheel.css'

type TelegramWebApp = {
  initData: string
  initDataUnsafe?: { user?: { language_code?: string } }
  ready: () => void
  expand: () => void
  openLink: (url: string) => void
  openTelegramLink: (url: string) => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  HapticFeedback?: {
    notificationOccurred: (type: 'success' | 'error' | 'warning') => void
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    selectionChanged: () => void
  }
}
declare global { interface Window { Telegram?: { WebApp?: TelegramWebApp } } }

type Lang = 'uz' | 'ru' | 'en'
type Spin = { percent: number; expiresAt: string; used: boolean; active: boolean }
type WheelState = { subscribed: boolean | null; linked: boolean; channelUrl: string; segments: number[]; spin: Spin | null; language?: Lang }

const SDK_URL = 'https://telegram.org/js/telegram-web-app.js'
const DEFAULT_SEGMENTS = [50, 10, 15, 5, 25, 15, 20, 10]
const SPIN_MS = 5600
const SITE = typeof window === 'undefined' ? '' : window.location.origin
const MUTE_KEY = 'ivygoo-wheel-muted'
const RUSSIAN_SPEAKING = ['ru', 'uk', 'be', 'kk', 'ky', 'tg', 'tk', 'az', 'hy']

/** Same rule as the bot and the website: Uzbek → uz, Russia and CIS → ru, everyone else → en. */
function detectLang(code?: string): Lang {
  const base = (code ?? '').toLowerCase().slice(0, 2)
  return base === 'uz' ? 'uz' : RUSSIAN_SPEAKING.includes(base) ? 'ru' : 'en'
}

function loadTelegram(): Promise<TelegramWebApp | null> {
  if (window.Telegram?.WebApp) return Promise.resolve(window.Telegram.WebApp)
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => resolve(window.Telegram?.WebApp ?? null)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}

function readStoredMute() {
  try { return window.localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}

/** Current rotation of an element, in degrees 0–360, read from its live transform. */
function readAngle(element: HTMLElement) {
  const transform = getComputedStyle(element).transform
  if (!transform || transform === 'none') return 0
  const [a, b] = transform.slice(transform.indexOf('(') + 1, -1).split(',').map(Number)
  return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
}

/** SVG path for one wheel sector, clockwise from the top. */
function sector(index: number, total: number, radius: number) {
  const start = (index / total) * Math.PI * 2 - Math.PI / 2
  const end = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2
  const point = (angle: number) => `${radius + radius * Math.cos(angle)} ${radius + radius * Math.sin(angle)}`
  return `M ${radius} ${radius} L ${point(start)} A ${radius} ${radius} 0 0 1 ${point(end)} Z`
}

function restingRotation(segments: number[], percent: number) {
  const index = Math.max(0, segments.indexOf(percent))
  const slice = 360 / segments.length
  return 360 - (index * slice + slice / 2)
}

export default function SpinWheel() {
  const [app, setApp] = useState<TelegramWebApp | null | undefined>(undefined)
  const [state, setState] = useState<WheelState | null>(null)
  const [error, setError] = useState('')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [revealed, setRevealed] = useState<Spin | null>(null)
  const [muted, setMuted] = useState(readStoredMute)
  const rotorRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<HTMLSpanElement>(null)
  const sound = useRef(new WheelSound())
  const stopTicks = useRef<() => void>(() => {})
  const lang = state?.language ?? detectLang(app?.initDataUnsafe?.user?.language_code)
  const t = useCallback((uz: string, ru: string, en: string) => lang === 'ru' ? ru : lang === 'en' ? en : uz, [lang])
  const segments = state?.segments?.length ? state.segments : DEFAULT_SEGMENTS
  const result = revealed ?? (spinning ? null : state?.spin ?? null)
  const countdown = useCountdown(result?.active ? result.expiresAt : null)

  useEffect(() => { sound.current.muted = muted }, [muted])
  useEffect(() => () => stopTicks.current(), [])

  const load = useCallback(async (webApp: TelegramWebApp) => {
    setError('')
    try {
      const value = await apiClient.post<WheelState>('/wheel/state', { initData: webApp.initData }, { auth: false })
      setState(value)
      if (value.spin) setRotation(restingRotation(value.segments, value.spin.percent))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Error')
    }
  }, [])

  useEffect(() => {
    document.title = 'Ivygoo · 🎡'
    void loadTelegram().then(webApp => {
      setApp(webApp && webApp.initData ? webApp : null)
      if (!webApp?.initData) return
      webApp.ready(); webApp.expand()
      webApp.setHeaderColor?.('#eef1f5'); webApp.setBackgroundColor?.('#eef1f5')
      void load(webApp)
    })
  }, [load])

  function toggleMute() {
    const next = !muted
    setMuted(next)
    try { window.localStorage.setItem(MUTE_KEY, next ? '1' : '0') } catch { /* Storage can be unavailable. */ }
    if (!next) sound.current.unlock()
  }

  /** Ticks once per segment that passes the pointer, following the real, slowing rotation. */
  function trackTicks(from: number) {
    const rotor = rotorRef.current
    if (!rotor) return () => {}
    const slice = 360 / segments.length
    let previous = readAngle(rotor)
    let total = from
    let boundary = Math.floor(total / slice)
    let frame = 0
    const step = () => {
      const angle = readAngle(rotor)
      const delta = ((angle - previous + 540) % 360) - 180
      previous = angle
      total += delta
      const next = Math.floor(total / slice)
      if (next !== boundary) {
        boundary = next
        sound.current.tick(Math.abs(delta) / 18)
        app?.HapticFeedback?.selectionChanged()
        const pointer = pointerRef.current
        if (pointer) {
          pointer.classList.remove('is-tick')
          void pointer.offsetWidth
          pointer.classList.add('is-tick')
        }
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }

  async function spin() {
    if (!app || spinning || state?.spin) return
    sound.current.unlock()
    setError(''); setSpinning(true); setRevealed(null)
    app.HapticFeedback?.impactOccurred('medium')
    try {
      const response = await apiClient.post<{ spin: Spin }>('/wheel/spin', { initData: app.initData }, { auth: false })
      const matches = segments.map((value, index) => value === response.spin.percent ? index : -1).filter(index => index >= 0)
      const index = matches[Math.floor(Math.random() * matches.length)] ?? 0
      const slice = 360 / segments.length
      const jitter = (Math.random() - 0.5) * slice * 0.6
      const from = rotation
      const target = from - (from % 360) + 360 * 7 + (360 - (index * slice + slice / 2)) + jitter
      sound.current.whoosh()
      stopTicks.current = trackTicks(from)
      setRotation(target)
      window.setTimeout(() => {
        stopTicks.current()
        setSpinning(false)
        setRevealed(response.spin)
        setState(current => current ? { ...current, spin: response.spin } : current)
        sound.current.win(response.spin.percent === 50)
        app.HapticFeedback?.notificationOccurred('success')
      }, SPIN_MS)
    } catch (failure) {
      stopTicks.current()
      setSpinning(false)
      app.HapticFeedback?.notificationOccurred('error')
      if (failure instanceof ApiError && failure.code === 'NOT_SUBSCRIBED') setState(current => current ? { ...current, subscribed: false } : current)
      else setError(failure instanceof Error ? failure.message : 'Error')
    }
  }

  const wheel = useMemo(() => <svg viewBox="0 0 200 200" className="spin-svg" aria-hidden="true">
    <defs>
      <linearGradient id="spin-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff3b4d" /><stop offset="1" stopColor="#9b1022" /></linearGradient>
      <linearGradient id="spin-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dde2e9" /></linearGradient>
      <linearGradient id="spin-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9ecf1" /><stop offset="1" stopColor="#c3cad4" /></linearGradient>
    </defs>
    {segments.map((value, index) => {
      const slice = 360 / segments.length
      const angle = index * slice + slice / 2
      const jackpot = value === 50
      return <g key={index}>
        <path d={sector(index, segments.length, 100)} fill={jackpot ? 'url(#spin-red)' : index % 2 ? 'url(#spin-steel)' : 'url(#spin-silver)'} stroke="#ffffff" strokeWidth="1.2" />
        <text x="100" y="30" transform={`rotate(${angle} 100 100)`} textAnchor="middle" className={jackpot ? 'spin-label is-jackpot' : 'spin-label'}>{value}%</text>
      </g>
    })}
    {segments.map((_, index) => {
      const angle = (index / segments.length) * Math.PI * 2 - Math.PI / 2
      return <circle key={`peg-${index}`} cx={100 + 94 * Math.cos(angle)} cy={100 + 94 * Math.sin(angle)} r="2.6" className="spin-peg" />
    })}
  </svg>, [segments])

  if (app === undefined) return <main className="spin-page"><div className="spin-loader" /></main>
  if (app === null) return <main className="spin-page"><section className="spin-card">
    <h1>🎡 Ivygoo</h1>
    <p>Barabanni Telegram bot ichida oching. · Откройте колесо в Telegram-боте. · Open the wheel inside the Telegram bot.</p>
    <a className="spin-primary" href="https://t.me/IvyGoo_bot?start=spin">@IvyGoo_bot</a>
  </section></main>

  const subscribed = state?.subscribed
  const jackpotRevealed = revealed?.percent === 50
  return <main className="spin-page">
    <header className="spin-head">
      <button type="button" className="spin-mute" onClick={toggleMute} aria-pressed={muted}
        aria-label={muted ? t('Ovozni yoqish', 'Включить звук', 'Turn sound on') : t('Ovozni o‘chirish', 'Выключить звук', 'Turn sound off')}>{muted ? '🔇' : '🔊'}</button>
      <span className="spin-brand">Ivy<b>goo</b></span>
      <h1>{t('Chegirma barabani', 'Колесо скидок', 'Discount wheel')}</h1>
      <p>{t('Bir marta aylantiring — 50% gacha chegirma', 'Один спин — скидка до 50%', 'One spin — up to 50% off')}</p>
    </header>

    <div className={`spin-stage ${spinning ? 'is-spinning' : ''}`}>
      <span ref={pointerRef} className="spin-pointer" aria-hidden="true" onAnimationEnd={event => event.currentTarget.classList.remove('is-tick')} />
      <div ref={rotorRef} className="spin-rotor" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? `${SPIN_MS}ms` : '0ms' }}>{wheel}</div>
      <button type="button" className="spin-hub" disabled={!state || spinning || Boolean(state.spin) || subscribed !== true} onClick={() => void spin()}
        aria-label={t('Aylantirish', 'Крутить', 'Spin')}>{spinning ? '…' : state?.spin ? '✓' : t('AYLANTIR', 'КРУТИТЬ', 'SPIN')}</button>
    </div>

    {error && <p className="spin-error" role="alert">{error}</p>}

    {state && subscribed === false && !state.spin && <section className="spin-card">
      <h2>📣 {t('Avval kanalga obuna bo‘ling', 'Сначала подпишитесь на канал', 'Join the channel first')}</h2>
      <p>{t('Baraban faqat @IvyGoo kanali obunachilari uchun.', 'Колесо доступно подписчикам канала @IvyGoo.', 'The wheel is for @IvyGoo channel subscribers.')}</p>
      <div className="spin-actions">
        <button type="button" className="spin-primary" onClick={() => app.openTelegramLink(state.channelUrl)}>{t('Obuna bo‘lish', 'Подписаться', 'Subscribe')}</button>
        <button type="button" className="spin-secondary" onClick={() => void load(app)}>{t('Tekshirish', 'Проверить', 'Check')}</button>
      </div>
    </section>}
    {state && subscribed === null && !state.spin && <section className="spin-card"><p>{t('Obunani tekshirib bo‘lmadi. Birozdan keyin urinib ko‘ring.', 'Не удалось проверить подписку. Попробуйте позже.', 'We could not check your subscription. Try again shortly.')}</p>
      <button type="button" className="spin-secondary" onClick={() => void load(app)}>{t('Qayta tekshirish', 'Проверить снова', 'Check again')}</button></section>}

    {result && <section className={`spin-result ${result.percent === 50 ? 'is-jackpot' : ''} ${revealed ? 'is-new' : ''}`} role="status">
      {jackpotRevealed && <div className="spin-confetti" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}</div>}
      <span className="spin-result-value">−{result.percent}%</span>
      {result.active ? <>
        <strong>{result.percent === 50 ? t('JACKPOT! Eng katta chegirma!', 'ДЖЕКПОТ! Максимальная скидка!', 'JACKPOT! The top prize!') : t('Tabriklaymiz! Chegirma sizniki', 'Поздравляем! Скидка ваша', 'Congratulations! The discount is yours')}</strong>
        <p>{t('Taymer tugashidan oldin to‘lang — keyin chegirma yo‘qoladi.', 'Оплатите до конца таймера — потом скидка сгорит.', 'Pay before the timer ends — after that it is gone.')}</p>
        {countdown && <span className="spin-timer">⏳ {countdown.label}</span>}
        <button type="button" className="spin-primary" onClick={() => app.openLink(`${SITE}/premium`)}>{t('Chegirma bilan olish', 'Купить со скидкой', 'Buy with discount')}</button>
        {!state?.linked && <small>{t('Saytda shu Telegram ulangan hisob bilan kiring — chegirma avtomatik qo‘llanadi.', 'Войдите на сайте в аккаунт, привязанный к этому Telegram, — скидка применится сама.', 'Sign in on the site with the account linked to this Telegram — the discount applies automatically.')}</small>}
      </> : <p>{result.used ? t('Bu chegirmadan foydalangansiz.', 'Вы уже использовали эту скидку.', 'You have used this discount.') : t('Chegirma muddati tugagan. Barabanni har kim bir marta aylantiradi.', 'Срок скидки истёк. Крутить можно один раз.', 'This discount has expired. Everyone spins once.')}</p>}
    </section>}

    <footer className="spin-foot">{t('Har bir Telegram hisob bir marta aylantiradi. 50% chegirma 10 daqiqa, qolganlari 24 soat amal qiladi.', 'Один спин на аккаунт Telegram. Скидка 50% действует 10 минут, остальные — 24 часа.', 'One spin per Telegram account. 50% lasts 10 minutes, other prizes 24 hours.')}</footer>
  </main>
}
