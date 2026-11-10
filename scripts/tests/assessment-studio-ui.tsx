import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import WritingReviewWorkbench from '@/components/writing/WritingReviewWorkbench'
import SpeakingReviewWorkbench from '@/components/speaking/SpeakingReviewWorkbench'
import CoachMascot from '@/components/ai/CoachMascot'
import { analyseTranscript } from '@/lib/speakingScoring'
import { needsEnglishReminder } from '@/lib/speakingLanguage'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { saveWritingAnalysis, getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import type { WritingEvaluation } from '@/services/geminiAI'

export async function run() {
  const host = document.getElementById('root')!
  const root = createRoot(host)
  const render = async (view: React.ReactNode) => act(async () => root.render(<MemoryRouter>{view}</MemoryRouter>))
  const click = async (label: string) => {
    const button = [...host.querySelectorAll('button')].find(item => item.textContent?.includes(label))
    assert.ok(button, `Missing button: ${label}`)
    await act(async () => button.click())
  }
  await i18n.changeLanguage('en')
  const original = 'These student learns English. Their study routine gives them opportunities to practise with their classmates and develop confidence when communicating about familiar and unfamiliar topics in everyday life.'
  const errors = [{ original: 'These student learns', corrected: 'These students learn', explanation: 'Use plural agreement.', category: 'grammar' as const }]
  const feedback = { taskAchievement: 'Limited development.', coherenceCohesion: 'Clear progression.', lexicalResource: 'Adequate range.', grammaticalRange: 'Agreement errors.' }
  const evaluation: WritingEvaluation = { overallBand: 6, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 6, criterionFeedback: feedback, errors, summary: 'Original practice assessment.', strengths: ['Clear ideas.'], improvements: ['Develop your example.'], correctedVersion: original.replace(errors[0].original, errors[0].corrected), improvedVersion: 'A stronger coaching rewrite.', xpAwarded: 60, correctedAssessment: { overallBand: 6.5, taskAchievement: 6, coherenceCohesion: 6, lexicalResource: 6, grammaticalRange: 8, criterionFeedback: feedback, summary: 'Language is more accurate; ideas need further development.' }, assessment: { provider: 'gemini', model: 'gemini-3.1-pro-preview', assessedAt: new Date().toISOString(), rubricVersion: 'ielts-public-2023' } }
  try {
    await render(<WritingReviewWorkbench evaluation={evaluation} original={original} />)
    assert.equal(host.querySelector('.assessment-annotated del')?.textContent, errors[0].original)
    assert.equal(host.querySelector('ins')?.textContent, 'Aa', 'Legend is rendered separately from actual corrections')
    assert.ok([...host.querySelectorAll('ins')].some(item => item.textContent === errors[0].corrected))
    assert.ok(host.textContent?.includes('6.0') && host.textContent.includes('6.5'))
    await click('Corrected text')
    assert.ok(host.textContent?.includes(evaluation.correctedVersion))
    assert.ok(host.textContent?.includes(evaluation.correctedAssessment!.summary))
    await click('Stronger version')
    assert.ok(host.textContent?.includes(evaluation.improvedVersion!))
    await click('Next steps')
    assert.ok(host.textContent?.includes(evaluation.improvements[0]))
    saveWritingAnalysis('studio-user', 'task-fixture', 'Fixture', 'task2', 35, 30, false, original, evaluation)
    const saved = getWritingAnalysisHistory('studio-user')[0]
    assert.deepEqual(saved.correctedAssessment, evaluation.correctedAssessment)
    assert.equal(saved.assessment?.model, evaluation.assessment?.model)
    await render(<WritingReviewWorkbench evaluation={{ ...evaluation, correctedAssessment: undefined }} original={original} />)
    assert.ok(host.textContent?.includes('predates separate corrected-text scoring'))

    const history = [{ role: 'examiner' as const, text: 'What do you enjoy?' }, { role: 'candidate' as const, text: 'I like read books.' }, { role: 'examiner' as const, text: 'Where do you read?' }, { role: 'candidate' as const, text: 'At home.' }]
    const speaking = { overallBand: 6, fluencyBand: 6, lexicalBand: 6, grammarBand: 6, pronunciationBand: 6, summary: 'Audio estimate.', strengths: [], weaknesses: [], improvementPriorities: [], source: 'ai' as const, assessmentMode: 'audio' as const, stats: analyseTranscript('I like read books. At home.', 10), improvedAnswers: history.filter(turn => turn.role === 'candidate').map((turn, answerIndex) => ({ answerIndex, original: turn.text, improved: `Improved ${turn.text}` })), answerFeedback: [{ answerIndex: 0, summary: 'Check the verb pattern.', corrections: [{ original: 'like read', corrected: 'like reading', explanation: 'Use the gerund after like here.' }] }, { answerIndex: 1, summary: 'Natural short answer.', corrections: [] }], pronunciationTargets: [] }
    await render(<SpeakingReviewWorkbench evaluation={speaking} transcript={history} pending={false} />)
    assert.ok(host.querySelector('del')?.textContent?.includes('like read'))
    const second = host.querySelector<HTMLButtonElement>('[aria-label="Question 2"]')!
    await act(async () => second.click())
    assert.ok(host.textContent?.includes('Where do you read?'))
    assert.ok(host.textContent?.includes('Natural short answer.'))
    assert.equal(host.querySelector('del'), null, 'Correct answers are never marked erroneous to fill a quota')
    await click('Pronunciation arena')
    assert.ok(host.textContent?.includes('No reliable word-level'))
    await click('Conversation replay')
    assert.ok(host.textContent?.includes('Device voice reconstruction'))
    const download = [...host.querySelectorAll('button')].find(button => button.textContent?.includes('Download both voices'))!
    assert.equal(download.disabled, true, 'Missing recordings cannot become a fabricated full audio export')
    await click('Practice plan')
    assert.ok(host.textContent?.includes('do not determine an IELTS band'))

    useAuthStore.setState({ user: { id: 'studio-user', role: 'USER', fullName: 'Learner' } as any })
    const owner = 'user:studio-user'
    const threadId = useAiAssistantStore.getState().startNewThread(owner)
    useAiAssistantStore.getState().setCoachPreferences(owner, { style: 'affectionate' })
    await render(<CoachMascot />)
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'warm', 'Legacy manual settings cannot lock the automatic tutor')
    const reply = (expression: 'affectionate' | 'focused') => act(async () => useAiAssistantStore.getState().pushMessage(owner, threadId, { id: expression, role: 'assistant', content: expression === 'focused' ? 'Try again with a clear example.' : 'Asalim, let us practise.', expression, createdAt: new Date().toISOString() }))
    await reply('affectionate')
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'affectionate')
    await reply('focused')
    assert.equal(host.querySelector('[data-expression]')?.getAttribute('data-expression'), 'focused')
    assert.equal(host.querySelector('fieldset'), null, 'No manual personality or lesson panel is rendered')
    assert.equal(needsEnglishReminder('My name is Elyor Nishonboyev.', 'What is your full name?'), false)
    assert.equal(needsEnglishReminder('Men bugun bordim chunki menga juda kerak.', 'What did you do?'), true)
    assert.equal(needsEnglishReminder('I visited Buxoro with my friend Elyor.', 'What did you do?'), false)
    assert.equal(needsEnglishReminder('Я сегодня ходил в школу.', 'What did you do?'), true)
    console.log('PASS: independent saved Writing scores, grounded edits, compact question review, honest audio availability, automatic tutor expressions and multilingual names')
  } finally { await act(async () => root.unmount()) }
}
