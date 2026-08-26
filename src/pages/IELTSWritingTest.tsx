import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { getWritingFullTestById, getWritingTaskById } from '@/data/writingTestData'
import IELTSWritingTestInterface from '@/components/IELTSWritingTestInterface'
import IELTSWritingFullTestInterface from '@/components/IELTSWritingFullTestInterface'

type WritingTestNavState = {
  autoStart?: boolean
  timerEnabled?: boolean
  durationMinutes?: number
} | null

export default function IELTSWritingTest() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as WritingTestNavState

  const task = useMemo(() => (id ? getWritingTaskById(id) : null), [id])
  const fullTest = useMemo(() => (id ? getWritingFullTestById(id) : null), [id])

  const handleExit = () => {
    navigate('/ielts/writing/tests')
  }

  if (fullTest?.available) {
    return (
      <IELTSWritingFullTestInterface
        fullTest={fullTest}
        onExit={handleExit}
        autoStart={navState?.autoStart}
        autoTimerEnabled={navState?.timerEnabled}
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
