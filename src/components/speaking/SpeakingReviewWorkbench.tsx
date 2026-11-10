import { useId, useState } from 'react'
import { useCopy } from '@/i18n/interface'
import type { ExaminerTurn, SpeakingEvaluation } from '@/services/speakingAI'
import ImprovedResponse from '@/components/ielts/ImprovedResponse'
import { InlineCorrections } from '@/components/writing/WritingReviewWorkbench'
import PronunciationArena from './PronunciationArena'
import ConversationReplay from './ConversationReplay'
import '@/styles/assessment-studio.css'

export default function SpeakingReviewWorkbench({ evaluation, transcript, pending, onImprovedAnswers }: {
  evaluation: SpeakingEvaluation; transcript: ExaminerTurn[]; pending: boolean;
  onImprovedAnswers?: (answers: NonNullable<SpeakingEvaluation['improvedAnswers']>) => void;
}) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language.startsWith('uz') ? uz : language.startsWith('ru') ? ru : en
  const id = useId()
  const [tab, setTab] = useState(0)
  const [index, setIndex] = useState(0)
  const tabs = [t('Answer analysis', 'Javoblar tahlili', 'Анализ ответов'), t('Pronunciation arena', 'Talaffuz arenasi', 'Тренировка произношения'), t('Conversation replay', 'Suhbat audiosi', 'Запись разговора'), t('Practice plan', 'Mashq rejasi', 'План практики')]
  const candidates = transcript.filter(turn => turn.role === 'candidate')
  const selected = candidates[Math.min(index, Math.max(0, candidates.length - 1))]
  const selectedIndex = selected ? candidates.indexOf(selected) : 0
  const turnIndex = selected ? transcript.indexOf(selected) : 0
  const question = transcript.slice(0, turnIndex).reverse().find(turn => turn.role === 'examiner')
  const feedback = evaluation.answerFeedback?.find(item => item.answerIndex === selectedIndex)
  const evidence = evaluation.evidence?.filter(item => item.answerIndex === selectedIndex) ?? []
  const errors = feedback?.corrections.map(error => ({ ...error, category: 'grammar' as const })) ?? []
  return <section className="assessment-studio" aria-label={t('Speaking analysis', 'Speaking tahlili', 'Анализ Speaking')}>
    <div className="assessment-tabs" role="tablist" aria-label={t('Review sections', 'Tahlil bo‘limlari', 'Разделы анализа')}>{tabs.map((title, i) => <button key={title} type="button" role="tab" id={`${id}-tab-${i}`} aria-selected={tab === i} aria-controls={`${id}-panel`} tabIndex={tab === i ? 0 : -1} onClick={() => setTab(i)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (i + 1) % tabs.length : event.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null
      if (next !== null) { event.preventDefault(); setTab(next); document.getElementById(`${id}-tab-${next}`)?.focus() }
    }}>{title}</button>)}</div>
    <div className="assessment-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} tabIndex={0}>
      {tab === 0 && <>
        <h3>{t('Review your answers', 'Javoblaringizni tahlil qiling', 'Разбор ваших ответов')}</h3>
        <div className="speaking-question-picker" aria-label={t('Select a question', 'Savolni tanlang', 'Выберите вопрос')}>{candidates.map((_, i) => <button key={i} type="button" aria-label={`${t('Question', 'Savol', 'Вопрос')} ${i + 1}`} aria-pressed={i === selectedIndex} onClick={() => setIndex(i)}>{i + 1}</button>)}</div>
        {selected ? <><p className="speaking-question-title">{question?.text || t('Your answer', 'Javobingiz', 'Ваш ответ')}</p><InlineCorrections text={selected.text} errors={errors} />
          {feedback && <p className="assessment-note mt-4">{feedback.summary}</p>}
          {errors.length > 0 && <div className="assessment-rules">{errors.map((error, i) => <details key={i}><summary><del>{error.original}</del> → <ins>{error.corrected}</ins></summary><p>{error.explanation}</p></details>)}</div>}
          {evidence.map((item, i) => <div key={i} className="speaking-review-evidence"><h4>{item.criterion}</h4>{item.quote && <p>“{item.quote}”</p>}<p>{item.explanation}</p><p>{item.exercise}</p></div>)}
          {!feedback && !evidence.length && <p className="assessment-note mt-4">{t('This saved report has no separate feedback for this answer. The original response and coaching rewrite are available below.', 'Bu saqlangan hisobotda ushbu javob uchun alohida izoh yo‘q. Asl javob va mashq uchun yaxshilangan shakl quyida.', 'В сохранённом отчёте нет отдельных замечаний к этому ответу. Ниже доступны оригинал и учебная версия.')}</p>}
          {selected.text.trim() && <ImprovedResponse pending={pending} text={evaluation.improvedAnswers?.find(item => item.answerIndex === selectedIndex && item.original === selected.text)?.improved} speakingAnswer={selected.text} onImproved={improved => onImprovedAnswers?.([...(evaluation.improvedAnswers ?? []).filter(item => item.answerIndex !== selectedIndex), { answerIndex: selectedIndex, original: selected.text, improved }].sort((a, b) => a.answerIndex - b.answerIndex))} />}
        </> : <p className="assessment-note">{t('No transcribed answers were saved.', 'Javoblar matni saqlanmagan.', 'Текст ответов не сохранён.')}</p>}
      </>}
      {tab === 1 && (evaluation.assessmentMode === 'audio' ? <PronunciationArena targets={evaluation.pronunciationTargets ?? []} /> : <p className="assessment-note">{t('Pronunciation was not assessed. Complete a recorded Speaking test to receive audio-based targets and practise them here.', 'Talaffuz baholanmagan. Audio asosidagi tavsiyalar va mashqlar uchun ovoz yoziladigan Speaking testini topshiring.', 'Произношение не оценивалось. Пройдите Speaking с записью, чтобы получить замечания по аудио и потренироваться здесь.')}</p>)}
      {tab === 2 && <ConversationReplay transcript={transcript} recording={evaluation.recording} />}
      {tab === 3 && <><div className="assessment-next"><div><h3>{t('Strengths', 'Kuchli tomonlar', 'Сильные стороны')}</h3>{evaluation.strengths.map(item => <p key={item}>{item}</p>)}</div><div><h3>{t('Focus next', 'Keyingi maqsad', 'Следующий шаг')}</h3>{evaluation.improvementPriorities.map((item, i) => <p key={i}><b>{item.area} · {item.target.toFixed(1)}</b><br />{item.action}</p>)}{evaluation.weaknesses.map(item => <p key={item}>{item}</p>)}</div></div><p className="assessment-note mt-5">{t('Record → listen → practise one change → try again. Pace and vocabulary statistics describe this recording; they do not determine an IELTS band.', 'Yozing → tinglang → bitta xatoni mashq qiling → qayta ayting. Tezlik va lug‘at statistikasi yozuvni tavsiflaydi, IELTS ballini belgilamaydi.', 'Запишите → послушайте → отработайте одно изменение → повторите. Темп и статистика слов не определяют балл IELTS.')}</p><div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600"><p>{t('Words spoken', 'Aytilgan so‘zlar', 'Сказано слов')}: <b>{evaluation.stats.wordCount}</b></p><p>{t('Speaking pace', 'Gapirish tezligi', 'Темп речи')}: <b>{evaluation.stats.wordsPerMinute} wpm</b></p><p>{t('Filler words', 'To‘ldiruvchi so‘zlar', 'Слова-паразиты')}: <b>{evaluation.stats.fillerCount}</b></p></div></>}
    </div>
    {evaluation.assessment && <footer className="assessment-provenance">{evaluation.assessment.model} · {t('IELTS public descriptors · AI practice estimate', 'IELTS rasmiy mezonlari · AI taxminiy bahosi', 'Официальные критерии IELTS · учебная оценка ИИ')}</footer>}
  </section>
}
