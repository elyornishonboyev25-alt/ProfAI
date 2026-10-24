import { BILLING_PERIODS, BILLING_PRODUCTS, type BillingProduct } from './catalog'
import { useBillingText } from './copy'

export default function PlanDuration({ months, onChange, products = BILLING_PRODUCTS }: {
  months: number; onChange: (months: number) => void; products?: BillingProduct[]
}) {
  const text = useBillingText()
  return <div className="billing-segment" role="group" aria-label={text('Plan duration', 'Tarif muddati', 'Срок тарифа')}>
    {BILLING_PERIODS.map(value => {
      const saving = Math.round(Math.max(0, ...products.filter(product => product.months === value).map(product => product.discount)))
      return <button type="button" key={value} aria-pressed={months === value} onClick={() => onChange(value)}>
      {value === 1 ? text('Monthly', 'Oylik', 'Месяц') : value === 3 ? text('3 months', '3 oylik', '3 месяца') : text('Yearly', 'Yillik', 'Год')}
      {saving > 0 && <span>{text(`Up to ${saving}%`, `${saving}% gacha`, `До ${saving}%`)}</span>}
    </button>})}
  </div>
}
