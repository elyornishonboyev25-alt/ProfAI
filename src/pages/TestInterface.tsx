import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { generateRandomReadingTest, mockReadingTests } from '../data/ieltsReadingPassages'
import { mockListeningTests } from '../data/listeningPassages'
import { fullReadingTest } from '../data/fullReadingTest'
import { fullReadingTest2 } from '../data/fullReadingTest2'
import { fullReadingTest3 } from '../data/fullReadingTest3'
import { fullReadingTest4 } from '../data/fullReadingTest4'
import { fullReadingTest5 } from '../data/fullReadingTest5'
import { fullReadingTest6 } from '../data/fullReadingTest6'
import { fullReadingTest7 } from '../data/fullReadingTest7'
import { fullReadingTest8 } from '../data/fullReadingTest8'
import { fullReadingTest9 } from '../data/fullReadingTest9'
import { fullReadingTest10 } from '../data/fullReadingTest10'
import IELTSReadingInterface from '../components/IELTSReadingInterface'
import { IELTSTest, TestResult } from '../types/ieltsTypes'
import {
  isAvailableIeltsTrackTest,
  isIeltsTrackCatalogTest,
} from '@/utils/ieltsTrackCatalog'
import { resolveGeneratedTrackTest } from '@/utils/generatedIeltsTests'
import { markFullMockSectionComplete, type MockSectionKey } from '@/utils/ieltsMockCatalog'

