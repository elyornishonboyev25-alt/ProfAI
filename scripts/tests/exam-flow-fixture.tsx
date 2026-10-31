import { HARD_QUESTIONS } from '@/features/sat/hardQuestions'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'
import IELTSReadingInterface from '@/components/IELTSReadingInterface'
import IELTSTestLibrary from '@/pages/IELTSTestLibrary'
import AttemptEntryBoundary from '@/components/tests/AttemptEntryBoundary'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import Results from '@/pages/Results'
import TestInterface from '@/pages/TestInterface'
import SATHardQuestions from '@/pages/SATHardQuestions'
import MockSAT from '@/pages/MockSAT'
import SATMockRun from '@/pages/SATMockRun'
import SATSection from '@/pages/SATSection'
import InProcessTests from '@/pages/InProcessTests'
import InProcessPanel from '@/components/tests/InProcessPanel'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { buildReadingRoadmapFullTest } from '@/utils/generatedIeltsTests'
import { saveReviewState } from '@/utils/resultsReviewState'
import { accountStorageFor } from '@/utils/accountStorage'
import { saveIeltsAttemptResume } from '@/utils/ieltsAttemptResume'
import { saveActiveTestPaper } from '@/utils/activeTestPaper'
import { createSATAttempt } from '@/features/sat/practiceTest4'
import { SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { saveSATAttempt } from '@/features/sat/attemptStorage'
import i18n from '@/i18n'
import '@/index.css'
import '@/styles/premium-identity.css'
import '@/styles/ivygoo-glass.css'

Object.assign(window, { hardRows: HARD_QUESTIONS })
const owner = 'flow-browser-fixture'
useAuthStore.setState({ user: { id: owner, fullName: 'Demo Learner', email: 'demo@example.test', role: 'USER' } as never })
void i18n.changeLanguage('en')
const paper = buildReadingRoadmapFullTest(2)!
const questions = paper.sections.flatMap(section => section.questions)
const result = { testId: paper.id, date: '2026-10-31T09:00:00Z', score: 7.5, correctAnswers: 32, totalQuestions: 40, timeSpent: 1830,
  answers: Object.fromEntries(questions.slice(0, 35).map((question, index) => [question.id, index < 32 ? question.correctAnswer : 'wrong'])) }
saveReviewState(paper.id, { result, test: paper })
const storage = accountStorageFor(owner)
const draftKey = `ielts_test_session_${paper.id}`
if (window.location.pathname === '/test/listening/ielts-listening-1' && new URLSearchParams(window.location.search).get('part') === '4') {
  const listening = resolveIeltsTestById('ielts-listening-1')!
  const key = `ielts_test_session_${listening.id}`
  if (!storage.getItem(key)) {
    storage.setItem(key, JSON.stringify({ isTestActive:true, testMode:'practice', selectedParts:[0,1,2,3], partsSelectionVersion:2, currentSectionIndex:3, answers:{}, elapsedSeconds:120, timeRemaining:-1 }))
    saveActiveTestPaper(key, listening, owner)
  }
}
if (!sessionStorage.getItem('flow-fixture-initialized')) {
  storage.setItem(draftKey, JSON.stringify({ isTestActive: true, testMode: 'practice', selectedParts: [0,1,2], partsSelectionVersion: 2,
    timeRemaining: 2400, deadline: Date.now() + 2_400_000, elapsedSeconds: 1200, answers: { [questions[0].id]: 'Saved answer' } }))
  saveActiveTestPaper(draftKey, paper, owner)
  saveIeltsAttemptResume(owner, { sessionKey: draftKey, title: paper.title, pathname: `/test/reading/${paper.id}`, search: '', state: null })
  const sat = SAT_TEST_CATALOG[3]
  const attempt = createSATAttempt(sat.id, sat.modules, 'practice')
  attempt.answers[sat.modules[0].questions[0].id] = 'A'
  saveSATAttempt(attempt)
  const completedSat = SAT_TEST_CATALOG[1]
  const completedAttempt = createSATAttempt(completedSat.id, completedSat.modules, 'practice')
  completedAttempt.status = 'submitted'
  completedAttempt.submittedAt = Date.parse('2026-10-31T09:00:00Z')
  completedAttempt.answers = Object.fromEntries(completedSat.modules.flatMap(module => module.questions).slice(0, 30).map(question => [question.id, question.correctAnswer]))
  saveSATAttempt(completedAttempt)
  sessionStorage.setItem('flow-fixture-initialized', 'true')
}
apiClient.get = (async (path: string) => {
  if (path.includes('/standing')) return { participants: 3, average: 7.2, percentiles: { total:null,rw:null,math:null }, me: null,
    rows: ['Demo Learner', 'Aziza Karimova', 'Sam Williams'].map((name, index) => ({ rank:index+1,name,nickname:null,avatarUrl:null,country:'Uzbekistan',total:8-index*.5,maxScore:9,rw:null,math:null,correct:35-index*3,durationSec:1800+index*45,completedAt:'2026-10-31T09:00:00Z',isMe:index===0 })) }
  return null
}) as typeof apiClient.get
apiClient.post = (async (path: string) => path === '/ai/generate' ? { text: JSON.stringify({ term:'evidence', partOfSpeech:'noun', definition:'Facts that support an idea.', example:'We found evidence in the passage.', synonym:'proof', explanation:'Evidence means facts that help show whether something is true.' }) } : {}) as typeof apiClient.post

function Workspace() {
  const navigate = useNavigate()
  const { id } = useParams()
  const test = resolveIeltsTestById(id ?? '')
  if (test && new URLSearchParams(window.location.search).get('part') === '4' && !storage.getItem(`ielts_test_session_${test.id}`)) {
    const key = `ielts_test_session_${test.id}`
    storage.setItem(key, JSON.stringify({ isTestActive:true, testMode:'practice', selectedParts:[0,1,2,3], partsSelectionVersion:2, currentSectionIndex:3, answers:{}, elapsedSeconds:120, timeRemaining:-1 }))
    saveActiveTestPaper(key, test, owner)
  }
  return test ? <AttemptEntryBoundary exam="IELTS"><IELTSReadingInterface test={test} onExit={() => window.location.assign('/')} onComplete={result => { (window as unknown as { lastResult: unknown }).lastResult = result; saveReviewState(test.id, { result, test }); navigate(`/results/${test.id}`, { state:{ result, test, returnTo:'/profile' } }) }} /></AttemptEntryBoundary> : <p>Unknown paper</p>
}
function Home() { return <main className="exam-flow p-8"><h1 className="text-3xl font-bold mb-6">Exam flow verification</h1><div className="flex flex-wrap gap-3"><Link className="flow-button" to={`/results/${paper.id}`} state={{ result, test: paper, returnTo: '/profile' }}>Reading result</Link><Link className="flow-button" to="/sat/hard-questions">Hard Questions</Link><Link className="flow-button" to="/in-process">In process</Link><Link className="flow-button" to="/mock/sat/3">SAT launch</Link></div></main> }
createRoot(document.getElementById('root')!).render(<BrowserRouter><Routes>
  <Route path="/workspace/:id" element={<Workspace />} /><Route path="/ielts/tests" element={<IELTSTestLibrary />} />
  <Route path="/" element={<Home />} /><Route path="/profile" element={<Home />} />
  <Route path="/results/:testId" element={<Results />} /><Route path="/test/:type/:id" element={<TestInterface />} />
  <Route path="/sat/in-process" element={<InProcessTests />} />
  <Route path="/sat/mock/:mockId/run" element={<SATMockRun />} />
  <Route path="/sat/:section" element={<SATSection />} />
  <Route path="/sat/hard-questions" element={<SATHardQuestions />} /><Route path="/mock/sat/:mockId" element={<MockSAT />} />
  <Route path="/in-process" element={<main className="p-6 mx-auto max-w-6xl"><InProcessPanel exam="IELTS" showEmpty /><InProcessPanel exam="SAT" showEmpty /></main>} />
  <Route path="*" element={<Home />} />
</Routes></BrowserRouter>)
