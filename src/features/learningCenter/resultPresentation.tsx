import UiText from '@/components/common/UiText'
import { useCopy } from '@/i18n/interface'
import type { CenterStudent, LearningResult } from './types'

export function seriesKey(result: LearningResult) {
  return `${result.examType}:${result.skill}:${result.maxScore}:${result.scoreKind ?? (result.maxScore === 100 ? 'PERCENT' : result.examType === 'IELTS' ? 'BAND' : 'SCALED')}`
}

export function isMeasured(result: LearningResult) {
  return (!result.scoreStatus || result.scoreStatus === 'SCORED') && Number.isFinite(result.score) && result.maxScore > 0
}

export function skillLabel(skill: string) {
  return skill.replace(/^IELTS_|^SAT_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()).replace('Reading Writing', 'Reading & Writing')
}

export function nativeScore(result: Pick<LearningResult, 'score' | 'maxScore' | 'examType'>) {
  return result.examType === 'IELTS' && result.maxScore === 9 ? result.score.toFixed(1) : String(result.score)
}

export function ResultScore({ result }: { result: LearningResult }) {
  if (!isMeasured(result)) return <span className="lc-result-pending"><UiText text={result.scoreStatus === 'PENDING' ? 'Awaiting assessment' : 'Score unverified'} /></span>
  return <div className="lc-result-score"><strong>{nativeScore(result)}</strong><span>/ {result.maxScore}{result.maxScore === 100 ? '%' : ''}</span>{typeof result.correctAnswers === 'number' && result.totalQuestions ? <small className="!text-slate-500">{result.correctAnswers} / {result.totalQuestions} <UiText text="correct" /></small> : null}{result.scoreKind === 'ESTIMATED' && <small><UiText text="Estimated" /></small>}</div>
}

export function ResultDate({ date, time = true }: { date: string; time?: boolean }) {
  const { language } = useCopy()
  const locale = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-GB'
  return <time dateTime={date}>{new Date(date).toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) })}</time>
}

export function ExamScores({ student }: { student: CenterStudent }) {
  const exams = student.targetExam === 'BOTH' ? ['IELTS', 'SAT'] : [...new Set([student.targetExam, ...(student.currentIelts !== null ? ['IELTS'] : []), ...(student.currentSat !== null ? ['SAT'] : [])])]
  if (student.targetExam === 'UNSET' && student.currentIelts === null && student.currentSat === null) return <span className="text-xs text-slate-500"><UiText text="Exam not set" /></span>
  return <div className="lc-exam-scores">{exams.filter(exam => exam === 'IELTS' || exam === 'SAT').map(exam => {
    const ielts = exam === 'IELTS'
    const value = ielts ? student.currentIelts : student.currentSat
    const source = ielts ? student.currentIeltsSource : student.currentSatSource
    return <div key={exam}><div className="flex flex-wrap items-baseline gap-2"><span className="lc-exam-tag">{exam}</span><strong>{value === null ? '—' : ielts ? value.toFixed(1) : value}</strong><span className="text-[10px] text-slate-500">/ {ielts ? 9 : 1600}</span></div><p className="mt-1 text-[10px] text-slate-500"><UiText text={source === 'PROFILE' ? 'Profile score' : source === 'COMBINED_SECTIONS' ? 'Combined sections' : source === 'FOUR_SKILLS' ? 'Four-skill estimate' : value === null ? 'Overall not available' : 'Full test'} /></p></div>
  })}</div>
}
