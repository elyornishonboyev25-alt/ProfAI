import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PricingCards from './PricingCards'
import PlanDuration from './PlanDuration'
import { COIN_COSTS, WELCOME_COINS } from './catalog'
import { useBillingText } from './copy'
import './billing.css'

export default function LandingPlans() {
  const text = useBillingText()
  const navigate = useNavigate()
  const [months, setMonths] = useState(1)
  return <div className="billing-landing-plans">
    <div className="billing-section-heading"><div><span className="billing-eyebrow">PROFAI PLANS</span>
      <h2>{text('Start free. Choose when you’re ready.', 'Bepul boshlang. Tayyor bo‘lganda tarif tanlang.', 'Начните бесплатно. Выберите тариф, когда будете готовы.')}</h2>
      <p>{text(`${WELCOME_COINS} welcome coins — enough for ${WELCOME_COINS / COIN_COSTS.test} practice tests. No card required.`, `${WELCOME_COINS} sovg‘a tanga — ${WELCOME_COINS / COIN_COSTS.test} ta mashq testiga yetadi. Karta talab etilmaydi.`, `${WELCOME_COINS} приветственных монет — хватит на ${WELCOME_COINS / COIN_COSTS.test} учебных тестов. Карта не нужна.`)}</p>
    </div></div>
    <PlanDuration months={months} onChange={setMonths} />
    <PricingCards months={months} onChoose={() => navigate('/premium')} />
  </div>
}
