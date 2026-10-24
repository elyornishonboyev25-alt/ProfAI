import { Fragment, type ReactNode } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { resolveFullMockRouteState } from '@/utils/fullMockRouteState'
import IeltsTestExitGuard from './IeltsTestExitGuard'
import { hasActiveTest } from '@/hooks/useActiveTest'
import { fullMockLaunchState, getFullMockPendingSection, getFullMockSectionRedirect, type MockSectionKey } from '@/utils/ieltsMockCatalog'

/** Preserve exam order, reload recovery and exit protection while starting each runner directly. */
export default function FullMockSectionGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const state = resolveFullMockRouteState(location) as { mock?: { id: string }; reviewPayload?: unknown } | null
  return <IeltsTestExitGuard mockId={state?.mock?.id} active={() => !state?.reviewPayload && (hasActiveTest() || !!state?.mock?.id)}>
    <FullMockSectionGateContent>{children}</FullMockSectionGateContent>
  </IeltsTestExitGuard>
}

function FullMockSectionGateContent({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { type } = useParams()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const state = resolveFullMockRouteState(location) as { mock?: { id: string; section: MockSectionKey }; from?: string; reviewPayload?: unknown } | null
  const section: MockSectionKey | null = location.pathname.startsWith('/ielts/writing/test/') ? 'writing'
    : location.pathname.startsWith('/ielts/speaking/test/') ? 'speaking'
      : type === 'listening' || type === 'reading' ? type : null
  if (!state?.mock?.id || !section || state.reviewPayload) return <>{children}</>
  if (new URLSearchParams(location.search).get('mock') !== state.mock.id) {
    const params = new URLSearchParams(location.search)
    params.set('mock', state.mock.id)
    return <Navigate to={{ pathname: location.pathname, search: `?${params}` }} replace state={state} />
  }
  const redirect = getFullMockSectionRedirect(state.mock.id, section, location.pathname)
  if (redirect) {
    const pending = getFullMockPendingSection(state.mock.id)
    return <Navigate to={redirect} replace state={pending ? fullMockLaunchState(state.mock.id, pending.key, state.from) : { from: state.from }} />
  }
  return <Fragment key={`${owner}:${state.mock.id}:${section}`}>{children}</Fragment>
}
