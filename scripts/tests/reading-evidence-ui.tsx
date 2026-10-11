import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import '@/i18n'
import Results from '@/pages/Results'
import ResultsReview from '@/pages/ResultsReview'
import TestInterface from '@/pages/TestInterface'
import ReadingInterface from '@/components/IELTSReadingInterface'
import { getIeltsReadingUnifiedCatalog } from '@/utils/ieltsTrackCatalog'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { findSourceRanges, resolveAnswerEvidence, sourceBlocks } from '@/utils/answerEvidence'
import { readingAnswerEvidence, readingEvidenceKeyConflicts } from '@/data/readingAnswerEvidence'
import { parseSectionParagraphs } from '@/utils/readingReview'
import { saveReviewState } from '@/utils/resultsReviewState'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getFullMockById, getFullMockOverallBand, getFullMockResults, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import { evaluateReadingAnswers } from '@/utils/ieltsUtils'
import type { Question, Section, TestResult } from '@/types/ieltsTypes'

const q = (changes: Partial<Question> = {}): Question => ({ id: 'fixture-q', number: 1, text: 'The ___ is useful.', type: 'note-completion', correctAnswer: 'art', ...changes })
const s = (changes: Partial<Section> = {}): Section => ({ id: 'fixture-p', title: 'Original passage', content: 'Earth is large.\n\nArt is useful.', questions: [q()], ...changes })

