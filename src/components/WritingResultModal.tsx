import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  X,
  Sparkles,
  Target,
  Trophy,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  PenLine,
} from 'lucide-react'
import type { WritingAnalysisEntry } from '@/utils/writingAnalysisStorage'
import type { WritingError } from '@/services/geminiAI'

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

function ErrorRow({ error, index }: { error: WritingError; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const categoryColors: Record<string, string> = {
    grammar: 'border-red-200 bg-red-50 text-red-700',
    vocabulary: 'border-violet-200 bg-violet-50 text-violet-700',
    spelling: 'border-orange-200 bg-orange-50 text-orange-700',
    punctuation: 'border-amber-200 bg-amber-50 text-amber-700',
    coherence: 'border-blue-200 bg-blue-50 text-blue-700',
    task: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50/50 transition"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-red-100 text-[9px] font-bold text-red-700">
          {index + 1}
        </span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${categoryColors[error.category] || categoryColors.grammar}`}>
          {error.category}
        </span>
        <span className="flex-1 truncate text-xs text-slate-700">{error.original}</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-3 py-2.5 space-y-2">
          <div className="rounded-lg bg-red-50/70 px-2.5 py-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-red-500 mb-0.5">Original</p>
            <p className="text-xs text-red-800 line-through">{error.original}</p>
          </div>
          <div className="rounded-lg bg-emerald-50/70 px-2.5 py-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-0.5">Corrected</p>
            <p className="text-xs text-emerald-800 font-medium">{error.corrected}</p>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">{error.explanation}</p>
        </div>
      )}
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
  const [showCorrected, setShowCorrected] = useState(false)
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
                  {entry.taskType === 'task1' ? 'Task 1' : 'Task 2'} · AI Review
                </div>
                <h3 className="mt-1.5 text-xl font-black text-slate-900">{entry.testTitle}</h3>
                <p className="text-xs text-slate-500">
                  {new Date(entry.savedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{entry.wordCount} words
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Overall Band</span>
              </div>
              <p className="flex-1 min-w-[200px] text-sm leading-relaxed text-slate-600">{entry.summary}</p>
              <div className="flex flex-col items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="mt-1 text-lg font-black text-slate-900">+{entry.xpAwarded}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600">XP</span>
              </div>
            </div>

            {/* Criteria */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                <Target className="h-3.5 w-3.5 text-red-500" /> Band Breakdown
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <MiniRing score={entry.taskAchievement} label="Task" />
                <MiniRing score={entry.coherenceCohesion} label="Coherence" />
                <MiniRing score={entry.lexicalResource} label="Vocab" />
                <MiniRing score={entry.grammaticalRange} label="Grammar" />
              </div>
            </div>

            {/* Strengths + improvements */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-emerald-800 mb-2">
                  <CheckCircle2 className="h-4 w-4" /> Strengths
                </h4>
                <ul className="space-y-1.5">
                  {entry.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-amber-800 mb-2">
                  <TrendingUp className="h-4 w-4" /> Improve
                </h4>
                <ul className="space-y-1.5">
                  {entry.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Errors */}
            {entry.errors.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-500" /> Mistake Analysis ({entry.errors.length})
                </h4>
                <div className="space-y-2">
                  {entry.errors.map((error, i) => (
                    <ErrorRow key={i} error={error} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Corrected version */}
            {entry.correctedVersion && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <BookOpen className="h-4 w-4 text-emerald-500" /> Corrected Version
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCorrected(!showCorrected)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    {showCorrected ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showCorrected ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showCorrected && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                    <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">{entry.correctedVersion}</p>
                  </div>
                )}
              </div>
            )}

            {/* Original */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                <PenLine className="h-3.5 w-3.5" /> Your Original Response
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
