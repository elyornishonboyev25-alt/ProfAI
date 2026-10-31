import { ownerText, type OwnerLanguage } from '@/i18n/owner'

export type OwnerPayment = { id: string; plan: string; status: string; currency?: string; amountMinor?: number; amountUzs: number; discountPercent?: number; wheelSpinId?: string | null; createdAt: string }

export function paymentAmount(payment: Pick<OwnerPayment, 'currency' | 'amountMinor' | 'amountUzs'>, language: OwnerLanguage) {
  const locale = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US'
  return payment.currency === 'USD' ? `USD ${((payment.amountMinor ?? 0) / 100).toFixed(2)}` : `${new Intl.NumberFormat(locale).format(payment.amountUzs)} ${ownerText('UZS', language)}`
}

export default function OwnerPaymentDetails({ payment, language }: { payment: OwnerPayment; language: OwnerLanguage }) {
  const t = (text: string, params?: Record<string, string | number>) => ownerText(text, language, params)
  const amountLabel = payment.status === 'APPROVED' ? 'Paid amount' : ['CANCELED', 'REJECTED'].includes(payment.status) ? 'Order amount' : 'Amount to pay'
  return <div className="owner-payment-details">
    <p><span>{t(amountLabel)}</span><strong>{paymentAmount(payment, language)}</strong></p>
    {Boolean(payment.discountPercent) && <p><span>{t('Discount')}</span><strong>{payment.discountPercent}%</strong></p>}
    {payment.wheelSpinId && <p><span>{t('Wheel discount reference')}</span><code>{payment.wheelSpinId}</code></p>}
  </div>
}
