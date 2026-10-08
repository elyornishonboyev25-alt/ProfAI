import { BILLING_PRODUCTS } from './catalog'
type Text = (en: string, uz: string, ru: string) => string
export function productLabel(code: string, text: Text) {
  const product = BILLING_PRODUCTS.find(p => p.code === code)
  if (!product) return text('Previous Premium plan', 'Oldingi Premium tarifi', 'Прежний тариф Premium')
  return `${product.audience === 'TEACHER' ? 'Teacher' : 'Student'} · ${text(`${product.months} months`, `${product.months} oy`, `${product.months} мес.`)}`
}
export function orderStatusLabel(status: string, text: Text) {
  if (status === 'APPROVED') return text('Paid', 'To‘landi', 'Оплачено')
  if (status === 'CANCELED') return text('Canceled', 'Bekor qilindi', 'Отменено')
  if (status === 'REJECTED') return text('Declined', 'Rad etildi', 'Отклонено')
  if (status === 'PROCESSING') return text('Processing', 'Tasdiqlanmoqda', 'Обработка')
  if (status === 'SUBMITTED') return text('Under review', 'Tekshirilmoqda', 'На проверке')
  return text('Awaiting payment', 'To‘lov kutilmoqda', 'Ожидает оплаты')
}
