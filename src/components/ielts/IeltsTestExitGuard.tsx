import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { UNSAFE_NavigationContext, parsePath, useLocation, type To } from 'react-router-dom'
import { hasActiveTest } from '@/hooks/useActiveTest'
import { useTestExitGuard } from '@/hooks/useTestExitGuard'
import { useBillingText } from '@/features/billing/copy'
import { getFullMockCompletedSections, getFullMockPendingSection, getFullMockSectionRedirect, type MockSectionKey } from '@/utils/ieltsMockCatalog'

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
      const payload = state as { mock?: { id?: string; section?: MockSectionKey }; result?: { testId?: string }; completedSection?: MockSectionKey } | null
      if (payload?.result?.testId && target.pathname === `/results/${payload.result.testId}`) return true
      if (id && payload?.mock?.id === id && payload.mock.section && getFullMockSectionRedirect(id, payload.mock.section, target.pathname) === null) return true
      if (id && payload?.mock?.id === id && target.pathname === getFullMockPendingSection(id)?.launchPath) return true
      // A submitted section hands off to the mock page, which asks before the next one.
      if (id && target.pathname === `/mock/ielts/${id}` && payload?.completedSection) return true
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

  return <>{children}<ConfirmDialog open={open}
    title={text('Save and exit?', 'Saqlash va chiqish?', 'Сохранить и выйти?')}
    description={text('Your answers and notes are saved. Continue later from IELTS / In process. Timed tests keep their original deadline.', 'Javoblar va qaydlar saqlanadi. IELTS / In process orqali davom ettiring. Vaqtli testning muddati saqlanadi.', 'Ответы и заметки сохраняются. Продолжите в IELTS / In process. Срок завершения теста не меняется.')}
    confirmLabel={text('Save & exit', 'Saqlash va chiqish', 'Сохранить и выйти')}
    cancelLabel={text('Continue test', 'Testni davom ettirish', 'Продолжить тест')}
    onClose={close} onConfirm={() => {
      const leave = pending.current; pending.current = null; leaving.current = true
      confirmExit(() => { setOpen(false) }, () => leave?.())
    }} /></>
}
