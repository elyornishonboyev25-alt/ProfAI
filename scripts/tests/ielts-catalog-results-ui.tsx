import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import IELTSSectionTests from '@/pages/IELTSSectionTests'
import IELTSWritingTests from '@/pages/IELTSWritingTests'
import IELTSSpeakingTests from '@/pages/IELTSSpeakingTests'
import MockIELTS from '@/pages/MockIELTS'
import { useAuthStore } from '@/store/authStore'
import { useSpeakingStore, type SpeakingSessionRecord } from '@/store/speakingStore'
import { accountStorageFor } from '@/utils/accountStorage'
import { getFullMockById, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import { objectiveCatalogResult, writingCatalogResult } from '@/utils/ieltsCatalogResults'
import { getWritingFullTestCatalog } from '@/data/writingTestData'
import type { WritingAnalysisEntry } from '@/utils/writingAnalysisStorage'
import type { ReadingAnalysisHistoryEntry } from '@/utils/readingAnalysisStorage'
import type { AuthUser } from '@/types/platform'
import i18n from '@/i18n'

export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
  const owner = 'catalog-results-owner'
  useAuthStore.setState({ user: { id: owner } as AuthUser })
  const storage = accountStorageFor(owner)
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const mock = getFullMockById('full-mock-1')!
  const listeningId = mock.sections[0].launchPath!.split('/').pop()!
  const readingId = mock.sections[1].launchPath!.split('/').pop()!
  const writing = getWritingFullTestCatalog()[0]
  const summary = (partNumber: number, correctAnswers: number, totalQuestions = 10) => ({ partNumber, correctAnswers, totalQuestions, sectionTitle: `Part ${partNumber}`, incorrectAnswers: totalQuestions - correctAnswers, skippedAnswers: 0, accuracy: correctAnswers / totalQuestions * 100 })
  const attempt = (id: string, date: string, parts: ReturnType<typeof summary>[], partial = true, bandScore = 0): ReadingAnalysisHistoryEntry => ({
    attemptKey: `${id}-${date}`, testId: id, savedAt: date, isPartial: partial, bandScore,
    correctAnswers: parts.reduce((sum, part) => sum + part.correctAnswers, 0), totalQuestions: parts.reduce((sum, part) => sum + part.totalQuestions, 0), sectionSummaries: parts,
  } as ReadingAnalysisHistoryEntry)
  const history = [
    attempt(listeningId, '2026-10-01', [summary(1, 3)]),
    attempt(listeningId, '2026-10-02', [summary(1, 8)]),
    attempt(listeningId, '2026-10-03', [summary(2, 7)]),
    attempt(readingId, '2026-10-04', [summary(1, 10, 13), summary(2, 11, 13), summary(3, 11, 14)], false, 7.5),
  ]
  const render = async (page: React.ReactNode) => {
    await act(async () => root.render(<MemoryRouter>{page}</MemoryRouter>))
  }
  const firstCard = () => element.querySelector<HTMLElement>('.ielts-catalog-card')!
  const clickFilter = async (label: string) => {
    const button = [...element.querySelectorAll<HTMLButtonElement>('[aria-pressed]')].find(item => item.textContent?.trim() === label)!
    assert.ok(button, `Filter ${label} exists`)
    await act(async () => button.click())
  }
  try {
    storage.setItem(`smarttest-reading-analysis-history-v1:${owner}`, JSON.stringify(history))
    await render(<IELTSSectionTests sectionOverride="listening" embedded />)
    assert.match(firstCard().textContent!, /2\/4 parts completed/)
    assert.match(firstCard().textContent!, /15\/20 correct/)
    assert.doesNotMatch(firstCard().textContent!, /Band /, 'partial attempts do not invent a full band')
    await act(async () => {
      storage.setItem(`smarttest-reading-analysis-history-v1:${owner}`, JSON.stringify([...history, attempt(listeningId, '2026-10-05', [summary(3, 9)])]))
      await new Promise(resolve => setTimeout(resolve, 80))
    })
    assert.match(firstCard().textContent!, /3\/4 parts completed/, 'saved progress refreshes without a reload')
    assert.match(firstCard().textContent!, /24\/30 correct/)
    await clickFilter('Part 1')
    assert.match(firstCard().textContent!, /Completed/)
    assert.match(firstCard().textContent!, /8\/10 correct/, 'a retaken part uses its latest result once')
    assert.doesNotMatch(firstCard().textContent!, /2\/4 parts|Band /)
    await render(<IELTSSectionTests key="reading" sectionOverride="reading" embedded />)
    assert.match(firstCard().textContent!, /Band 7\.5/)
    assert.match(firstCard().textContent!, /32\/40 correct/)
    const zero = objectiveCatalogResult([attempt(listeningId, '2026-10-05', [summary(1, 0, 40)], false)], listeningId, 4)
    assert.equal(zero.band, 0, 'zero is a valid completed band')
    const allParts = objectiveCatalogResult([attempt(listeningId, '2026-10-05', [1, 2, 3, 4].map(part => summary(part, 5)))], listeningId, 4)
    assert.equal(allParts.band, undefined, 'separate part practice is not a scored full attempt')

    const task1 = { attemptKey: 'writing-task1', testId: writing.tasks[0].id, savedAt: '2026-10-01', overallBand: 6.5, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 7 } as WritingAnalysisEntry
    storage.setItem(`smarttest-writing-analysis-v1:${owner}`, JSON.stringify([task1]))
    await render(<IELTSWritingTests embedded />)
    assert.match(firstCard().textContent!, /1\/2 tasks completed/)
    assert.doesNotMatch(firstCard().textContent!, /Band /)
    await clickFilter('Task 1')
    assert.match(firstCard().textContent!, /Band 6\.5/)
    const task2 = { ...task1, testId: writing.tasks[1].id, savedAt: '2026-10-02', overallBand: 6.5, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 7 }
    assert.equal(writingCatalogResult([{ ...task1, overallBand: 6, grammaticalRange: 6 }, task2], writing).band, 6, 'combined Writing preserves criterion means until final rounding')
    storage.setItem(`smarttest-writing-analysis-v1:${owner}`, JSON.stringify([{ ...task1, fullTest: { id: writing.id, overallBand: 7 } }]))
    await render(<IELTSWritingTests key="full-writing" embedded />)
    assert.match(firstCard().textContent!, /Band 7\.0/)

    useSpeakingStore.setState({ sessions: [
      { id: 'own', userId: owner, modeLabel: 'Speaking Full Mock 1', date: '2026-10-04', overallBand: 7.5 },
      { id: 'other', userId: 'another', modeLabel: 'Speaking Full Mock 1', date: '2026-10-05', overallBand: 9 },
    ] as SpeakingSessionRecord[] })
    await render(<IELTSSpeakingTests embedded />)
    assert.match(firstCard().textContent!, /Band 7\.5/)
    assert.doesNotMatch(firstCard().textContent!, /Band 9/)
    storage.setItem('profai:speaking:day:speaking-day-1', JSON.stringify({ finished: true, evaluation: { source: 'ai', overallBand: 6 } }))
    await clickFilter('Part 1')
    // Allow the account-data notification to refresh cached rows.
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)) })
    assert.match(firstCard().textContent!, /Band 6\.0/, 'old daily attempts retain their scores')

    storage.removeItem(`smarttest-reading-analysis-history-v1:${owner}`)
    saveFullMockSectionResult(mock.id, 'listening', { band: 7.5, testId: listeningId, completedAt: '2026-10-05', result: { testId: listeningId, date: '2026-10-05', score: 7.5, correctAnswers: 33, totalQuestions: 40, timeSpent: 1000, answers: { q1: 'answer' } } })
    await render(<IELTSSectionTests key="mock-listening" sectionOverride="listening" embedded />)
    assert.match(firstCard().textContent!, /Band 7\.5/, 'a mock section appears without standalone analysis history')
    assert.match(firstCard().textContent!, /33\/40 correct/)

    saveFullMockSectionResult(mock.id, 'listening', { band: 7, testId: listeningId, completedAt: '2026-10-05' })
    saveFullMockSectionResult(mock.id, 'reading', { band: 7.5, testId: readingId, completedAt: '2026-10-05' })
    await render(<MockIELTS embedded />)
    assert.match(firstCard().textContent!, /2\/4 completed/)
    assert.doesNotMatch(firstCard().textContent!, /Overall \d/, 'two sections cannot produce an overall')
    await act(async () => {
      saveFullMockSectionResult(mock.id, 'writing', { band: 6.5, testId: writing.id, completedAt: '2026-10-05' })
      saveFullMockSectionResult(mock.id, 'speaking', { band: 0, assessmentStatus: 'pending', testId: 'speaking-full-1', completedAt: '2026-10-05' })
    })
    assert.match(firstCard().textContent!, /4\/4 completed/)
    assert.match(firstCard().textContent!, /Assessment pending/)
    assert.doesNotMatch(firstCard().textContent!, /Overall \d/)
    await act(async () => saveFullMockSectionResult(mock.id, 'speaking', { band: 7.5, assessmentStatus: 'graded', testId: 'speaking-full-1', completedAt: '2026-10-05' }))
    assert.match(firstCard().textContent!, /Overall 7\.0/)
    await act(async () => useAuthStore.setState({ user: { id: 'another' } as AuthUser }))
    assert.doesNotMatch(firstCard().textContent!, /Overall \d|4\/4 completed/, 'switching accounts clears the mock score')
    console.log('PASS: all four catalogs show saved bands, partial question counts avoid duplicate parts, Writing weighting is preserved, and mock overall requires four assessed sections')
  } finally {
    await act(async () => root.unmount())
    useAuthStore.setState({ user: null })
    useSpeakingStore.setState({ sessions: [] })
    localStorage.clear()
  }
}
