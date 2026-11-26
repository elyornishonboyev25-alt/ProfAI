import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCopy } from '@/i18n/interface'
import { AnswerRecording, requestSpeakingMicrophone, microphoneError } from '@/lib/speakingMedia'
import { transcribeAnswer } from '@/lib/speakingAudio'
import { analyseTranscript } from '@/lib/speakingScoring'
import { evaluateSpeaking, type SpeakingEvaluation, type ExaminerTurn } from '@/services/speakingAI'
import { saveTestAudio, readTestAudio } from '@/utils/testAudioStorage'
import { accountStorageFor } from '@/utils/accountStorage'
import { cancelCoachAudio } from '@/lib/coachAudio'
import { acquireNovaAudio, ownNovaMedia } from '@/lib/novaAudioOwnership'
import SpeakingReviewWorkbench from '@/components/speaking/SpeakingReviewWorkbench'

/** Separate practice recordings never change a scored/mock attempt. */
export default function NovaSpeakingPractice({ testId, questionId, question, onAttempt }: { testId: string; questionId: string; question: string; onAttempt: (text: string) => void }) {
  const owner = useAuthStore(s => s.user?.id ?? 'guest'), { language } = useCopy()
  const t = (uz: string, en: string) => language === 'en' ? en : uz
  const key = `nova:speaking:${testId}:${questionId}`, audioKey = `${key}:audio`
  const [text, setText] = useState(''), [recording, setRecording] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null), [url, setUrl] = useState(''), [duration, setDuration] = useState(0)
  const stream = useRef<MediaStream | null>(null), recorder = useRef<AnswerRecording | null>(null), blob = useRef<Blob | null>(null)
  const generation = useRef(0), started = useRef(0), timer = useRef(0), request = useRef<AbortController | null>(null), player = useRef<HTMLAudioElement>(null)
  const releaseCapture = useRef<(() => void) | null>(null)
  useEffect(() => {
    const version = ++generation.current
    setText(''); setDuration(0); setEvaluation(null); setUrl(''); setError(''); setBusy(false); setRecording(false); blob.current = null
    try { const saved = JSON.parse(accountStorageFor(owner).getItem(key) ?? '{}'); setText(saved.text ?? ''); setDuration(saved.duration ?? 0); setEvaluation(saved.evaluation ?? null) } catch { /* Recover from a damaged optional practice draft. */ }
    void readTestAudio(owner, `${audioKey}:answer:0`).then(value => { if (generation.current !== version) return; blob.current = value; if (value) setUrl(URL.createObjectURL(value)) })
    const interrupt = () => player.current?.pause()
    window.addEventListener('nova:interrupt', interrupt)
    return () => { generation.current++; releaseCapture.current?.(); request.current?.abort(); clearTimeout(timer.current); void recorder.current?.stop(); recorder.current = null; stream.current?.getTracks().forEach(track => track.stop()); player.current?.pause(); window.removeEventListener('nova:interrupt', interrupt) }
  }, [owner, key])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  const persist = (text: string, duration: number, evaluation: SpeakingEvaluation | null) => accountStorageFor(owner).setItem(key, JSON.stringify({ text, duration, evaluation }))
  const finish = async () => {
    const capture = recorder.current; if (!capture) return
    const capturedStream = stream.current, capturedOwnership = releaseCapture.current
    stream.current = null; releaseCapture.current = null
    recorder.current = null; clearTimeout(timer.current); setRecording(false); setBusy(true)
    const version = generation.current
    try {
      const audio = await capture.stop(); capturedStream?.getTracks().forEach(track => track.stop()); capturedOwnership?.()
      if (version !== generation.current) return
      const duration = Math.max(.1, (Date.now() - started.current) / 1000)
      blob.current = audio; setDuration(duration); setUrl(URL.createObjectURL(audio)); await saveTestAudio(owner, `${audioKey}:answer:0`, audio)
      if (version !== generation.current) return
      setText(''); setEvaluation(null); persist('', duration, null)
      const controller = new AbortController(); request.current = controller
      const transcript = await transcribeAnswer(audio, controller.signal, { language: 'en', lastReliableLanguage: 'en' }, owner)
      if (version !== generation.current || controller.signal.aborted) return
      setText(transcript); setEvaluation(null); persist(transcript, duration, null)
    } catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'Recording could not be processed. Retry transcription or correct the text.') }
    finally { capturedOwnership?.(); capturedStream?.getTracks().forEach(track => track.stop()); if (version === generation.current) setBusy(false) }
  }
  const record = async () => {
    if (busy || recorder.current) return
    window.dispatchEvent(new Event('nova:interrupt')); cancelCoachAudio(); setBusy(true); setError('')
    const version = generation.current
    try {
      const mic = await requestSpeakingMicrophone()
      if (generation.current !== version) { mic.getTracks().forEach(t => t.stop()); return }
      stream.current = mic; recorder.current = new AnswerRecording(mic); started.current = Date.now(); setRecording(true); setBusy(false)
      releaseCapture.current = acquireNovaAudio('recording', () => { void finish() })
      timer.current = window.setTimeout(() => { void finish() }, 120_000)
    } catch (error) { if (generation.current === version) { setBusy(false); setError(microphoneError(error)) } }
  }
  const retryTranscription = async () => {
    if (!blob.current || busy) return
    const version = generation.current, controller = new AbortController(); request.current = controller
    setBusy(true); setError('')
    try {
      const transcript = await transcribeAnswer(blob.current, controller.signal, { language: 'en', lastReliableLanguage: 'en' }, owner)
      if (generation.current !== version || controller.signal.aborted) return
      setText(transcript); setEvaluation(null); persist(transcript, duration, null)
    } catch (error) { if (generation.current === version && !controller.signal.aborted) setError(error instanceof Error ? error.message : 'Transcription unavailable; original recording is saved.') }
    finally { if (generation.current === version) setBusy(false) }
  }
  const history: ExaminerTurn[] = [{ role: 'examiner', text: question }, { role: 'candidate', text }]
  const assess = async () => {
    if (!text.trim() || busy) return
    setBusy(true); setError(''); const version = generation.current
    try {
      const result = await evaluateSpeaking({ modeLabel: `Nova practice · ${testId}`, history, stats: analyseTranscript(text, duration), ...(blob.current ? { audio: [{ blob: blob.current, answerIndex: 0 }], expectedAudioAnswers: [0] } : {}) })
      if (generation.current !== version) return
      const withRecording = { ...result, ...(blob.current ? { recording: { audioKey, layout: 'session' as const } } : {}) }
      setEvaluation(withRecording); persist(text, duration, withRecording)
    } catch (error) { if (generation.current === version) setError(error instanceof Error ? error.message : 'Assessment unavailable; your recording is saved.') }
    finally { if (generation.current === version) setBusy(false) }
  }
  return <section aria-label={t('Speaking qayta urinish', 'Speaking retry')}>
    <p>{t('Savol sayt katalogidan. Inglizcha javob bering; transcriptni tekshirib tuzatishingiz mumkin.', 'This question comes from the site catalog. Answer in English; check and correct the transcript.')}</p>
    <button disabled={busy} type="button" onClick={() => { if (recording) void finish(); else void record() }}>{recording ? t('Yozishni tugatish', 'Finish recording') : t('Javobni yozish / qayta urinish', 'Record answer / retry')}</button>
    {url && <><audio ref={player} controls src={url} aria-label="Original learner recording" onPlay={event => ownNovaMedia(event.currentTarget)}/><button disabled={busy || recording} onClick={() => void retryTranscription()}>{t('Saqlangan audiodan transcriptni qayta olish', 'Retry transcription from saved audio')}</button></>}
    <label>Transcript<textarea disabled={busy || recording} value={text} onChange={e => { setText(e.target.value); setEvaluation(null); persist(e.target.value, duration, null) }}/></label>
    <p>{t('Transcriptdagi so‘zning o‘zi talaffuz xatosiga dalil emas.', 'A transcript word alone is not evidence of a pronunciation error.')}</p>
    <button disabled={busy || !text.trim()} onClick={() => void assess()}>{t('Haqiqiy javobni baholash', 'Assess this actual answer')}</button><button disabled={busy || !text.trim()} onClick={() => onAttempt(`${question}\nMy actual answer: ${text}\n${blob.current ? 'A recording exists locally; retrieve the actual assessment for pronunciation, do not infer it from this transcript.' : 'Text-only attempt; pronunciation is unassessed.'}`)}>{t('Nova bilan rivojlantirish', 'Develop it with Nova')}</button>
    {busy && <p role="status">{t('Qayta ishlanmoqda…', 'Processing…')}</p>}{error && <p role="alert">{error}</p>}
    {evaluation && <SpeakingReviewWorkbench evaluation={evaluation} transcript={history} pending={false}/>}
  </section>
}
