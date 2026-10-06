import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins, Sparkles } from 'lucide-react'
import PricingCards from './PricingCards'
import { useBillingText } from './copy'
import './billing.css'
export default function LandingPlans() {
  const text = useBillingText()
  const navigate = useNavigate()
  const [months, setMonths] = useState(1)
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS')
  return <div className="billing-landing-plans"><div className="billing-section-heading"><div><span className="billing-eyebrow"><Sparkles size={15} />{text('YOUR NEXT CHAPTER', 'KEYINGI QADAMINGIZ', 'ВАШ СЛЕДУЮЩИЙ ШАГ')}</span><h2>{text('Start free. Grow your way.', 'Bepul boshlang. O‘z yo‘lingizda rivojlaning.', 'Начните бесплатно. Развивайтесь в своём ритме.')}</h2><p><Coins size={15} className="inline-block mr-1" />{text('150 welcome coins. No card required. Free vocabulary and saved results stay available.', '150 sovg‘a tanga. Karta talab etilmaydi. Bepul lug‘at va saqlangan natijalar doim ochiq.', '150 приветственных монет. Без карты. Бесплатный словарь и результаты всегда доступны.')}</p></div><div className="billing-segment" aria-label={text('Currency', 'Valyuta', 'Валюта')} role="group">{(['UZS', 'USD'] as const).map(value => <button key={value} aria-pressed={currency === value} onClick={() => setCurrency(value)}>{value}</button>)}</div></div><div className="billing-segment" aria-label={text('Duration', 'Muddat', 'Срок')} role="group">{[1, 3, 12].map(value => <button key={value} aria-pressed={months === value} onClick={() => setMonths(value)}>{value === 1 ? text('Monthly', 'Oylik', 'Месяц') : value === 3 ? text('Quarterly', 'Choraklik', 'Квартал') : text('Yearly', 'Yillik', 'Год')}{value > 1 && <span>−{value === 3 ? 10 : 20}%</span>}</button>)}</div><PricingCards months={months} currency={currency} onChoose={() => navigate('/premium')} /></div>
}
