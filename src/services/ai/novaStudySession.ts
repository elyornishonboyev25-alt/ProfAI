import { create } from 'zustand'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { tutorProgressSchema, type StudyReference, type TutorProgress, type NovaToolResult, type NovaEffect, type WritingAnchor } from '@/lib/novaStudy'
import { addSavedWord } from '@/utils/myVocabularyStore'
import { cancelCoachAudio } from '@/lib/coachAudio'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { loadSATAttemptHistory } from '@/features/sat/attemptStorage'

const KEY = 'nova:study-session:v1'
type Receipt = { id: string; status: 'applied' | 'failed' | 'awaiting_consent'; message: string }
type State = { owner: string; open: boolean; progress: TutorProgress | null; annotations: { text: string; anchors: WritingAnchor[] } | null; pending: Array<{ id: string; effect: NovaEffect }>; action: { id: string; effect: Extract<NovaEffect, { type: 'study_control' | 'play_segment' }> } | null; receipts: Receipt[]; notice: string; draft: string; autoWords: boolean }
export const useNovaStudySession = create<State>(() => ({ owner: '', open: false, progress: null, annotations: null, pending: [], action: null, receipts: [], notice: '', draft: '', autoWords: false }))
export function reportNovaAction(id: string, status: Receipt['status'], message: string) {
  useNovaStudySession.setState(s => ({ receipts: [...s.receipts.filter(r => r.id !== id), { id, status, message }].slice(-20), notice: message, ...(s.action?.id === id ? { action: null } : {}) }))
}
const owner = () => useAuthStore.getState().user?.id ?? 'guest'
export function restoreNovaStudy() {
  const id = owner()
  if (useNovaStudySession.getState().owner === id) return
  let progress: TutorProgress | null = null
  try { const parsed = tutorProgressSchema.safeParse(JSON.parse(accountStorageFor(id).getItem(KEY) ?? 'null')); if (parsed.success) progress = parsed.data } catch { /* Optional persisted lesson. */ }
  useNovaStudySession.setState({ owner: id, progress, open: false, annotations: null, pending: [], action: null, receipts: [], draft: '', notice: '', autoWords: false })
}
export function setStudyProgress(progress: TutorProgress) {
  restoreNovaStudy()
  const changed = JSON.stringify(useNovaStudySession.getState().progress?.reference) !== JSON.stringify(progress.reference)
  useNovaStudySession.setState({ progress })
  accountStorageFor(owner()).setItem(KEY, JSON.stringify(progress))
  if (changed) window.dispatchEvent(new Event('nova:study-changed'))
}
export function openNovaStudy(reference?: StudyReference) {
  restoreNovaStudy()
  window.dispatchEvent(new Event('nova:interrupt')); cancelCoachAudio()
  if (reference) {
    const previous = useNovaStudySession.getState().progress
    const sameLesson = previous?.reference.skill === reference.skill && previous.reference.testId === reference.testId && previous.reference.attemptId === reference.attemptId && previous.reference.mode === reference.mode
    if (!sameLesson) useNovaStudySession.setState({ autoWords: false })
    const sameQuestion = sameLesson && previous.reference.questionId === reference.questionId
    setStudyProgress(tutorProgressSchema.parse({ ...(sameQuestion ? previous : sameLesson ? { words: previous.words, answers: previous.answers } : {}), reference }))
  }
  useNovaStudySession.setState({ open: true })
}
export function currentNovaStudy() {
  restoreNovaStudy()
  const state = useNovaStudySession.getState()
  return { studyReference: state.progress?.reference, studyProgress: state.progress ?? undefined, actionReceipts: state.receipts, writingDraft: state.draft || undefined, vocabularyAutoSave: state.autoWords }
}
export function observeNovaStudyPermission(text: string) {
  restoreNovaStudy()
  if (/(?:auto|avto)(?:matik(?: ravishda)?)?.{0,45}(?:qo[‘’'ʻ]?sh|saqla)|(?:automatically).{0,35}(?:save|add)/i.test(text)) useNovaStudySession.setState({ autoWords: true })
  if (/(?:auto|avtomatik).{0,30}(?:to[‘’'ʻ]?xtat|bekor|off|stop|don't|do not)/i.test(text)) useNovaStudySession.setState({ autoWords: false })
}
function rememberWord(term: string) {
  const progress = useNovaStudySession.getState().progress
  if (progress && !progress.words.includes(term)) setStudyProgress({ ...progress, words: [...progress.words, term].slice(-100) })
}
export function currentWritingDraft() {
  const focused = document.activeElement
  if (focused instanceof HTMLTextAreaElement && focused.closest('.writing-desk')) return focused.value
  return document.querySelector<HTMLTextAreaElement>('.writing-desk textarea')?.value ?? ''
}
export function inferNovaStudy(pathname: string, routeState: unknown): StudyReference | undefined {
  const review = /^\/results\/([^/]+)\/review$/.exec(pathname)
  if (review) {
    const result = (routeState as { result?: { date?: string } } | null)?.result
    const history = getReadingAnalysisHistory(owner()).filter(entry => entry.testId === decodeURIComponent(review[1]))
    const entry = result?.date ? history.find(entry => entry.resultPayload.date === result.date) : history.length === 1 ? history[0] : undefined
    if (entry) return { skill: /listening/i.test(entry.testId + entry.testTitle) ? 'listening' : 'reading', testId: entry.testId, attemptId: entry.attemptKey, mode: 'analyze' }
  }
  const sat = /^\/sat\/results\/([^/]+)$/.exec(pathname)
  if (sat) { const entry = loadSATAttemptHistory().find(a => a.id === decodeURIComponent(sat[1])); if (entry?.attempt.status === 'submitted') return { skill: 'sat-math', testId: entry.attempt.testId, attemptId: entry.id, mode: 'analyze' } }
  return undefined
}
const applied = new Set<string>()
export function receiveNovaToolResults(results: NovaToolResult[] | undefined, navigate: (path: string, options?: { state?: unknown }) => void) {
  restoreNovaStudy()
  for (const result of results ?? []) {
    const key = `${owner()}:${result.id}`
    if (applied.has(key)) continue
    applied.add(key)
    if (!result.ok) { useNovaStudySession.setState({ notice: result.error.message }); continue }
    const effect = result.effect
    if (!effect) continue
    if (effect.type === 'vocabulary' && effect.confirmation || effect.type === 'navigate' && effect.confirmation) {
      useNovaStudySession.setState(state => ({ open: true, pending: [...state.pending, { id: result.id, effect }] })); continue
    }
    try { applyNovaEffect(effect, navigate, false, result.id) }
    catch { applied.delete(key); reportNovaAction(result.id, 'failed', 'Amal bajarilmadi. Qayta urinib ko‘ring.') }
    if (applied.size > 1000) applied.delete(applied.values().next().value!)
  }
}
export function applyNovaEffect(effect: NovaEffect, navigate: (path: string, options?: { state?: unknown }) => void, confirmed = false, actionId: string = crypto.randomUUID()) {
  if (effect.type === 'study_control' || effect.type === 'play_segment') {
    const ref = effect.reference
    const current = useNovaStudySession.getState().progress?.reference
    if (ref && (ref.skill !== current?.skill || ref.testId !== current?.testId || ref.attemptId !== current?.attemptId || ref.questionId !== current?.questionId || ref.mode !== current?.mode)) openNovaStudy(ref)
    useNovaStudySession.setState({ open: true, action: { id: actionId, effect } }); return
  }
  const leavesPage = effect.type === 'navigate' || effect.type === 'study' && effect.reference.mode === 'analyze' && ['reading', 'listening', 'sat-math', 'sat-rw'].includes(effect.reference.skill)
  const draft = leavesPage ? currentWritingDraft() : ''
  if (draft.trim()) {
    if (!confirmed) { useNovaStudySession.setState(state => ({ open: true, pending: [...state.pending, { id: actionId, effect }] })); reportNovaAction(actionId, 'awaiting_consent', 'Draftni saqlab sahifani ochish uchun tasdiq kutilmoqda.'); return }
    accountStorageFor(owner()).setItem('nova:writing-navigation-backup:v1', JSON.stringify({ path: window.location.pathname, text: draft, savedAt: new Date().toISOString() }))
  }
  if (effect.type === 'vocabulary') {
    addSavedWord({ ...effect.word, preserveSense: true, source: 'ai', origins: [{ label: effect.word.origin, path: window.location.pathname, questionId: effect.word.sourceQuestionId }] })
    rememberWord(effect.word.term)
    useNovaStudySession.setState({ notice: 'My Vocab’ga saqlandi.' })
  } else if (effect.type === 'study') {
    openNovaStudy(effect.reference)
    if (effect.reference.mode === 'analyze' && ['reading', 'listening'].includes(effect.reference.skill)) {
      const entry = getReadingAnalysisHistory(owner()).find(a => a.attemptKey === effect.reference.attemptId)
      if (!entry) { useNovaStudySession.setState({ notice: 'Attempt sinxronlandi, lekin bu qurilmada hali yuklanmadi. Sahifani yangilang.' }); return }
      navigate(`/results/${encodeURIComponent(entry.testId)}/review`, { state: { result: entry.resultPayload, initialQuestionId: effect.reference.questionId } })
    } else if (effect.reference.mode === 'analyze' && effect.reference.skill.startsWith('sat-')) navigate(`/sat/results/${encodeURIComponent(effect.reference.attemptId!)}`)
  } else if (effect.type === 'navigate') {
    // Existing editors flush on focus loss/pagehide; never leave a dirty editor implicitly.
    document.activeElement instanceof HTMLElement && document.activeElement.blur()
    navigate(effect.path, { state: effect.state })
  } else if (effect.type === 'annotations') {
    useNovaStudySession.setState({ annotations: { text: effect.text, anchors: effect.anchors }, open: true })
    window.dispatchEvent(new CustomEvent('nova:writing-annotations', { detail: effect }))
  }
  reportNovaAction(actionId, 'applied', effect.type === 'vocabulary' ? 'My Vocab’ga saqlandi.' : 'Amal bajarildi.')
}
export function acceptNovaPending(id: string, navigate: (path: string, options?: { state?: unknown }) => void) {
  restoreNovaStudy()
  const pending = useNovaStudySession.getState().pending.find(item => item.id === id)
  if (!pending) return
  if (pending.effect.type === 'vocabulary') {
    const word = pending.effect.word
    addSavedWord({ ...word, preserveSense: true, source: 'ai', origins: [{ label: word.origin, path: window.location.pathname, questionId: word.sourceQuestionId }] })
    rememberWord(word.term)
    useNovaStudySession.setState({ notice: 'My Vocab’ga saqlandi.' })
    reportNovaAction(id, 'applied', 'My Vocab’ga saqlandi.')
  } else { document.activeElement instanceof HTMLElement && document.activeElement.blur(); applyNovaEffect(pending.effect, navigate, true, id) }
  useNovaStudySession.setState(state => ({ pending: state.pending.filter(item => item.id !== id) }))
}
export function novaStudyBlocked() { return useAiAssistantStore.getState().isExamModeActive }
