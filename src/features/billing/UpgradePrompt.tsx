import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Check, Crown, Headphones, LockKeyhole, Sparkles, X } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useBillingText } from './copy'
import './premium-experience.css'

export default function UpgradePrompt({ tier = 'PRO', reason = 'content', modal = false, onClose }: {
  tier?: 'PRO' | 'MAX' | 'RESET'; reason?: 'content' | 'ai' | 'voice'; modal?: boolean; onClose: () => void
}) {
  const text = useBillingText()
  const reduced = useReducedMotion()
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const reset = tier === 'RESET'
  const name = tier === 'MAX' ? 'IvyGoo Elite' : 'IvyGoo Pro'
  useEffect(() => {
    if (!modal) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key !== 'Tab') return
      const nodes = panel.current?.querySelectorAll<HTMLElement>('button, a[href]')
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus() }
  }, [modal, onClose])
  const content = <motion.div ref={panel} role={modal ? 'dialog' : undefined} aria-modal={modal || undefined} aria-labelledby={titleId}
    className="upgrade-prompt" initial={reduced ? false : { opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .28, ease: [.22, 1, .36, 1] }}>
    <button type="button" className="upgrade-close" onClick={onClose} aria-label={text('Close', 'Yopish', 'Закрыть')}><X size={18} /></button>
    <div className="upgrade-emblem" aria-hidden="true"><Crown size={30} /><span><Sparkles size={13} /></span></div>
    <p className="upgrade-plan-name">{reset ? 'IvyGoo Elite' : name}</p>
    <h2 id={titleId}>{reset ? text('Your next session is on its way.', 'Keyingi suhbat uchun vaqt yangilanadi.', 'Время для следующего занятия скоро обновится.') : reason === 'content' ? text('Open your next chapter.', 'Tayyorgarlikni yangi bosqichga olib chiqing.', 'Откройте следующий этап.') : reason === 'voice' ? text('Make time for a real conversation.', 'Jonli suhbatga vaqt ajrating.', 'Найдите время для живого разговора.') : text('Keep the conversation going.', 'Suhbatni davom ettiring.', 'Продолжайте разговор.')}</h2>
    <p className="upgrade-description">{reset ? text('Your allowance renews automatically: daily time at 00:00 UTC, monthly capacity on the 1st. Your progress is saved.', 'Limit avtomatik yangilanadi: kunlik vaqt 00:00 UTC da, oylik imkoniyat har oyning 1-sanasida. Natijalaringiz saqlangan.', 'Лимит обновится автоматически: ежедневный в 00:00 UTC, месячный — 1-го числа. Прогресс сохранён.') : reason === 'content' ? text('The first five tests in each skill are free. Unlock the complete IELTS and SAT library, with vocabulary for every test.', 'Har bir skilldagi dastlabki 5 ta test bepul. Barcha IELTS va SAT testlarini ularning lug‘atlari bilan oching.', 'Первые пять тестов каждого навыка бесплатны. Откройте всю библиотеку IELTS и SAT со словарём каждого теста.') : text('Choose more room to learn, with a monthly AI balance and a separate Live AI time allowance.', 'Oylik AI balansi va alohida Live AI vaqti bilan o‘rganish imkoniyatlarini kengaytiring.', 'Учитесь больше с ежемесячным балансом AI и отдельным временем Live AI.')}</p>
    {!reset && <div className="upgrade-benefits"><span><BookOpen size={16} />{text('Every test & its vocabulary', 'Barcha testlar va lug‘atlari', 'Все тесты и их словари')}</span><span><Headphones size={16} />{tier === 'MAX' ? text('4h daily · 120h monthly Live AI', 'Live AI: 4 soat/kun · 120 soat/oy', 'Live AI: 4 ч/день · 120 ч/месяц') : text('1h daily · 30h monthly Live AI', 'Live AI: 1 soat/kun · 30 soat/oy', 'Live AI: 1 ч/день · 30 ч/месяц')}</span><span><Check size={16} />{text('Your progress stays with you', 'Natijalaringiz saqlanadi', 'Ваш прогресс сохраняется')}</span></div>}
    {!reset && <Link to={`/premium?plan=${tier === 'MAX' ? 'elite' : 'pro'}`} className="upgrade-action" onClick={onClose}>{text(`Explore ${name}`, `${name}ni ko‘rish`, `Посмотреть ${name}`)}<ArrowUpRight size={18} /></Link>}
    <button type="button" className="upgrade-later" onClick={onClose}>{text('Back to learning', 'O‘qishga qaytish', 'Вернуться к обучению')}</button>
    {!reset && <small><LockKeyhole size={12} />{text('One payment. No auto-renewal.', 'Bir martalik to‘lov. Avtomatik uzaytirilmaydi.', 'Разовая оплата. Без автопродления.')}</small>}
  </motion.div>
  return modal ? createPortal(<div className="upgrade-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>{content}</div>, document.body) : content
}
