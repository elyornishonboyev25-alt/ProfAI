import UiText from '@/components/common/UiText'
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
    <div className="billing-section-heading"><div><span className="billing-eyebrow"><UiText text={"IVYGOO PLANS"} /></span>
      <h2>{text('Start free. Upgrade when you are ready.', 'Bepul boshlang. Tayyor bo‘lganda o‘ting.', 'Начните бесплатно. Улучшите, когда будете готовы.')}</h2>
      <p>{text('The first five tests in each IELTS skill, five IELTS full mocks and five SAT mocks are free. AI balance renews monthly. IvyGoo Pro $5.99/month, IvyGoo Elite $11.99/month. No card required to start.', 'Har bir IELTS skillida dastlabki beshta test, beshta IELTS full mock va beshta SAT mock bepul. AI balansi har oy yangilanadi. IvyGoo Pro $5.99/oy, IvyGoo Elite $11.99/oy. Boshlash uchun karta kerak emas.', 'Первые пять тестов каждого навыка IELTS, пять полных IELTS и пять SAT бесплатны. Баланс AI обновляется ежемесячно. IvyGoo Pro $5.99/мес., IvyGoo Elite $11.99/мес. Без карты.')}</p>
    </div></div><PlanDuration months={months} onChange={setMonths} /><PricingCards months={months} onChoose={() => navigate('/premium')} />
  </div>
}
