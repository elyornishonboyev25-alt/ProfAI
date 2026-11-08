import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Profile from '@/pages/Profile'
import i18n from '@/i18n'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'
import type { TestResult } from '@/types/ieltsTypes'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { saveReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { saveWritingAnalysis } from '@/utils/writingAnalysisStorage'
import { getSATReviewTests, isSATTestComplete } from '@/features/sat/catalog'
import { accountStorageFor } from '@/utils/accountStorage'
import { getFullMockCatalog, getFullMockAttempts, retakeFullMock, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import type { WritingEvaluation } from '@/services/geminiAI'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}|{(location.state as { result?: TestResult } | null)?.result?.date ?? ''}</output>
}

export async function run() {
  await i18n.changeLanguage('en')
  localStorage.clear()
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const user: AuthUser = { id: 'results-owner', email: 'results-owner@example.test', fullName: 'Results Owner', role: 'USER', premium: false, xp: 0, level: 1, currentStreak: 0, onboardingCompleted: true }
  const originalGet = apiClient.get
  apiClient.get = (async () => { throw new Error('offline') }) as typeof apiClient.get
  useAuthStore.setState({ user })

  try {
    const reading = resolveIeltsTestById('ielts-listening-3')!
    const answers = Object.fromEntries(reading.sections.flatMap((section) => section.questions.map((question) => [question.id, question.correctAnswer])))
    const result: TestResult = {
      testId: reading.id, date: '2026-09-02T09:00:00.000Z', score: 8.5, correctAnswers: 36, totalQuestions: 40, timeSpent: 1850, answers,
    }
    saveReadingAnalysisHistory({
      userId: user.id, attemptKey: `${reading.id}-${result.date}`, savedAt: result.date, testId: reading.id, testTitle: reading.title,
      score: 8.5, bandScore: 8.5, isPartial: false, accuracy: 90, correctAnswers: 36, totalQuestions: 40, incorrectAnswers: 3,
      skippedAnswers: 1, timeSpent: 1850, sectionSummaries: [], focusAreas: [], incorrectQuestions: [], questionResults: [], resultPayload: result,
    })

    const evaluation = {
      overallBand: 6.5, taskAchievement: 6, coherenceCohesion: 7, lexicalResource: 6.5, grammaticalRange: 6.5,
      summary: 'Clear position.', strengths: [], improvements: [], errors: [], correctedVersion: '',
    } as unknown as WritingEvaluation
    saveWritingAnalysis(user.id, 'writing-test-1', 'Test 1', 'task2', 268, 2400, true, 'Essay', evaluation)

    const sat = getSATReviewTests().find((test) => isSATTestComplete(test) && test.modules.length === 4)!
    const startedAt = new Date('2026-08-15T08:00:00.000Z').getTime()
    // Older installations retained submitted results only in the active slot.
    accountStorageFor(user.id).setItem(`profai:sat:${sat.id}:attempt:v1`, JSON.stringify({
      version: 1, attemptId: `${sat.id}-${startedAt}`, testId: sat.id, mode: 'exam' as never, status: 'submitted',
      currentModuleIndex: 3, currentQuestionIndex: 0, answers: {}, flagged: [], notes: {}, highlights: {},
      startedAt, updatedAt: startedAt + 7_000_000, submittedAt: startedAt + 7_000_000, moduleStartedAt: {}, moduleDeadlines: {},
    }))

    await act(async () => root.render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    ))

    const text = () => container.textContent ?? ''
    assert.ok(text().includes('Every result.'), 'My Results hero renders')
    assert.ok(!container.querySelector('.recharts-wrapper'), 'Charts are no longer rendered')
    const rows = () => [...container.querySelectorAll('.mr-row')]
    assert.equal(rows().length, 3, 'Reading, Writing and SAT results are listed')
    assert.deepEqual(rows().map((row) => row.querySelector('.mr-seq')?.textContent), ['#3', '#2', '#1'], 'Newest first with chronological numbering')
    assert.ok(rows()[1].textContent?.includes('8.5') && rows()[1].textContent?.includes('36/40'), 'Listening band and correct answers are shown')
    assert.ok(rows()[2].textContent?.includes('SAT score'), 'Full SAT shows its 1600-scale score')
    console.log('PASS: chronological IELTS + SAT record without charts')

    const sortButton = container.querySelector<HTMLButtonElement>('.mr-sort')!
    await act(async () => sortButton.click())
    assert.deepEqual(rows().map((row) => row.querySelector('.mr-seq')?.textContent), ['#1', '#2', '#3'], 'Oldest-first ordering')

    const satFilter = [...container.querySelectorAll<HTMLButtonElement>('.mr-filter')].find((button) => button.textContent?.includes('Digital SAT'))!
    await act(async () => satFilter.click())
    assert.equal(rows().length, 1, 'SAT filter isolates SAT results')
    await act(async () => rows()[0].querySelector<HTMLButtonElement>('.mr-analyze')!.click())
    assert.ok(container.querySelector('[data-testid="location"]')?.textContent?.startsWith(`/sat/results/${encodeURIComponent(`${sat.id}-${startedAt}`)}`), 'SAT Analyze opens the exact attempt review without the retired lab')
    console.log('PASS: sorting, filtering and SAT analyze link')

    await act(async () => root.render(
      <MemoryRouter key="listening" initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    ))
    const listeningRow = rows().find((row) => row.textContent?.includes('Listening'))!
    await act(async () => listeningRow.querySelector<HTMLButtonElement>('.mr-analyze')!.click())
    assert.equal(container.querySelector('[data-testid="location"]')?.textContent, `/results/${reading.id}|${result.date}`, 'IELTS Analyze opens that attempt result')

    await act(async () => root.render(
      <MemoryRouter key="writing" initialEntries={['/profile']}>
        <Routes><Route path="/profile" element={<Profile />} /></Routes>
      </MemoryRouter>,
    ))
    const writingRow = rows().find((row) => row.textContent?.includes('Writing'))!
    assert.ok(writingRow.textContent?.includes('6.5') && writingRow.textContent?.includes('268'), 'Writing band and word count are shown')
    await act(async () => writingRow.querySelector<HTMLButtonElement>('.mr-analyze')!.click())
    assert.ok(document.body.textContent?.includes('Writing review'), 'Writing Analyze opens the saved feedback')
    console.log('PASS: IELTS Listening and Writing analyze actions')

    const mock = getFullMockCatalog()[0]
    await act(async () => {
      for (const section of mock.sections) saveFullMockSectionResult(mock.id, section.key, { band: 7, testId: section.key, completedAt: '2026-10-24T10:00:00Z' })
      assert.equal(retakeFullMock(mock.id), true)
    })
    await act(async () => root.render(
      <MemoryRouter key="full-mock" initialEntries={['/profile']}>
        <Routes><Route path="/profile" element={<Profile />} /></Routes>
      </MemoryRouter>,
    ))
    const fullMockHistory = container.querySelector('.mr-mock-row')!
    assert.ok(fullMockHistory, 'Archived full mocks remain accessible in My Results')
    await act(async () => fullMockHistory.querySelector<HTMLButtonElement>('.mr-mock-toggle')!.click())
    const fullReport = [...fullMockHistory.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Full report'))!
    await act(async () => fullReport.click())
    assert.ok(document.querySelector('[aria-label="Saved full mock result"]')?.textContent?.includes('Your overall result.'))
    await act(async () => document.querySelector<HTMLButtonElement>('[aria-label="Saved full mock result"] nav button')!.click())
    assert.equal(document.querySelector('[aria-label="Saved full mock result"]'), null)
    assert.equal(getFullMockAttempts('different-account').length, 0, 'Full mock results stay account scoped')
    console.log('PASS: archived full mock review is accessible from My Results and stays account scoped')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet
    localStorage.clear()
    useAuthStore.setState({ user: null })
  }
}
