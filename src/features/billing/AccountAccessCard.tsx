import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Check, Clock3, Infinity as InfinityIcon, ShieldCheck, Sparkles } from 'lucide-react'
import type { AccessEntitlement } from '../../../backend/src/utils/accessEntitlement'
import { useAccountAccess } from './useAccountAccess'
import { useBillingText } from './copy'
import './billing.css'

export function AccessStatusCard({ access }: { access: AccessEntitlement | null }) {
  const text = useBillingText()
  if (!access || access.kind === 'COINS') return null
  const trial = access.kind === 'TRIAL'
  const unlimited = access.kind === 'UNLIMITED'
  const date = (value: string) => {
    const fields = new Map(new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tashkent',
    }).formatToParts(new Date(value)).map(part => [part.type, part.value]))
    const months = text('January|February|March|April|May|June|July|August|September|October|November|December', 'yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr', 'января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря').split('|')
    return `${fields.get('day')} ${months[Number(fields.get('month')) - 1]} ${fields.get('year')}, ${fields.get('hour')}:${fields.get('minute')}`
  }
  const days = access.daysRemaining ?? 0
  return <section className={`billing-glass billing-entitlement ${trial ? 'is-trial' : 'is-unlimited'} ${access.active ? '' : 'is-expired'}`} aria-label={text('Account access', 'Akkaunt imkoniyatlari', 'Доступ аккаунта')}>
    <div className="billing-entitlement-top"><span className="billing-eyebrow"><ShieldCheck size={14} />{trial ? access.active ? text('14 DAYS FREE', '14 KUN BEPUL', '14 ДНЕЙ БЕСПЛАТНО') : text('FREE TRIAL ENDED', 'SINOV MUDDATI TUGADI', 'ПРОБНЫЙ ПЕРИОД ЗАВЕРШЁН') : unlimited ? text('UNLIMITED ACCESS', 'MUDDATSIZ KIRISH', 'БЕЗЛИМИТНЫЙ ДОСТУП') : text('PREMIUM ACCESS', 'PREMIUM IMKONIYATLAR', 'PREMIUM-ДОСТУП')}</span><span className="billing-entitlement-state"><span />{access.active ? text('Active', 'Faol', 'Активен') : text('Ended', 'Tugagan', 'Завершён')}</span></div>
    <div className="billing-entitlement-main"><div className="billing-entitlement-icon">{unlimited ? <InfinityIcon size={34} /> : <Sparkles size={30} />}</div><div><h2>{trial ? access.active ? text('Your free trial is active.', 'Siz hozir sinov muddatidasiz.', 'Ваш бесплатный пробный период активен.') : text('Your free trial has ended.', 'Bepul sinov muddati tugadi.', 'Бесплатный пробный период завершён.') : unlimited ? text('Learn without limits.', 'Cheklovlarsiz rivojlaning.', 'Учитесь без ограничений.') : text('Your Premium access.', 'Premium imkoniyatlaringiz.', 'Ваш Premium-доступ.')}</h2><p>{access.active ? trial ? text('Explore IELTS, SAT, shadowing, podcasts and AI with 14 days of free access. Your coins stay untouched.', 'IELTS, SAT, shadowing, podcast va AI imkoniyatlarini 14 kun bepul sinab ko‘ring. Tangalar sarflanmaydi.', 'Пробуйте IELTS, SAT, шэдоуинг, подкасты и AI бесплатно 14 дней. Монеты не расходуются.') : text('IELTS, SAT, lessons and AI are included. Practice freely without spending coins.', 'IELTS, SAT, darslar va AI xizmatlari ochiq. Tangalarni sarflamasdan mashq qiling.', 'IELTS, SAT, уроки и AI включены. Практикуйтесь без расхода монет.') : text('Your saved results and free activities remain available. Choose a plan or use your coins to continue paid practice.', 'Saqlangan natijalar va bepul mashqlar ochiq qoladi. Pullik mashqlar uchun tarif tanlang yoki tangalardan foydalaning.', 'Результаты и бесплатные занятия остаются доступны. Для платной практики выберите тариф или используйте монеты.')}</p></div></div>
    <div className="billing-entitlement-details">{trial && <div><Clock3 size={17} /><span>{text('Time remaining', 'Qolgan vaqt', 'Осталось времени')}</span><strong>{text(`${days} ${days === 1 ? 'day' : 'days'}`, `${days} kun`, `${days} дн.`)}</strong></div>}{access.expiresAt ? <div><CalendarDays size={17} /><span>{text('Access ends', 'Muddat tugashi', 'Доступ до')}</span><strong><time dateTime={access.expiresAt}>{date(access.expiresAt)}</time><small>UZT · UTC+5</small></strong></div> : <div><InfinityIcon size={18} /><span>{text('Access period', 'Foydalanish muddati', 'Срок доступа')}</span><strong>{text('No expiration', 'Muddatsiz', 'Бессрочно')}</strong></div>}<div><Check size={17} /><span>{text('Automatic charges', 'Avtomatik to‘lov', 'Автосписание')}</span><strong>{text('None', 'Yo‘q', 'Нет')}</strong></div></div>
    {trial && <div className="billing-trial-progress" role="progressbar" aria-label={text('Free trial days remaining', 'Bepul sinovning qolgan kunlari', 'Оставшиеся дни пробного периода')} aria-valuemin={0} aria-valuemax={14} aria-valuenow={Math.min(14, days)}><span style={{ width: `${Math.min(100, Math.max(0, days / 14 * 100))}%` }} /></div>}
    {trial && <div className="billing-entitlement-footer"><span>{access.startsAt && <>{text('Started', 'Boshlangan', 'Начало')}: <time dateTime={access.startsAt}>{date(access.startsAt)}</time></>}</span><Link to="/premium">{text('Explore plans', 'Tariflarni ko‘rish', 'Посмотреть тарифы')}<ArrowUpRight size={15} /></Link></div>}
  </section>
}
export default function AccountAccessCard() {
  return <AccessStatusCard access={useAccountAccess()} />
}
