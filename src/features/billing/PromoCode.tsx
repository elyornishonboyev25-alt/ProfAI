import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, ChevronDown, Gift, Loader2, Megaphone, Send, Ticket } from 'lucide-react'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useBillingText } from './copy'
import './promo.css'

type PromoStatus = {
  telegramEnabled: boolean
  channelUrl: string
  promoDays: number
  referralBonusDays: number
  telegramLinked: boolean
  promoIssued: boolean
  promoRedeemed: boolean
}

type Outcome = { tone: 'success' | 'error'; message: string }

export default function PromoCode({ onRedeemed }: { onRedeemed: () => void }) {
  const text = useBillingText()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore(state => state.user)
  const presetCode = (params.get('promo') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24)
  const [open, setOpen] = useState(Boolean(presetCode))
  const [guideOpen, setGuideOpen] = useState(false)
  const [code, setCode] = useState(presetCode)
  const [status, setStatus] = useState<PromoStatus | null>(null)
  const [busy, setBusy] = useState<'apply' | 'bot' | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !user) return
    let alive = true
    void apiClient.get<PromoStatus>('/promo/status').then(value => { if (alive) setStatus(value) }).catch(() => undefined)
    return () => { alive = false }
  }, [open, user?.id])

  useEffect(() => {
    if (presetCode) window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }, [presetCode])

  const needAccount = () => navigate('/register', { state: { from: { pathname: '/premium' } } })

  const errorMessage = (error: unknown) => {
    const reason = error instanceof ApiError ? error.code : undefined
    switch (reason) {
      case 'ALREADY_USED': return text('This promo code has already been used.', 'Bu promokod avval ishlatilgan.', 'Этот промокод уже использован.')
      case 'SELF_REFERRAL': return text('You cannot use your own invitation code.', 'O‘zingizning taklif kodingizdan foydalana olmaysiz.', 'Нельзя использовать собственный код приглашения.')
      case 'ALREADY_CLAIMED': return text('An invitation code was already applied to your account.', 'Hisobingizga taklif kodi allaqachon qo‘llangan.', 'Код приглашения уже применён к вашему аккаунту.')
      case 'TOO_LATE': return text('Invitation codes work during the first 7 days after sign-up.', 'Taklif kodi ro‘yxatdan o‘tgandan keyingi 7 kun ichida ishlaydi.', 'Коды приглашения работают в течение 7 дней после регистрации.')
      default: return text('We could not find this code. Check it and try again.', 'Bu kod topilmadi. Tekshirib, qayta urinib ko‘ring.', 'Код не найден. Проверьте его и попробуйте снова.')
    }
  }

  async function apply(event: FormEvent) {
    event.preventDefault()
    if (!user) { needAccount(); return }
    if (code.trim().length < 3 || busy) return
    setBusy('apply'); setOutcome(null)
    try {
      const result = await apiClient.post<{ kind: 'PROMO' | 'REFERRAL'; days: number }>('/promo/redeem', { code })
      setOutcome({
        tone: 'success',
        message: result.kind === 'REFERRAL'
          ? text(`Invitation accepted. +${result.days} days of Premium added.`, `Taklif qabul qilindi. Premium’ga +${result.days} kun qo‘shildi.`, `Приглашение принято. К Premium добавлено +${result.days} дн.`)
          : text(`Promo code applied. +${result.days} days of Premium added.`, `Promokod qo‘llandi. Premium’ga +${result.days} kun qo‘shildi.`, `Промокод применён. К Premium добавлено +${result.days} дн.`),
      })
      setCode('')
      onRedeemed()
    } catch (error) {
      setOutcome({ tone: 'error', message: errorMessage(error) })
    } finally { setBusy(null) }
  }

  async function openBot() {
    if (!user) { needAccount(); return }
    setBusy('bot'); setOutcome(null)
    try {
      const result = await apiClient.post<{ url: string }>('/promo/telegram')
      window.open(result.url, '_blank', 'noopener')
    } catch {
      setOutcome({ tone: 'error', message: text('The Telegram bot is not available right now. Please try again soon.', 'Telegram bot hozircha mavjud emas. Birozdan keyin urinib ko‘ring.', 'Telegram-бот сейчас недоступен. Попробуйте позже.') })
    } finally { setBusy(null) }
  }

  const days = status?.promoDays ?? 7
  const channelUrl = status?.channelUrl ?? 'https://t.me/IvyGoo'

  return <section className="promo" aria-labelledby="promo-title">
    <button type="button" className={`promo-toggle ${open ? 'is-open' : ''}`} aria-expanded={open} aria-controls="promo-panel" onClick={() => setOpen(value => !value)}>
      <span className="promo-toggle-icon"><Ticket size={18} /></span>
      <span className="promo-toggle-copy">
        <strong id="promo-title">{text('Have a promo code?', 'Promokodingiz bormi?', 'Есть промокод?')}</strong>
        <small>{text('Enter it to get free Premium days', 'Kiriting va bepul Premium kunlarini oling', 'Введите и получите бесплатные дни Premium')}</small>
      </span>
      <ChevronDown size={18} className="promo-toggle-chevron" />
    </button>

    {open && <div id="promo-panel" ref={panelRef} className="promo-panel billing-glass">
      <form className="promo-form" onSubmit={event => void apply(event)}>
        <label htmlFor="promo-code-input">{text('Promo or invitation code', 'Promokod yoki taklif kodi', 'Промокод или код приглашения')}</label>
        <div className="promo-input-row">
          <input id="promo-code-input" value={code} onChange={event => { setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24)); setOutcome(null) }}
            placeholder="IVYXXXXXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" maxLength={24} />
          <button type="submit" className="billing-primary" disabled={busy !== null || code.trim().length < 3}>
            {busy === 'apply' ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
            {text('Apply', 'Qo‘llash', 'Применить')}
          </button>
        </div>
        <p className="promo-hint">{text('A friend invited you? Paste their invitation code here too — you both get bonus days.', 'Do‘stingiz taklif qildimi? Uning taklif kodini ham shu yerga kiriting — ikkalangiz bonus kun olasiz.', 'Вас пригласил друг? Вставьте и его код приглашения — оба получите бонусные дни.')}</p>
        {outcome && <div role={outcome.tone === 'error' ? 'alert' : 'status'} className={outcome.tone === 'success' ? 'billing-status is-success' : 'billing-error'}>{outcome.message}</div>}
      </form>

      <div className="promo-divider" role="presentation"><span>{text('or', 'yoki', 'или')}</span></div>

      <button type="button" className="promo-get" aria-expanded={guideOpen} onClick={() => setGuideOpen(value => !value)}>
        <Gift size={18} />
        <span><strong>{text('Get a free promo code', 'Bepul promokod olish', 'Получить бесплатный промокод')}</strong><small>{text(`Join our Telegram channel and get +${days} Premium days`, `Telegram kanalimizga obuna bo‘ling va +${days} kun Premium oling`, `Подпишитесь на наш Telegram-канал и получите +${days} дн. Premium`)}</small></span>
        <ChevronDown size={17} className="promo-get-chevron" />
      </button>

      {guideOpen && <ol className="promo-steps">
        <li>
          <span className="promo-step-number">1</span>
          <div>
            <strong>{text('Join the channel', 'Kanalga obuna bo‘ling', 'Подпишитесь на канал')}</strong>
            <p>{text('Subscribe to our official Telegram channel.', 'Rasmiy Telegram kanalimizga obuna bo‘ling.', 'Подпишитесь на наш официальный Telegram-канал.')}</p>
            <a className="billing-secondary" href={channelUrl} target="_blank" rel="noopener noreferrer"><Megaphone size={16} />@IvyGoo<ArrowRight size={15} /></a>
          </div>
        </li>
        <li>
          <span className="promo-step-number">2</span>
          <div>
            <strong>{text('Open the bot and press Start', 'Botni oching va Start bosing', 'Откройте бота и нажмите Start')}</strong>
            <p>{text('The bot checks your subscription and sends your personal code.', 'Bot obunangizni tekshiradi va shaxsiy kodingizni yuboradi.', 'Бот проверит подписку и пришлёт ваш личный код.')}</p>
            <button type="button" className="billing-primary" disabled={busy !== null || status?.telegramEnabled === false} onClick={() => void openBot()}>
              {busy === 'bot' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {text('Open Telegram bot', 'Telegram botni ochish', 'Открыть Telegram-бота')}
            </button>
            {status?.telegramEnabled === false && <p className="promo-soon">{text('The bot is coming soon.', 'Bot tez orada ishga tushadi.', 'Бот скоро заработает.')}</p>}
          </div>
        </li>
        <li>
          <span className="promo-step-number">3</span>
          <div>
            <strong>{text('Paste your code above', 'Kodni yuqoriga kiriting', 'Вставьте код выше')}</strong>
            <p>{text(`Press Apply — +${days} Premium days are added instantly.`, `“Qo‘llash” ni bosing — +${days} kun Premium darhol qo‘shiladi.`, `Нажмите «Применить» — +${days} дн. Premium добавятся сразу.`)}</p>
          </div>
        </li>
      </ol>}
    </div>}
  </section>
}
