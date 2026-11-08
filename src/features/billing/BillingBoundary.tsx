import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AccessGate from './AccessGate'
import AccountGate from './AccountGate'
import { useBillingText } from './copy'
import { vocabularyResource, isFreeStudyResource } from './studyResources'
export function routeStudyResource(pathname: string, search: string) {
  const vocabulary = vocabularyResource(pathname, search)
  if (vocabulary) return { feature: vocabulary.startsWith('mock:') ? 'mock' as const : 'test' as const, resource: vocabulary }
  const skill = pathname.match(/^\/ielts\/(writing|speaking)\/test\/([A-Za-z0-9_-]+)$/)
  if (skill) return { feature: 'test' as const, resource: `test:${skill[1]}:${skill[2]}` }
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
function IeltsSavedReview({ mockId, access, children }: { mockId: string; access: NonNullable<ReturnType<typeof routeStudyResource>>; children: ReactNode }) {
  const [saved, setSaved] = useState<boolean | null>(null)
  const text = useBillingText()
  useEffect(() => {
    let active = true
    void import('@/utils/ieltsMockCatalog').then(catalog => { if (active) setSaved(catalog.getFullMockCompletedSections(mockId).length === catalog.MOCK_SECTION_COUNT) }).catch(() => { if (active) setSaved(false) })
    return () => { active = false }
  }, [mockId])
  if (saved === null) return <p role="status">{text('Loading saved progress…', 'Saqlangan natija yuklanmoqda…', 'Загружаем сохранённый результат…')}</p>
  return saved ? <AccountGate>{children}</AccountGate> : <AccessGate {...access}>{children}</AccessGate>
}
export default function BillingBoundary({ children }: { children: ReactNode }) {
  const { pathname, search, state } = useLocation()
  const navigate = useNavigate()
  const access = routeStudyResource(pathname, search)
  const classes = /^\/learning-center(?:\/|$)/.test(pathname)
  if (classes) return <AccountGate classes>{children}</AccountGate>
  if (pathname.startsWith('/sat/results/')) return <>{children}</>
  const savedPaper = (state as { reviewPayload?: { result?: { testId?: string; answers?: unknown } } } | null)?.reviewPayload?.result
  const paper = pathname.match(/^\/test\/(?:reading|listening)\/([A-Za-z0-9_-]+)$/)
  if (paper && savedPaper?.testId === paper[1] && savedPaper.answers && typeof savedPaper.answers === 'object') return <AccountGate>{children}</AccountGate>
  const study = /^\/(?:ielts|sat|test|mock)(?:\/|$)/.test(pathname) || ['/ai-tutor', '/writing-lab', '/speaking-lab', '/speaking-community'].includes(pathname)
  // Listening keeps its Start action; the account gate covers its preview as well.
  if (access?.resource.startsWith('test:listening:') && isFreeStudyResource(access.resource)) return <AccountGate>{children}</AccountGate>
  const sat = pathname.match(/^\/(?:mock\/sat|sat\/mock)\/([A-Za-z0-9_-]+)(?:\/run)?$/)
  if (sat && access) return <SATSavedReview key={`${pathname}:${search}`} mockId={sat[1]} search={search} access={access}>{children}</SATSavedReview>
  const mock = pathname.match(/^\/mock\/ielts\/([A-Za-z0-9_-]+)$/)
  if (mock && access) return <IeltsSavedReview key={pathname} mockId={mock[1]} access={access}>{children}</IeltsSavedReview>
  return access ? <AccessGate key={access.resource} {...access} onCancel={pathname.startsWith('/vocabulary/') ? () => navigate(pathname.startsWith('/vocabulary/sat') ? '/vocabulary/sat' : '/vocabulary/ielts') : undefined}>{children}</AccessGate> : study ? <AccountGate>{children}</AccountGate> : <>{children}</>
}
