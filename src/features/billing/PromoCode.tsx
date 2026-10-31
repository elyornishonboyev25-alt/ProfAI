import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Gift, Loader2, Send, TimerReset, Users } from 'lucide-react'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { GROUP_MIN_SIZE, GROUP_MONTHLY_USD } from './catalog'
import { formatBillingMoney } from './PricingCards'
import { useBillingText } from './copy'
import { useCountdown, type WheelDiscountState } from './useWheelDiscount'
import './promo.css'

type PromoStatus = { telegramEnabled: boolean; botUsername: string; channelUrl: string }
type Outcome = { tone: 'success' | 'error'; message: string }
type RedeemResponse =
  | { kind: 'PROMO' | 'REFERRAL'; days: number }
  | { kind: 'CAMPAIGN'; months: number; startsAt: string; expiresAt: string; deferred: boolean; afterLaunchGift: boolean }

/** Ways to pay less: the Telegram wheel, group buying and a friend's invitation code. */
export default function PromoCode({ wheel, onRedeemed }: { wheel: WheelDiscountState & { refresh: () => Promise<void> }; onRedeemed: () => void }) {
  const text = useBillingText()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore(state => state.user)
  const [code, setCode] = useState((params.get('promo') ?? params.get('ref') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24))
  const [status, setStatus] = useState<PromoStatus | null>(null)
  const [busy, setBusy] = useState<'apply' | 'bot' | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const countdown = useCountdown(wheel.discount?.expiresAt)

  useEffect(() => {
    if (!user) return
    let alive = true
    void apiClient.get<PromoStatus>('/promo/status').then(value => { if (alive) setStatus(value) }).catch(() => undefined)
    return () => { alive = false }
  }, [user?.id])

  const needAccount = () => navigate('/register', { state: { from: { pathname: '/premium' } } })
  const botUrl = `https://t.me/${status?.botUsername ?? 'IvyGoo_bot'}`

  const errorMessage = (error: unknown) => {
    switch (error instanceof ApiError ? error.code : undefined) {
      case 'ALREADY_USED': return text('This code has already been used.', 'Bu kod avval ishlatilgan.', 'Этот код уже использован.')
      case 'SELF_REFERRAL': return text('You cannot use your own invitation code.', 'O‘zingizning taklif kodingizdan foydalana olmaysiz.', 'Нельзя использовать собственный код приглашения.')
      case 'ALREADY_CLAIMED': return text('An invitation code was already applied to your account.', 'Hisobingizga taklif kodi allaqachon qo‘llangan.', 'Код приглашения уже применён к вашему аккаунту.')
      case 'TOO_LATE': return text('Invitation codes work during the first 7 days after sign-up.', 'Taklif kodi ro‘yxatdan o‘tgandan keyingi 7 kun ichida ishlaydi.', 'Коды приглашения работают 7 дней после регистрации.')
      default: return text('We could not find this code. Check it and try again.', 'Bu kod topilmadi. Tekshirib, qayta urinib ko‘ring.', 'Код не найден. Проверьте и попробуйте снова.')
    }
  }

  async function apply(event: FormEvent) {
    event.preventDefault()
    if (!user) { needAccount(); return }
    if (code.length < 3 || busy) return
    setBusy('apply'); setOutcome(null)
    try {
      const result = await apiClient.post<RedeemResponse>('/promo/redeem', { code })
      const message = result.kind === 'CAMPAIGN'
        ? result.afterLaunchGift
          ? text(`You are currently using PRO. This code will activate ${result.months} additional months of PRO after your free 1-month PRO ends. Your code is saved; you do not need to enter it again.`,
            `Hozir PRO’dan foydalanyapsiz. Bu promokod bepul 1 oylik PRO tugagandan keyin amal qiladi va yana ${result.months} oylik PRO beradi. Promokod saqlandi, qayta kiritish shart emas.`,
            `Вы уже пользуетесь PRO. Промокод добавит ещё ${result.months} месяца PRO после окончания бесплатного месяца. Код сохранён, вводить его повторно не нужно.`)
          : result.deferred
            ? text(`Code saved — ${result.months} additional months of PRO will begin after your current access ends. You do not need to enter it again.`,
              `Promokod saqlandi — joriy obunangiz tugagach, yana ${result.months} oylik PRO boshlanadi. Qayta kiritish shart emas.`,
              `Код сохранён — ещё ${result.months} месяца PRO начнутся после окончания текущего доступа. Повторный ввод не нужен.`)
            : text(`Code applied — ${result.months} months of PRO activated.`, `Promokod qo‘llandi — ${result.months} oylik PRO faollashtirildi.`, `Код применён — активировано ${result.months} месяца PRO.`)
        : result.kind === 'REFERRAL'
        ? text(`Invitation accepted — +${result.days} Premium days. Start our Telegram bot and join the channel so your friend gets their reward too.`, `Taklif qabul qilindi — +${result.days} kun Premium. Do‘stingiz ham mukofot olishi uchun Telegram botga start bering va kanalga obuna bo‘ling.`, `Приглашение принято — +${result.days} дн. Premium. Запустите бота и подпишитесь на канал, чтобы друг тоже получил награду.`)
        : text(`Code applied — +${result.days} Premium days.`, `Kod qo‘llandi — +${result.days} kun Premium.`, `Код применён — +${result.days} дн. Premium.`)
      setOutcome({ tone: 'success', message })
      setCode('')
      onRedeemed()
    } catch (error) {
      setOutcome({ tone: 'error', message: errorMessage(error) })
    } finally { setBusy(null) }
  }

  async function openWheel() {
    if (!user) { needAccount(); return }
    setBusy('bot'); setOutcome(null)
    try {
      const result = await apiClient.post<{ url: string }>('/promo/telegram')
      window.open(result.url, '_blank', 'noopener')
    } catch {
      setOutcome({ tone: 'error', message: text('The Telegram bot is not available right now. Please try again soon.', 'Telegram bot hozircha mavjud emas. Birozdan keyin urinib ko‘ring.', 'Telegram-бот сейчас недоступен. Попробуйте позже.') })
    } finally { setBusy(null) }
  }

  const discount = wheel.discount
  return <section className="promo-center" aria-labelledby="promo-center-title">
    <div className="promo-center-head">
      <span className="billing-eyebrow"><Gift size={15} />{text('PAY LESS', 'ARZONROQ OLING', 'ПЛАТИТЕ МЕНЬШЕ')}</span>
      <h2 id="promo-center-title">{text('Discounts and promo codes', 'Chegirmalar va promokodlar', 'Скидки и промокоды')}</h2>
    </div>

    {discount && countdown && countdown.left > 0 && <div className={`promo-live ${discount.percent === 50 ? 'is-jackpot' : ''}`} role="status">
      <span className="promo-live-badge">−{discount.percent}%</span>
      <div><strong>{text('Your wheel discount is applied to every plan', 'Baraban chegirmangiz barcha tariflarga qo‘llandi', 'Скидка с колеса применена ко всем тарифам')}</strong>
        <small>{text('Pay before the timer ends — after that the discount is gone.', 'Taymer tugashidan oldin to‘lang — keyin chegirma yo‘qoladi.', 'Оплатите до конца таймера — потом скидка сгорит.')}</small></div>
      <span className="promo-live-timer"><TimerReset size={16} />{countdown.label}</span>
    </div>}

    <div className="promo-grid">
      <article className="billing-glass promo-tile promo-tile-wheel">
        <span className="promo-tile-icon">🎡</span>
        <h3>{text('Spin for up to 50% off', '50% gacha chegirma yuting', 'Выиграйте скидку до 50%')}</h3>
        <p>{wheel.spun && !discount
          ? wheel.used ? text('You have already used your wheel discount.', 'Baraban chegirmangizdan foydalangansiz.', 'Вы уже использовали скидку с колеса.') : text(`Your ${wheel.lastPercent ?? ''}% discount has expired. Everyone can spin once.`, `${wheel.lastPercent ?? ''}% chegirmangiz muddati tugagan. Har kim bir marta aylantiradi.`, `Ваша скидка ${wheel.lastPercent ?? ''}% истекла. Крутить можно один раз.`)
          : text('Join our Telegram channel and spin the wheel once. 5% to 50% off any plan.', 'Telegram kanalimizga obuna bo‘ling va barabanni bir marta aylantiring. Har qanday tarifga 5% dan 50% gacha.', 'Подпишитесь на наш Telegram-канал и крутите колесо один раз. От 5% до 50% на любой тариф.')}</p>
        <ol className="promo-mini-steps">
          <li>{text('Open the bot', 'Botni oching', 'Откройте бота')}</li>
          <li>{text('Join @IvyGoo', '@IvyGoo’ga obuna bo‘ling', 'Подпишитесь на @IvyGoo')}</li>
          <li>{text('Spin & pay', 'Aylantiring va to‘lang', 'Крутите и платите')}</li>
        </ol>
        {!wheel.spun && <button type="button" className="billing-primary" disabled={busy !== null || status?.telegramEnabled === false} onClick={() => void openWheel()}>
          {busy === 'bot' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{text('Spin in Telegram', 'Telegramda aylantirish', 'Крутить в Telegram')}
        </button>}
        {status?.telegramEnabled === false && <p className="promo-soon">{text('The bot is coming soon.', 'Bot tez orada ishga tushadi.', 'Бот скоро заработает.')}</p>}
      </article>

      <article className="billing-glass promo-tile">
        <span className="promo-tile-icon"><Users size={22} /></span>
        <h3>{text(`${GROUP_MIN_SIZE}+ friends? Pay less each`, `${GROUP_MIN_SIZE}+ do‘st? Har biringizga arzon`, `${GROUP_MIN_SIZE}+ друзей? Дешевле каждому`)}</h3>
        <p>{text(`Pro ${formatBillingMoney(GROUP_MONTHLY_USD.PRO, 'USD')} and Max ${formatBillingMoney(GROUP_MONTHLY_USD.MAX, 'USD')} per person. One person pays; everyone gets Premium. Each friend can add their own wheel discount.`,
          `Pro ${formatBillingMoney(GROUP_MONTHLY_USD.PRO, 'USD')}, Max ${formatBillingMoney(GROUP_MONTHLY_USD.MAX, 'USD')} — kishi boshiga. Bir kishi to‘laydi, hammaga Premium. Har bir do‘st barabandan qo‘shimcha chegirma qo‘sha oladi.`,
          `Pro ${formatBillingMoney(GROUP_MONTHLY_USD.PRO, 'USD')}, Max ${formatBillingMoney(GROUP_MONTHLY_USD.MAX, 'USD')} с человека. Платит один — Premium у всех. Каждый может добавить свою скидку с колеса.`)}</p>
        <p className="promo-note">{text(`Fewer than ${GROUP_MIN_SIZE} people: only the wheel discount applies.`, `${GROUP_MIN_SIZE} kishidan kam bo‘lsa — faqat baraban chegirmasi.`, `Меньше ${GROUP_MIN_SIZE} человек — только скидка с колеса.`)}</p>
        <a className="billing-secondary" href={`${botUrl}?start=spin`} target="_blank" rel="noopener noreferrer">{text('Build a group in the bot', 'Botda guruh tuzish', 'Собрать группу в боте')}<ArrowRight size={16} /></a>
      </article>

      <article className="billing-glass promo-tile">
        <span className="promo-tile-icon"><BadgeCheck size={22} /></span>
        <h3>{text('Invitation or promo code', 'Taklif yoki promokod', 'Код приглашения или промокод')}</h3>
        <p>{text('A friend invited you? Enter their code — you both get Premium days.', 'Do‘stingiz taklif qildimi? Kodini kiriting — ikkalangiz Premium kun olasiz.', 'Вас пригласил друг? Введите код — оба получите дни Premium.')}</p>
        <form className="promo-form" onSubmit={event => void apply(event)}>
          <label htmlFor="promo-code-input" className="sr-only">{text('Code', 'Kod', 'Код')}</label>
          <div className="promo-input-row">
            <input id="promo-code-input" value={code} onChange={event => { setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24)); setOutcome(null) }}
              placeholder="ABCD2345" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={24} />
            <button type="submit" className="billing-primary" disabled={busy !== null || code.length < 3}>
              {busy === 'apply' ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}{text('Apply', 'Qo‘llash', 'Применить')}
            </button>
          </div>
        </form>
      </article>
    </div>
    {outcome && <div role={outcome.tone === 'error' ? 'alert' : 'status'} className={outcome.tone === 'success' ? 'billing-status is-success' : 'billing-error'}>{outcome.message}</div>}
  </section>
}
