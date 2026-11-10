import WritingReviewWorkbench from '@/components/writing/WritingReviewWorkbench'
import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import TestLeaderboard from '@/components/results/TestLeaderboard'

import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Sparkles, Target, Trophy, PenLine } from 'lucide-react'
import type { WritingAnalysisEntry } from '@/utils/writingAnalysisStorage'
import { getWritingTaskById } from '@/data/writingTestData'
import WritingTaskDiagram from '@/components/writing/WritingTaskDiagram'
import WritingScoreExplanation from '@/components/writing/WritingScoreExplanation'
import WritingDataVisual from '@/components/writing/WritingDataVisual'
import WritingTaskImage from '@/components/writing/WritingTaskImage'

function MiniRing({ score, label }: { score: number; label: string }) {
  const r = 26
  const stroke = 4
  const circumference = 2 * Math.PI * r
  const progress = (score / 9) * circumference
  const svgSize = (r + stroke) * 2
  const color = score >= 7 ? '#059669' : score >= 5.5 ? '#d97706' : score >= 4 ? '#ea580c' : '#dc2626'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle cx={r + stroke} cy={r + stroke} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <motion.circle
            cx={r + stroke} cy={r + stroke} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>{score.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
    </div>
  )
}

export default function WritingResultModal({
  entry,
  onClose,
}: {
  entry: WritingAnalysisEntry
  onClose: () => void
}) {
  const { c: uiCopy } = useCopy()
  const task = entry.taskSnapshot ?? getWritingTaskById(entry.testId)
  const bandColor = (b: number) =>
    b >= 7 ? 'from-emerald-500 to-green-600' : b >= 5.5 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600'

  const modal = (
    <div className="fixed inset-0 z-[260] bg-slate-950/55 px-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-full items-start justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl rounded-[1.8rem] border border-red-200/85 bg-white shadow-[0_34px_80px_rgba(15,23,42,0.32)] overflow-hidden"
        >
          {/* Header */}
          <div className="relative border-b border-slate-100 px-6 py-4">
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${bandColor(entry.overallBand)}`} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-700">
                  <Sparkles className="h-3 w-3" />
                  {entry.taskType === 'task1' ? 'Task 1' : 'Task 2'} <UiText text={"· Writing review"} />
                </div>
                <h3 className="mt-1.5 text-xl font-black text-slate-900">{entry.testTitle}</h3>
                {entry.fullTest ? <p className="mt-1 text-xs font-semibold text-red-700"><UiText text={"Full test estimated band"} /> {entry.fullTest.overallBand.toFixed(1)} <UiText text={"· Task 2 weighted twice"} /></p> : null}
                <p className="text-xs text-slate-500">
                  {new Date(entry.savedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{entry.wordCount} <UiText text={"words"} />
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-red-100 bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
            {/* Score hero */}
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="flex flex-col items-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <span className={`text-3xl font-black bg-gradient-to-r ${bandColor(entry.overallBand)} bg-clip-text text-transparent`}>
                    {entry.overallBand.toFixed(1)}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500"><UiText text={"Estimated task band"} /></span>
              </div>
              <p className="flex-1 min-w-[200px] text-sm leading-relaxed text-slate-600">{entry.summary}</p>
              <div className="flex flex-col items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="mt-1 text-lg font-black text-slate-900">+{entry.xpAwarded}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600">XP</span>
              </div>
            </div>

            {/* Criteria */}
            {task ? (
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review task prompt"} /></summary>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{task.prompt}</p>
              </details>
            ) : null}
            {task?.diagram ? (
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 chart"} /></summary>
                <div className="mx-auto mt-4 max-w-[650px]"><WritingTaskDiagram diagram={task.diagram} /></div>
              </details>
            ) : null}
            {task?.visual ? (
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 data"} /></summary>
                <div className="mx-auto mt-4 max-w-[750px]"><WritingDataVisual visual={task.visual} /></div>
              </details>
            ) : null}
            {task?.chart ? (
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 chart"} /></summary>
                <div className="mx-auto mt-4 max-w-[750px]">
                  <WritingDataVisual visual={{
                    kind: 'line',
                    title: task.chart.title,
                    unit: task.chart.yAxisLabel || 'number of shops',
                    years: task.chart.series[0].data.map((point) => point.year),
                    series: task.chart.series.map((series) => ({ label: series.label, values: series.data.map((point) => point.value) })),
                    sourceLabel: '', sourceUrl: '',
                  }} />
                </div>
              </details>
            ) : null}
            {task?.imageUrl ? (
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 image"} /></summary>
                <WritingTaskImage task={task} className="mx-auto mt-4 max-w-full" />
              </details>
            ) : null}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                <Target className="h-3.5 w-3.5 text-red-500" /> <UiText text={"Band Breakdown"} />
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <MiniRing score={entry.taskAchievement} label={entry.taskType === 'task1' ? 'Task Achievement' : 'Task Response'} />
                <MiniRing score={entry.coherenceCohesion} label={uiCopy("Coherence")} />
                <MiniRing score={entry.lexicalResource} label={uiCopy("Vocab")} />
                <MiniRing score={entry.grammaticalRange} label={uiCopy("Grammar")} />
              </div>
              <WritingScoreExplanation feedback={entry.criterionFeedback} taskType={entry.taskType} />
            </div>

            <WritingReviewWorkbench evaluation={entry} original={entry.studentResponse} />

            <details className="ir-glass p-5"><summary className="cursor-pointer font-bold"><UiText text={"Test leaderboard"} /></summary><div className="mt-5"><TestLeaderboard testId={entry.testId} title={entry.testTitle} /></div></details>
            {/* Original */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                <PenLine className="h-3.5 w-3.5" /> <UiText text={"Your Original Response"} />
              </h4>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                {entry.studentResponse || '(empty)'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal
}
