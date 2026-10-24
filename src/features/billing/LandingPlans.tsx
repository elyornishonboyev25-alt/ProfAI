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
    <div className="billing-section-heading"><div><span className="billing-eyebrow">IVYGOO PLANS</span>
      <h2>{text('Start free. Upgrade when you are ready.', 'Bepul boshlang. Tayyor bo‘lganda o‘ting.', 'Начните бесплатно. Улучшите, когда будете готовы.')}</h2>
      <p>{text('Free forever with monthly IELTS, SAT and AI allowances. Pro $6/month, Max $12/month. No card required to start.', 'Har oy IELTS, SAT va AI imkoniyatlari bilan doimiy bepul. Pro $6/oy, Max $12/oy. Boshlash uchun karta kerak emas.', 'Бесплатно навсегда с ежемесячными лимитами IELTS, SAT и AI. Pro $6/мес., Max $12/мес. Без карты.')}</p>
    </div></div><PlanDuration months={months} onChange={setMonths} /><PricingCards months={months} onChoose={() => navigate('/premium')} />
  </div>
}
