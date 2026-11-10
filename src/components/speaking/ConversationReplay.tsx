import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Play, Square } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { useAuthStore } from '@/store/authStore'
import type { ExaminerTurn, SpeakingEvaluation } from '@/services/speakingAI'
import { readTestAudio } from '@/utils/testAudioStorage'
import { speak } from '@/lib/speech'
import { combineSpeechRecordings } from '@/lib/speakingReplayAudio'

type Clip = { role: 'examiner' | 'candidate'; text: string; blob: Blob | null; url: string | null }
export default function ConversationReplay({ transcript, recording }: { transcript: ExaminerTurn[]; recording?: SpeakingEvaluation['recording'] }) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language.startsWith('uz') ? uz : language.startsWith('ru') ? ru : en
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const player = useRef<HTMLAudioElement | null>(null)
  const speech = useRef<(() => void) | null>(null)
  const version = useRef(0)
  const exportRequest = useRef<AbortController | null>(null)
  const transcriptKey = JSON.stringify(transcript)
  const audioKey = recording?.audioKey
  const layout = recording?.layout
  const stop = () => { version.current++; player.current?.pause(); speech.current?.(); speech.current = null; setPlaying(null) }
  useEffect(() => {
    let disposed = false
    const urls: string[] = []
    setLoading(true); setClips([])
    let candidate = 0, examiner = 0
    const turns = JSON.parse(transcriptKey) as ExaminerTurn[]
    const pending = turns.map(turn => ({ ...turn, index: turn.role === 'candidate' ? candidate++ : examiner++ }))
    void Promise.all(pending.map(async turn => {
      const key = turn.role === 'candidate' ? layout === 'day' ? `${audioKey}:${turn.index}` : `${audioKey}:answer:${turn.index}` : `${audioKey}:examiner:${turn.index}`
      const blob = audioKey ? await readTestAudio(owner, key) : null
      const url = blob ? URL.createObjectURL(blob) : null
      if (url) urls.push(url)
      if (disposed && url) URL.revokeObjectURL(url)
      return { ...turn, blob, url }
    })).then(result => { if (!disposed) { setClips(result); setLoading(false) } })
    return () => { disposed = true; version.current++; player.current?.pause(); speech.current?.(); exportRequest.current?.abort(); urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [owner, audioKey, layout, transcriptKey])
  const playFrom = async (start: number) => {
    stop(); setError('')
    const token = version.current
    const playTurn = async (index: number): Promise<void> => {
      if (token !== version.current) return
      if (index >= clips.length) { setPlaying(null); return }
      const clip = clips[index]
      setPlaying(index)
      const next = () => { if (token === version.current) void playTurn(index + 1) }
      if (clip.url) {
        player.current ??= new Audio()
        const audio = player.current
        audio.src = clip.url; audio.onended = next
        audio.onerror = () => { if (token === version.current) { setError(t('This recording could not play. Try the individual audio below.', 'Bu yozuv ijro bo‘lmadi. Quyidagi alohida audioni oching.', 'Не удалось воспроизвести запись. Попробуйте отдельный файл ниже.')); stop() } }
        try { await audio.play() }
        catch { if (token === version.current) { setError(t('Tap play again to enable audio.', 'Ovozni yoqish uchun yana ijro tugmasini bosing.', 'Нажмите воспроизведение ещё раз для включения звука.')); stop() } }
      } else if (clip.role === 'examiner' && 'speechSynthesis' in window) {
        speech.current = speak(clip.text, { lang: 'en', onEnd: next, onError: () => { if (token === version.current) { setError(t('The device voice is unavailable.', 'Qurilma ovozi mavjud emas.', 'Голос устройства недоступен.')); stop() } } })
      } else {
        setError(t('A candidate recording is missing on this device. The transcript remains available; full replay has stopped.', 'Bu qurilmada o‘quvchi audiosi topilmadi. Matn saqlangan; to‘liq ijro to‘xtadi.', 'Запись кандидата недоступна на этом устройстве. Текст сохранён; воспроизведение остановлено.')); stop()
      }
    }
    await playTurn(start)
  }
  const complete = clips.length > 0 && clips.every(clip => !!clip.blob)
  const download = async () => {
    if (!complete || exporting) return
    stop(); setExporting(true); setError('')
    const controller = new AbortController(); exportRequest.current = controller
    try {
      const audio = await combineSpeechRecordings(clips.map(clip => clip.blob!), controller.signal)
      controller.signal.throwIfAborted()
      const url = URL.createObjectURL(audio)
      const link = document.createElement('a'); link.href = url; link.download = 'ivygoo-speaking-conversation.wav'; link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not export this audio.') }
    finally { if (!controller.signal.aborted) setExporting(false) }
  }
  return <div>
    <div className="speaking-replay-controls"><button type="button" className="assessment-primary" disabled={loading || !clips.length || exporting} onClick={() => playing === null ? void playFrom(0) : stop()}>{playing !== null ? <Square size={15} /> : <Play size={15} />}{playing !== null ? t('Stop replay', 'Ijroni to‘xtatish', 'Остановить') : t('Play conversation', 'Suhbatni tinglash', 'Слушать разговор')}</button><button type="button" disabled={!complete || exporting || loading} className="assessment-secondary" onClick={() => void download()}>{exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}{t('Download both voices', 'Ikkala ovozni yuklash', 'Скачать оба голоса')}</button></div>
    <p className="assessment-note mt-3">{t('Original recordings stay on the device used for the test. Missing examiner audio is read with a labelled device voice during replay; it is never included as a recording in the download.', 'Asl audiolar test topshirilgan qurilmada saqlanadi. Yetishmayotgan examiner audiosi qurilma ovozi bilan o‘qiladi va belgilab ko‘rsatiladi; u yozuv sifatida yuklanmaydi.', 'Оригиналы хранятся на устройстве прохождения теста. Отсутствующий голос экзаменатора озвучивается устройством с пометкой и не включается в загрузку как запись.')}</p>
    {loading && <p role="status" className="assessment-note">{t('Loading saved recordings…', 'Saqlangan audiolar ochilmoqda…', 'Загрузка записей…')}</p>}
    {error && <p role="alert" className="assessment-note text-red-700">{error}</p>}
    {clips.map((clip, index) => <div key={index} className={`speaking-replay-turn ${playing === index ? 'is-playing' : ''}`}><small>{clip.role === 'examiner' ? t('Examiner', 'Examiner', 'Экзаменатор') : t('You', 'Siz', 'Вы')} · {clip.url ? t('Original recording', 'Asl audioyozuv', 'Оригинальная запись') : clip.role === 'examiner' ? t('Device voice reconstruction', 'Qurilma ovozi bilan qayta o‘qish', 'Озвучивание устройством') : t('Recording unavailable here', 'Bu yerda audio mavjud emas', 'Запись недоступна')}</small><p>{clip.text}</p>{clip.url && <audio controls preload="none" src={clip.url} onPlay={stop} aria-label={`${clip.role} ${index + 1}`} />}</div>)}
  </div>
}