type TestLaunchPreset = {
  mode: 'practice' | 'simulation' | 'full-test'
  partIndex?: number
  durationMinutes?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function TestInterface() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state as {
    reviewPayload?: {
      result: TestResult
      showCorrectAnswers?: boolean
    }
    sourceTest?: IELTSTest
    fromResults?: boolean
    entry?: string
    from?: string
    launchPreset?: TestLaunchPreset
    mock?: { id: string; section: MockSectionKey }
  } | null) ?? null
  const reviewPayload = routeState?.reviewPayload
  const sourceTest = routeState?.sourceTest
  const mockContext = routeState?.mock
  const reviewFromResults = Boolean(routeState?.fromResults && reviewPayload?.result)
  const isReviewLaunch = Boolean(reviewPayload?.result)
  const fromMockFlow = routeState?.entry === 'mock-ielts'
  const mockFrom = routeState?.from ?? 'tests'
  const [testData, setTestData] = useState<IELTSTest | null>(null)
  const [loading, setLoading] = useState(true)
  const trackType = type === 'reading' || type === 'listening' ? type : null
  const launchPreset = useMemo(() => {
    const statePreset = routeState?.launchPreset
    const params = new URLSearchParams(location.search)
    const modeCandidate = params.get('mode')
    const partCandidate = params.get('part')
    const minutesCandidate = params.get('minutes')

    const mode =
      modeCandidate === 'practice' || modeCandidate === 'simulation' || modeCandidate === 'full-test'
        ? modeCandidate
        : statePreset?.mode
    const partIndex =
      partCandidate && Number.isFinite(Number(partCandidate))
        ? clamp(Math.round(Number(partCandidate)), 1, 4)
        : statePreset?.partIndex
    const durationMinutes =
      minutesCandidate && Number.isFinite(Number(minutesCandidate))
        ? clamp(Math.round(Number(minutesCandidate)), 5, 180)
        : statePreset?.durationMinutes

    if (!mode && !partIndex && !durationMinutes) return null
    return {
      mode: mode ?? (trackType === 'listening' ? 'full-test' : 'simulation'),
      partIndex,
      durationMinutes,
    } as TestLaunchPreset
  }, [location.search, routeState?.launchPreset, trackType])

  const catalogTrackTest = useMemo(() => {
    if (!trackType || !id) return false
    return isIeltsTrackCatalogTest(trackType, id)
  }, [id, trackType])

  const trackTestComingSoon = useMemo(() => {
    if (isReviewLaunch) return false
    if (!trackType || !id || !catalogTrackTest) return false
    return !isAvailableIeltsTrackTest(trackType, id)
  }, [catalogTrackTest, id, isReviewLaunch, trackType])

  useEffect(() => {
    setLoading(true)
    let foundTest: IELTSTest | undefined | null

    if (!id) {
      setLoading(false)
      setTestData(null)
      return
    }

    if (sourceTest?.id === id) {
      setTestData(sourceTest)
      setLoading(false)
      return
    }

    if (trackTestComingSoon) {
      setTestData(null)
      setLoading(false)
      return
    }

    if (type === 'reading') {
      if (id === 'ielts-reading-full-vol1') {
        foundTest = fullReadingTest
      } else if (id === 'ielts-reading-full-vol2') {
        foundTest = fullReadingTest2
      } else if (id === 'ielts-reading-full-vol3' || id === 'ielts-reading-money-transfers') {
        foundTest = fullReadingTest3
      } else if (id === 'ielts-reading-full-vol4') {
        foundTest = fullReadingTest4
      } else if (id === 'ielts-reading-full-vol5') {
        foundTest = fullReadingTest5
      } else if (id === 'ielts-reading-full-vol6') {
        foundTest = fullReadingTest6
      } else if (id === 'ielts-reading-full-vol7') {
        foundTest = fullReadingTest7
      } else if (id === 'ielts-reading-full-vol8') {
        foundTest = fullReadingTest8
      } else if (id === 'ielts-reading-full-vol9') {
        foundTest = fullReadingTest9
      } else if (id === 'ielts-reading-full-vol10') {
        foundTest = fullReadingTest10
      } else if (id === 'random') {
        foundTest = generateRandomReadingTest()
      } else {
        foundTest = mockReadingTests.find((test) => test.id === id) ?? resolveGeneratedTrackTest('reading', id)
      }
    } else if (type === 'listening') {
      foundTest = mockListeningTests.find((test) => test.id === id) ?? resolveGeneratedTrackTest('listening', id)
    }

    setTestData(foundTest ?? null)
    setLoading(false)
  }, [id, sourceTest, trackTestComingSoon, type])

  const handleComplete = (results: unknown) => {
    // Inside a Full Mock, a section counts as done only when its test is actually
    // submitted — which is exactly here, in the completion handler.
    if (mockContext?.id && mockContext.section) {
      markFullMockSectionComplete(mockContext.id, mockContext.section)
    }
    navigate(`/results/${(results as { testId?: string })?.testId || 'unknown'}`, {
      state: {
        result: results,
        test: testData,
      },
    })
  }

  const handleExit = () => {
    if (reviewFromResults && reviewPayload?.result?.testId) {
      navigate(`/results/${reviewPayload.result.testId}`, {
        state: {
          result: reviewPayload.result,
          test: testData ?? sourceTest ?? undefined,
        },
      })
      return
    }

    if (type === 'reading' || type === 'listening') {
      navigate(`/ielts/${type}/tests`, {
        state: fromMockFlow
          ? { entry: 'mock-ielts', from: mockFrom }
          : { entry: 'ielts-catalog' },
      })
      return
    }
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (trackTestComingSoon) {
    const label = trackType === 'reading' ? 'Reading' : 'Listening'
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(155deg,#fff_0%,#fff5f5_55%,#fffaf8_100%)] px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_20px_46px_rgba(220,38,38,0.16)]">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock3 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900">{label} Test Coming Soon</h1>
          <p className="mt-2 text-sm text-slate-600">
            This test is currently in preview mode. Right now <strong>Reading Full Test 1-10</strong> and <strong>Listening Full Test 1-2</strong> are fully live.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={handleExit}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!testData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(155deg,#fff_0%,#fff5f5_55%,#fffaf8_100%)] px-4">
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_20px_46px_rgba(220,38,38,0.16)]">
          <h1 className="text-2xl font-black text-slate-900">Test Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">Requested test payload is not available right now.</p>
          <button
            onClick={handleExit}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (type === 'reading') {
    return (
      <IELTSReadingInterface
        test={testData}
        onComplete={handleComplete}
        onExit={handleExit}
        reviewPayload={reviewPayload}
        launchPreset={
          launchPreset
            ? {
                mode: launchPreset.mode === 'full-test' ? 'simulation' : launchPreset.mode,
                partIndex: launchPreset.partIndex,
                durationMinutes: launchPreset.durationMinutes,
              }
            : undefined
        }
      />
    )
  }
  if (type === 'listening') {
    // Listening now shares the polished Reading interface (same question rendering,
    // header, navigation) with an added non-controllable audio playlist.
    return (
      <IELTSReadingInterface
        test={testData}
        onComplete={handleComplete}
        onExit={handleExit}
        reviewPayload={reviewPayload}
        launchPreset={
          launchPreset
            ? {
                mode: launchPreset.mode === 'full-test' ? 'simulation' : launchPreset.mode,
                partIndex: launchPreset.partIndex,
                durationMinutes: launchPreset.durationMinutes,
              }
            : undefined
        }
      />
    )
  }

  return <div>Unsupported Test Type</div>
}


