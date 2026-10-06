import { BILLING_PRODUCTS } from './catalog'
type Text = (en: string, uz: string, ru: string) => string
export function productLabel(code: string, text: Text) {
  const product = BILLING_PRODUCTS.find(p => p.code === code)
  if (!product) return text('Previous Premium plan', 'Oldingi Premium tarifi', 'Прежний тариф Premium')
  if (product.audience === 'TOPUP') return text(`${product.coins} coins`, `${product.coins} tanga`, `${product.coins} монет`)
  const name = product.audience === 'TEACHER' ? text('Teacher Individual', 'O‘qituvchi Individual', 'Преподаватель Individual') : product.audience === 'CENTER_STUDENT' ? text('Center student', 'Markaz o‘quvchisi', 'Ученик центра') : text('Independent learner', 'Mustaqil o‘quvchi', 'Самостоятельный ученик')
  return `${name} · ${text(`${product.months} months`, `${product.months} oy`, `${product.months} мес.`)}`
}
export function activityLabel(reason: string, text: Text) {
  if (reason === 'WELCOME') return text('Welcome gift', 'Boshlang‘ich sovg‘a', 'Приветственный подарок')
  if (reason.startsWith('REFUND:')) return text('Coins returned', 'Tangalar qaytarildi', 'Возврат монет')
  if (reason.startsWith('OWNER:')) return text('Gift from the ProfAI team', 'ProfAI jamoasidan sovg‘a', 'Подарок от команды ProfAI')
  if (reason.startsWith('test:')) return text('Practice test access', 'Mashq testini ochish', 'Доступ к учебному тесту')
  if (reason.startsWith('mock:')) return text('Full mock access', 'To‘liq mockni ochish', 'Доступ к полному mock')
  if (reason.startsWith('shadowing:')) return text('Shadowing lesson', 'Shadowing darsi', 'Урок шэдоуинга')
  if (reason.startsWith('podcast:')) return text('Podcast episode', 'Podcast epizodi', 'Эпизод подкаста')
  if (reason === 'writing') return text('Writing AI assessment', 'Writing AI tekshiruvi', 'AI-проверка Writing')
  if (reason === 'speaking') return text('Speaking AI assessment', 'Speaking AI tekshiruvi', 'AI-проверка Speaking')
  if (reason === 'voice') return text('AI voice session', 'AI ovozli sessiyasi', 'Голосовая AI-сессия')
  if (reason === 'ai') return text('AI Coach request', 'AI Coach so‘rovi', 'Запрос AI Coach')
  return productLabel(reason, text)
}
export function orderStatusLabel(status: string, text: Text) {
  if (status === 'APPROVED') return text('Paid', 'To‘landi', 'Оплачено')
  if (status === 'CANCELED') return text('Canceled', 'Bekor qilindi', 'Отменено')
  if (status === 'REJECTED') return text('Declined', 'Rad etildi', 'Отклонено')
  if (status === 'PROCESSING') return text('Processing', 'Tasdiqlanmoqda', 'Обработка')
  if (status === 'SUBMITTED') return text('Under review', 'Tekshirilmoqda', 'На проверке')
  return text('Awaiting payment', 'To‘lov kutilmoqda', 'Ожидает оплаты')
}
