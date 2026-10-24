import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useCountdown } from '@/features/billing/useWheelDiscount'
import { WheelSound } from '@/features/wheel/wheelSound'
import '@/styles/spin-wheel.css'

type TelegramWebApp = {
  initData: string
  initDataUnsafe?: { user?: { language_code?: string; first_name?: string } }
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
type Phase = 'idle' | 'windup' | 'spinning' | 'settled'

const SDK_URL = 'https://telegram.org/js/telegram-web-app.js'
const DEFAULT_SEGMENTS = [50, 10, 15, 5, 25, 15, 20, 10]
const PRIZES = [50, 25, 20, 15, 10, 5]
const SPIN_MS = 6400
const WINDUP_DEG = 16
const BULBS = 20
const SITE = typeof window === 'undefined' ? '' : window.location.origin
const MUTE_KEY = 'ivygoo-wheel-muted'
const RUSSIAN_SPEAKING = ['ru', 'uk', 'be', 'kk', 'ky', 'tg', 'tk', 'az', 'hy']
// Local development can preview the wheel without Telegram at /spin?demo
const DEMO = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')

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

function demoApp(): TelegramWebApp {
  return { initData: 'demo', initDataUnsafe: { user: { language_code: new URLSearchParams(window.location.search).get('lang') ?? 'uz' } },
    ready: () => {}, expand: () => {}, openLink: url => window.open(url, '_blank'), openTelegramLink: url => window.open(url, '_blank') }
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
function sector(index: number, total: number, radius: number, center: number) {
  const start = (index / total) * Math.PI * 2 - Math.PI / 2
  const end = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2
  const point = (angle: number) => `${center + radius * Math.cos(angle)} ${center + radius * Math.sin(angle)}`
  return `M ${center} ${center} L ${point(start)} A ${radius} ${radius} 0 0 1 ${point(end)} Z`
}

function restingRotation(segments: number[], percent: number) {
  const index = Math.max(0, segments.indexOf(percent))
  const slice = 360 / segments.length
  return 360 - (index * slice + slice / 2)
}

/** Counts a number up with an ease-out, for the prize reveal. */
function useCountUp(target: number | null, duration = 900) {
  const [value, setValue] = useState(target ?? 0)
  useEffect(() => {
    if (target === null) return
    let frame = 0
    const started = performance.now()
    const step = (time: number) => {
      const progress = Math.min(1, (time - started) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

export default function SpinWheel() {
  const [app, setApp] = useState<TelegramWebApp | null | undefined>(undefined)
  const [state, setState] = useState<WheelState | null>(null)
  const [error, setError] = useState('')
  const [rotation, setRotation] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealed, setRevealed] = useState<Spin | null>(null)
  const [muted, setMuted] = useState(readStoredMute)
  const rotorRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const sound = useRef(new WheelSound())
  const stopTicks = useRef<() => void>(() => {})
  const lang = state?.language ?? detectLang(app?.initDataUnsafe?.user?.language_code)
  const t = useCallback((uz: string, ru: string, en: string) => lang === 'ru' ? ru : lang === 'en' ? en : uz, [lang])
  const segments = state?.segments?.length ? state.segments : DEFAULT_SEGMENTS
  const busy = phase === 'windup' || phase === 'spinning'
  const result = revealed ?? (busy ? null : state?.spin ?? null)
  const countdown = useCountdown(result?.active ? result.expiresAt : null)
  const shown = useCountUp(revealed ? revealed.percent : result ? result.percent : null, revealed ? 1100 : 0)

  useEffect(() => { sound.current.muted = muted }, [muted])
  useEffect(() => () => stopTicks.current(), [])

  const load = useCallback(async (webApp: TelegramWebApp) => {
    setError('')
    if (DEMO) { setState({ subscribed: true, linked: true, channelUrl: 'https://t.me/IvyGoo', segments: DEFAULT_SEGMENTS, spin: null }); return }
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
    void (DEMO ? Promise.resolve(demoApp()) : loadTelegram()).then(webApp => {
      setApp(webApp && webApp.initData ? webApp : null)
      if (!webApp?.initData) return
      webApp.ready(); webApp.expand()
      webApp.setHeaderColor?.('#eceff4'); webApp.setBackgroundColor?.('#eceff4')
      void load(webApp)
    })
  }, [load])

  function toggleMute() {
    const next = !muted
    setMuted(next)
    try { window.localStorage.setItem(MUTE_KEY, next ? '1' : '0') } catch { /* Storage can be unavailable. */ }
    if (!next) sound.current.unlock()
  }

  /** Ticks once per peg that passes the pointer, following the real, slowing rotation. */
  function trackTicks(from: number) {
    const rotor = rotorRef.current
    if (!rotor) return () => {}
    const slice = 360 / segments.length
    let previous = readAngle(rotor)
    let total = from
    let boundary = Math.floor(total / slice)
    let lastTime = performance.now()
    let frame = 0
    const step = (time: number) => {
      const angle = readAngle(rotor)
      const delta = ((angle - previous + 540) % 360) - 180
      const speed = Math.abs(delta) / Math.max(1, time - lastTime)
      previous = angle; lastTime = time; total += delta
      const next = Math.floor(total / slice)
      if (next !== boundary) {
        boundary = next
        sound.current.tick(speed / 1.2)
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

  async function drawSpin(): Promise<Spin> {
    if (DEMO) {
      const percent = segments[Math.floor(Math.random() * segments.length)]
      return { percent, expiresAt: new Date(Date.now() + (percent === 50 ? 600_000 : 86_400_000)).toISOString(), used: false, active: true }
    }
    const response = await apiClient.post<{ spin: Spin }>('/wheel/spin', { initData: app!.initData }, { auth: false })
    return response.spin
  }

  async function spin() {
    const rotor = rotorRef.current
    if (!app || !rotor || busy || state?.spin) return
    sound.current.unlock()
    sound.current.press()
    app.HapticFeedback?.impactOccurred('medium')
    setError(''); setRevealed(null); setPhase('windup')
    const from = rotation
    // Anticipation: the wheel is pulled back a little while the prize is drawn on the server.
    const windup = rotor.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${from - WINDUP_DEG}deg)` }],
      { duration: 380, easing: 'cubic-bezier(.3,0,.4,1)', fill: 'forwards' })
    try {
      const [won] = await Promise.all([drawSpin(), windup.finished])
      const matches = segments.map((value, index) => value === won.percent ? index : -1).filter(index => index >= 0)
      const index = matches[Math.floor(Math.random() * matches.length)] ?? 0
      const slice = 360 / segments.length
      const jitter = (Math.random() - 0.5) * slice * 0.55
      const start = from - WINDUP_DEG
      const target = from - (from % 360) + 360 * 8 + (360 - (index * slice + slice / 2)) + jitter
      setPhase('spinning')
      sound.current.spinStart()
      app.HapticFeedback?.impactOccurred('heavy')
      stopTicks.current = trackTicks(start)
      const main = rotor.animate([
        { transform: `rotate(${start}deg)`, easing: 'cubic-bezier(.12,.62,.08,1)' },
        { transform: `rotate(${target + 2.2}deg)`, offset: 0.965, easing: 'cubic-bezier(.4,0,.3,1)' },
        { transform: `rotate(${target}deg)` },
      ], { duration: SPIN_MS, fill: 'forwards' })
      windup.cancel()
      await main.finished
      setRotation(target)
      main.commitStyles?.()
      main.cancel()
      stopTicks.current()
      sound.current.stop()
      app.HapticFeedback?.impactOccurred('heavy')
      setPhase('settled')
      window.setTimeout(() => {
        setRevealed(won)
        setState(current => current ? { ...current, spin: won } : current)
        sound.current.win(won.percent === 50)
        app.HapticFeedback?.notificationOccurred('success')
      }, 260)
    } catch (failure) {
      windup.cancel()
      stopTicks.current()
      setPhase('idle')
      app.HapticFeedback?.notificationOccurred('error')
      if (failure instanceof ApiError && failure.code === 'NOT_SUBSCRIBED') setState(current => current ? { ...current, subscribed: false } : current)
      else setError(failure instanceof Error ? failure.message : 'Error')
    }
  }

  const wheel = useMemo(() => {
    const C = 120
    return <svg viewBox="0 0 240 240" className="spin-svg" aria-hidden="true">
      <defs>
        <linearGradient id="seg-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff4a5b" /><stop offset=".55" stopColor="#d61c33" /><stop offset="1" stopColor="#8e0d20" /></linearGradient>
        <linearGradient id="seg-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e3e7ed" /></linearGradient>
        <linearGradient id="seg-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eef1f5" /><stop offset="1" stopColor="#c7ced8" /></linearGradient>
      </defs>
      {segments.map((value, index) => {
        const slice = 360 / segments.length
        const angle = index * slice + slice / 2
        const jackpot = value === 50
        return <g key={index}>
          <path d={sector(index, segments.length, 112, C)} fill={jackpot ? 'url(#seg-red)' : index % 2 ? 'url(#seg-b)' : 'url(#seg-a)'} stroke="#ffffff" strokeWidth="1.4" />
          <g transform={`rotate(${angle} ${C} ${C})`}>
            {jackpot && <text x={C} y="26" textAnchor="middle" className="spin-star">★</text>}
            <text x={C} y={jackpot ? 52 : 46} textAnchor="middle" className={jackpot ? 'spin-label is-jackpot' : 'spin-label'}>
              {value}<tspan className="spin-label-pct" dx="1">%</tspan>
            </text>
          </g>
        </g>
      })}
      {segments.map((_, index) => {
        const angle = (index / segments.length) * Math.PI * 2 - Math.PI / 2
        return <circle key={`peg-${index}`} cx={C + 108 * Math.cos(angle)} cy={C + 108 * Math.sin(angle)} r="3.2" className="spin-peg" />
      })}
    </svg>
  }, [segments])

  const bulbs = useMemo(() => Array.from({ length: BULBS }, (_, index) => {
    const angle = (index / BULBS) * Math.PI * 2 - Math.PI / 2
    return <i key={index} className="spin-bulb" style={{ left: `${50 + 47.6 * Math.cos(angle)}%`, top: `${50 + 47.6 * Math.sin(angle)}%`, '--i': index } as CSSProperties} />
  }), [])

  if (app === undefined) return <main className="spin-page"><div className="spin-loader" /></main>
  if (app === null) return <main className="spin-page"><section className="spin-card">
    <img src="/ivygoo-icon-192.png" alt="" className="spin-card-logo" />
    <h1>{t('Chegirma barabani', 'Колесо скидок', 'Discount wheel')}</h1>
    <p>Barabanni Telegram bot ichida oching. · Откройте колесо в Telegram-боте. · Open the wheel inside the Telegram bot.</p>
    <a className="spin-primary" href="https://t.me/IvyGoo_bot?start=spin">@IvyGoo_bot</a>
  </section></main>

  const subscribed = state?.subscribed
  const canSpin = Boolean(state) && !busy && !state?.spin && subscribed === true
  const jackpotRevealed = revealed?.percent === 50
  return <main className={`spin-page is-${phase} ${jackpotRevealed ? 'is-jackpot' : ''}`}>
    <div className="spin-aura" aria-hidden="true" />
    <header className="spin-top">
      <span className="spin-logo"><img src="/ivygoo-icon-192.png" alt="" />Ivy<b>goo</b></span>
      <button type="button" className="spin-mute" onClick={toggleMute} aria-pressed={muted}
        aria-label={muted ? t('Ovozni yoqish', 'Включить звук', 'Turn sound on') : t('Ovozni o‘chirish', 'Выключить звук', 'Turn sound off')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" />{muted ? <path d="M16 9l5 6M21 9l-5 6" className="spin-mute-x" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" className="spin-mute-wave" />}</svg>
      </button>
    </header>

    <section className="spin-hero">
      <span className="spin-eyebrow">{t('FAQAT KANAL OBUNACHILARI UCHUN', 'ТОЛЬКО ДЛЯ ПОДПИСЧИКОВ', 'FOR CHANNEL SUBSCRIBERS')}</span>
      <h1>{t('Chegirma barabani', 'Колесо скидок', 'Discount wheel')}</h1>
      <p>{t('Bir marta aylantiring va Premium’ga 50% gacha chegirma yuting', 'Крутите один раз и выиграйте до 50% на Premium', 'Spin once and win up to 50% off Premium')}</p>
    </section>

    <div className="spin-stage">
      <div className="spin-frame">
        {bulbs}
        <div ref={rotorRef} className="spin-rotor" style={{ transform: `rotate(${rotation}deg)` }}>{wheel}</div>
        <div className="spin-gloss" aria-hidden="true" />
        <button type="button" className="spin-hub" disabled={!canSpin} onClick={() => void spin()} aria-label={t('Aylantirish', 'Крутить', 'Spin')}>
          <span>{busy ? '' : state?.spin ? '✓' : t('AYLANTIR', 'КРУТИТЬ', 'SPIN')}</span>
        </button>
      </div>
      <div ref={pointerRef} className="spin-pointer" aria-hidden="true" onAnimationEnd={event => event.currentTarget.classList.remove('is-tick')}>
        <svg viewBox="0 0 40 52"><defs><linearGradient id="ptr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5868" /><stop offset="1" stopColor="#9b1022" /></linearGradient></defs>
          <path d="M20 50 L4 16 A16 16 0 1 1 36 16 Z" fill="url(#ptr)" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" /><circle cx="20" cy="16" r="5.5" fill="#fff" opacity=".92" /></svg>
      </div>
      <div className="spin-shadow" aria-hidden="true" />
    </div>

    {error && <p className="spin-error" role="alert">{error}</p>}

    {!result && state && subscribed === true && <div className="spin-prizes" aria-label={t('Yutuqlar', 'Призы', 'Prizes')}>
      {PRIZES.map(prize => <span key={prize} className={prize === 50 ? 'is-jackpot' : ''}>{prize}%</span>)}
    </div>}

    {state && subscribed === false && !state.spin && <section className="spin-card">
      <span className="spin-card-icon">📣</span>
      <h2>{t('Avval kanalga obuna bo‘ling', 'Сначала подпишитесь на канал', 'Join the channel first')}</h2>
      <p>{t('Baraban faqat @IvyGoo kanali obunachilari uchun. Obuna bo‘ling va qaytib “Tekshirish”ni bosing.', 'Колесо доступно подписчикам @IvyGoo. Подпишитесь и нажмите «Проверить».', 'The wheel is for @IvyGoo subscribers. Join, then tap “Check”.')}</p>
      <div className="spin-actions">
        <button type="button" className="spin-primary" onClick={() => app.openTelegramLink(state.channelUrl)}>{t('Obuna bo‘lish', 'Подписаться', 'Join channel')}</button>
        <button type="button" className="spin-secondary" onClick={() => void load(app)}>{t('Tekshirish', 'Проверить', 'Check')}</button>
      </div>
    </section>}
    {state && subscribed === null && !state.spin && <section className="spin-card"><p>{t('Obunani tekshirib bo‘lmadi. Birozdan keyin urinib ko‘ring.', 'Не удалось проверить подписку. Попробуйте позже.', 'We could not check your subscription. Try again shortly.')}</p>
      <button type="button" className="spin-secondary" onClick={() => void load(app)}>{t('Qayta tekshirish', 'Проверить снова', 'Check again')}</button></section>}

    {result && <section className={`spin-result ${result.percent === 50 ? 'is-jackpot' : ''} ${revealed ? 'is-new' : ''}`} role="status">
      {revealed && <div className="spin-confetti" aria-hidden="true">{Array.from({ length: jackpotRevealed ? 44 : 22 }, (_, index) => <i key={index} style={{ '--i': index, '--x': `${(index * 37) % 100}%` } as CSSProperties} />)}</div>}
      <span className="spin-result-eyebrow">{result.active ? (result.percent === 50 ? t('JACKPOT', 'ДЖЕКПОТ', 'JACKPOT') : t('SIZ YUTDINGIZ', 'ВЫ ВЫИГРАЛИ', 'YOU WON')) : t('SIZNING NATIJANGIZ', 'ВАШ РЕЗУЛЬТАТ', 'YOUR RESULT')}</span>
      <span className="spin-result-value">−{shown}<small>%</small></span>
      <span className="spin-result-label">{t('Premium tarifiga chegirma', 'скидка на тариф Premium', 'off any Premium plan')}</span>
      {result.active ? <>
        {countdown && <span className="spin-timer"><i />{t('Amal qiladi', 'Действует', 'Valid for')} <b>{countdown.label}</b></span>}
        <button type="button" className="spin-primary" onClick={() => app.openLink(`${SITE}/premium`)}>{t('Chegirma bilan olish', 'Купить со скидкой', 'Buy with discount')}</button>
        <p className="spin-result-note">{state?.linked
          ? t('Chegirma saytda avtomatik qo‘llanadi. Taymer tugashidan oldin to‘lang.', 'Скидка применится на сайте автоматически. Оплатите до конца таймера.', 'The discount applies on the website automatically. Pay before the timer ends.')
          : t('Saytda shu Telegram ulangan hisob bilan kiring — chegirma avtomatik qo‘llanadi.', 'Войдите на сайте в аккаунт, привязанный к этому Telegram, — скидка применится сама.', 'Sign in on the website with the account linked to this Telegram — the discount applies automatically.')}</p>
      </> : <p className="spin-result-note">{result.used ? t('Bu chegirmadan foydalangansiz. Rahmat!', 'Вы уже воспользовались этой скидкой. Спасибо!', 'You have already used this discount. Thank you!') : t('Chegirma muddati tugagan. Barabanni har kim bir marta aylantiradi.', 'Срок скидки истёк. Крутить можно один раз.', 'This discount has expired. Everyone spins once.')}</p>}
    </section>}

    <footer className="spin-foot">
      <span>🎁 {t('Har bir Telegram hisob — 1 marta', 'Один спин на аккаунт', 'One spin per account')}</span>
      <span>⏱ {t('50% — 10 daqiqa, boshqalari — 24 soat', '50% — 10 минут, остальные — 24 часа', '50% — 10 minutes, others — 24 hours')}</span>
    </footer>
  </main>
}
