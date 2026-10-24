import { Fragment } from 'react'
import { Check, Minus } from 'lucide-react'
import { GROUP_MIN_SIZE, GROUP_MONTHLY_USD, PLAN_MONTHLY_USD, PLAN_QUOTAS, type AccessFeature, type PlanTier } from './catalog'
import { formatBillingMoney } from './PricingCards'
import { useBillingText } from './copy'

type Cell = string | boolean
type Row = { label: string; hint?: string; values: [Cell, Cell, Cell] }
const TIERS: PlanTier[] = ['FREE', 'PRO', 'MAX']

export default function PlanComparison({ currentTier }: { currentTier?: PlanTier }) {
  const text = useBillingText()
  const perMonth = text('/ month', '/ oy', '/ мес.')
  const unlimited = text('Unlimited', 'Cheksiz', 'Без лимита')
  const quota = (feature: AccessFeature) => TIERS.map(tier => {
    const value = PLAN_QUOTAS[tier][feature]
    return value === null ? unlimited : value === 0 ? false : `${value.toLocaleString('en-US')} ${perMonth}`
  }) as [Cell, Cell, Cell]

  const groups: Array<{ title: string; rows: Row[] }> = [
    { title: text('Practice', 'Mashq', 'Практика'), rows: [
      { label: text('IELTS & SAT practice tests', 'IELTS va SAT mashq testlari', 'Тесты IELTS и SAT'), hint: text('Reading, Listening, SAT sections', 'Reading, Listening, SAT bo‘limlari', 'Reading, Listening, разделы SAT'), values: quota('test') },
      { label: text('Full mock exams', 'To‘liq mock imtihonlar', 'Полные пробные экзамены'), hint: text('Timed, real exam format', 'Vaqtli, haqiqiy imtihon formati', 'С таймером, как на экзамене'), values: quota('mock') },
      { label: text('Podcasts & shadowing lessons', 'Podcast va shadowing darslari', 'Подкасты и шэдоуинг'), values: quota('podcast') },
      { label: text('Vocabulary, articles & progress', 'Lug‘at, maqolalar va natijalar', 'Словарь, статьи и прогресс'), values: [true, true, true] },
    ] },
    { title: text('AI feedback', 'AI tahlil', 'AI-анализ'), rows: [
      { label: text('Writing band score & feedback', 'Writing ball va tahlil', 'Оценка и разбор Writing'), values: quota('writing') },
      { label: text('Speaking band score & feedback', 'Speaking ball va tahlil', 'Оценка и разбор Speaking'), values: quota('speaking') },
      { label: text('AI tutor messages', 'AI ustoz xabarlari', 'Сообщения AI-наставнику'), values: quota('ai') },
      { label: text('Live AI voice tutor', 'Jonli AI ovozli ustoz', 'Живой голосовой AI-наставник'), hint: text('Sessions per month', 'Oyiga darslar soni', 'Занятий в месяц'), values: quota('voice') },
    ] },
    { title: text('Together', 'Birgalikda', 'Вместе'), rows: [
      { label: text('Join classes & assignments', 'Classga qo‘shilish va vazifalar', 'Классы и задания'), values: [false, true, true] },
      { label: text('Create classes & track students', 'Class yaratish va kuzatish', 'Создание классов'), values: [false, false, true] },
      { label: text(`Group price (${GROUP_MIN_SIZE}+ people, via Telegram)`, `Guruh narxi (${GROUP_MIN_SIZE}+ kishi, Telegram orqali)`, `Групповая цена (${GROUP_MIN_SIZE}+ чел., через Telegram)`),
        values: [false, `${formatBillingMoney(GROUP_MONTHLY_USD.PRO, 'USD')} ${perMonth}`, `${formatBillingMoney(GROUP_MONTHLY_USD.MAX, 'USD')} ${perMonth}`] },
    ] },
  ]

  const renderCell = (value: Cell) => value === true
    ? <Check size={18} className="plans-yes" aria-label={text('Included', 'Bor', 'Есть')} />
    : value === false ? <Minus size={18} className="plans-no" aria-label={text('Not included', 'Yo‘q', 'Нет')} /> : <span>{value}</span>

  return <section className="billing-glass plans-compare" aria-labelledby="plans-compare-title">
    <div className="plans-compare-head">
      <span className="billing-eyebrow">{text('COMPARE PLANS', 'TARIFLARNI SOLISHTIRING', 'СРАВНЕНИЕ ТАРИФОВ')}</span>
      <h2 id="plans-compare-title">{text('Everything in each plan, side by side', 'Har bir tarifda nimalar bor — yonma-yon', 'Что входит в каждый тариф')}</h2>
      <p>{text('Allowances renew on the 1st of every month. Unused ones do not carry over.', 'Imkoniyatlar har oyning 1-sanasida yangilanadi. Ishlatilmaganlari keyingi oyga o‘tmaydi.', 'Лимиты обновляются 1-го числа. Неиспользованные не переносятся.')}</p>
    </div>
    <div className="plans-compare-scroll">
      <table className="plans-table">
        <thead><tr>
          <th scope="col"><span className="sr-only">{text('Feature', 'Imkoniyat', 'Функция')}</span></th>
          {TIERS.map(tier => <th scope="col" key={tier} className={`${tier === 'PRO' ? 'is-featured' : ''} ${currentTier === tier ? 'is-current' : ''}`}>
            <strong>{tier === 'FREE' ? 'Free' : tier === 'PRO' ? 'Pro' : 'Max'}</strong>
            <small>{tier === 'FREE' ? '$0' : `${formatBillingMoney(PLAN_MONTHLY_USD[tier], 'USD')} ${perMonth}`}</small>
            {currentTier === tier && <em>{text('Current', 'Joriy', 'Текущий')}</em>}
          </th>)}
        </tr></thead>
        <tbody>{groups.map(group => <Fragment key={group.title}>
          <tr className="plans-group"><th scope="rowgroup" colSpan={4}>{group.title}</th></tr>
          {group.rows.map(row => <tr key={row.label}>
            <th scope="row">{row.label}{row.hint && <small>{row.hint}</small>}</th>
            {row.values.map((value, index) => <td key={index} className={index === 1 ? 'is-featured' : ''}>{renderCell(value)}</td>)}
          </tr>)}
        </Fragment>)}</tbody>
      </table>
    </div>
  </section>
}
