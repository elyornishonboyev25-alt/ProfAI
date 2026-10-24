import { useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { UNSAFE_NavigationContext, parsePath, useLocation, type To } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'
import { hasActiveTest } from '@/hooks/useActiveTest'
import { useTestExitGuard } from '@/hooks/useTestExitGuard'
import { useBillingText } from '@/features/billing/copy'
import { getFullMockCompletedSections, getFullMockPendingSection } from '@/utils/ieltsMockCatalog'

/** Protect button, link, browser-history and document exits with one confirmation. */
export default function IeltsTestExitGuard({ children, mockId, active }: {
  children: ReactNode
  mockId?: string
  active?: () => boolean
}) {
  const text = useBillingText()
  const location = useLocation()
  const { navigator } = useContext(UNSAFE_NavigationContext)
  const [open, setOpen] = useState(false)
  const pending = useRef<(() => void) | null>(null)
  const focus = useRef<HTMLElement | null>(null)
  const leaving = useRef(false)
  const current = useRef({ location, mockId, active })
  current.current = { location, mockId, active }
  const isActive = () => !leaving.current && (current.current.active?.() ?? hasActiveTest())
  const show = () => { if (!open) focus.current = document.activeElement as HTMLElement | null; setOpen(true) }
  const { cancelExit, confirmExit } = useTestExitGuard(isActive, show)
  const close = () => { pending.current = null; cancelExit(); setOpen(false); focus.current?.focus() }
  useLayoutEffect(() => { leaving.current = false; pending.current = null; setOpen(false) }, [location.key])

  useLayoutEffect(() => {
    const push = navigator.push
    const replace = navigator.replace
    const go = navigator.go
    const allowed = (to: To, state?: unknown) => {
      if (!isActive()) return true
      const { location: route, mockId: id } = current.current
      const target = typeof to === 'string' ? parsePath(to) : to
      // Canonical URL changes, section transitions and a submitted result keep
      // the same attempt; they must work even when an exam timer submits it.
      if (!target.pathname || target.pathname === route.pathname) return true
      const payload = state as { mock?: { id?: string }; result?: { testId?: string } } | null
      if (payload?.result?.testId && target.pathname === `/results/${payload.result.testId}`) return true
      if (id && payload?.mock?.id === id && target.pathname === getFullMockPendingSection(id)?.launchPath) return true
      return !!id && target.pathname === `/mock/ielts/${id}` && getFullMockCompletedSections(id).length === 4
    }
    const block = (leave: () => void) => { pending.current = leave; show() }
    navigator.push = (to, state, options) => {
      if (allowed(to, state)) push(to, state, options)
      else block(() => push(to, state, options))
    }
    navigator.replace = (to, state, options) => {
      if (allowed(to, state)) replace(to, state, options)
      else block(() => replace(to, state, options))
    }
    navigator.go = delta => { if (isActive()) block(() => go(delta)); else go(delta) }
    return () => { navigator.push = push; navigator.replace = replace; navigator.go = go }
  }, [navigator])

  return <>{children}{open && createPortal(<div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <section role="alertdialog" aria-modal="true" aria-labelledby="ielts-exit-title" aria-describedby="ielts-exit-description"
      className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-100 bg-white p-7 shadow-2xl" onKeyDown={event => {
        if (event.key === 'Escape') close()
        if (event.key === 'Tab') {
          const buttons = event.currentTarget.querySelectorAll('button')
          const first = buttons[0], last = buttons[buttons.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-700 to-rose-400" />
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><LogOut size={23} /></span>
      <p className="mt-5 text-xs font-black tracking-widest text-red-600">IELTS</p>
      <h2 id="ielts-exit-title" className="mt-2 text-2xl font-black text-slate-950">{text('Are you sure you want to leave?', 'Aniq chiqmoqchimisiz?', 'Вы точно хотите выйти?')}</h2>
      <p id="ielts-exit-description" className="mt-3 text-sm leading-6 text-slate-600">{text('Your progress is saved on this device. You can resume from IELTS. Timed tests keep their original deadline.', 'Javoblaringiz shu qurilmada saqlanadi. IELTS bo‘limidan davom ettirishingiz mumkin. Vaqtli testning muddati o‘zgarmaydi.', 'Ответы сохраняются на этом устройстве. Продолжить можно в разделе IELTS. Время теста продолжает идти.')}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button autoFocus type="button" onClick={close} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">{text('Continue test', 'Testni davom ettirish', 'Продолжить тест')}</button>
        <button type="button" onClick={() => {
          const leave = pending.current
          pending.current = null
          leaving.current = true
          confirmExit(() => { setOpen(false) }, () => leave?.())
        }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-500 px-4 py-3 text-sm font-bold text-white"><ShieldCheck size={16} />{text('Save & exit', 'Saqlash va chiqish', 'Сохранить и выйти')}</button>
      </div>
    </section>
  </div>, document.body)}</>
}
