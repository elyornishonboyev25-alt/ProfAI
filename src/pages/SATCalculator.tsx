import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calculator, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export default function SATCalculator() {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()
  const [readingScore, setReadingScore] = useState(30)
  const [writingScore, setWritingScore] = useState(30)
  const [mathScore, setMathScore] = useState(600)

  const calculateTotal = () => {
    const rw = (readingScore + writingScore) * 10
    return rw + Number(mathScore)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.section
        initial={minimalMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={minimalMotion ? { duration: 0.12 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="premium-hero premium-hero-blue p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="premium-top-controls">
              <button onClick={() => navigate('/sat')} className="premium-back-btn-blue">
                <ArrowLeft className="h-4 w-4" />
                Back to SAT Arena
              </button>
              <span className="premium-top-chip-blue">SAT Score Tool</span>
            </div>
            <h1 className="mt-4 inline-flex items-center gap-3 text-3xl font-black text-slate-900 sm:text-4xl">
              <Calculator className="h-8 w-8 text-blue-600" />
              SAT Score Calculator
            </h1>
          </div>
          <div className="premium-stat-blue rounded-2xl text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Estimated Total</p>
            <p className="mt-1 text-4xl font-black text-slate-900">{calculateTotal()}</p>
            <p className="mt-1 text-xs font-semibold text-blue-700">Range 400 - 1600</p>
          </div>
        </div>
      </motion.section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/60 p-6 shadow-[0_16px_34px_rgba(37,99,235,0.12)]">
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Reading (10-40)</label>
                <span className="text-sm font-bold text-blue-700">{readingScore}</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={readingScore}
                onChange={(event) => setReadingScore(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 accent-blue-600"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Writing (10-40)</label>
                <span className="text-sm font-bold text-blue-700">{writingScore}</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={writingScore}
                onChange={(event) => setWritingScore(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 accent-blue-600"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Math (200-800)</label>
                <span className="text-sm font-bold text-blue-700">{mathScore}</span>
              </div>
              <input
                type="range"
                min="200"
                max="800"
                step="10"
                value={mathScore}
                onChange={(event) => setMathScore(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 accent-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/60 p-6 shadow-[0_16px_34px_rgba(37,99,235,0.12)]">
          <h2 className="text-lg font-semibold text-slate-900">Score Breakdown</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
              <span className="font-medium text-slate-700">Reading + Writing</span>
              <span className="font-bold text-blue-700">{(readingScore + writingScore) * 10}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
              <span className="font-medium text-slate-700">Math</span>
              <span className="font-bold text-blue-700">{mathScore}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-lg font-black text-blue-700">{calculateTotal()}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setReadingScore(30)
              setWritingScore(30)
              setMathScore(600)
            }}
            className="interactive-lift mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </section>
    </div>
  )
}

