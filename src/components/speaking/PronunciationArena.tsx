import { useEffect, useRef, useState } from 'react'
import { Headphones, Loader2, Mic, Square } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import type { SpeakingEvaluation } from '@/services/speakingAI'
import { apiClient } from '@/lib/apiClient'
import { examinerAudio } from '@/lib/speakingAudio'
import { AnswerRecording, microphoneError, requestSpeakingMicrophone } from '@/lib/speakingMedia'
import { withAssessmentDeadline } from '@/utils/assessmentDeadline'

type Feedback = { accuracyPercent: number | null; needsWorkPercent: number | null; heard: string; feedback: string; nextTry: string }
export default function PronunciationArena({ targets }: { targets: NonNullable<SpeakingEvaluation['pronunciationTargets']> }) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language.startsWith('uz') ? uz : language.startsWith('ru') ? ru : en
  const [index, setIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState('')
  const [attemptUrl, setAttemptUrl] = useState<string | null>(null)
  const recorder = useRef<AnswerRecording | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const player = useRef<HTMLAudioElement | null>(null)
  const request = useRef<AbortController | null>(null)
  const guard = useRef(false)
  const alive = useRef(true)
  const stopTimer = useRef<ReturnType<typeof setTimeout>>()
  const finishRef = useRef<() => void>(() => {})
  const target = targets[Math.min(index, Math.max(0, targets.length - 1))]
  useEffect(() => { alive.current = true; return () => {
    alive.current = false; request.current?.abort(); clearTimeout(stopTimer.current); void recorder.current?.stop(); stream.current?.getTracks().forEach(track => track.stop()); player.current?.pause()
    if (player.current?.src.startsWith('blob:')) URL.revokeObjectURL(player.current.src)
  } }, [])
  useEffect(() => () => { if (attemptUrl) URL.revokeObjectURL(attemptUrl) }, [attemptUrl])
  const listen = async () => {
    if (!target || guard.current) return
    guard.current = true; setListening(true); setError('')
    const controller = new AbortController(); request.current = controller
    try {
      player.current ??= new Audio()
      const audio = player.current
      audio.pause()
      if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src)
      const url = await examinerAudio(target.example, 'marin', controller.signal)
      if (!alive.current) { URL.revokeObjectURL(url); return }
      audio.src = url
      audio.onended = () => { guard.current = false; if (alive.current) setListening(false) }
      audio.onerror = () => { guard.current = false; if (alive.current) { setListening(false); setError(t('Audio could not play. Try again.', 'Audio ijro bo‘lmadi. Qayta urining.', 'Не удалось воспроизвести аудио. Повторите.')) } }
      await audio.play()
    } catch (err) { if (alive.current) { setError(err instanceof Error ? err.message : t('Could not play the model audio.', 'Namuna audiosi ochilmadi.', 'Не удалось воспроизвести образец.')); setListening(false) }; guard.current = false }
  }
  const finish = async () => {
    const capture = recorder.current
    if (!capture) return
    recorder.current = null; clearTimeout(stopTimer.current); setRecording(false); setBusy(true)
    try {
      const blob = await capture.stop()
      stream.current?.getTracks().forEach(track => track.stop()); stream.current = null
      if (!alive.current) return
      setAttemptUrl(URL.createObjectURL(blob))
      if (!blob.size || blob.size > 1_400_000) throw new Error(t('Record a clear attempt of up to 15 seconds.', '15 soniyagacha aniq talaffuz qilib yozing.', 'Запишите чёткую попытку до 15 секунд.'))
      const controller = new AbortController(); request.current = controller
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('Could not read the recording.')); reader.readAsDataURL(blob) })
      const result = await withAssessmentDeadline(signal => apiClient.post<Feedback>('/ai/speaking-audio/pronunciation', { word: target.word, phrase: target.example, audioBase64: data, mimeType: blob.type.split(';')[0].replace('audio/x-m4a', 'audio/mp4').replace('audio/m4a', 'audio/mp4') }, { signal: AbortSignal.any([signal, controller.signal]) }), 80_000)
      if (alive.current) setFeedback(result)
    } catch (err) { if (alive.current) setError(err instanceof Error ? err.message : t('Could not assess this attempt.', 'Bu urinish tekshirilmadi.', 'Не удалось оценить попытку.')) }
    finally { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; guard.current = false; if (alive.current) setBusy(false) }
  }
  finishRef.current = () => { void finish() }
  const record = async () => {
    if (guard.current || !target) return
    guard.current = true; setError(''); setFeedback(null); setBusy(true)
    try {
      const mic = await requestSpeakingMicrophone()
      if (!alive.current) { mic.getTracks().forEach(track => track.stop()); return }
      stream.current = mic; recorder.current = new AnswerRecording(mic); setRecording(true); setBusy(false)
      stopTimer.current = setTimeout(() => finishRef.current(), 15_000)
    } catch (err) { guard.current = false; stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; if (alive.current) { setBusy(false); setError(microphoneError(err)) } }
  }
  if (!target) return <p className="assessment-note">{t('No reliable word-level pronunciation issue was identified from the supplied audio. This does not mean your pronunciation is perfect. Review the pronunciation evidence and practise its suggested exercise.', 'Yuborilgan audiodan ishonchli so‘z darajasidagi talaffuz xatosi aniqlanmadi. Bu talaffuz mukammal degani emas. Talaffuz dalillari va tavsiya etilgan mashqni ko‘ring.', 'В аудио не выявлено надёжных ошибок на уровне отдельных слов. Это не означает идеальное произношение. Изучите замечания и рекомендованное упражнение.')}</p>
  return <div>
    <div className="pronunciation-targets" aria-label={t('Words to practise', 'Mashq uchun so‘zlar', 'Слова для практики')}>{targets.map((item, i) => <button key={`${item.word}-${item.answerIndex}`} type="button" disabled={busy || recording || listening} aria-pressed={i === index} onClick={() => { setIndex(i); setFeedback(null); setAttemptUrl(null); setError('') }}>{item.word}</button>)}</div>
    <h3 className="pronunciation-word">{target.word}</h3><p className="pronunciation-ipa">{target.ipa}</p>
    <p className="assessment-note">{target.heard}</p><p className="assessment-annotated">{target.tip}</p><p className="assessment-note mt-3">“{target.example}”</p>
    <div className="pronunciation-actions"><button type="button" className="assessment-secondary" disabled={recording || busy || listening} onClick={() => void listen()}>{listening ? <Loader2 size={15} className="animate-spin" /> : <Headphones size={15} />}{t('Hear the example', 'Namunani tinglash', 'Слушать образец')}</button><button type="button" className="assessment-primary" disabled={busy || listening} onClick={() => recording ? void finish() : void record()}>{busy ? <Loader2 size={15} className="animate-spin" /> : recording ? <Square size={15} /> : <Mic size={15} />}{recording ? t('Finish attempt', 'Urinishni tugatish', 'Завершить попытку') : busy ? t('Listening closely…', 'Diqqat bilan tekshiryapman…', 'Анализируем…') : t('Try saying it', 'Aytib ko‘rish', 'Произнесите сами')}</button></div>
    {attemptUrl && <audio controls preload="metadata" src={attemptUrl} className="mt-4 h-9 w-full" aria-label={t('Your pronunciation attempt', 'Sizning talaffuz urinishingiz', 'Ваша попытка')} />}
    {error && <p role="alert" className="assessment-note mt-4 text-red-700">{error}</p>}
    {feedback && <div className="pronunciation-feedback" role="status">{feedback.accuracyPercent !== null && <><strong>{feedback.accuracyPercent}%</strong><span className="ml-2 text-xs">{t('practice match', 'taxminiy moslik', 'учебное совпадение')} · {feedback.needsWorkPercent}% {t('to refine', 'ustida ishlash kerak', 'требует работы')}</span></>}<p>{feedback.heard && `“${feedback.heard}” · `}{feedback.feedback}</p><p>{feedback.nextTry}</p></div>}
    <p className="assessment-note mt-4">{t('AI coaching estimate from your recording. This percentage is approximate and is separate from your IELTS band.', 'Yozuvingiz asosidagi AI mashq bahosi. Foiz taxminiy bo‘lib, IELTS ballingizdan alohida hisoblanadi.', 'Учебная оценка ИИ по вашей записи. Процент приблизительный и не является баллом IELTS.')}</p>
  </div>
}
