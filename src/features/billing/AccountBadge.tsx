import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Clock3 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import { useAccountAccess } from './useAccountAccess'
import './billing.css'
export default function AccountBadge() {
  const user = useAuthStore(s => s.user)
  const { refresh } = useBillingStore()
  const text = useBillingText()
  const access = useAccountAccess()
  useEffect(() => {
    const update = () => void refresh()
    window.addEventListener('profai:billing-updated', update); window.addEventListener('focus', update)
    return () => { window.removeEventListener('profai:billing-updated', update); window.removeEventListener('focus', update) }
  }, [user?.id, refresh])
  if (access?.active && access.kind !== 'TRIAL') return null
  if (access?.active && access.kind === 'TRIAL') return <Link to="/premium" className="billing-account-badge billing-access-badge is-trial" title={text('7-day free trial', '7 kunlik bepul sinov', '7-дневный пробный период')}><Clock3 size={17} /><strong>{text(`${access.daysRemaining}d free`, `${access.daysRemaining} kun bepul`, `${access.daysRemaining} дн. бесплатно`)}</strong></Link>
  return <Link to="/premium" className="billing-account-badge"><Sparkles size={17} />{text('View plans', 'Tariflarni ko‘rish', 'Посмотреть тарифы')}</Link>
}
