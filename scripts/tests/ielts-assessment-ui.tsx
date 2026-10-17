import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { evaluateSpeaking, type SpeakingEvaluation } from '@/services/speakingAI'
import { analyseTranscript, estimateBandsFromStats } from '@/lib/speakingScoring'
import { writingSectionBand, writingVisualContext } from '@/lib/writingScoring'
import { getWritingTaskById } from '@/data/writingTestData'
import type { WritingEvaluation } from '@/services/geminiAI'
import SpeakingResult from '@/components/speaking/SpeakingResult'
import { saveWritingAnalysis, getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import WritingScoreExplanation from '@/components/writing/WritingScoreExplanation'
import IELTSSpeakingTest from '@/pages/IELTSSpeakingTest'
import { findIeltsSpeakingDay } from '@/utils/ieltsSpeakingCatalog'
import { accountStorageFor } from '@/utils/accountStorage'
import i18n from '@/i18n'

export async function run() {
  const originalPost = apiClient.post
  Object.defineProperty(globalThis, 'FileReader', { value: window.FileReader, configurable: true })
  Object.defineProperty(globalThis, 'Blob', { value: window.Blob, configurable: true })
  const root = createRoot(document.getElementById('root')!)
  const history = Array.from({ length: 6 }, () => ({ role: 'candidate' as const, text: 'My name is Ali.' }))
  const stats = analyseTranscript(history.map(turn => turn.text).join(' '), 20)
  const evaluation: SpeakingEvaluation = { overallBand: 1, fluencyBand: 8, lexicalBand: 8, grammarBand: 8, pronunciationBand: 8, summary: 'Descriptor-based assessment.', strengths: [], weaknesses: [], improvementPriorities: [], stats, source: 'ai', assessmentMode: 'audio', improvedAnswers: history.map((turn, answerIndex) => ({ answerIndex, original: turn.text, improved: turn.text })) }
  try {
    await i18n.changeLanguage('en')
    let requests: string[] = []
    apiClient.post = (async (path: string, body: { audio?: Array<{ answerIndex: number }> }) => {
      requests.push(path)
      assert.equal(body.audio?.length, 6, 'No answer recording is dropped to fit a four-clip sample')
      assert.deepEqual(body.audio.map(clip => clip.answerIndex), [0, 1, 2, 3, 4, 5])
      return evaluation
    }) as typeof apiClient.post
    const audio = history.map((_, answerIndex) => ({ answerIndex, blob: new Blob(['audio'.repeat(25)], { type: 'audio/webm' }) }))
    const graded = await evaluateSpeaking({ modeLabel: 'Speaking Mock 1', history, stats, audio })
    assert.equal(graded.overallBand, 8, 'Short identification answers do not impose an arbitrary band ceiling')
    assert.equal(graded.assessmentMode, 'audio')
    requests = []
    apiClient.post = (async (path: string) => { requests.push(path); throw new Error('Provider unavailable') }) as typeof apiClient.post
    const failed = await evaluateSpeaking({ modeLabel: 'Speaking Mock 1', history, stats, audio })
    assert.equal(failed.source, 'offline')
    assert.deepEqual(requests, ['/ai/speaking-audio/assess'], 'Failed audio cannot fall through to a text band')
    assert.equal(estimateBandsFromStats(stats).overallBand, 0, 'Statistics never create a substitute performance band')
    await act(async () => root.render(<MemoryRouter><SpeakingResult evaluation={failed} modeLabel="Speaking Mock 1" onRetry={() => {}} onExit={() => {}} /></MemoryRouter>))
    assert.ok(document.body.textContent?.includes('No band was awarded'))
    assert.equal(document.body.textContent?.includes('0.0'), false, 'Unavailable assessment is displayed as unassessed')
    const before = requests.length
    await evaluateSpeaking({ modeLabel: 'Speaking Mock 1', history, stats, expectedAudioAnswers: [0] })
    assert.equal(requests.length, before, 'Missing saved recordings cannot silently become text assessment')

    const first = { overallBand: 6, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 6.5 } as WritingEvaluation
    const second = { overallBand: 6.5, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6.5, grammaticalRange: 6.5 } as WritingEvaluation
    assert.equal(writingSectionBand(first, second), 6, 'Keep unrounded criterion averages until Task 2 weighting is applied')
    assert.equal(writingSectionBand(first, undefined), 2, 'An unattempted task retains its zero score and original weight')
    const day1 = getWritingTaskById('writing-day-1')!
    assert.ok(writingVisualContext(day1)?.includes('8500'), 'Day 1 grading receives the displayed chart data')
    const feedback = { taskAchievement: 'Your overview captures the overall change.', coherenceCohesion: 'Paragraphs progress clearly.', lexicalResource: 'Your wording conveys accurate comparisons.', grammaticalRange: 'Complex sentences are generally accurate.' }
    saveWritingAnalysis('assessment-user', day1.id, day1.title, 'task1', 180, 1200, true, 'Original essay.', { ...first, criterionFeedback: feedback, errors: [], strengths: [], improvements: [], summary: 'Feedback', correctedVersion: '', xpAwarded: 0 })
    const entry = getWritingAnalysisHistory('assessment-user')[0]
    assert.deepEqual(entry.criterionFeedback, feedback)
    await act(async () => root.render(<WritingScoreExplanation feedback={entry.criterionFeedback} taskType={entry.taskType} />))
    assert.ok(document.body.textContent?.includes(feedback.taskAchievement))
    assert.ok(document.body.textContent?.includes('Task Achievement'))
    const day = findIeltsSpeakingDay('speaking-day-1')!
    assert.equal(day.content.kind, 'part1')
    const questions = day.content.topic.questions
    const dailyAnswers = questions.map((question, index) => ({ question: { prompt: question.q }, spoken: `I enjoy studying topic ${index} because it gives me useful opportunities.`, recorded: false, audioUrl: null, loading: false, error: null, revealedSample: false, analysis: { source: 'ai', estimatedBand: 2, correctedVersion: 'Answer', band8Template: 'Answer', issues: [], strengths: [], suggestions: ['Try another topic.'] } }))
    accountStorageFor('guest').setItem(`profai:speaking:day:${day.id}`, JSON.stringify({ index: dailyAnswers.length - 1, answers: dailyAnswers, drafts: dailyAnswers.map(() => ''), typingMode: true, prepLeft: 0, speakLeft: 0, finished: false, day }))
    let wholeDayRequests = 0
    apiClient.post = (async (path: string, body: { history: Array<{ role: string; text: string }> }) => {
      assert.equal(path, '/ai/speaking-audio/assess-transcript')
      assert.deepEqual(body.history.filter(turn => turn.role === 'candidate').map(turn => turn.text), dailyAnswers.map(item => item.spoken))
      wholeDayRequests++
      return { ...evaluation, assessmentMode: 'transcript', improvedAnswers: dailyAnswers.map((item, answerIndex) => ({ answerIndex, original: item.spoken, improved: item.spoken })) }
    }) as typeof apiClient.post
    const renderDay = () => <MemoryRouter initialEntries={['/speaking/speaking-day-1']}><Routes><Route path="/speaking/:id" element={<IELTSSpeakingTest />} /></Routes></MemoryRouter>
    await act(async () => root.render(renderDay()))
    const finish = [...document.querySelectorAll('button')].find(button => button.textContent?.includes('Finish day'))!
    assert.ok(finish)
    await act(async () => finish.click())
    assert.equal(wholeDayRequests, 1)
    assert.ok(document.body.textContent?.includes('Text Practice Estimate'))
    assert.ok(document.body.textContent?.includes('8.0'), 'Final practice score comes from all answers together, not their old per-answer bands')
    await act(async () => root.render(<div />))
    await act(async () => root.render(renderDay()))
    assert.equal(wholeDayRequests, 1, 'Reload preserves the already completed whole-session assessment')
    assert.ok(document.body.textContent?.includes('8.0'))
    console.log('PASS: complete audio, grounded bands, honest outages, Writing weighting, chart context and persisted explanations')
  } finally { apiClient.post = originalPost; await act(async () => root.unmount()); localStorage.clear() }
}
