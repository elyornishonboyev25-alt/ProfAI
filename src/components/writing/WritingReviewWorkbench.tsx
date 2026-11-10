import { useId, useState } from 'react'
import { Check, Copy, FileCheck2, PenLine } from 'lucide-react'
import type { WritingEvaluation, WritingError } from '@/services/geminiAI'
import { useCopy } from '@/i18n/interface'
import '@/styles/assessment-studio.css'

export function InlineCorrections({ text, errors }: { text: string; errors: WritingError[] }) {
  const ranges: Array<{ start: number; end: number; error: WritingError }> = []
  for (const error of errors) {
    if (!error.original || error.original === error.corrected) continue
    let start = text.indexOf(error.original)
    while (start >= 0 && ranges.some(range => start < range.end && start + error.original.length > range.start)) start = text.indexOf(error.original, start + 1)
    if (start >= 0) ranges.push({ start, end: start + error.original.length, error })
  }
  ranges.sort((a, b) => a.start - b.start)
  let end = 0
  return <p className="assessment-annotated">{ranges.map(range => {
    const before = text.slice(end, range.start)
    end = range.end
    return <span key={`${range.start}-${range.end}`}>{before}<span className="assessment-edit" title={range.error.explanation}><del>{range.error.original}</del>{' '}<ins>{range.error.corrected}</ins></span></span>
  })}{text.slice(end)}</p>
}

