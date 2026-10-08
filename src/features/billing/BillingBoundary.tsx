import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import AccessGate from './AccessGate'
import AccountGate from './AccountGate'
import { useBillingText } from './copy'
export function routeStudyResource(pathname: string, search: string) {
  const test = pathname.match(/^\/test\/(reading|listening|sat)\/([A-Za-z0-9_-]+)$/)
  if (test) return { feature: 'test' as const, resource: `test:${test[1]}:${test[2]}` }
  const database = pathname.match(/^\/tests\/([A-Za-z0-9_-]+)\/attempt$/)
  if (database) return { feature: 'test' as const, resource: `test:database:${database[1]}` }
  const mock = pathname.match(/^\/mock\/(ielts|sat)\/([A-Za-z0-9_-]+)$/)
  if (mock) {
    const section = new URLSearchParams(search).get('section')
    if (mock[1] === 'sat' && (section === 'math' || section === 'reading-writing')) return { feature: 'test' as const, resource: `test:sat:${mock[2]}:${section}` }
    return { feature: 'mock' as const, resource: `mock:${mock[1]}:${mock[2]}` }
  }
  const sat = pathname.match(/^\/sat\/mock\/([A-Za-z0-9_-]+)\/run$/)
  if (sat) {
    const section = new URLSearchParams(search).get('section')
    return section === 'math' || section === 'reading-writing' ? { feature: 'test' as const, resource: `test:sat:${sat[1]}:${section}` } : { feature: 'mock' as const, resource: `mock:sat:${sat[1]}` }
  }
  return null
}
function SATSavedReview({ mockId, search, access, children }: { mockId: string; search: string; access: NonNullable<ReturnType<typeof routeStudyResource>>; children: ReactNode }) {
  const [savedReview, setSavedReview] = useState<boolean | null>(null)
  const text = useBillingText()
  useEffect(() => {
    let active = true
    void Promise.all([import('@/features/sat/catalog'), import('@/features/sat/attemptStorage')]).then(([catalog, storage]) => {
      const section = new URLSearchParams(search).get('section')
      const test = catalog.getSATSectionTest(mockId, catalog.isSATSection(section) ? section : null)
      if (active) setSavedReview(storage.loadSATAttempt(test.id)?.status === 'submitted')
    }).catch(() => { if (active) setSavedReview(false) })
    return () => { active = false }
  }, [mockId, search])
  if (savedReview === null) return <p role="status">{text('Loading saved progress…', 'Saqlangan natija yuklanmoqda…', 'Загрузка сохранённого результата…')}</p>
  return savedReview ? <>{children}</> : <AccessGate {...access}>{children}</AccessGate>
}
export default function BillingBoundary({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  const access = routeStudyResource(pathname, search)
  const classes = /^\/learning-center(?:\/|$)/.test(pathname)
  if (classes) return <AccountGate classes>{children}</AccountGate>
  if (pathname === '/sat/mistakes') return <>{children}</>
  const study = /^\/(?:ielts|sat|test|mock)(?:\/|$)/.test(pathname) || ['/ai-tutor', '/writing-lab', '/speaking-lab', '/speaking-community'].includes(pathname)
  // Listening keeps its Start action; the account gate covers its preview as well.
  if (access?.resource.startsWith('test:listening:')) return <AccountGate>{children}</AccountGate>
  const sat = pathname.match(/^\/(?:mock\/sat|sat\/mock)\/([A-Za-z0-9_-]+)(?:\/run)?$/)
  if (sat && access) return <SATSavedReview key={`${pathname}:${search}`} mockId={sat[1]} search={search} access={access}>{children}</SATSavedReview>
  return access ? <AccessGate key={access.resource} {...access}>{children}</AccessGate> : study ? <AccountGate>{children}</AccountGate> : <>{children}</>
}
