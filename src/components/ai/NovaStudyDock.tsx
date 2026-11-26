import SpeakingReviewWorkbench from '@/components/speaking/SpeakingReviewWorkbench'
import type { SpeakingEvaluation, ExaminerTurn } from '@/services/speakingAI'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import NovaStudySurface from './NovaStudySurface'
import { useNovaSelection } from './useNovaSelection'
import { BookOpen, X, Play, Pause, RotateCcw, Mic } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAiTutor } from './useAiTutor'
import { usePushToTalk } from './usePushToTalk'
import CoachMascot from './CoachMascot'
import AiMessageContent from './AiMessageContent'
import NovaLessonMessage from './NovaLessonMessage'
import NovaWritingAnnotations from './NovaWritingAnnotations'
import NovaSpeakingPractice from './NovaSpeakingPractice'
import ListeningDiagram from '@/components/ListeningDiagram'
import { NovaSourceAudio } from '@/lib/novaSourceAudio'
import { novaSkill, writingVersion, type StudyReference, type StudyTest, type StudyAttempt } from '@/lib/novaStudy'
import { openNovaStudy, restoreNovaStudy, setStudyProgress, useNovaStudySession, acceptNovaPending, dismissNovaPending, currentWritingDraft, applyNovaEffect, inferNovaStudy, reportNovaAction } from '@/services/ai/novaStudySession'
import './nova-study.css'
import { getAllSavedWords } from '@/utils/myVocabularyStore'

type Context = { reference: StudyReference; test: { id: string; title: string; questionIds: string[] }; question: { id: string; number: number; text: string; type: string; instruction?: string; options?: unknown[]; passage?: string; audioUrl?: string; duration?: number; userAnswer?: unknown; sourceRange?: { start: number; end: number; reference: string }; visual?: { asset?: string; alt?: string; listening?: boolean; diagram?: string } }; attempt?: { questionStatuses?: Record<string, 'correct' | 'incorrect' | 'skipped'>; writing?: string; transcript?: ExaminerTurn[]; completedAt: string; speakingEvaluation?: SpeakingEvaluation }; evidence?: { answer: unknown; explanation?: string; quotes: Array<{ quote: string }>; transcript?: string; alignment: string } }

function choiceLabel(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const option = value as { key?: string; letter?: string; text?: string }
    return `${option.key ?? option.letter ?? ''}. ${option.text ?? ''}`
  }
  return ''
}

