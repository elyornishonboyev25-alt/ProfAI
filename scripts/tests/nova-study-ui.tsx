import assert from 'node:assert/strict'
import { useAuthStore } from '@/store/authStore'
import { getAllSavedWords } from '@/utils/myVocabularyStore'
import { useNovaStudySession, restoreNovaStudy, openNovaStudy, receiveNovaToolResults, acceptNovaPending, observeNovaStudyPermission, currentNovaStudy } from '@/services/ai/novaStudySession'
import type { NovaToolResult } from '@/lib/novaStudy'

export async function run() {
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
  openNovaStudy({ skill: 'reading', testId: 'source', questionId: 'q2', mode: 'practice' })
  assert.equal(currentNovaStudy().vocabularyAutoSave, true, 'Consent remains within one lesson')
  openNovaStudy({ skill: 'listening', testId: 'other', mode: 'practice' })
  assert.equal(currentNovaStudy().vocabularyAutoSave, false, 'A new lesson requires its own automatic-save consent')
  receiveNovaToolResults([result('pending-old-owner', true)], navigate)
  useAuthStore.setState({ user: { id: 'other-learner' } as any })
  acceptNovaPending('pending-old-owner', navigate)
  assert.equal(getAllSavedWords().length, 0, 'An old account’s pending save cannot write into the next account')
  assert.equal(useNovaStudySession.getState().pending.length, 0)
  console.log('PASS: real My Vocab save, contextual-sense deduplication, consent/dismiss/explicit save, source provenance, per-lesson auto-save consent and account-change fencing')
}
