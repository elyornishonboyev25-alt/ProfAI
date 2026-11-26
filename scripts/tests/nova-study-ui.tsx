import assert from 'node:assert/strict'
import { useAuthStore } from '@/store/authStore'
import { getAllSavedWords } from '@/utils/myVocabularyStore'
import { useNovaStudySession, restoreNovaStudy, openNovaStudy, receiveNovaToolResults, acceptNovaPending, dismissNovaPending, observeNovaStudyPermission, currentNovaStudy, novaStudyScope } from '@/services/ai/novaStudySession'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import type { NovaToolResult } from '@/lib/novaStudy'
import { acquireNovaAudio, novaAudioOwner, interruptNovaAudio, subscribeNovaAudio } from '@/lib/novaAudioOwnership'

export async function run() {
  const owners: Array<string | null> = [], events: string[] = []
  const unsubscribe = subscribeNovaAudio(() => owners.push(novaAudioOwner()))
  const releaseOld = acquireNovaAudio('coach', () => events.push('coach cancelled'))
  const releaseNew = acquireNovaAudio('original', () => events.push('source cancelled'))
  releaseOld()
  assert.equal(novaAudioOwner(), 'original', 'Late completion cannot unmute the microphone under a successor')
  assert.deepEqual(events, ['coach cancelled'])
  releaseNew(); assert.equal(novaAudioOwner(), null)
  acquireNovaAudio('replay', () => events.push('replay cancelled')); interruptNovaAudio()
  assert.equal(novaAudioOwner(), null); assert.ok(events.includes('replay cancelled'))
  assert.deepEqual(owners.slice(0, 3), ['coach', 'original', null]); unsubscribe()
  const navigate = () => {}, owner = 'study-ui-learner'
  useAuthStore.setState({ user: { id: owner } as any }); restoreNovaStudy()
  const word = { term: 'bank', definition: 'The land beside a river', uzbek: 'Daryo qirg‘og‘i', example: 'We walked along the bank.', synonym: 'riverside', context: 'reading' as const, origin: 'Reading question', sourceQuestionId: 'source-q1' }
  const result = (id: string, confirmation: boolean, definition = word.definition): NovaToolResult => ({ id, name: 'save_vocabulary', ok: true, data: { status: 'awaiting_browser_save' }, effect: { type: 'vocabulary', word: { ...word, definition }, confirmation } })
  receiveNovaToolResults([result('consent', true)], navigate)
  assert.equal(getAllSavedWords().length, 0, 'A proposed save is not a completed save')
  useNovaStudySession.setState({ pending: [] })
  assert.equal(getAllSavedWords().length, 0, 'Dismiss leaves vocabulary unchanged')
  receiveNovaToolResults([result('accept', true)], navigate); acceptNovaPending('accept', navigate)
  assert.equal(getAllSavedWords().length, 1)
  receiveNovaToolResults([result('accept', true)], navigate); acceptNovaPending('accept', navigate)
  assert.equal(getAllSavedWords().length, 1, 'Repeated tool completion cannot duplicate a save')
  receiveNovaToolResults([result('same-sense', false)], navigate)
  assert.equal(getAllSavedWords().length, 1, 'An explicit save of the same sense is idempotent')
  receiveNovaToolResults([result('different-sense', false, 'A place that keeps money')], navigate)
  assert.equal(getAllSavedWords().length, 2, 'A different meaning must not replace the river sense')
  assert.equal(getAllSavedWords().find(w => w.definition === word.definition)?.sourceQuestionId, 'source-q1')
  assert.equal(getAllSavedWords()[0].origins?.[0].questionId, 'source-q1')
  openNovaStudy({ skill: 'reading', testId: 'source', questionId: 'q1', mode: 'practice' })
  observeNovaStudyPermission('Bilmagan so‘zlarimni avtomatik qo‘sh')
  assert.equal(currentNovaStudy().vocabularyAutoSave, true)
  observeNovaStudyPermission('Avtomatik qo‘shma')
  assert.equal(currentNovaStudy().vocabularyAutoSave, false, 'Negative Uzbek instruction revokes consent')
  observeNovaStudyPermission('Save new words automatically')
  assert.equal(currentNovaStudy().vocabularyAutoSave, true)
  openNovaStudy({ skill: 'reading', testId: 'source', questionId: 'q2', mode: 'practice' })
  assert.equal(currentNovaStudy().vocabularyAutoSave, true, 'Consent remains within one lesson')
  openNovaStudy({ skill: 'listening', testId: 'other', mode: 'practice' })
  assert.equal(currentNovaStudy().vocabularyAutoSave, false, 'A new lesson requires its own automatic-save consent')
  receiveNovaToolResults([result('dismiss-receipt', true)], navigate)
  dismissNovaPending('dismiss-receipt')
  assert.equal(currentNovaStudy().actionReceipts.find(r => r.id === 'dismiss-receipt')?.status, 'cancelled')
  const scope = novaStudyScope(), before = getAllSavedWords().length
  openNovaStudy({ skill: 'reading', testId: 'new-lesson', mode: 'practice' })
  receiveNovaToolResults([result('stale-result', false, 'Stale sense')], navigate, scope)
  assert.equal(getAllSavedWords().length, before, 'Late effects from an older lesson cannot modify the new lesson')
  useAiAssistantStore.setState({ isExamModeActive: true })
  receiveNovaToolResults([result('exam-late-result', false, 'Exam sense')], navigate)
  assert.equal(getAllSavedWords().length, before, 'Entering an exam cancels in-flight coaching effects')
  assert.equal(currentNovaStudy().actionReceipts.find(r => r.id === 'exam-late-result')?.status, 'cancelled')
  useAiAssistantStore.setState({ isExamModeActive: false })
  receiveNovaToolResults([result('pending-old-owner', true)], navigate)
  useAuthStore.setState({ user: { id: 'other-learner' } as any })
  acceptNovaPending('pending-old-owner', navigate)
  assert.equal(getAllSavedWords().length, 0, 'An old account’s pending save cannot write into the next account')
  assert.equal(useNovaStudySession.getState().pending.length, 0)
  console.log('PASS: real My Vocab save, contextual-sense deduplication, consent/dismiss/explicit save, source provenance, per-lesson auto-save consent and account-change fencing')
}
