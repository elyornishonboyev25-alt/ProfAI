import { Minus } from 'lucide-react'
import { useBillingText } from './copy'

type Row = { label: string; values: [string | null, string, string] }

export default function PlanComparison() {
  const text = useBillingText()
  const all = text('All tests', 'Barcha testlar', 'Все тесты')
  const rows: Row[] = [
    { label: text('IELTS skills', 'IELTS skilllari', 'Навыки IELTS'), values: [text('First 5 per skill', 'Har birida ilk 5 ta', 'Первые 5 каждого'), all, all] },
    { label: text('IELTS & SAT mocks', 'IELTS va SAT mocklar', 'Пробные IELTS и SAT'), values: [text('First 5 each', 'Har birida ilk 5 ta', 'Первые 5 каждого'), all, all] },
    { label: text('Test vocabulary', 'Test lug‘atlari', 'Словари тестов'), values: [text('Free tests', 'Bepul testlar', 'Бесплатные тесты'), all, all] },
    { label: text('AI chat capacity', 'AI suhbat imkoniyati', 'Объём AI-чата'), values: [text('Standard', 'Asosiy', 'Базовый'), text('6× more', '6× ko‘proq', 'В 6× больше'), text('30× more', '30× ko‘proq', 'В 30× больше')] },
    { label: text('Live AI tutor', 'Live AI ustoz', 'Голосовой AI'), values: [null, text('1 hour / day', '1 soat / kun', '1 час / день'), text('4 hours / day', '4 soat / kun', '4 часа / день')] },
  ]

  return <section className="billing-glass plans-compare" aria-labelledby="plans-compare-title">
    <h2 id="plans-compare-title">{text('Compare the essentials', 'Asosiy farqlar', 'Главные отличия')}</h2>
    <table className="plans-table">
      <caption className="sr-only">{text('Free, IvyGoo Pro and IvyGoo Elite features', 'Free, IvyGoo Pro va IvyGoo Elite imkoniyatlari', 'Возможности Free, IvyGoo Pro и IvyGoo Elite')}</caption>
      <colgroup><col className="plans-feature-column" /><col /><col /><col /></colgroup>
      <thead><tr>
        <th scope="col"><span className="sr-only">{text('Feature', 'Imkoniyat', 'Возможность')}</span></th>
        <th scope="col">Free</th>
        <th scope="col" className="is-featured"><span className="plans-brand">IvyGoo </span>Pro</th>
        <th scope="col"><span className="plans-brand">IvyGoo </span>Elite</th>
      </tr></thead>
      <tbody>{rows.map(row => <tr key={row.label}>
        <th scope="row">{row.label}</th>
        {row.values.map((value, index) => <td key={index} className={index === 1 ? 'is-featured' : undefined}>
          {value ?? <Minus size={16} aria-label={text('Not included', 'Kiritilmagan', 'Не входит')} />}
        </td>)}
      </tr>)}</tbody>
    </table>
  </section>
}
