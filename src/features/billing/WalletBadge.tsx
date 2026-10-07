import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Clock3 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import './billing.css'
import { useAccountAccess } from './useAccountAccess'
export default function WalletBadge() {
  const user = useAuthStore(s => s.user)
  const { wallet, userId, refresh, error } = useBillingStore()
  const text = useBillingText()
  const access = useAccountAccess()
  useEffect(() => {
    void refresh()
    const update = () => void refresh()
    window.addEventListener('profai:billing-updated', update)
    window.addEventListener('focus', update)
    return () => { window.removeEventListener('profai:billing-updated', update); window.removeEventListener('focus', update) }
  }, [user?.id, refresh])
  if (!user) return <Link to="/premium" className="billing-wallet-badge"><Coins size={17} />{text('Plans', 'Tariflar', 'Тарифы')}</Link>
  if (access?.active && (access.kind === 'UNLIMITED' || access.kind === 'PREMIUM')) return null
  if (access?.active && access.kind === 'TRIAL') return <Link to="/premium" className="billing-wallet-badge billing-access-badge is-trial" title={text('14-day free trial', '14 kunlik bepul sinov muddati', '14-дневный бесплатный пробный период')}><Clock3 size={17} /><strong>{text(`${access.daysRemaining}d free`, `${access.daysRemaining} kun bepul`, `${access.daysRemaining} дн. бесплатно`)}</strong></Link>
  return <Link to="/premium" className="billing-wallet-badge" title={text('Your coin balance and plans', 'Tanga balansingiz va tariflar', 'Ваш баланс и тарифы')}><Coins size={17} /><strong>{userId === user.id && wallet ? wallet.balance.toLocaleString() : error ? '—' : '…'}</strong><span>{text('coins', 'tanga', 'монет')}</span></Link>
}
