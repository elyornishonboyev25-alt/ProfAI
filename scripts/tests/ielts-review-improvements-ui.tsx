import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import i18n from '@/i18n'
import ReviewPracticeLink from '@/components/ielts/ReviewPracticeLink'
import SpeakingResult from '@/components/speaking/SpeakingResult'
import IELTSWritingFullTestInterface from '@/components/IELTSWritingFullTestInterface'
import { analyseTranscript } from '@/lib/speakingScoring'
import { evaluateSpeaking, type SpeakingEvaluation, type ExaminerTurn } from '@/services/speakingAI'
import { apiClient } from '@/lib/apiClient'
import { getWritingFullTestById } from '@/data/writingTestData'
import { accountStorageFor } from '@/utils/accountStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'

export async function run() {
  const container = document.getElementById('root')!
  let root: ReturnType<typeof createRoot> | undefined
  const originalPost = apiClient.post
  const history: ExaminerTurn[] = [{ role: 'examiner', text: 'What do you enjoy?' }, { role: 'candidate', text: 'I like read books.' }, { role: 'examiner', text: 'Where?' }, { role: 'candidate', text: '' }, { role: 'candidate', text: 'At home with my sister.' }]
  const evaluation: SpeakingEvaluation = { overallBand: 6, fluencyBand: 6, lexicalBand: 6, grammarBand: 6, pronunciationBand: 0, summary: 'Your original answers were assessed.', strengths: ['Relevant ideas'], weaknesses: ['Check verb forms'], improvementPriorities: [{ area: 'Grammar', target: 6.5, action: 'Practise verb patterns.' }], source: 'ai', assessmentMode: 'transcript', stats: analyseTranscript('I like read books. At home with my sister.', 20), improvedAnswers: [{ answerIndex: 0, original: 'I like read books.', improved: 'I enjoy reading books.' }, { answerIndex: 2, original: 'At home with my sister.', improved: 'I read at home with my sister.' }] }
  async function render(node: React.ReactNode) {
    if (root) await act(async () => root!.unmount())
    root = createRoot(container)
    await act(async () => root!.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter>))
  }
  let destination = ''
  function Location() { destination = useLocation().pathname; return null }
  try {
    localStorage.clear()
    for (const language of ['en', 'uz', 'ru']) {
      await act(async () => { await i18n.changeLanguage(language) })
      for (const [skill, path] of [['listening', '/podcast'], ['reading', '/articles'], ['speaking', '/shadowing-lab']] as const) {
        await render(<><ReviewPracticeLink skill={skill} /><Location /></>)
        const link = container.querySelector<HTMLAnchorElement>(`a[href="${path}"]`)!
        assert.ok(link)
        assert.ok(link.textContent!.length > 70, 'The card includes a practical exercise and a visible action')
        if (language !== 'en') assert.equal(link.textContent!.includes('Build your'), false, 'Resource cards are translated')
        await act(async () => link.click())
        assert.equal(destination, path)
      }
    }
    await act(async () => { await i18n.changeLanguage('en') })
    apiClient.post = (async () => (evaluation)) as typeof apiClient.post
    const checked = await evaluateSpeaking({ modeLabel: 'Speaking Mock 1', history, stats: evaluation.stats })
    assert.deepEqual(checked.improvedAnswers, evaluation.improvedAnswers)
    assert.equal(checked.overallBand, 6, 'No arbitrary word-count ceiling overrides descriptor-based assessment')
    for (const rewrites of [[], [{ ...evaluation.improvedAnswers![0], original: 'Someone else\'s answer' }], [{ ...evaluation.improvedAnswers![0], answerIndex: 2 }, evaluation.improvedAnswers![1]]]) {
      apiClient.post = (async () => ({ ...evaluation, improvedAnswers: rewrites })) as typeof apiClient.post
      const graded = await evaluateSpeaking({ modeLabel: 'Speaking Mock 1', history, stats: evaluation.stats })
      assert.equal(graded.source, 'ai', 'Missing coaching must not discard a valid assessment')
      assert.equal(graded.improvedAnswers?.some(item => item.original === "Someone else's answer"), false, 'Mismatched coaching is discarded independently')
    }
    for (const reviewMode of [false, true]) {
      await render(<SpeakingResult evaluation={evaluation} transcript={history} modeLabel="Speaking Mock 1" reviewMode={reviewMode} onRetry={() => {}} onExit={() => {}} />)
      assert.equal(container.querySelector('a[href="/shadowing-lab"]'), null, 'Speaking feedback has no practice-resource promotion')
      assert.equal(container.querySelector('[data-test-vocabulary]'), null, 'Speaking feedback has no vocabulary promotion')
      assert.ok(container.querySelector('[role="tablist"]'), 'Compact tabs replace a long expanded review')
      for (const answer of evaluation.improvedAnswers!) {
        await act(async () => container.querySelector<HTMLButtonElement>(`[aria-label="Question ${answer.answerIndex + 1}"]`)!.click())
        assert.ok(container.textContent!.includes(answer.improved))
      }
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Question 2"]')!.click())
      assert.equal(container.querySelectorAll('.assessment-panel section').length, 0, 'No rewrite is fabricated for empty speech')
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Question 1"]')!.click())
    }
    await render(<SpeakingResult evaluation={{ ...evaluation, improvedAnswers: [{ ...evaluation.improvedAnswers![0], original: 'Unrelated response' }] }} transcript={history} modeLabel="Speaking Mock 1" reviewMode onRetry={() => {}} onExit={() => {}} />)
    assert.equal(container.textContent!.includes('I enjoy reading books.'), false, 'Saved mismatched data is never displayed as the learner\'s rewrite')
    assert.ok(container.textContent!.includes('An improved version is unavailable'))

    let repairCalls = 0
    apiClient.post = (async (path: string, body: { history: ExaminerTurn[] }) => {
      repairCalls++
      assert.equal(path, '/ai/speaking-audio/rewrites', 'Coaching recovery never repeats audio grading')
      assert.deepEqual(body.history, [history[4]], 'Only the missing non-empty answer is regenerated')
      return { improvedAnswers: [{ answerIndex: 0, original: history[4].text, improved: 'I read at home with my sister.' }] }
    }) as typeof apiClient.post
    const partial = { ...evaluation, improvedAnswers: [evaluation.improvedAnswers![0]] }
    await render(<React.StrictMode><SpeakingResult evaluation={partial} transcript={history} modeLabel="Speaking Mock 1" autoImprove onRetry={() => {}} onExit={() => {}} /></React.StrictMode>)
    assert.equal(repairCalls, 1, 'StrictMode and overlapping recovery share one request')
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Question 3"]')!.click())
    assert.ok(container.textContent!.includes('I read at home with my sister.'))
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Question 1"]')!.click())
    assert.ok(container.textContent!.includes('I enjoy reading books.'))
    assert.ok(container.textContent!.includes('6.0'), 'The valid band stays visible during coaching recovery')
    await render(<SpeakingResult evaluation={partial} transcript={history} modeLabel="Speaking Mock 1" reviewMode onRetry={() => {}} onExit={() => {}} />)
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Question 3"]')!.click())
    assert.ok(container.textContent!.includes('I read at home with my sister.'), 'Reloaded reviews reuse recovered coaching')
    assert.equal(repairCalls, 1)

    let rejectCoaching: (reason: Error) => void = () => {}
    apiClient.post = (() => new Promise((_resolve, reject) => { rejectCoaching = reject })) as typeof apiClient.post
    const failedHistory: ExaminerTurn[] = [{ role: 'candidate', text: 'I likes swim.' }]
    await render(<SpeakingResult evaluation={{ ...evaluation, improvedAnswers: [] }} transcript={failedHistory} modeLabel="Speaking Mock 2" autoImprove onRetry={() => {}} onExit={() => {}} />)
    assert.ok(container.textContent!.includes('6.0'), 'The band is usable before optional coaching finishes')
    assert.ok(container.querySelector('[role="status"]')?.textContent?.includes('Preparing your improved answer'))
    await act(async () => rejectCoaching(new Error('Provider unavailable')))
    assert.ok(container.textContent!.includes('6.0'), 'A second provider failure cannot erase the validated score')
    assert.ok([...container.querySelectorAll('button')].some(button => button.textContent?.includes('Generate improved answer')), 'A failed recovery remains retriable without retaking the test')

    const fullTest = getWritingFullTestById('writing-full-1')!
    const responses = ['The diagram shows the stages of smoking fish.', 'I believe learning languages is useful because it helps people communicate.']
    const draftKey = `profai:writing:draft:guest:${fullTest.id}:mock:review-test`
    accountStorageFor('guest').setItem(draftKey, JSON.stringify(Object.fromEntries(fullTest.tasks.map((task, index) => [task.id, responses[index]]))))
    accountStorageFor('guest').setItem(`${draftKey}:session`, JSON.stringify({ timerEnabled: false, deadline: null }))
    const submitted: string[] = []
    apiClient.post = (async (path: string, body: { response: string }) => {
      assert.equal(path, '/ai/generate/writing/submissions')
      submitted.push(body.response)
      return { id: 'writing-'+submitted.length, status: 'COMPLETED', result: { overallBand: 6, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 6, summary: 'Original response feedback', strengths: [], improvements: [], errors: [], correctedVersion: body.response, improvedVersion: `Improved: ${body.response}`, xpAwarded: 0 } }
    }) as typeof apiClient.post
    let completed: Array<{ response: string; improvedVersion?: string }> = []
    await render(<IELTSWritingFullTestInterface fullTest={fullTest} inFullMock fullMockId="review-test" onExit={() => {}} onComplete={(_band, _summary, review) => { completed = review }} />)
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Next: Task 2'))!.click())
    const submit = [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Submit'))!
    assert.ok(submit, `Writing submit button missing: ${[...container.querySelectorAll('button')].map(button => button.textContent).join(', ')}`)
    await act(async () => submit.click())
    const confirmationTitle = [...document.querySelectorAll('h2')].find(node => /^submit both responses\?$/i.test(node.textContent?.trim() ?? ''))
    assert.ok(confirmationTitle, 'Submission confirmation explains that both tasks will be sent')
    const confirm = [...confirmationTitle.parentElement!.querySelectorAll('button')].find(button => /^submit full test$/i.test(button.textContent?.trim() ?? ''))!
    assert.ok(confirm, 'The confirmation has its own submission action')
    await act(async () => confirm.click())
    assert.deepEqual(submitted, responses)
    assert.deepEqual(completed.map(item => item.improvedVersion), responses.map(response => `Improved: ${response}`))
    for (const button of [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter(button => button.textContent?.includes('Stronger version'))) await act(async () => button.click())
    for (const response of responses) assert.ok(container.textContent!.includes(`Improved: ${response}`), 'Both tasks retain their own stronger answer in the compact review')
    assert.deepEqual(getWritingAnalysisHistory().slice(0, 2).map(item => item.improvedVersion).sort(), responses.map(response => `Improved: ${response}`).sort())
    console.log('PASS: translated resource navigation, grounded Speaking rewrites, empty/legacy answers, both Writing tasks and persisted mock review data')
  } finally {
    apiClient.post = originalPost
    if (root) await act(async () => root!.unmount())
    localStorage.clear()
  }
}