export default function NovaStudyDock() {
  const user = useAuthStore(s => s.user), exam = useAiAssistantStore(s => s.isExamModeActive)
  const talkOpen = useAiAssistantStore(s => s.talkOpen)
  const state = useNovaStudySession(), navigate = useNavigate(), location = useLocation(), { language } = useCopy()
  const en = language === 'en', t = (uz: string, english: string) => en ? english : uz
  const tutor = useAiTutor('floating')
  const reduced = useReducedMotion()
  const selection = useNovaSelection(location.pathname)
  const ptt = usePushToTalk(state.open && !talkOpen && !exam, tutor.beginPushToTalk, tutor.endPushToTalk)
  const [catalog, setCatalog] = useState<Array<Omit<StudyTest, 'questions'>>>([])
  const [attempts, setAttempts] = useState<StudyAttempt[]>([])
  const [skill, setSkill] = useState<StudyReference['skill']>('listening')
  const [context, setContext] = useState<Context | null>(null), [error, setError] = useState('')
  const [answer, setAnswer] = useState(''), [message, setMessage] = useState('')
  const [audioState, setAudioState] = useState('idle'), [start, setStart] = useState(0), [end, setEnd] = useState(15), [rate, setRate] = useState(1)
  const player = useRef<NovaSourceAudio | null>(null), requestVersion = useRef(0), panel = useRef<HTMLDivElement>(null)
  const savedWords = useMemo(() => state.progress?.words.length ? getAllSavedWords().filter(word => state.progress!.words.includes(word.term)) : [], [state.progress?.words, user?.id])
  const reference = state.progress?.reference
  const signature = JSON.stringify(reference)
  useEffect(() => { restoreNovaStudy(); return () => player.current?.stop() }, [user?.id])
  useEffect(() => {
    const interrupt = (event: Event) => { if ((event as CustomEvent).detail?.source !== 'original') player.current?.stop() }
    const play = (event: Event) => { const d = (event as CustomEvent).detail; if (d && context?.question.audioUrl === d.audioUrl) void player.current?.play(d.audioUrl, d.start, d.end) }
    window.addEventListener('nova:interrupt', interrupt); window.addEventListener('nova:source-play', play)
    return () => { window.removeEventListener('nova:interrupt', interrupt); window.removeEventListener('nova:source-play', play) }
  }, [context?.question.audioUrl])
  useEffect(() => { player.current = new NovaSourceAudio(setAudioState); return () => player.current?.stop() }, [])
  useEffect(() => {
    if (!state.open || !user || exam) return
    const controller = new AbortController()
    Promise.all([apiClient.get<{ items: typeof catalog }>('/ai/assistant/study/catalog', { signal: controller.signal }), apiClient.get<{ items: StudyAttempt[] }>('/ai/assistant/study/attempts', { signal: controller.signal })])
      .then(([c, a]) => { setCatalog(c.items); setAttempts(a.items) }).catch(() => { if (!controller.signal.aborted) setError(t('Katalog yuklanmadi. Qayta ochib ko‘ring.', 'Catalog could not load. Close and retry.')) })
    return () => controller.abort()
  }, [state.open, user?.id, exam])
  useEffect(() => {
    player.current?.stop(); setContext(null); setError(''); setAnswer('')
    const version = ++requestVersion.current
    if (!reference || !state.open || exam) return
    const controller = new AbortController()
    apiClient.post<Context>('/ai/assistant/study/context', { reference, pathname: location.pathname, reveal: state.progress?.transcriptRevealed ?? false }, { signal: controller.signal })
      .then(value => { if (version === requestVersion.current && !controller.signal.aborted) { setContext(value); setSkill(value.reference.skill); const current = useNovaStudySession.getState().progress; const segment = current?.segment; setStart(segment?.start ?? value.question.sourceRange?.start ?? 0); setEnd(segment?.end ?? value.question.sourceRange?.end ?? 15); setRate(segment?.rate ?? 1); if (current && JSON.stringify(current.reference) !== JSON.stringify(value.reference)) setStudyProgress({ ...current, reference: value.reference, questionIndex: value.test.questionIds.indexOf(value.question.id) }) } })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Context unavailable') })
    return () => controller.abort()
  }, [signature, state.open, exam, user?.id])
  useEffect(() => {
    const action = state.action
    if (!action || !state.open || !context || !state.progress || exam) return
    const ref = action.effect.reference
    if (ref && (ref.testId !== context.reference.testId || ref.skill !== context.reference.skill || ref.attemptId !== context.reference.attemptId || ref.mode !== context.reference.mode || ref.questionId && ref.questionId !== context.question.id)) return
    const owner = user?.id, id = action.id
    let cancelled = false
    const report = (ok: boolean, message: string) => {
      if (!cancelled && useAuthStore.getState().user?.id === owner && useNovaStudySession.getState().action?.id === id) reportNovaAction(id, ok ? 'applied' : 'failed', message)
    }
    const progress = useNovaStudySession.getState().progress!
    const move = (delta: number) => {
      const index = context.test.questionIds.indexOf(context.question.id) + delta, questionId = context.test.questionIds[index]
      if (!questionId) { report(false, delta > 0 ? 'Bu testning oxirgi savoli. Bugungi so‘zlarni takrorlaymizmi?' : 'Bu testning birinchi savoli.'); return }
      player.current?.stop()
      setStudyProgress({ ...progress, reference: { ...context.reference, questionId }, questionIndex: index, step: 'understand', hint: 0, transcriptRevealed: false, segment: undefined })
      report(true, 'Savol ochildi. Bu savol bizdan nimani so‘rayapti?')
    }
    const run = async () => {
      if (action.effect.type === 'study_control') {
        const command = action.effect.action
        if (command === 'next_question' || command === 'previous_question') { move(command === 'next_question' ? 1 : -1); return }
        if (command === 'pause') { player.current?.pause(); report(true, 'Audio to‘xtatildi.'); return }
        if (command === 'continue' && !(audioState === 'paused' && !player.current?.atBoundary)) {
          if (progress.step === 'reinforce') { move(1); return }
          if (progress.step === 'evidence') { setStudyProgress({ ...progress, step: 'reinforce' }); report(true, 'Endi javobga qaramasdan asosiy fikrni va yangi so‘zlarni eslang.'); return }
          if (progress.step !== 'understand' || !context.question.audioUrl) {
            setStudyProgress({ ...progress, step: 'attempt' })
            report(true, context.question.audioUrl ? 'Nima dedi? Avval o‘zingiz tushunganingizni ayting.' : 'Avval o‘zingiz qanday yechishingizni ayting.'); return
          }
        }
        if (command === 'resume' || command === 'continue' && audioState === 'paused' && !player.current?.atBoundary) {
          const ok = await player.current?.resume(); report(Boolean(ok), ok ? 'Audio davom ettirildi.' : 'Davom ettirish uchun avval audio oralig‘ini eshiting.'); return
        }
      }
      if (!context.question.audioUrl) { report(false, 'Bu savolda original audio yo‘q. Keyingi savol buyrug‘idan foydalaning.'); return }
      const selected = progress.segment ?? { start: context.question.sourceRange?.start ?? start, end: context.question.sourceRange?.end ?? end, rate }
      const segment = { ...selected, end: selected.end ?? selected.start + 15 }
      if (action.effect.type === 'play_segment') {
        if (action.effect.audioUrl !== context.question.audioUrl) { report(false, 'Audio tanlangan savol manbasiga mos kelmadi.'); return }
        segment.start = action.effect.start; segment.end = action.effect.end ?? segment.start + 15
      } else {
        const command = action.effect.action
        // Without verified alignment these remain explicitly labelled manual ranges.
        const length = Math.max(.5, segment.end - segment.start)
        if (command === 'next_segment' || command === 'previous_segment') {
          const next = command === 'next_segment' ? segment.end : Math.max(0, segment.start - length)
          segment.start = next; segment.end = next + length
        }
        if (command === 'slower') segment.rate = Math.max(.5, segment.rate - .25)
        if (command === 'normal_speed') segment.rate = 1
      }
      setStart(segment.start); setEnd(segment.end); setRate(segment.rate)
      setStudyProgress({ ...progress, step: 'listen', segment })
      const ok = await player.current?.play(context.question.audioUrl, segment.start, segment.end, segment.rate)
      report(Boolean(ok), ok ? 'Original audio ijro etilmoqda. Gap chegaralari tasdiqlanmagan — tanlangan audio oralig‘i ishlatilmoqda.' : 'Audio ijro etilmadi. Qayta urinib ko‘ring.')
    }
    void run().catch(() => report(false, 'Boshqaruv bajarilmadi. Qayta urinib ko‘ring.'))
    return () => { cancelled = true }
  }, [state.action?.id, context, state.open, exam, user?.id])
  useEffect(() => {
    if (!state.open) { player.current?.stop(); return }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { window.dispatchEvent(new Event('nova:interrupt')); useNovaStudySession.setState({ open: false }) } }
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape)
  }, [state.open])
  useEffect(() => {
    const selected = () => {
      const selection = window.getSelection()?.toString().trim().slice(0, 2400)
      if (selection && !panel.current?.contains(document.activeElement)) useNovaStudySession.setState({ draft: currentWritingDraft() })
    }
    document.addEventListener('selectionchange', selected); return () => document.removeEventListener('selectionchange', selected)
  }, [])
  if (!user || exam || /\/(?:login|register)$/.test(location.pathname)) return null
  const progress = state.progress
  const changeStep = (step: NonNullable<typeof progress>['step']) => { if (progress) setStudyProgress({ ...progress, step }) }
  const reveal = async () => {
    if (!reference || !progress) return
    const version = requestVersion.current
    try { const value = await apiClient.post<Context>('/ai/assistant/study/context', { reference, pathname: location.pathname, reveal: true }); if (version !== requestVersion.current) return; setContext(value); setStudyProgress({ ...progress, step: 'evidence', transcriptRevealed: true }) } catch { setError('Evidence unavailable') }
  }
  const choose = (reference: StudyReference) => { player.current?.stop(); applyNovaEffect({ type: 'study', reference }, navigate) }
  const play = (offset = start, until = end) => {
    if (!context?.question.audioUrl || !progress) return
    const segment = { start: Math.max(0, offset), end: Math.max(offset + .5, until), rate }
    setStudyProgress({ ...progress, step: 'listen', segment }); void player.current?.play(context.question.audioUrl, segment.start, segment.end, rate)
  }
  const ask = (text: string) => { player.current?.stop(); const selected = selection.context || selection.text || reference?.selectedText; void tutor.send({ text: selected ? `${text}\n\n${t('Tanlangan matn', 'Selected text')}:\n${selected}` : text }); setMessage('') }
  const latest = [...tutor.messages].reverse().find(m => m.role === 'assistant')
  return <>
    {!state.open && !talkOpen && <button type="button" className="nova-study-launch" onClick={() => { const reference = inferNovaStudy(location.pathname, location.state); const selectedText = selection.text || window.getSelection()?.toString().trim().slice(0, 2400); if (selectedText) selection.commit(selectedText); openNovaStudy(reference ? { ...reference, selectedText } : undefined) }}><BookOpen size={18}/>Nova</button>}
    <AnimatePresence>{selection.text && !talkOpen && <motion.button key="selection" type="button" className="nova-selection-action" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ left: selection.position.x, top: selection.position.y }} onPointerDown={event => event.preventDefault()} onClick={() => { const text = selection.commit(); const ref = inferNovaStudy(location.pathname, location.state) ?? reference; openNovaStudy(ref ? { ...ref, selectedText: text } : undefined); player.current?.stop(); void tutor.send({ text: `${t('Shuni tushuntir', 'Explain this')}:\n${text}` }) }}><BookOpen size={15}/>{t('Shuni tushuntir', 'Explain this')}</motion.button>}</AnimatePresence>
    <NovaStudySurface open={state.open} onClose={() => { window.dispatchEvent(new Event('nova:interrupt')); useNovaStudySession.setState({ open: false }) }} label={t('Nova dars doskasi', 'Nova study board')}>
      <header><CoachMascot size={44} state={tutor.voiceState} level={tutor.voiceLevel}/><div><strong>Nova</strong><p>{t('Birga tushunamiz, keyin o‘zingiz urinib ko‘rasiz.', 'Work through it, then try it yourself.')}</p></div><button type="button" aria-label={t('Doska yopilsin', 'Close study board')} onClick={() => { window.dispatchEvent(new Event('nova:interrupt')); useNovaStudySession.setState({ open: false }) }}><X size={20}/></button></header>
      <div className="nova-study-scroll" ref={panel}>
        <AnimatePresence mode="wait">{(selection.context || reference?.selectedText) && <motion.blockquote className="nova-context-quote" key={selection.context || reference?.selectedText} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><strong>{t('Tanlangan matn', 'Selected text')}</strong><p>{selection.context || reference?.selectedText}</p></motion.blockquote>}</AnimatePresence>
        <details className="nova-study-setup" open={!context}><summary>{t('Test va yo‘nalish', 'Test and skill')}</summary>
        <label>{t('Yo‘nalish', 'Skill')}<select value={skill} onChange={e => setSkill(novaSkill.parse(e.target.value))}>{novaSkill.options.map(s => <option key={s} value={s}>{({ listening: 'IELTS Listening', reading: 'IELTS Reading', writing: 'IELTS Writing', speaking: 'IELTS Speaking', 'sat-math': 'SAT Math', 'sat-rw': 'SAT Reading and Writing', vocabulary: 'My Vocab' })[s]}</option>)}</select></label>
        <label>{t('Yakunlangan attempt — Analyze', 'Completed attempt — Analyze')}<select value={reference?.attemptId ?? ''} onChange={e => { const a = attempts.find(a => a.id === e.target.value && a.skill === skill); if (a) choose({ skill, testId: a.testId, attemptId: a.id, mode: 'analyze' }) }}><option value="">{t('Attempt tanlang', 'Choose an attempt')}</option>{attempts.filter(a => a.skill === skill && a.completed).map(a => <option value={a.id} key={a.id}>{a.title} · {a.completedAt.slice(0, 16)} · {a.id.slice(-8)}</option>)}</select></label>
        <label>{t('Alohida Practice', 'Separate Practice')}<select value={reference?.mode === 'practice' ? reference.testId : ''} onChange={e => { if (e.target.value) choose({ skill, testId: e.target.value, mode: 'practice' }) }}><option value="">{t('Katalogdan tanlang', 'Choose from catalog')}</option>{catalog.filter(test => test.skill === skill).map(test => <option key={test.id} value={test.id}>{test.title}</option>)}</select></label>
        </details>
        <label className="nova-study-auto-save"><span><input type="checkbox" checked={state.autoWords} onChange={event => useNovaStudySession.setState({ autoWords: event.target.checked })}/>{t(' Shu darsdagi qiyin so‘zlarni avtomatik saqlashga ruxsat', ' Allow automatic saves of difficult words in this lesson')}</span></label>
        {progress && progress.words.length > 0 && <button onClick={() => navigate(`/vocabulary/my-words/${['reading', 'listening', 'writing', 'speaking'].includes(progress.reference.skill) ? progress.reference.skill : 'sat'}/flashcards`)}>{t('Bugungi so‘zlarni takrorlash', 'Review today’s words')} ({progress.words.length})</button>}
        {progress && progress.words.length > 0 && <div className="nova-vocab-cards" aria-label={t('Dars lug\u2018ati', 'Lesson vocabulary')}>{savedWords.map((word, i) => <motion.button type="button" key={word.id} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : Math.min(i * .05, .25) }} onClick={() => ask(`${t('Shu so\u2018zni kontekstda tushuntir', 'Explain this word in context')}: ${word.term}\n${word.example}`)}><strong>{word.term}</strong><small>{word.definition}</small></motion.button>)}</div>}
        {error && <p role="alert">{error}</p>}{state.notice && <p role="status">{state.notice}</p>}
        {state.pending.map(item => <div key={item.id} className="nova-study-consent"><p>{item.effect.type === 'vocabulary' ? `${item.effect.word.term} — My Vocab’ga qo‘shilsinmi?` : t('Draftni saqlab, sahifani ochish?', 'Save the draft and open the page?')}</p><button onClick={() => acceptNovaPending(item.id, navigate)}>{t('Ruxsat berish', 'Allow')}</button><button onClick={() => dismissNovaPending(item.id)}>{t('Bekor qilish', 'Dismiss')}</button></div>)}
        {context && progress && <>
          <div className="nova-study-source"><span>{reference?.mode === 'analyze' ? 'Analyze' : 'Practice'}</span><h2>{context.test.title}</h2>{context.attempt && <p>{context.attempt.completedAt} · {reference?.attemptId}</p>}</div>
          <label>{t('Savol', 'Question')}<select value={context.question.id} onChange={e => choose({ ...context.reference, questionId: e.target.value })}>{context.test.questionIds.map((id, i) => <option key={id} value={id}>{i + 1} · {id}</option>)}</select></label>
          {context.attempt?.questionStatuses && Object.keys(context.attempt.questionStatuses).length > 0 && <nav className="nova-study-actions" aria-label={t('Xato va bo‘sh javoblar', 'Incorrect and skipped answers')}>{context.test.questionIds.filter(id => ['incorrect', 'skipped'].includes(context.attempt?.questionStatuses?.[id] ?? '')).map(id => <button key={id} aria-current={context.question.id === id ? 'step' : undefined} onClick={() => choose({ ...context.reference, questionId: id })}>{t('Savol', 'Question')} {context.test.questionIds.indexOf(id) + 1}{context.attempt?.questionStatuses?.[id] === 'skipped' ? t(' · bo‘sh', ' · skipped') : ''}</button>)}</nav>}
          <nav className="nova-study-steps" aria-label={t('Dars qadami', 'Lesson step')}>{(['understand', 'attempt', 'hint', 'evidence', 'reinforce'] as const).map(step => <button key={step} aria-current={progress.step === step ? 'step' : undefined} onClick={() => step === 'evidence' ? void reveal() : changeStep(step)}>{({ understand: t('Savol', 'Question'), attempt: t('Urinish', 'Try'), hint: t('Ishora', 'Hint'), evidence: t('Dalil', 'Evidence'), reinforce: t('Takror', 'Recall') })[step]}</button>)}</nav>
          <article className="nova-study-question">{context.question.instruction && <p className="nova-study-instruction">{context.question.instruction}</p>}<p>{context.question.text}</p>{context.question.visual?.listening && context.question.visual.asset ? <ListeningDiagram src={context.question.visual.asset} alt={context.question.visual.alt ?? 'Source map'}/> : context.question.visual?.diagram ? <ListeningDiagram src={context.question.visual.diagram === 'old-water-mill' ? '/images/test3-old-water-mill.svg' : '/images/ielts-listening-test14-education-house.jpg'} alt="Source diagram"/> : context.question.visual?.asset?.startsWith('/') && <img className="nova-study-visual" src={context.question.visual.asset} alt={context.question.visual.alt ?? 'Source question diagram'} loading="lazy"/>}{context.question.options?.map((option, i) => <p key={i}>{choiceLabel(option)}</p>)}{context.question.userAnswer !== undefined && <p>{t('Original javobingiz', 'Your original answer')}: {String(context.question.userAnswer)}</p>}</article>
          {context.attempt?.speakingEvaluation?.stats && Array.isArray(context.attempt.speakingEvaluation.strengths) && context.attempt.transcript && <SpeakingReviewWorkbench evaluation={context.attempt.speakingEvaluation} transcript={context.attempt.transcript} pending={false}/>}
          {context.reference.skill === 'speaking' && <NovaSpeakingPractice key={context.question.id} testId={context.test.id} questionId={context.question.id} question={context.question.text} onAttempt={ask}/>}
          {context.question.passage && <details><summary>{t('Original matn', 'Source passage')}</summary><p className="nova-study-passage">{context.question.passage}</p></details>}
          {progress.step === 'understand' && <p>{t('Bu savol bizdan nimani so‘rayapti? Qanday ma’lumot va word limit kerak?', 'What is the question asking? What information and word limit do we need?')}</p>}
          {context.question.audioUrl && <section className="nova-source-player" aria-label="Original audio"><strong>{t('Original audio', 'Original audio')}</strong><p>{t('Gapma-gap alignment yo‘q. Oraliqni original yozuvdan tanlang.', 'Sentence alignment unavailable. Select a range in the original recording.')}</p><div><label>{t('Boshlanish (s)', 'Start (s)')}<input type="number" min="0" value={start} onChange={e => setStart(Math.max(0, Number(e.target.value)))}/></label><label>{t('Tugash (s)', 'End (s)')}<input type="number" min={start + .5} value={end} onChange={e => setEnd(Number(e.target.value))}/></label><label>{t('Tezlik', 'Speed')}<select value={rate} onChange={e => { setRate(Number(e.target.value)); player.current?.setRate(Number(e.target.value)) }}><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option></select></label></div><div><button onClick={() => play()}><Play size={16}/>{t('Eshitish / qayta', 'Play / replay')}</button><button aria-label="Pause source" onClick={() => player.current?.pause()}><Pause size={16}/></button><button onClick={() => void player.current?.resume()}>{t('Davom', 'Resume')}</button><button aria-label="Listen three seconds earlier" onClick={() => play(Math.max(0, start - 3))}><RotateCcw size={16}/>-3s</button><button onClick={() => { const length = end - start; setStart(end); setEnd(end + length); play(end, end + length) }}>{t('Keyingi oraliq', 'Next range')}</button></div><p role="status">{audioState === 'error' ? t('Original audio yuklanmadi. Qayta urining.', 'Source audio failed to load. Retry.') : audioState}</p></section>}
          <label>{progress.step === 'listen' ? t('Nima dedi?', 'What did you hear?') : t('Sizning urinishingiz', 'Your attempt')}<textarea value={progress.answers[context.question.id] ?? answer} onChange={e => { setAnswer(e.target.value); setStudyProgress({ ...progress, answers: { ...progress.answers, [context.question.id]: e.target.value }, step: 'attempt' }) }}/></label>
          <div className="nova-study-actions"><button onClick={() => ask(`${t('Javobimni tekshir. Avval dalilsiz talaffuz baholama.', 'Check my answer. Do not infer pronunciation from text.')}\n${progress.answers[context.question.id] ?? answer}`)}>{t('Nova tekshirsin', 'Ask Nova to check')}</button><button onClick={() => { setStudyProgress({ ...progress, hint: Math.min(4, progress.hint + 1), step: 'hint' }); ask(`${t('Bosqichli ishora ber. Javobni darhol ochma.', 'Give a progressive hint without revealing the answer.')} ${progress.hint + 1}/4`) }}>{t('Ishora', 'Hint')} {progress.hint}/4</button><button onClick={() => { void reveal(); ask(t('To‘liq tushuntir. Haqiqiy javob dalilini tool bilan ol.', 'Explain fully. Retrieve the actual answer evidence with the tool.')) }}>{t('To‘liq izoh', 'Full explanation')}</button></div>
          {context.evidence && <motion.section className="nova-study-evidence" key={context.question.id} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }}><h3>{t('Manbadagi dalil', 'Source evidence')}</h3><p>{t('Javob', 'Answer')}: {String(context.evidence.answer)}</p>{context.evidence.explanation && <p>{context.evidence.explanation}</p>}{context.evidence.quotes.map((q, i) => <motion.blockquote key={i} initial={reduced ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduced ? 0 : i * .07 }}>{q.quote}</motion.blockquote>)}{context.evidence.transcript ? <details open><summary>Transcript</summary><p>{context.evidence.transcript}</p></details> : context.question.audioUrl && <p>{t('Bu manbada transcript mavjud emas.', 'No transcript is available for this source.')}</p>}</motion.section>}
          {context.attempt?.writing && <NovaWritingAnnotations text={context.attempt.writing} anchors={state.annotations?.anchors ?? []}/>}
        </>}
        <button type="button" onClick={() => { const text = currentWritingDraft(); if (!text) { setError(t('Writing paragrafini avval tanlang.', 'Select a writing paragraph first.')); return }; useNovaStudySession.setState({ draft: text }); ask(`${t('Haqiqiy Writing paragrafimni ko‘r. Span uchun aniq versiya va offset ishlat.', 'Review my actual writing paragraph. Use the exact version and offsets for annotations.')} ${writingVersion(text)}`) }}>{t('Writing paragrafimni ko‘r', 'Review my writing paragraph')}</button>
        {state.annotations && <NovaWritingAnnotations text={state.draft || state.annotations.text} anchors={state.annotations.anchors} onFocus={(start, end) => { const editor = document.querySelector<HTMLTextAreaElement>('.writing-desk textarea'); if (editor && editor.value === state.annotations?.text) { editor.focus(); editor.setSelectionRange(start, end); editor.scrollIntoView({ block: 'center' }) } }}/ >}
        {latest && <div className="nova-study-reply" aria-live="polite"><AiMessageContent content={latest.content}/>{latest.lesson && <NovaLessonMessage message={latest} threadId={tutor.activeThreadId ?? ''} userId={user.id} onAttempt={text => ask(text)}/>}</div>}
      </div>
      <form onSubmit={e => { e.preventDefault(); if (message.trim()) ask(message) }}><label className="sr-only" htmlFor="nova-study-message">{t('Nova uchun xabar', 'Message Nova')}</label><textarea id="nova-study-message" value={message} onChange={e => setMessage(e.target.value)} placeholder={t('Shuni tushuntir…', 'Explain this…')}/><button disabled={tutor.isSending || !message.trim()}>{t('Yuborish', 'Send')}</button><button type="button" aria-label="Hold to talk to Nova" aria-pressed={ptt.held} style={{ touchAction: 'none' }} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); ptt.press() }} onPointerUp={() => ptt.release()} onPointerCancel={() => ptt.release(true)} onLostPointerCapture={() => ptt.release(true)}><Mic size={18}/>{ptt.held ? t('Tinglayapman…', 'Listening…') : 'Space'}</button><button type="button" aria-label="Talk to Nova" onClick={() => { player.current?.stop(); useAiAssistantStore.getState().openTalk() }}>{t('Suhbat', 'Talk')}</button></form>
      {tutor.voiceError && <p role="alert">{tutor.voiceError}</p>}
    </NovaStudySurface>
  </>
}
