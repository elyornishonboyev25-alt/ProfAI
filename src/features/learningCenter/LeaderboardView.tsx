import { useState } from 'react'
import { Award, Flame, Trophy, TrendingUp } from 'lucide-react'
import { useAsyncData } from '@/hooks/useAsyncData'
import { learningCenterApi } from './api'
import { Avatar, CenterPageHeading, CenterPanel, CenterSkeleton, EmptyState, ErrorState, inputClass } from './components'
import type { LeaderboardRow } from './types'

type Exam = 'SAT' | 'IELTS'
type Metric = 'SCORE' | 'IMPROVEMENT'

export default function LeaderboardView({ slug }: { slug: string }) {
  const [exam, setExam] = useState<Exam>('SAT')
  const [metric, setMetric] = useState<Metric>('SCORE')
  const [groupId, setGroupId] = useState('')
  const groups = useAsyncData(() => learningCenterApi.groups(slug), [slug])
  const { data, loading, error, refetch } = useAsyncData(
    () => learningCenterApi.leaderboard(slug, exam, metric, groupId || undefined),
    [slug, exam, metric, groupId],
  )
  const rows = data?.rows ?? []

  return <div className="space-y-6">
    <CenterPageHeading eyebrow="Class leaderboard" title="Every result deserves a place" description="Rank real SAT and IELTS results, or celebrate improvement within each track." action={<label className="min-w-44"><span className="sr-only">Filter group</span><select value={groupId} onChange={(event) => setGroupId(event.target.value)} className={inputClass}><option value="">All groups</option>{groups.data?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>} />
    <div className="flex flex-wrap gap-3">
      <div className="lc-leader-segment" role="group" aria-label="Exam track">{(['SAT', 'IELTS'] as const).map((value) => <button key={value} type="button" aria-pressed={exam === value} onClick={() => setExam(value)} className={exam === value ? 'is-active' : ''}>{value}</button>)}</div>
      <div className="lc-leader-segment" role="group" aria-label="Ranking metric">{(['SCORE', 'IMPROVEMENT'] as const).map((value) => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={metric === value ? 'is-active' : ''}>{value === 'SCORE' ? 'Highest score' : 'Most improved'}</button>)}</div>
    </div>
    {loading && !data ? <CenterSkeleton blocks={5} /> : error ? <ErrorState message={error} onRetry={() => void refetch()} /> : rows.length ? <>
      <CenterPanel className="lc-leader-hero p-6 sm:p-8">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3"><div><p className="lc-eyebrow"><Trophy className="h-4 w-4" /> {exam} · {metric === 'SCORE' ? 'Top scores' : 'Growth leaders'}</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Class leaderboard</h2><p className="mt-1 text-sm text-slate-600">{rows.length} learners in this ranking</p></div><span className="lc-leader-badge"><Award className="h-5 w-5" /> The top spot is earned</span></div>
        <div className="relative z-10 mt-8 grid items-end gap-3 sm:grid-cols-3 sm:gap-5">{[rows[1], rows[0], rows[2]].map((row, index) => row ? <Podium key={row.id} row={row} place={index === 1 ? 1 : index === 0 ? 2 : 3} metric={metric} exam={exam} /> : <div key={index} />)}</div>
      </CenterPanel>
      <CenterPanel><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 px-5 py-4"><h2 className="text-lg font-black text-slate-950">Full ranking</h2><span className="text-xs font-semibold text-slate-500">{metric === 'SCORE' ? 'Best result' : 'Change from first to latest result'}</span></div><div className="divide-y divide-slate-200/70">{rows.map((row) => <div key={row.id} className="lc-leader-row flex items-center gap-3 px-5 py-3.5"><span className="w-8 text-center text-sm font-black text-slate-500">#{row.rank}</span><Avatar name={row.fullName} url={row.avatarUrl} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{row.nickname || row.fullName}</p><p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">{row.attempts} {exam} results <span className="px-1">·</span><Flame className="h-3.5 w-3.5 text-red-500" />{row.currentStreak} day streak</p></div><div className="text-right"><p className="text-lg font-black text-slate-950">{displayValue(row, metric, exam)}</p><p className="text-[10px] font-bold uppercase tracking-wider text-red-700">{metric === 'SCORE' ? exam : 'growth'}</p></div></div>)}</div></CenterPanel>
    </> : <CenterPanel><EmptyState title="The race begins with a result" description="Learners appear here after their first SAT or IELTS result is recorded." /></CenterPanel>}
  </div>
}

function displayValue(row: LeaderboardRow, metric: Metric, exam: Exam) {
  if (metric === 'IMPROVEMENT') return `${row.improvement > 0 ? '+' : ''}${row.improvement.toFixed(1)}%`
  const score = row.highest ?? row.score
  return exam === 'IELTS' ? Number(score).toFixed(1) : String(score)
}

function Podium({ row, place, metric, exam }: { row: LeaderboardRow; place: number; metric: Metric; exam: Exam }) {
  return <article className={`lc-podium lc-podium-${place} flex min-w-0 flex-col items-center justify-end p-5 text-center`}><span className="lc-podium-place">#{place}</span><Avatar name={row.fullName} url={row.avatarUrl} size={place === 1 ? 'lg' : 'md'} /><p className="mt-3 w-full truncate text-sm font-bold text-slate-900">{row.nickname || row.fullName}</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{displayValue(row, metric, exam)}</p><span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-700">{metric === 'SCORE' ? exam : <><TrendingUp className="h-3 w-3" /> growth</>}</span></article>
}
