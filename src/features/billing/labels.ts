import { BILLING_PRODUCTS } from './catalog'
type Text = (en: string, uz: string, ru: string) => string
const AUDIENCE_NAME: Record<string, string> = { PRO: 'Pro', MAX: 'Max', STUDENT: 'Student', TEACHER: 'Teacher' }
export function productLabel(code: string, text: Text) {
  const product = BILLING_PRODUCTS.find(p => p.code === code)
  const [audience, months] = product ? [product.audience, product.months] : [code.split('_')[0], Number(code.split('_')[1])]
  const name = AUDIENCE_NAME[audience]
  if (!name) return text('Premium plan', 'Premium tarifi', 'Тариф Premium')
  if (!Number.isFinite(months) || months <= 0) return name
  return `${name} · ${text(`${months} months`, `${months} oy`, `${months} мес.`)}`
}
export function orderStatusLabel(status: string, text: Text) {
  if (status === 'APPROVED') return text('Paid', 'To‘landi', 'Оплачено')
  if (status === 'CANCELED') return text('Canceled', 'Bekor qilindi', 'Отменено')
  if (status === 'REJECTED') return text('Declined', 'Rad etildi', 'Отклонено')
  if (status === 'PROCESSING') return text('Processing', 'Tasdiqlanmoqda', 'Обработка')
  if (status === 'SUBMITTED') return text('Under review', 'Tekshirilmoqda', 'На проверке')
  return text('Awaiting payment', 'To‘lov kutilmoqda', 'Ожидает оплаты')
}
