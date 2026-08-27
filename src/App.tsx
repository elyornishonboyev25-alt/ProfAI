import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'

import MobileBottomNav from '@/components/layout/MobileBottomNav'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import { Sidebar } from '@/components/layout/Sidebar'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import Footer from '@/components/Footer'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PremiumRoute from '@/components/auth/PremiumRoute'
import PremiumOnly from '@/components/premium/PremiumOnly'
import { ToastViewport } from '@/components/common/ToastViewport'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import FullscreenToggle from '@/components/common/FullscreenToggle'
import WordLookupLayer from '@/components/vocab/WordLookupLayer'
import NicknameGate from '@/components/speaking/NicknameGate'
import { sendHeartbeat } from '@/lib/speakingApi'
import { recordXpActivity, type XpActivitySource } from '@/lib/xpApi'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useCelebrationStore } from '@/store/celebrationStore'
import { useRegisterModalStore } from '@/store/registerModalStore'
import { addTrackedMinutes, routeToActivityKey } from '@/utils/weeklyPlanner'
import { lazyWithRetry as lazy } from '@/utils/lazyWithRetry'
import { isPublicFeatureEnabled } from '@/config/featureFlags'

const globalJourneyEnabled = isPublicFeatureEnabled('globalJourney')

const RegisterModal = lazy(() => import('@/components/auth/RegisterModal'))
const AchievementCelebration = lazy(() => import('@/components/achievements/AchievementCelebration'))
const FloatingAIAssistant = lazy(() => import('@/components/ai/FloatingAIAssistant'))
const TalkOverlay = lazy(() => import('@/components/ai/TalkOverlay'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Landing = lazy(() => import('@/pages/Landing'))
const TestPreparation = lazy(() => import('@/pages/TestPreparation'))
const AcademicSkills = lazy(() => import('@/pages/AcademicSkills'))
const SAT = lazy(() => import('@/pages/SAT'))
const SATSection = lazy(() => import('@/pages/SATSection'))
const SATMistakes = lazy(() => import('@/pages/SATMistakes'))
const SATCalculator = lazy(() => import('@/pages/SATCalculator'))
const SATMockRun = lazy(() => import('@/pages/SATMockRun'))
const IELTS = lazy(() => import('@/pages/IELTS'))
const IELTSSection = lazy(() => import('@/pages/IELTSSection'))
const IELTSSectionTests = lazy(() => import('@/pages/IELTSSectionTests'))
const Vocabulary = lazy(() => import('@/pages/Vocabulary'))
const VocabularyActivity = lazy(() => import('@/pages/VocabularyActivity'))
const ArticlesVocabulary = lazy(() => import('@/pages/ArticlesVocabulary'))
const MyWordsVocabulary = lazy(() => import('@/pages/MyWordsVocabulary'))
const WritingLab = lazy(() => import('@/pages/WritingLab'))
const SpeakingLab = lazy(() => import('@/pages/SpeakingLab'))
const SpeakerProfile = lazy(() => import('@/pages/SpeakerProfile'))
const PublicProfile = lazy(() => import('@/pages/PublicProfile'))
const Community = lazy(() => import('@/pages/Community'))
const MockIELTS = lazy(() => import('@/pages/MockIELTS'))
const MockIELTSRun = lazy(() => import('@/pages/MockIELTSRun'))
const MockSAT = lazy(() => import('@/pages/MockSAT'))
const TestInterface = lazy(() => import('@/pages/TestInterface'))
const Results = lazy(() => import('@/pages/Results'))
const ResultsReview = lazy(() => import('@/pages/ResultsReview'))
const SharedResult = lazy(() => import('@/pages/SharedResult'))
const Profile = lazy(() => import('@/pages/Profile'))
const AnalyzeMistakes = lazy(() => import('@/pages/AnalyzeMistakes'))
const AccountProfile = lazy(() => import('@/pages/AccountProfile'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Premium = lazy(() => import('@/pages/Premium'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const IELTSWritingTests = lazy(() => import('@/pages/IELTSWritingTests'))
const IELTSWritingTest = lazy(() => import('@/pages/IELTSWritingTest'))
const IELTSSpeakingTests = lazy(() => import('@/pages/IELTSSpeakingTests'))
const IELTSSpeakingTest = lazy(() => import('@/pages/IELTSSpeakingTest'))
const TestRunner = lazy(() => import('@/pages/TestRunner'))
const Articles = lazy(() => import('@/pages/Articles'))
const ArticleReader = lazy(() => import('@/pages/ArticleReader'))
const ShadowingLab = lazy(() => import('@/pages/ShadowingLab'))
const Podcast = lazy(() => import('@/pages/Podcast'))
const Admission = lazy(() => import('@/pages/Admission'))
const AdmissionLessons = lazy(() => import('@/pages/AdmissionLessons'))
const AdmissionLesson = lazy(() => import('@/pages/AdmissionLesson'))
const AdmissionUniversities = lazy(() => import('@/pages/AdmissionUniversities'))
const AdmissionUniversity = lazy(() => import('@/pages/AdmissionUniversity'))
const AITutor = lazy(() => import('@/pages/AITutor'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function toDateISO(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function xpSourceForActivity(activityKey: ReturnType<typeof routeToActivityKey>): XpActivitySource | null {
  if (activityKey === 'vocabulary') return 'STUDY_VOCABULARY'
  if (activityKey === 'articles') return 'STUDY_ARTICLES'
  if (activityKey === 'podcast') return 'STUDY_PODCAST'
  if (activityKey === 'shadowing') return 'STUDY_SHADOWING'
  if (activityKey === 'admission') return 'STUDY_ADMISSION'
  return null
}

function RouteLoader() {
  const { pathname } = useLocation()

  if (pathname === '/dashboard' || pathname === '/') {
    return (
      <div className="dashboard-route-loader workspace-page min-h-screen px-3 pb-8 pt-3 sm:px-5 sm:pt-5" role="status" aria-label="Opening dashboard">
        <div className="dashboard-loader-shell mx-auto max-w-[98rem]">
          <div className="dashboard-loader-header">
            <span className="dashboard-loader-avatar" />
            <span className="dashboard-loader-copy">
              <i />
              <b />
              <em />
            </span>
          </div>
          <div className="dashboard-loader-grid">
            <span className="dashboard-loader-target" />
            <span className="dashboard-loader-center">
              <i className="dashboard-loader-stats" />
              <b className="dashboard-loader-chart" />
            </span>
            <span className="dashboard-loader-rail" />
          </div>
          <span className="dashboard-loader-learning" />
        </div>
      </div>
    )
  }

  return <BrandPageLoader compact label="Opening page" />
}

function DeferredFloatingAIAssistant() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setReady(true), 180)
    return () => window.clearTimeout(timeoutId)
  }, [])

  if (!ready) return null

  return (
    <Suspense fallback={null}>
      <FloatingAIAssistant />
    </Suspense>
  )
}

function DeferredTalkOverlay() {
  const talkOpen = useAiAssistantStore((state) => state.talkOpen)
  const [hasLoaded, setHasLoaded] = useState(talkOpen)

  useEffect(() => {
    if (talkOpen) setHasLoaded(true)
  }, [talkOpen])

  if (!hasLoaded) return null

  return (
    <Suspense fallback={null}>
      <TalkOverlay />
    </Suspense>
  )
}

function DeferredRegisterModal() {
  const isOpen = useRegisterModalStore((state) => state.isOpen)

  if (!isOpen) return null

  return (
    <Suspense fallback={null}>
      <RegisterModal />
    </Suspense>
  )
}

function DeferredAchievementCelebration() {
  const current = useCelebrationStore((state) => state.current)

  if (!current) return null

  return (
    <Suspense fallback={null}>
      <AchievementCelebration />
    </Suspense>
  )
}

function AnimatedRoute({ children, dashboardEntrance = false }: { children: ReactNode; dashboardEntrance?: boolean }) {
  const location = useLocation()
  return (
    <div
      key={location.pathname}
      className={`arena-route h-full ${dashboardEntrance ? 'arena-route-dashboard' : ''}`}
    >
      {children}
    </div>
  )
}

function LegacySpeakingRedirect() {
  const { search } = useLocation()
  const legacy = new URLSearchParams(search).get('section')
  const mode = legacy === 'ai' || legacy === 'debate' || legacy === 'partner' || legacy === 'progress' ? legacy : 'people'
  return <Navigate to={mode === 'people' ? '/community' : `/community?mode=${mode}`} replace />
}

function App() {
  const location = useLocation()
  const pathname = location.pathname
  const user = useAuthStore((state: AuthState) => state.user)
  const hydrated = useAuthStore((state: AuthState) => state.hydrated)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const isExamModeActive = useAiAssistantStore((state) => state.isExamModeActive)

  const isAuthPage = pathname === '/login' || pathname === '/register'
  // Guests at the root get the full-bleed marketing landing (its own nav + footer),
  // so the global top-nav and footer chrome are suppressed there.
  const isGuestLanding = pathname === '/' && hydrated && !user
  const isVocabularyMode = pathname === '/vocabulary' || pathname.startsWith('/vocabulary/')
  const isLeaderboardMode = pathname === '/leaderboard'
  const isProfileStandalone = pathname === '/profile'
  const isStandaloneMode = pathname === '/account'
  const isIeltsMockMode = pathname === '/mock/ielts' || pathname.startsWith('/mock/ielts/')
  const isTrackMode =
    isStandaloneMode ||
    isVocabularyMode ||
    pathname === '/dashboard' ||
    (pathname === '/' && Boolean(user)) ||
    pathname.startsWith('/mock') ||
    pathname === '/test-preparation' ||
    pathname === '/academic-skills' ||
    pathname === '/speaking-community' ||
    pathname.startsWith('/speaker/') ||
    pathname === '/community' ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/sat') ||
    pathname.startsWith('/ielts') ||
    pathname === '/writing-lab' ||
    pathname === '/speaking-lab' ||
    pathname === '/shadowing-lab' ||
    pathname === '/podcast' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/articles') ||
    pathname.startsWith('/admission') ||
    pathname === '/ai-tutor' ||
    isLeaderboardMode
  const isCustomTestMode =
    /^\/tests\/[^/]+\/attempt$/.test(pathname) ||
    /^\/mock\/sat(?:\/\d+)?$/.test(pathname) ||
    /^\/sat\/mock\/\d+\/run$/.test(pathname)
  const isClassicTestMode = pathname.startsWith('/test/') || pathname.startsWith('/results/') || pathname.startsWith('/shared/results/')
  const isTestMode = isCustomTestMode || isClassicTestMode
  const communityMode = pathname === '/community' ? new URLSearchParams(location.search).get('mode') : null
  const isLiveCommunityMode = communityMode === 'debate' || communityMode === 'partner'

  // Warm the next route while the learner is reading the current screen. This
  // keeps Back from IELTS/SAT and sidebar navigation from waiting on a large
  // dashboard/chart chunk after the click.
  useEffect(() => {
    const isReturningFromTrack = pathname.startsWith('/ielts') || pathname.startsWith('/sat') || pathname.startsWith('/mock')
    const isDashboard = pathname === '/dashboard' || (pathname === '/' && Boolean(user))
    if (!isReturningFromTrack && !isDashboard) return

    const preloadTimer = window.setTimeout(() => {
      if (isReturningFromTrack) {
        void import('@/pages/Dashboard')
      }

      if (isDashboard) {
        void Promise.all([
          import('@/pages/Profile'),
          import('@/pages/AITutor'),
        ])
      }
    }, isReturningFromTrack ? 180 : 1400)

    return () => window.clearTimeout(preloadTimer)
  }, [pathname, user])

  const pathParts = pathname.split('/').filter(Boolean)
  const isFocusContentMode =
    pathname === '/onboarding' ||
    pathname.startsWith('/sat/') ||
    pathname.startsWith('/ielts/') ||
    pathname.startsWith('/ielts/speaking/test/') ||
    pathname.startsWith('/ielts/writing/test/') ||
    (pathname.startsWith('/articles/') && pathParts.length > 1) ||
    (pathname.startsWith('/vocabulary/') && pathParts.length > 2) ||
    (pathname.startsWith('/admission/lessons/') && pathParts.length > 2) ||
    (pathname.startsWith('/admission/universities/') && pathParts.length > 2)

  const isPublicStandalone =
    isAuthPage ||
    isGuestLanding ||
    pathname === '/premium' ||
    pathname.startsWith('/shared/results/') ||
    pathname.startsWith('/speaker/')

  const isImmersiveHub = [
    '/ielts',
    '/sat',
    '/articles',
    '/podcast',
    '/shadowing-lab',
    '/admission/universities',
    '/admission/shortlist',
    '/vocabulary',
    '/community',
  ].includes(pathname)

  // The workspace shell is route-owned, not auth-owned. This keeps its geometry
  // stable if a request is refreshing the session or if a session expires while
  // the learner is already on a workspace page. Public and focused experiences
  // intentionally keep their standalone layouts.
  const showSidebar =
    !isPublicStandalone &&
    !isTestMode &&
    !isFocusContentMode &&
    !isVocabularyMode &&
    !isLeaderboardMode &&
    !isIeltsMockMode &&
    pathname !== '/ielts'
  const sidebarVisible = showSidebar && !isImmersiveHub
  const showMobileNav =
    Boolean(user) &&
    !isPublicStandalone &&
    !isTestMode &&
    !isFocusContentMode &&
    !isIeltsMockMode &&
    pathname !== '/onboarding' &&
    !isLiveCommunityMode
  const showAmbientBackground = !isTestMode && !isFocusContentMode && !isLiveCommunityMode

  useEffect(() => {
    const activityKey = routeToActivityKey(pathname)
    if (!activityKey) return

    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      addTrackedMinutes(user?.id, toDateISO(new Date()), activityKey, 1)
    }, 60000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [pathname, user?.id])

  useEffect(() => {
    if (!user) return
    const source = xpSourceForActivity(routeToActivityKey(pathname))
    if (!source) return

    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      const bucket = Math.floor(Date.now() / 300_000)
      void recordXpActivity({
        source,
        eventKey: `${pathname}:${bucket}`,
        durationSec: 300,
        metadata: { pathname, activeMinutes: 5 },
      }).then((reward) => {
        updateUserProgress({ xp: reward.totalXp, level: reward.level, currentStreak: reward.currentStreak })
      }).catch(() => {})
    }, 300_000)

    return () => window.clearInterval(intervalId)
  }, [pathname, updateUserProgress, user?.id])

  // Presence heartbeat — keeps "online now" / "last seen" accurate for the community.
  useEffect(() => {
    if (!user) return
    const heartbeat = (recalculateStreak = false) => {
      void sendHeartbeat(recalculateStreak).then((reward) => {
        if (reward) updateUserProgress({ xp: reward.totalXp, level: reward.level, currentStreak: reward.currentStreak })
      })
    }
    heartbeat(true)
    const id = window.setInterval(() => {
      if (!document.hidden) heartbeat()
    }, 60000)
    return () => window.clearInterval(id)
  }, [updateUserProgress, user?.id])

  // Persisted auth hydrates asynchronously. Rendering a route before that
  // completes briefly treats a signed-in learner as a guest, removes the
  // sidebar and expands the page to full width. Keep one neutral shell visible
  // until the session state is authoritative so that layout can never flash or
  // settle into the wrong mode.
  if (!hydrated) {
    return (
      <div className="app-shell relative min-h-screen text-[#1E293B]">
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-screen min-w-0 items-center justify-center">
          <BrandPageLoader />
        </div>
      </div>
    )
  }

  // New accounts enter onboarding once. Completing the review or skipping its
  // final step persists the flag, so learners can edit their profile later.
  if (user && !user.onboardingCompleted && pathname !== '/onboarding' && !pathname.startsWith('/shared/results/')) {
    return <Navigate to="/onboarding" replace />
  }
  if (user?.onboardingCompleted && pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className={`app-shell relative min-h-screen text-[#1E293B] selection:bg-blue-100 ${pathname === '/dashboard' || (pathname === '/' && user) ? 'app-shell-dashboard' : ''}`}>
      {showAmbientBackground ? <AnimatedBackground /> : null}
      <ToastViewport />
      <DeferredRegisterModal />
      <NicknameGate />
      <DeferredAchievementCelebration />
      {!isTestMode ? (
        <>
          <DeferredFloatingAIAssistant />
          {!isExamModeActive ? <DeferredTalkOverlay /> : null}
          {!isExamModeActive ? <FullscreenToggle /> : null}
          <WordLookupLayer />
        </>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1">
          {showSidebar ? <Sidebar concealed={isImmersiveHub} /> : null}

          <main
            className={`min-w-0 w-full flex-1 overflow-x-clip ${
              sidebarVisible ? 'lg:ml-[18.75rem]' : 'ml-0'
            }`}
          >
            <div
              className={`flex min-h-full flex-col ${
                isTestMode
                  ? location.pathname.startsWith('/results/')
                    ? 'min-h-screen overflow-y-auto'
                    : 'min-h-[calc(100vh-80px)]'
                  : 'min-h-screen'
              }`}
            >
              <ErrorBoundary key={location.key}>
                <Suspense fallback={<RouteLoader />}>
                    <Routes location={location}>
                      <Route path="/" element={<AnimatedRoute dashboardEntrance={Boolean(user)}>{user ? <Dashboard /> : <Landing />}</AnimatedRoute>} />
                      <Route path="/dashboard" element={<AnimatedRoute dashboardEntrance><Dashboard /></AnimatedRoute>} />
                      <Route path="/about" element={<AnimatedRoute dashboardEntrance><Dashboard /></AnimatedRoute>} />
                      <Route
                        path="/test-preparation"
                        element={globalJourneyEnabled ? <AnimatedRoute><TestPreparation /></AnimatedRoute> : <Navigate to="/ielts" replace />}
                      />
                      <Route
                        path="/academic-skills"
                        element={globalJourneyEnabled ? <AnimatedRoute><AcademicSkills /></AnimatedRoute> : <Navigate to="/articles" replace />}
                      />
                      <Route path="/tests" element={<Navigate to={globalJourneyEnabled ? '/test-preparation' : '/ielts'} replace />} />
                      <Route
                        path="/tests/:id/attempt"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <TestRunner />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/leaderboard" element={<AnimatedRoute><Leaderboard /></AnimatedRoute>} />
                      <Route path="/mock" element={<Navigate to={globalJourneyEnabled ? '/test-preparation' : '/ielts'} replace />} />
                      <Route
                        path="/mock/ielts"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <MockIELTS />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/mock/ielts/:mockId"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <MockIELTSRun />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/mock/sat"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <MockSAT />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/mock/sat/:mockId"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <MockSAT />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route path="/sat" element={<AnimatedRoute><SAT /></AnimatedRoute>} />
                      <Route path="/sat/mistakes" element={<AnimatedRoute><SATMistakes /></AnimatedRoute>} />
                      <Route
                        path="/sat/mock/:mockId/run"
                        element={
                          <PremiumRoute>
                            <SATMockRun />
                          </PremiumRoute>
                        }
                      />
                      <Route path="/sat/:section" element={<AnimatedRoute><SATSection /></AnimatedRoute>} />
                      <Route path="/sat/calculator" element={<AnimatedRoute><SATCalculator /></AnimatedRoute>} />
                      <Route path="/ielts" element={<AnimatedRoute><IELTS /></AnimatedRoute>} />
                      <Route path="/ielts/writing/tests" element={<AnimatedRoute><IELTSWritingTests /></AnimatedRoute>} />
                      <Route path="/ielts/speaking/tests" element={<AnimatedRoute><IELTSSpeakingTests /></AnimatedRoute>} />
                      <Route path="/ielts/speaking/test/:id" element={<AnimatedRoute><IELTSSpeakingTest /></AnimatedRoute>} />
                      <Route path="/ielts/writing/test/:id" element={<AnimatedRoute><IELTSWritingTest /></AnimatedRoute>} />
                      <Route path="/ielts/:section/tests" element={<AnimatedRoute><IELTSSectionTests /></AnimatedRoute>} />
                      <Route path="/ielts/:section" element={<AnimatedRoute><IELTSSection /></AnimatedRoute>} />
                      <Route
                        path="/vocabulary"
                        element={
                          <AnimatedRoute>
                            <PremiumOnly
                              title="Vocabulary Arena is Premium"
                              description="Grow your word power with the Articles and My-Words vocabulary tracks on ProfAI Premium."
                              perks={['Articles & My-Words tracks', 'Spaced practice activities', 'AI vocabulary help']}
                            >
                              <Vocabulary />
                            </PremiumOnly>
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/:track"
                        element={
                          <AnimatedRoute>
                            <PremiumOnly
                              title="Vocabulary Arena is Premium"
                              description="Grow your word power with the Articles and My-Words vocabulary tracks on ProfAI Premium."
                              perks={['Articles & My-Words tracks', 'Spaced practice activities', 'AI vocabulary help']}
                            >
                              <Vocabulary />
                            </PremiumOnly>
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/ielts/:bookId/:testId/:sectionId"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <VocabularyActivity />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/ielts/:bookId/:testId/:sectionId/:activity"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <VocabularyActivity />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/sat/:packId/:sectionId"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <VocabularyActivity />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/sat/:packId/:sectionId/:activity"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <VocabularyActivity />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/articles"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <ArticlesVocabulary />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/articles/:articleSlug"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <VocabularyActivity />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/articles/:articleSlug/:activity"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <VocabularyActivity />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/my-words"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <MyWordsVocabulary />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/my-words/:wordsContext"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <MyWordsVocabulary />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/vocabulary/my-words/:wordsContext/:activity"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <VocabularyActivity />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route path="/writing-lab" element={<AnimatedRoute><WritingLab /></AnimatedRoute>} />
                      <Route path="/speaking-lab" element={<AnimatedRoute><SpeakingLab /></AnimatedRoute>} />
                      <Route
                        path="/speaking-community"
                        element={
                          <AnimatedRoute><LegacySpeakingRedirect /></AnimatedRoute>
                        }
                      />
                      <Route
                        path="/speaker/:id"
                        element={
                          <AnimatedRoute>
                            <SpeakerProfile />
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/community"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <Community />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/u/:nickname"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <PublicProfile />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/test/:type/:id"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <TestInterface />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/results/:testId"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <Results />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/results/:testId/review"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <ResultsReview />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/shared/results/:shareId" element={<AnimatedRoute><SharedResult /></AnimatedRoute>} />
                      <Route
                        path="/analyze-mistakes"
                        element={
                          <PremiumRoute>
                            <AnimatedRoute>
                              <AnalyzeMistakes />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <PremiumRoute>
                            <AnimatedRoute>
                              <Profile />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />

                      <Route
                        path="/account"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <AccountProfile />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/articles"
                        element={
                          <AnimatedRoute>
                            <Articles />
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/articles/:slug"
                        element={
                          <AnimatedRoute>
                            <ArticleReader />
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/shadowing-lab"
                        element={
                          <AnimatedRoute>
                            <ShadowingLab />
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/podcast"
                        element={
                          <AnimatedRoute>
                            <Podcast />
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/admission"
                        element={
                          <AnimatedRoute>
                            <PremiumOnly
                              title="Application Planning is Premium"
                              description="Guided application lessons and the university research workspace are part of ProfAI Premium."
                              perks={['30+ study-abroad lessons', 'QS university rankings explorer', 'Scholarship & application guidance']}
                            >
                              <Admission />
                            </PremiumOnly>
                          </AnimatedRoute>
                        }
                      />
                      <Route path="/admission/lessons" element={<AnimatedRoute><AdmissionLessons /></AnimatedRoute>} />
                      <Route path="/admission/lessons/:slug" element={<AnimatedRoute><AdmissionLesson /></AnimatedRoute>} />
                      <Route path="/admission/universities" element={<AnimatedRoute><AdmissionUniversities /></AnimatedRoute>} />
                      <Route path="/admission/shortlist" element={<AnimatedRoute><AdmissionUniversities shortlistOnly /></AnimatedRoute>} />
                      <Route path="/admission/universities/:slug" element={<AnimatedRoute><AdmissionUniversity /></AnimatedRoute>} />
                      <Route
                        path="/ai-tutor"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <AITutor />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/premium" element={<AnimatedRoute><Premium /></AnimatedRoute>} />
                      <Route path="/login" element={<AnimatedRoute><Login /></AnimatedRoute>} />
                      <Route path="/register" element={<AnimatedRoute><Register /></AnimatedRoute>} />
                      <Route
                        path="/onboarding"
                        element={
                          <ProtectedRoute>
                            <AnimatedRoute>
                              <Onboarding />
                            </AnimatedRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<AnimatedRoute><NotFound /></AnimatedRoute>} />
                    </Routes>
                </Suspense>
              </ErrorBoundary>

              {!isAuthPage && !isGuestLanding && !isTestMode && !isVocabularyMode && !isTrackMode && !isProfileStandalone && (
                <div className="mt-14">
                  <Footer />
                </div>
              )}
              {showMobileNav ? <div className="h-20 lg:hidden" aria-hidden /> : null}
            </div>
          </main>
        </div>
      </div>
      {showMobileNav ? <MobileBottomNav /> : null}
    </div>
  )
}

export default App
