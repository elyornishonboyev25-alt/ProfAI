import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PricingCards from './PricingCards'
import PlanDuration from './PlanDuration'
import { useBillingText } from './copy'
import './billing.css'
export default function LandingPlans() {
  const text = useBillingText()
  const navigate = useNavigate()
  const [months, setMonths] = useState(1)
  return <div className="billing-landing-plans">
    <div className="billing-section-heading"><div><span className="billing-eyebrow">PROFAI PLANS</span>
      <h2>{text('Your ambition. Your first week. $0.', 'Sizning maqsadingiz. Birinchi hafta. $0.', 'Ваша цель. Первая неделя. $0.')}</h2>
      <p>{text('Start for free with 7 days of IELTS, SAT and AI. No card required. Continue from $3/month.', 'IELTS, SAT va AI bilan 7 kun bepul boshlang. Karta talab etilmaydi. Keyin oyiga $3 dan.', 'Начните бесплатно: 7 дней IELTS, SAT и AI. Без карты. Далее от $3/мес.')}</p>
    </div></div><PlanDuration months={months} onChange={setMonths} /><PricingCards months={months} onChoose={() => navigate('/premium')} />
  </div>
}
