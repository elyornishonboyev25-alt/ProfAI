import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { TopNavigation } from '@/components/layout/TopNavigation'
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
import RegisterModal from '@/components/auth/RegisterModal'
import FloatingAIAssistant from '@/components/ai/FloatingAIAssistant'
import TalkOverlay from '@/components/ai/TalkOverlay'
import FullscreenToggle from '@/components/common/FullscreenToggle'
import WordLookupLayer from '@/components/vocab/WordLookupLayer'
import NicknameGate from '@/components/speaking/NicknameGate'
import AchievementCelebration from '@/components/achievements/AchievementCelebration'
import { sendHeartbeat } from '@/lib/speakingApi'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { addTrackedMinutes, routeToActivityKey } from '@/utils/weeklyPlanner'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Landing = lazy(() => import('@/pages/Landing'))
const Tests = lazy(() => import('@/pages/Tests'))
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
const SpeakingCommunity = lazy(() => import('@/pages/SpeakingCommunity'))
const SpeakerProfile = lazy(() => import('@/pages/SpeakerProfile'))
const PublicProfile = lazy(() => import('@/pages/PublicProfile'))
const Community = lazy(() => import('@/pages/Community'))
const Mock = lazy(() => import('@/pages/Mock'))
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

const prefetchHighTrafficRoutes = () =>
  Promise.allSettled([
    import('@/pages/Tests'),
    import('@/pages/Leaderboard'),
    import('@/pages/SpeakingCommunity'),
    import('@/pages/Mock'),
    import('@/pages/AccountProfile'),
    import('@/pages/Profile'),
    import('@/pages/IELTS'),
    import('@/pages/SAT'),
  ])

