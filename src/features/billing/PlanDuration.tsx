import { BILLING_PERIODS } from './catalog'
import { useBillingText } from './copy'

export default function PlanDuration({ months, onChange }: { months: number; onChange: (months: number) => void }) {
  const text = useBillingText()
  return <div className="billing-segment" role="group" aria-label={text('Plan duration', 'Tarif muddati', 'Срок тарифа')}>
    {BILLING_PERIODS.map(value => <button type="button" key={value} aria-pressed={months === value} onClick={() => onChange(value)}>
      {value === 1 ? text('Monthly', 'Oylik', 'Месяц') : value === 3 ? text('3 months', '3 oylik', '3 месяца') : text('Yearly', 'Yillik', 'Год')}
      {value > 1 && <span>−{value === 3 ? 10 : 20}%</span>}
    </button>)}
  </div>
}
