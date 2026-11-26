import { useId, useState } from 'react'
import { ChevronDown, Clock3 } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { useCopy } from '@/i18n/interface'
import { CenterPanel, inputClass, secondaryButton } from './components'
import { isMeasured, isPractice, ResultDate, ResultScore, skillLabel } from './resultPresentation'
import type { LearningResult } from './types'

export default function StudentResults({ results }: { results: LearningResult[] }) {
  const { c } = useCopy()
  const [exam, setExam] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const filtered = results.filter(result => (!exam || result.examType === exam) && `${result.title} ${result.skill}`.toLowerCase().includes(search.toLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const currentPage = Math.min(page, pages)
  return <CenterPanel className="p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold text-slate-950"><UiText text="Test history" /></h2><span className="text-xs font-semibold text-slate-500"><UiText text="{{count}} saved attempts" values={{ count: results.length }} /></span></div>
    <div className="mt-4 flex flex-wrap gap-2"><input type="search" aria-label={c('Search test history')} value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder={c('Search tests...')} className={`${inputClass} min-w-0 flex-1`} /><select aria-label={c('Filter result exam')} value={exam} onChange={event => { setExam(event.target.value); setPage(1) }} className={`${inputClass} !w-auto`}><option value=""><UiText text="All exams" /></option><option value="IELTS">IELTS</option><option value="SAT">SAT</option></select></div>
    <div className="lc-result-history">{filtered.length ? filtered.slice((currentPage - 1) * 10, currentPage * 10).map((result, index) => <ResultAttempt key={`${result.source}-${result.id}`} result={result} initiallyOpen={index === 0} />) : <p className="py-8 text-center text-sm text-slate-500"><UiText text="No test results yet." /></p>}</div>
    {pages > 1 && <div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={currentPage <= 1} className={secondaryButton} onClick={() => setPage(currentPage - 1)}><UiText text="Previous" /></button><span className="text-xs text-slate-500">{currentPage} / {pages}</span><button type="button" disabled={currentPage >= pages} className={secondaryButton} onClick={() => setPage(currentPage + 1)}><UiText text="Next" /></button></div>}
  </CenterPanel>
}

function ResultAttempt({ result, initiallyOpen }: { result: LearningResult; initiallyOpen: boolean }) {
  const id = useId()
  const [expanded, setExpanded] = useState(initiallyOpen)
  const parts = result.parts ?? []
  const objective = result.examType === 'IELTS' && ['IELTS_READING', 'IELTS_LISTENING'].includes(result.skill)
  const open = expanded || parts.length === 1
  return <article className="lc-attempt">
    <div className="lc-attempt-heading"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wide text-red-700"><span>{result.examType} · {skillLabel(result.skill)}</span>{objective && <span className="lc-attempt-kind"><UiText text={isPractice(result) ? 'Part practice' : 'Full test'} /></span>}</div><h3 className="mt-2 break-words text-sm font-bold leading-5 text-slate-900">{result.title}</h3><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500"><ResultDate date={result.completedAt} />{result.durationSec > 0 && <span><Clock3 className="mr-1 inline h-3 w-3" />{Math.max(1, Math.round(result.durationSec / 60))} <UiText text="min" /></span>}</div></div><div className="lc-attempt-score"><ResultScore result={result} showPracticeLabel={false} /></div></div>
    {objective && isMeasured(result) && parts.length > 0 && <>
      {parts.length > 1 && <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setExpanded(!expanded)} className="lc-parts-toggle"><UiText text={open ? 'Hide part results' : 'Show part results'} /><ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} /></button>}
      {open && <div id={id} className="lc-parts-table-wrap"><table className="lc-parts-table"><caption className="sr-only">{result.title} · <UiText text="Part results" /></caption><thead><tr><th scope="col"><UiText text={result.skill === 'IELTS_READING' ? 'Passage' : 'Part'} /></th><th scope="col"><UiText text="Correct" /></th><th scope="col"><UiText text="Incorrect" /></th><th scope="col"><UiText text="Unanswered" /></th><th scope="col"><UiText text="Total" /></th></tr></thead><tbody>{parts.map(part => <tr key={part.partNumber}><th scope="row"><span>{part.partNumber}</span><span className="lc-part-name">{part.sectionTitle}</span></th><td className="lc-mark-correct">{part.correctAnswers}</td><td className="lc-mark-incorrect">{part.incorrectAnswers}</td><td>{part.skippedAnswers}</td><td>{part.totalQuestions}</td></tr>)}</tbody>{parts.length > 1 && <tfoot><tr><th scope="row"><UiText text="Total" /></th><td>{parts.reduce((sum, part) => sum + part.correctAnswers, 0)}</td><td>{parts.reduce((sum, part) => sum + part.incorrectAnswers, 0)}</td><td>{parts.reduce((sum, part) => sum + part.skippedAnswers, 0)}</td><td>{parts.reduce((sum, part) => sum + part.totalQuestions, 0)}</td></tr></tfoot>}</table></div>}
    </>}
    {objective && !parts.length && <p className="mt-3 text-[11px] leading-5 text-slate-500"><UiText text="Part breakdown was not recorded for this attempt." /></p>}
  </article>
}
