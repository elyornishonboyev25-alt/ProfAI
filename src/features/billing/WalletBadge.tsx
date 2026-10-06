import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import './billing.css'
export default function WalletBadge() {
  const user = useAuthStore(s => s.user)
  const { wallet, userId, refresh, error } = useBillingStore()
  const text = useBillingText()
  useEffect(() => {
    void refresh()
    const update = () => void refresh()
    window.addEventListener('profai:billing-updated', update)
    window.addEventListener('focus', update)
    return () => { window.removeEventListener('profai:billing-updated', update); window.removeEventListener('focus', update) }
  }, [user?.id, refresh])
  if (!user) return <Link to="/premium" className="billing-wallet-badge"><Coins size={17} />{text('Plans', 'Tariflar', 'Тарифы')}</Link>
  return <Link to="/premium" className="billing-wallet-badge" title={text('Your coin balance and plans', 'Tanga balansingiz va tariflar', 'Ваш баланс и тарифы')}><Coins size={17} /><strong>{userId === user.id && wallet ? wallet.balance.toLocaleString() : error ? '—' : '…'}</strong><span>{text('coins', 'tanga', 'монет')}</span></Link>
}
