import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { getWritingFullTestById, getWritingTaskById } from '@/data/writingTestData'
import IELTSWritingTestInterface from '@/components/IELTSWritingTestInterface'
import IELTSWritingFullTestInterface from '@/components/IELTSWritingFullTestInterface'
import { fullMockLaunchState, getFullMockPendingSection, getFullMockSectionRedirect, saveFullMockSectionResult, type MockSectionKey } from '@/utils/ieltsMockCatalog'

type WritingTestNavState = {
  autoStart?: boolean
  timerEnabled?: boolean
  durationMinutes?: number
  entry?: string
  from?: string
  mock?: { id: string; section: MockSectionKey }
} | null

export default function IELTSWritingTest() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as WritingTestNavState

  const task = useMemo(() => (id ? getWritingTaskById(id) : null), [id])
  const fullTest = useMemo(() => (id ? getWritingFullTestById(id) : null), [id])

  const mockRedirect = navState?.mock?.id ? getFullMockSectionRedirect(navState.mock.id, 'writing', location.pathname) : null
  if (mockRedirect && navState?.mock) {
    const pending = getFullMockPendingSection(navState.mock.id)
    return <Navigate to={mockRedirect} replace state={pending ? fullMockLaunchState(navState.mock.id, pending.key, navState.from) : { from: navState.from }} />
  }

  const handleExit = () => {
    if (navState?.mock?.id) {
      navigate(`/mock/ielts/${navState.mock.id}`, { state: { from: navState.from } })
      return
    }
    navigate('/ielts/writing/tests', { state: navState })
  }

  if (fullTest?.available) {
    return (
      <IELTSWritingFullTestInterface
        key={`${fullTest.id}:${navState?.mock?.id ?? 'standalone'}`}
        fullTest={fullTest}
        onExit={handleExit}
        inFullMock={Boolean(navState?.mock?.id)}
        fullMockId={navState?.mock?.id}
        onComplete={(band, summary, review) => {
          const mockId = navState?.mock?.id
          if (!mockId) return
          saveFullMockSectionResult(mockId, 'writing', {
            band, summary, review, testId: fullTest.id, completedAt: new Date().toISOString(),
          })
          const next = getFullMockPendingSection(mockId)
          if (next?.launchPath) navigate(next.launchPath, { replace: true, state: fullMockLaunchState(mockId, next.key, navState?.from) })
          else navigate(`/mock/ielts/${mockId}`, { replace: true, state: { from: navState?.from } })
        }}
        autoStart={navState?.mock?.id ? true : navState?.autoStart}
        autoTimerEnabled={navState?.mock?.id ? true : navState?.timerEnabled}
        autoDurationMinutes={navState?.durationMinutes}
      />
    )
  }

  if (!task || !task.available) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(155deg,#fff_0%,#fff5f5_55%,#fffaf8_100%)] px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_20px_46px_rgba(220,38,38,0.16)]">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock3 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900">
            {task || fullTest ? 'Writing Test Coming Soon' : 'Test Not Found'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {task || fullTest
              ? 'This writing test is currently in preview mode. Writing Full Test 1 is live now.'
              : 'The requested writing test could not be found.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={handleExit}
              className="route-back-button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Writing Tests
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <IELTSWritingTestInterface
      task={task}
      onExit={handleExit}
      autoStart={navState?.autoStart}
      autoTimerEnabled={navState?.timerEnabled}
      autoDurationMinutes={navState?.durationMinutes}
    />
  )
}