function toDateISO(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function RouteLoader() {
  return <BrandPageLoader />
}

function AnimatedRoute({ children }: { children: ReactNode }) {
  const { minimalMotion } = useMotionPreferences()

  if (minimalMotion) {
    return <div className="h-full">{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

function App() {
  const location = useLocation()
  const pathname = location.pathname
  const user = useAuthStore((state: AuthState) => state.user)

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isLanding = pathname === '/' || pathname === '/dashboard' || pathname === '/about'
  // Guests at the root get the full-bleed marketing landing (its own nav + footer),
  // so the global top-nav and footer chrome are suppressed there.
  const isGuestLanding = pathname === '/' && !user
  const isVocabularyMode = pathname === '/vocabulary' || pathname.startsWith('/vocabulary/')
  const isProfileStandalone = pathname === '/profile'
  const isStandaloneMode = pathname === '/account'
  const isTrackMode =
    isStandaloneMode ||
    pathname.startsWith('/mock') ||
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
    pathname.startsWith('/admission')
  const isCustomTestMode =
    /^\/tests\/[^/]+\/attempt$/.test(pathname) ||
    /^\/mock\/sat(?:\/\d+)?$/.test(pathname) ||
    /^\/sat\/mock\/\d+\/run$/.test(pathname)
  const isClassicTestMode = pathname.startsWith('/test/') || pathname.startsWith('/results/') || pathname.startsWith('/shared/results/')
  const isTestMode = isCustomTestMode || isClassicTestMode

  // Authenticated pages use one persistent workspace sidebar. The old dashboard
  // top bar duplicated the same destinations and made the layout jump between
  // sections, so it is intentionally kept only out of the app workspace.
  const showTopNavigation = false
  // `/` renders the authenticated dashboard too. Keep it inside the same
  // workspace shell so opening the site never flashes the standalone version.
  const sidebarRoutes = new Set(['/', '/dashboard', '/tests', '/ai-tutor'])
  const showSidebar =
    Boolean(user) &&
    !isAuthPage &&
    !isGuestLanding &&
    !isTestMode &&
    sidebarRoutes.has(pathname)
  // Standalone prep/content screens expose their own Dashboard back action.
  const showMobileNav = Boolean(user) && showSidebar

  useEffect(() => {
    const connection = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    const slowConnection =
      connection.connection?.saveData === true ||
      connection.connection?.effectiveType === 'slow-2g' ||
      connection.connection?.effectiveType === '2g'

    if (slowConnection) return

    const runPrefetch = () => {
      void prefetchHighTrafficRoutes()
    }

    if (typeof window.requestIdleCallback === 'function') {
      const callbackId = window.requestIdleCallback(runPrefetch, { timeout: 2500 })
      return () => window.cancelIdleCallback(callbackId)
    }

    const timeoutId = window.setTimeout(runPrefetch, 600)
    return () => window.clearTimeout(timeoutId)
  }, [])

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

  // Presence heartbeat — keeps "online now" / "last seen" accurate for the community.
  useEffect(() => {
    if (!user) return
    void sendHeartbeat()
    const id = window.setInterval(() => {
      if (!document.hidden) void sendHeartbeat()
    }, 60000)
    return () => window.clearInterval(id)
  }, [user?.id])

  // Onboarding is a required, server-backed one-time contract. Once completed,
  // the flag travels with the account and this guard never interrupts the user again.
  if (user && !user.onboardingCompleted && pathname !== '/onboarding' && !pathname.startsWith('/shared/results/')) {
    return <Navigate to="/onboarding" replace />
  }
  if (user?.onboardingCompleted && pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="app-shell relative min-h-screen text-[#1E293B] selection:bg-red-100">
      <AnimatedBackground />
      <ToastViewport />
      <RegisterModal />
      <NicknameGate />
      <AchievementCelebration />
      {!isTestMode ? (
        <>
          <FloatingAIAssistant />
          <TalkOverlay />
          <FullscreenToggle />
          <WordLookupLayer />
        </>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-col">
        {showTopNavigation && <TopNavigation />}

        <div className="flex flex-1">
          <AnimatePresence initial={false}>
            {showSidebar ? <Sidebar key="workspace-sidebar" /> : null}
          </AnimatePresence>

          <main
            className={`w-full flex-1 transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              showSidebar ? 'lg:ml-64' : 'ml-0'
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
              <ErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <AnimatePresence mode="wait" initial={false}>
                    <Routes location={location} key={location.pathname}>
                      <Route path="/" element={<AnimatedRoute>{user ? <Dashboard /> : <Landing />}</AnimatedRoute>} />
                      <Route path="/dashboard" element={<AnimatedRoute><Dashboard /></AnimatedRoute>} />
                      <Route path="/about" element={<AnimatedRoute><Dashboard /></AnimatedRoute>} />
                      <Route path="/tests" element={<AnimatedRoute><Tests /></AnimatedRoute>} />
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
                      <Route
                        path="/mock"
                        element={
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <Mock />
                            </AnimatedRoute>
                          </PremiumRoute>
                        }
                      />
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
                          <PremiumRoute showGuestBanner>
                            <AnimatedRoute>
                              <SpeakingCommunity />
                            </AnimatedRoute>
                          </PremiumRoute>
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
                            <PremiumOnly
                              title="Reading Library is Premium"
                              description="A curated library of articles with a professional reader and AI vocabulary help is part of ProfAI Premium."
                              perks={['Curated reading library', 'Highlight, notes & contrast modes', 'Ask-AI vocabulary help']}
                            >
                              <Articles />
                            </PremiumOnly>
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/articles/:slug"
                        element={
                          <AnimatedRoute>
                            <PremiumOnly
                              title="Reading Library is Premium"
                              description="Open the full professional reader with AI vocabulary help on ProfAI Premium."
                              perks={['Professional reader', 'Highlight & notes', 'Ask-AI vocabulary help']}
                            >
                              <ArticleReader />
                            </PremiumOnly>
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/shadowing-lab"
                        element={
                          <AnimatedRoute>
                            <PremiumOnly
                              title="Shadowing Lab is Premium"
                              description="Turn any English YouTube video into line-by-line shadowing practice on ProfAI Premium."
                              perks={['Paste any English YouTube link', 'AI splits it into shadowing lines', 'Loop, slow down, record & compare']}
                            >
                              <ShadowingLab />
                            </PremiumOnly>
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/podcast"
                        element={
                          <AnimatedRoute>
                            <PremiumOnly
                              title="English Podcasts are Premium"
                              description="Build listening with subtitled English podcasts, speed control and A-B repeat on ProfAI Premium."
                              perks={['English captions', 'Adjustable playback speed', 'A-B loop repeat']}
                            >
                              <Podcast />
                            </PremiumOnly>
                          </AnimatedRoute>
                        }
                      />
                      <Route
                        path="/admission"
                        element={
                          <AnimatedRoute>
                            <PremiumOnly
                              title="Admission Hub is Premium"
                              description="Study-abroad lessons and the QS university explorer are part of ProfAI Premium."
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
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>

              {!isAuthPage && !isGuestLanding && !isTestMode && !isVocabularyMode && !isTrackMode && !isProfileStandalone && (
                <div className="mt-14">
                  <Footer />
                </div>
              )}
              {showMobileNav ? <div className="h-20 md:hidden" aria-hidden /> : null}
            </div>
          </main>
        </div>
      </div>
      {showMobileNav ? <MobileBottomNav /> : null}
    </div>
  )
}

export default App







