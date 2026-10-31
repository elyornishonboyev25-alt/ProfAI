import { Fragment } from 'react'
import { Check, Minus } from 'lucide-react'
import { GROUP_MONTHLY_USD, PLAN_MONTHLY_USD, PLAN_QUOTAS, type AccessFeature, type PlanTier } from './catalog'
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

  const firstFive = text('First 5 in each skill', 'Har bir skillda dastlabki 5 ta', 'Первые 5 каждого навыка')
  const firstMocks = text('First 5', 'Dastlabki 5 ta', 'Первые 5')
  const groups: Array<{ title: string; rows: Row[] }> = [
    { title: text('IELTS & SAT', 'IELTS va SAT', 'IELTS и SAT'), rows: [
      { label: text('IELTS skill tests', 'IELTS skill testlari', 'Тесты навыков IELTS'), hint: 'Reading / Listening / Writing / Speaking', values: [firstFive, unlimited, unlimited] },
      { label: text('IELTS full mocks', 'IELTS to‘liq mocklar', 'Полные экзамены IELTS'), values: [firstMocks, unlimited, unlimited] },
      { label: text('SAT full mocks & sections', 'SAT to‘liq mock va bo‘limlari', 'Полные экзамены и разделы SAT'), values: [firstMocks, unlimited, unlimited] },
      { label: text('Test vocabulary', 'Test lug‘atlari', 'Словари тестов'), hint: text('Follows access to its test', 'Tegishli test bilan birga ochiladi', 'Открывается вместе с тестом'), values: [text('Free tests only', 'Bepul testlar uchun', 'Для бесплатных тестов'), text('Every test', 'Barcha testlar', 'Для всех тестов'), text('Every test', 'Barcha testlar', 'Для всех тестов')] },
    ] },
    { title: text('Academic skills', 'Akademik ko‘nikmalar', 'Академические навыки'), rows: [
      { label: text('Articles, podcasts & shadowing', 'Maqola, podcast va shadowing', 'Статьи, подкасты и шэдоуинг'), values: [unlimited, unlimited, unlimited] },
      { label: text('Personal vocabulary & saved progress', 'Shaxsiy lug‘at va saqlangan natijalar', 'Личный словарь и сохранённый прогресс'), values: [true, true, true] },
    ] },
    { title: text('Your AI tutor', 'AI ustozingiz', 'Ваш AI-наставник'), rows: [
      { label: text('Monthly AI balance', 'Oylik AI balansi', 'Ежемесячный баланс AI'), hint: text('Your remaining balance is shown as a percentage', 'Qolgan balans foizda ko‘rsatiladi', 'Остаток баланса отображается в процентах'), values: [text('100% · Essential', '100% · Asosiy', '100% · Базовый'), text('100% · 6× capacity', '100% · 6× imkoniyat', '100% · В 6 раз больше'), text('100% · 30× capacity', '100% · 30× imkoniyat', '100% · В 30 раз больше')] },
      { label: text('Live AI · daily time', 'Live AI · kunlik vaqt', 'Live AI · время в день'), values: [false, text('1 hour', '1 soat', '1 час'), text('4 hours', '4 soat', '4 часа')] },
      { label: text('Live AI · monthly time', 'Live AI · oylik vaqt', 'Live AI · время в месяц'), hint: text('Separate from your text AI balance', 'Yozma AI balansidan alohida', 'Отдельно от текстового баланса AI'), values: [false, text('30 hours', '30 soat', '30 часов'), text('120 hours', '120 soat', '120 часов')] },
      { label: text('Writing band score & feedback', 'Writing ball va tahlil', 'Оценка и разбор Writing'), values: quota('writing') },
      { label: text('Speaking band score & feedback', 'Speaking ball va tahlil', 'Оценка и разбор Speaking'), values: quota('speaking') },
    ] },
    { title: text('Learn together', 'Birga o‘rganing', 'Учитесь вместе'), rows: [
      { label: text('Join classes & assignments', 'Classga qo‘shilish va vazifalar', 'Классы и задания'), values: [false, true, true] },
      { label: text('Create classes & track students', 'Class yaratish va kuzatish', 'Создание классов'), values: [false, false, true] },
      { label: text('Group price (5+ people, via Telegram)', 'Guruh narxi (5+ kishi, Telegram orqali)', 'Групповая цена (от 5 человек, через Telegram)'), values: [false, formatBillingMoney(GROUP_MONTHLY_USD.PRO, 'USD') + ' ' + perMonth, formatBillingMoney(GROUP_MONTHLY_USD.MAX, 'USD') + ' ' + perMonth] },
    ] },
  ]

  const renderCell = (value: Cell) => value === true
    ? <Check size={18} className="plans-yes" aria-label={text('Included', 'Bor', 'Есть')} />
    : value === false ? <Minus size={18} className="plans-no" aria-label={text('Not included', 'Yo‘q', 'Нет')} /> : <span>{value}</span>

  return <section className="billing-glass plans-compare" aria-labelledby="plans-compare-title">
    <div className="plans-compare-head">
      <span className="billing-eyebrow">{text('COMPARE PLANS', 'TARIFLARNI SOLISHTIRING', 'СРАВНЕНИЕ ТАРИФОВ')}</span>
      <h2 id="plans-compare-title">{text('Everything in each plan, side by side', 'Har bir tarifda nimalar bor — yonma-yon', 'Что входит в каждый тариф')}</h2>
      <p>{text('Your first five tests stay free. AI balance renews on the 1st; daily Live AI time renews at 00:00 UTC. Unused allowances do not carry over.', 'Dastlabki beshta test bepul qoladi. AI balansi har oyning 1-sanasida, kunlik Live AI vaqti 00:00 UTC da yangilanadi. Ishlatilmagan limitlar keyingi davrga o‘tmaydi.', 'Первые пять тестов остаются бесплатными. Баланс AI обновляется 1-го числа, ежедневное время Live AI — в 00:00 UTC. Неиспользованные лимиты не переносятся.')}</p>
    </div>
    <p className="plans-mobile-hint">{text('Swipe to compare plans', 'Tariflarni solishtirish uchun suring', 'Смахните, чтобы сравнить тарифы')}</p>
    <div className="plans-compare-scroll">
      <table className="plans-table">
        <thead><tr>
          <th scope="col"><span className="sr-only">{text('Feature', 'Imkoniyat', 'Функция')}</span></th>
          {TIERS.map(tier => <th scope="col" key={tier} className={`${tier === 'PRO' ? 'is-featured' : ''} ${currentTier === tier ? 'is-current' : ''}`}>
            <strong>{tier === 'FREE' ? 'Free' : tier === 'PRO' ? 'IvyGoo Pro' : 'IvyGoo Elite'}</strong>
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