export async function run() {
  assert.deepEqual(findSourceRanges('The Earth has art.', 'art'), [{ start: 14, end: 17 }], 'whole word matching excludes a substring inside Earth')
  const typography = 'An artist’s well–known\n  rôle.'
  const normalized = findSourceRanges(typography, "artist's well-known role")[0]
  assert.equal(typography.slice(normalized.start, normalized.end), 'artist’s well–known\n  rôle', 'typography normalization keeps original offsets')
  assert.equal(resolveAnswerEvidence(s(), q()).ranges[0].blockId, 'paragraph-1')
  assert.equal(resolveAnswerEvidence(s({ content: 'Art here.\n\nArt there.' }), q()).state, 'unavailable', 'a repeated answer without a source location is never guessed')
  assert.equal(resolveAnswerEvidence(s({ content: 'Art here.\n\nArt there.' }), q({ location: 'Paragraph 2' })).ranges[0].blockId, 'paragraph-1')
  assert.equal(resolveAnswerEvidence(s(), q({ correctAnswer: 'NOT GIVEN', type: 'true-false-not-given' })).ranges.length, 0)
  const paragraphs = parseSectionParagraphs(s({ content: 'A newborn introduction.\n\nA First paragraph.\n\nContinuation.\n\nB Second paragraph.' }))
  assert.deepEqual(paragraphs.map(p => p.label), ['TEXT-1', 'A', 'B'])
  assert.ok(paragraphs[1].content.includes('Continuation.'))
  const grouped = resolveAnswerEvidence(s({ content: 'Red followed by blue.' }), q({ correctAnswer: ['red', 'blue'] }))
  assert.deepEqual(grouped.ranges.map(range => range.answerIndex), [0, 1], 'each grouped blank retains its own number')
  const scoped = resolveAnswerEvidence(s({ paragraphs: [{ label: 'A', content: 'Art one.' }, { label: 'B', content: 'Art two.' }] }), q({ answerEvidence: [{ quote: 'Art', paragraphLabel: 'B' }] }))
  assert.deepEqual(scoped.ranges.map(range => range.blockId), ['paragraph-1'])
  const multipleLocations = resolveAnswerEvidence(s({ paragraphs: ['A', 'B', 'D'].map(label => ({ label, content: `${label} source paragraph.` })) }), q({ type: 'true-false-not-given', correctAnswer: 'TRUE', location: 'Paragraphs A and B' }))
  assert.deepEqual(multipleLocations.ranges.map(range => range.blockId), ['paragraph-0', 'paragraph-1'], 'the word and must not be interpreted as paragraph D')

  const missing = new Set(['rd28-q4', 'rd28-q5', 'rd28-q6', 'rd28-q7', 'rd28-q8', 'rd28-q9'])
  const seenQuotes = new Set<string>()
  let checked = 0
  for (const card of getIeltsReadingUnifiedCatalog()) {
    const test = resolveIeltsTestById(card.testId)!
    for (const section of test.sections) for (const question of section.questions) {
      const evidence = resolveAnswerEvidence(section, question)
      if (missing.has(question.id)) assert.equal(evidence.state, 'unavailable', `${question.id}: incomplete source is reported`)
      else assert.notEqual(evidence.state, 'unavailable', `${question.id}: every available source has evidence or a deliberate absence explanation`)
      const correction = readingEvidenceKeyConflicts[question.id]
      if (correction) {
        assert.equal(question.correctAnswer, correction.sourceAnswer, `${question.id}: catalog uses the verified key`)
        assert.notEqual(evidence.state, 'key-conflict', `${question.id}: corrected keys no longer report conflicts`)
        if (!missing.has(question.id)) assert.equal(evidence.state, 'answer', `${question.id}: corrected key highlights the exact source`)
        assert.equal(resolveAnswerEvidence(section, { ...question, correctAnswer: correction.storedAnswer }).state, 'key-conflict', 'obsolete snapshots must not highlight evidence for a wrong key')
        const grade = (answer: string) => evaluateReadingAnswers([section], { [question.id]: answer }).questionResults.find(item => item.questionId === question.id)!.status
        assert.equal(grade(correction.sourceAnswer), 'correct', `${question.id}: the source answer earns a mark`)
        assert.equal(grade(correction.storedAnswer), 'incorrect', `${question.id}: the obsolete key no longer earns a mark`)
      }
      if (evidence.state === 'not-given' || evidence.state === 'not-mentioned' || evidence.state === 'key-conflict') assert.equal(evidence.ranges.length, 0)
      for (const range of evidence.ranges) {
        const block = evidence.blocks.find(b => b.id === range.blockId)!
        assert.ok(range.start >= 0 && range.end <= block.text.length && range.end > range.start, `${question.id}: valid original offsets`)
      }
      for (const quote of readingAnswerEvidence[question.id] ?? []) {
        assert.ok(sourceBlocks(section).some(block => findSourceRanges(block.text, quote).length), `${question.id}: reviewed quotation is present verbatim: ${quote}`)
        seenQuotes.add(question.id)
      }
      checked++
    }
  }
  assert.deepEqual([...seenQuotes].sort(), Object.keys(readingAnswerEvidence).sort(), 'no orphan evidence keys')
  console.log(`PASS: ${checked} full-catalog questions, exact source offsets, reviewed quotations, absent information and six corrected answer keys`)

  const container = document.getElementById('root')!
  let root: ReturnType<typeof createRoot> | undefined
  async function render(node: React.ReactNode) {
    if (root) await act(async () => root!.unmount())
    root = createRoot(container)
    await act(async () => root!.render(node))
  }
  const test = resolveIeltsTestById('ielts-reading-full-vol26')!
  const result: TestResult = { testId: test.id, date: '2026-10-11T12:00:00Z', score: 0, correctAnswers: 0, totalQuestions: 40, timeSpent: 3600, answers: { 'rd26-q19': 'physical harm' } }
  const mark = () => container.querySelector<HTMLElement>('[data-answer-evidence]')
  try {
    localStorage.clear(); window.sessionStorage.clear()
    for (const testId of ['ielts-reading-full-vol25', 'ielts-reading-full-vol28']) {
      const current = resolveIeltsTestById(testId)!
      const old = structuredClone(current)
      const answers: Record<string, string> = {}
      for (const section of old.sections) for (const question of section.questions) {
        const correction = readingEvidenceKeyConflicts[question.id]
        if (!correction) continue
        question.correctAnswer = correction.storedAnswer
        answers[question.id] = correction.sourceAnswer
      }
      const saved: TestResult = { ...result, testId, answers, detailedBreakdown: { readingAnalysis: evaluateReadingAnswers(old.sections, answers) } }
      const mockId = 'full-mock-1'
      assert.ok(getFullMockById(mockId))
      saveFullMockSectionResult(mockId, 'reading', { band: saved.score, testId, completedAt: saved.date, result: saved })
      for (const skill of ['listening', 'writing', 'speaking'] as const) saveFullMockSectionResult(mockId, skill, { band: 7, testId: skill, completedAt: saved.date })
      const expectedBand = testId.endsWith('25') ? 2 : 2.5
      assert.equal(getFullMockResults(mockId).reading?.band, expectedBand, 'saved mock Reading band regrades from the corrected catalog')
      assert.equal(getFullMockResults(mockId).reading?.result?.correctAnswers, Object.keys(answers).length)
      assert.equal(getFullMockOverallBand(mockId), Math.round((21 + expectedBand) / 4 * 2) / 2, 'overall mock band uses the corrected Reading score')
      await render(<MemoryRouter initialEntries={[{ pathname: `/results/${testId}`, state: { test: old, result: saved, mock: { id: 'completed-mock' } } }]}><Routes><Route path="/results/:testId" element={<Results />} /></Routes></MemoryRouter>)
      for (const id of Object.keys(answers)) {
        const number = current.sections.flatMap(section => section.questions).find(question => question.id === id)!.number
        const card = container.querySelector<HTMLButtonElement>(`[aria-label="Review question ${number} in passage"]`)!
        assert.ok(card.textContent?.includes('Status: correct'), `${id}: saved Answer Sheet regrades with the corrected catalog`)
      }
      const history = getReadingAnalysisHistory().find(entry => entry.testId === testId)!
      assert.equal(history.correctAnswers, Object.keys(answers).length)
      assert.equal(history.resultPayload?.correctAnswers, Object.keys(answers).length, 'saved review totals agree with the corrected cards')
      assert.equal(history.resultPayload?.score, expectedBand, 'a stale band is recalculated after corrected keys change the score')
    }
    localStorage.clear(); window.sessionStorage.clear()
    await render(<MemoryRouter initialEntries={[{ pathname: `/results/${test.id}`, state: { result, test } }]}><Routes>
      <Route path="/results/:testId" element={<Results />} />
      <Route path="/test/:type/:id" element={<TestInterface />} />
    </Routes></MemoryRouter>)
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Review question 19 in passage"]')!.click())
    assert.ok(container.querySelector('#question-card-rd26-q19'), 'Answer Sheet opens the exact question and part')
    assert.equal(container.querySelector<HTMLInputElement>('[aria-label="Answer for question 19"]')!.value, 'physical harm', 'the original submitted answer is preserved')
    assert.ok(mark()?.textContent?.includes('physical health'), 'evidence uses the correct answer, not the submitted wrong word')
    assert.equal(mark()?.querySelector('[data-question-number]')?.getAttribute('data-question-number'), '19')
    assert.ok(container.querySelector<HTMLInputElement>('[aria-label="Answer for question 19"]')!.disabled, 'review stays read only')
    const toggle = () => [...container.querySelectorAll('button')].find(button => /(?:Hide|Show) Correct Answers/.test(button.textContent ?? ''))!
    await act(async () => toggle().click())
    assert.equal(mark(), null, 'hide answers also hides highlights')
    await act(async () => toggle().click())
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Show evidence for question 21"]')!.click())
    assert.equal(mark()?.getAttribute('data-answer-evidence'), 'rd26-q21', 'question action selects its source evidence')

    const directReview = () => <MemoryRouter initialEntries={[{ pathname: '/mock/review', key: 'saved-review' }]}><ReadingInterface test={test}
      reviewPayload={{ result, showCorrectAnswers: true, initialQuestionId: 'rd26-q19' }} fullMockId="completed-mock"
      onComplete={() => { throw new Error('Review must never submit a mock') }} onExit={() => {}} /></MemoryRouter>
    window.sessionStorage.clear()
    await render(directReview())
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Next')!.click())
    assert.equal(mark()?.getAttribute('data-answer-evidence'), 'rd26-q20')
    await render(directReview())
    assert.equal(mark()?.getAttribute('data-answer-evidence'), 'rd26-q20', 'reloading preserves the last reviewed question')
    const stale = structuredClone(test)
    stale.sections[1].questions.find(question => question.id === 'rd26-q19')!.text = 'Obsolete saved question'
    saveReviewState(test.id, { test: stale, result: { ...result, detailedBreakdown: { readingAnalysis: evaluateReadingAnswers(stale.sections, result.answers) } } })
    await render(<MemoryRouter initialEntries={[{ pathname: `/results/${test.id}/review`, state: { initialQuestionId: 'rd26-q19' } }]}><Routes><Route path="/results/:testId/review" element={<ResultsReview />} /></Routes></MemoryRouter>)
    assert.ok(!container.textContent!.includes('Obsolete saved question'))
    assert.equal(mark()?.getAttribute('data-answer-evidence'), 'rd26-q19', 'saved attempts use current catalog evidence')
    console.log('PASS: corrected saved/full-mock grading and bands, Answer Sheet navigation, correct source pairing, hiding, question actions and saved/reloaded attempts')
  } finally {
    if (root) await act(async () => root!.unmount())
    localStorage.clear(); window.sessionStorage.clear()
  }
}
