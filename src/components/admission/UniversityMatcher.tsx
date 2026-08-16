import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, GraduationCap, Loader2, Sparkles, Target, X } from 'lucide-react'
import UniversityLogo from '@/components/admission/UniversityLogo'
import { universities } from '@/data/admission/universities'
import { matchUniversities, type DegreeLevel, type MatchInput, type UniversityMatch } from '@/data/admission/match'
import { fetchAccount, updateAccount } from '@/lib/profileApi'
import { useToastStore, type ToastState } from '@/store/toastStore'

type Props = { open: boolean; onClose: () => void }

const CLASS_STYLE: Record<UniversityMatch['classification'], { label: string; chip: string }> = {
  safety: { label: 'Safety', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  match: { label: 'Match', chip: 'bg-amber-100 text-amber-700 border-amber-200' },
  reach: { label: 'Reach', chip: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
}

const COUNTRIES = Array.from(new Set(universities.map((u) => u.country))).sort()

export default function UniversityMatcher({ open, onClose }: Props) {
  const navigate = useNavigate()
  const pushToast = useToastStore((s: ToastState) => s.pushToast)

  const [step, setStep] = useState(1)
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>('bachelor')
  const [fieldOfStudy, setFieldOfStudy] = useState('')
  const [sat, setSat] = useState('')
  const [ielts, setIelts] = useState('')
  const [gpa, setGpa] = useState('')
  const [budget, setBudget] = useState('')
  const [preferredCountry, setPreferredCountry] = useState('')
  const [results, setResults] = useState<UniversityMatch[]>([])
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)

  // Prefill from the saved account profile each time the matcher opens.
  useEffect(() => {
    if (!open) return
    setStep(1)
    setSavedSlug(null)
    fetchAccount()
      .then((data) => {
        const p = data.profile
        if (p.gpa) setGpa(p.gpa)
        if (p.currentSatScore) setSat(String(p.currentSatScore))
        if (p.currentIeltsScore) setIelts(String(p.currentIeltsScore))
        if (p.fieldOfStudy) setFieldOfStudy(p.fieldOfStudy)
        if (p.budgetUsd) setBudget(String(p.budgetUsd))
        if (p.country) setPreferredCountry((prev) => prev || (COUNTRIES.includes(p.country as string) ? (p.country as string) : prev))
        if (p.degreeLevel === 'bachelor' || p.degreeLevel === 'master' || p.degreeLevel === 'phd') setDegreeLevel(p.degreeLevel)
      })
      .catch(() => {})
  }, [open])

  const input: MatchInput = useMemo(
    () => ({
      satTotal: sat ? Number(sat) : null,
      ieltsOverall: ielts ? Number(ielts) : null,
      gpa: gpa ? Number(gpa) : null,
      fieldOfStudy: fieldOfStudy || null,
      degreeLevel,
      budgetUsdPerYear: budget ? Number(budget) : null,
      preferredCountry: preferredCountry || null,
    }),
    [sat, ielts, gpa, fieldOfStudy, degreeLevel, budget, preferredCountry],
  )

  const computeAndShow = () => {
    setResults(matchUniversities(input))
    setStep(4)
  }

  const setAsTarget = async (slug: string) => {
    setSavingSlug(slug)
    try {
      await updateAccount({ targetUniversitySlug: slug, showUniversity: true })
      setSavedSlug(slug)
      pushToast({ type: 'success', title: 'Target saved', message: 'This university is now your target and shows on your profile.' })
    } catch (e) {
      pushToast({ type: 'error', title: 'Could not save', message: e instanceof Error ? e.message : 'Try again.' })
    } finally {
      setSavingSlug(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_40px_90px_rgba(30,64,175,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Find my university</h2>
              <p className="text-[11px] font-medium text-slate-500">{step < 4 ? `Step ${step} of 3` : `${results.length} matches ranked for you`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
                <p className="text-sm font-bold text-slate-700">What do you want to study?</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['bachelor', 'master', 'phd'] as DegreeLevel[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDegreeLevel(d)}
                      className={`rounded-xl border-2 py-3 text-sm font-bold capitalize transition ${degreeLevel === d ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <label className="block text-sm font-medium text-slate-700">
                  Field of study / major
                  <input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} className="input mt-1" placeholder="e.g. Computer Science, Economics" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Preferred country (optional)
                  <select value={preferredCountry} onChange={(e) => setPreferredCountry(e.target.value)} className="input mt-1">
                    <option value="">Any country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
                <p className="text-sm font-bold text-slate-700">Your test scores (leave blank if not taken)</p>
                <label className="block text-sm font-medium text-slate-700">
                  SAT total (400–1600)
                  <input type="number" min={400} max={1600} value={sat} onChange={(e) => setSat(e.target.value)} className="input mt-1" placeholder="e.g. 1450" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  IELTS overall (0–9)
                  <input type="number" min={0} max={9} step={0.5} value={ielts} onChange={(e) => setIelts(e.target.value)} className="input mt-1" placeholder="e.g. 7.0" />
                </label>
                <p className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-700">
                  Tip: the more you fill in, the more precise your fit score.
                </p>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
                <p className="text-sm font-bold text-slate-700">Academics & budget</p>
                <label className="block text-sm font-medium text-slate-700">
                  GPA (0–4)
                  <input type="number" min={0} max={4} step={0.01} value={gpa} onChange={(e) => setGpa(e.target.value)} className="input mt-1" placeholder="e.g. 3.8" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Yearly living budget in USD (optional)
                  <input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} className="input mt-1" placeholder="e.g. 25000" />
                </label>
              </motion.div>
            ) : null}

            {step === 4 ? (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {results.map((m) => {
                  const cs = CLASS_STYLE[m.classification]
                  const isSaved = savedSlug === m.university.slug
                  return (
                    <div key={m.university.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <UniversityLogo name={m.university.name} brand={m.university.brand} website={m.university.website} size={40} rounded="0.6rem" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900">{m.university.name}</p>
                          <p className="text-[11px] text-slate-500">{m.university.city}, {m.university.country}{typeof m.university.rank === 'number' ? ` · QS #${m.university.rank}` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">{m.fitPercent}%</p>
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${cs.chip}`}>{cs.label}</span>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-0.5">
                        {m.reasons.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                            {r}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => void setAsTarget(m.university.slug)}
                          disabled={savingSlug === m.university.slug || isSaved}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {isSaved ? <Check className="h-3.5 w-3.5" /> : savingSlug === m.university.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                          {isSaved ? 'Saved as target' : 'Set as target'}
                        </button>
                        <button
                          onClick={() => { onClose(); navigate(`/admission/universities/${m.university.slug}`) }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          View profile <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          {step > 1 && step < 4 ? (
            <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} className="cta-sheen inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-6 py-2.5 text-sm font-black text-white">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : step === 3 ? (
            <button onClick={computeAndShow} className="cta-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-6 py-2.5 text-sm font-black text-white">
              <Sparkles className="h-4 w-4" /> See my matches
            </button>
          ) : (
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <GraduationCap className="h-4 w-4" /> Adjust answers
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