type Review = Pick<WritingEvaluation, 'overallBand' | 'correctedAssessment' | 'assessment' | 'criterionFeedback' | 'correctedVersion' | 'improvedVersion' | 'errors' | 'strengths' | 'improvements'>
export default function WritingReviewWorkbench({ evaluation, original }: { evaluation: Review; original: string }) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language.startsWith('uz') ? uz : language.startsWith('ru') ? ru : en
  const id = useId()
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const tabs = [t('Corrections', 'Tuzatishlar', 'Исправления'), t('Corrected text', 'Tuzatilgan matn', 'Исправленный текст'), t('Stronger version', 'Yaxshilangan versiya', 'Улучшенная версия'), t('Next steps', 'Keyingi qadamlar', 'Следующие шаги')]
  const corrected = evaluation.correctedAssessment
  const unchanged = evaluation.correctedVersion === original
  const labels = { taskAchievement: t('Task fulfilment', 'Vazifaga javob', 'Выполнение задания'), coherenceCohesion: t('Coherence', 'Izchillik', 'Связность'), lexicalResource: t('Vocabulary', 'Lug‘at', 'Лексика'), grammaticalRange: t('Grammar', 'Grammatika', 'Грамматика') }
  const copy = async () => {
    try { await navigator.clipboard.writeText(evaluation.correctedVersion); setCopied(true); setCopyError(false); window.setTimeout(() => setCopied(false), 1800) }
    catch { setCopyError(true) }
  }
  return <section className="assessment-studio writing-review-workbench" aria-label={t('Writing analysis', 'Writing tahlili', 'Анализ Writing')}>
    <div className="assessment-comparison">
      <div><span className="assessment-icon"><PenLine size={19} /></span><p>{t('Your original', 'Siz yozgan javob', 'Ваш ответ')}</p><strong>{evaluation.overallBand.toFixed(1)}<small>/ 9</small></strong></div>
      <span className="assessment-comparison-arrow" aria-hidden="true">→</span>
      <div><span className="assessment-icon assessment-icon--green"><FileCheck2 size={19} /></span><p>{t('With these corrections', 'Shu xatolar tuzatilganda', 'С этими исправлениями')}</p><strong>{corrected ? corrected.overallBand.toFixed(1) : '—'}<small>/ 9</small></strong></div>
      <p className="assessment-comparison-note">{corrected ? unchanged ? t('No validated language corrections were applied. The unchanged text retains the same practice estimate.', 'Tasdiqlangan til tuzatishi qo‘llanmadi. Matn o‘zgarmagani uchun taxminiy baho ham bir xil.', 'Подтверждённые языковые исправления не внесены. Оценка неизменённого текста остаётся прежней.') : t('Two independent practice estimates. Correcting language may leave task coverage and development unchanged.', 'Ikki mustaqil taxminiy baho. Til xatolari tuzatilsa ham, g‘oyalar va vazifaga javob darajasi o‘zgarmasligi mumkin.', 'Две независимые оценки для практики. Исправление языка может не изменить полноту ответа и развитие идей.') : t('This saved attempt predates separate corrected-text scoring.', 'Bu eski urinishda tuzatilgan matn alohida baholanmagan.', 'В этой сохранённой попытке исправленный текст отдельно не оценивался.')}</p>
    </div>
    <div className="assessment-tabs" role="tablist" aria-label={t('Review sections', 'Tahlil bo‘limlari', 'Разделы анализа')}>{tabs.map((title, index) => <button key={title} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={tab === index} aria-controls={`${id}-panel`} tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null
      if (next !== null) { event.preventDefault(); setTab(next); document.getElementById(`${id}-tab-${next}`)?.focus() }
    }}>{title}{index === 0 && <span>{evaluation.errors.length}</span>}</button>)}</div>
    <div className="assessment-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} tabIndex={0}>
      {tab === 0 && <><div className="assessment-legend"><span><del>Aa</del> {t('Original error', 'Asl xato', 'Ошибка')}</span><span><ins>Aa</ins> {t('Correction', 'To‘g‘ri shakli', 'Исправление')}</span></div><InlineCorrections text={original} errors={evaluation.errors} /><div className="assessment-rules">{evaluation.errors.map((error, index) => <details key={index}><summary><del>{error.original}</del> <span aria-hidden="true">→</span> <ins>{error.corrected}</ins></summary><p>{error.explanation}</p></details>)}</div></>}
      {tab === 1 && <><div className="assessment-panel-heading"><h3>{tabs[1]}</h3><button type="button" className="assessment-secondary" onClick={() => void copy()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('Copied', 'Nusxalandi', 'Скопировано') : t('Copy', 'Nusxalash', 'Копировать')}</button></div>{copyError && <p role="status">{t('Select the text and copy it manually.', 'Matnni belgilab qo‘lda nusxalang.', 'Выделите текст и скопируйте вручную.')}</p>}<p className="assessment-annotated">{evaluation.correctedVersion || original}</p>{corrected && <div className="assessment-score-reasons"><h3>{t('Why this version earns this estimate', 'Bu versiya nega shu bahoni oldi', 'Обоснование оценки этой версии')}</h3><p>{corrected.summary}</p>{Object.entries(labels).map(([key, label]) => <details key={key}><summary>{label}<b>{corrected[key as keyof typeof labels].toFixed(1)}</b></summary><p>{corrected.criterionFeedback[key as keyof typeof labels]}</p></details>)}</div>}</>}
      {tab === 2 && <><p className="assessment-note">{t('A coaching rewrite of your ideas. The corrected-text score above applies to the corrected text, not this rewrite.', 'O‘z g‘oyalaringiz asosida yaxshilangan namuna. Yuqoridagi ikkinchi baho bu namunaga emas, tuzatilgan matnga tegishli.', 'Учебная версия ваших идей. Вторая оценка относится к исправленному тексту, а не к этой версии.')}</p><p className="assessment-annotated">{evaluation.improvedVersion || t('A stronger rewrite is unavailable for this saved attempt.', 'Bu urinish uchun yaxshilangan namuna mavjud emas.', 'Улучшенная версия для этой попытки недоступна.')}</p></>}
      {tab === 3 && <div className="assessment-next"><div><h3>{t('Keep doing', 'Davom ettiring', 'Продолжайте')}</h3>{evaluation.strengths.map(item => <p key={item}>{item}</p>)}</div><div><h3>{t('Try next', 'Keyingi mashq', 'Попробуйте дальше')}</h3>{evaluation.improvements.map(item => <p key={item}>{item}</p>)}</div></div>}
    </div>
    {evaluation.assessment && <footer className="assessment-provenance">{evaluation.assessment.model} · {t('IELTS public descriptors · AI practice estimates', 'IELTS rasmiy mezonlari · AI taxminiy bahosi', 'Официальные критерии IELTS · учебная оценка ИИ')}</footer>}
  </section>
}
