import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleDollarSign, GraduationCap, Loader2, MapPin, ShieldCheck, Sparkles, Target, X } from 'lucide-react'
import UniversityLogo from '@/components/admission/UniversityLogo'
import { formatUniversityRank } from '@/data/admission'
import { universities } from '@/data/admission/universities'
import { matchUniversities, type DegreeLevel, type MatchInput, type UniversityMatch } from '@/data/admission/match'
import { fetchAccount, updateAccount } from '@/lib/profileApi'
import { useToastStore, type ToastState } from '@/store/toastStore'
import './university-matcher.css'

type Props = {
  open: boolean
  onClose: () => void
  resumeInput?: MatchInput | null
  resumeVisibleCount?: number
  resumeScrollTop?: number
}

const CLASS_STYLE: Record<UniversityMatch['classification'], { label: string; chip: string }> = {
  match: { label: 'Explore', chip: 'um-match-chip-explore' },
  reach: { label: 'Dream', chip: 'um-match-chip-dream' },
}

const STEPS = [
  { label: 'Study goals', hint: 'Your direction' },
  { label: 'Test scores', hint: 'Your results' },
  { label: 'Budget & GPA', hint: 'Your priorities' },
]

const COUNTRIES = Array.from(new Set(universities.map((u) => u.country))).sort()
const MAJORS = [
  'Computer Science', 'Business Management', 'Economics', 'Engineering', 'Medicine', 'Law',
  'Psychology', 'Data Science', 'Artificial Intelligence', 'Finance', 'Accounting',
  'Marketing', 'Architecture', 'International Relations', 'Political Science',
  'Biology / Life Sciences', 'Chemistry', 'Physics', 'Mathematics', 'Education',
  'Public Health', 'Nursing', 'Media & Communications', 'Art & Design',
]
const DEFAULT_GPA = ''
const DEFAULT_YEARLY_BUDGET = ''
const RESULTS_PAGE_SIZE = 12

export default function UniversityMatcher({ open, onClose, resumeInput, resumeVisibleCount, resumeScrollTop }: Props) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const resultScrollRef = useRef<HTMLDivElement>(null)
  const pushToast = useToastStore((s: ToastState) => s.pushToast)

  const [step, setStep] = useState(1)
  const [degreeLevel, setDegreeLevel] = useState<DegreeLevel>('bachelor')
  const [fieldOfStudy, setFieldOfStudy] = useState('')
  const [sat, setSat] = useState('')
  const [ielts, setIelts] = useState('')
  const [gpa, setGpa] = useState(DEFAULT_GPA)
  const [budget, setBudget] = useState(DEFAULT_YEARLY_BUDGET)
  const [preferredCountry, setPreferredCountry] = useState('')
  const [results, setResults] = useState<UniversityMatch[]>([])
  const [visibleResultCount, setVisibleResultCount] = useState(RESULTS_PAGE_SIZE)
  const [inputError, setInputError] = useState('')
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)

  // Prefill from the saved account profile each time the matcher opens.
  useEffect(() => {
    if (!open) return
    if (resumeInput) {
      setDegreeLevel(resumeInput.degreeLevel ?? 'bachelor')
      setFieldOfStudy(resumeInput.fieldOfStudy ?? '')
      setSat(resumeInput.satTotal == null ? '' : String(resumeInput.satTotal))
      setIelts(resumeInput.ieltsOverall == null ? '' : String(resumeInput.ieltsOverall))
      setGpa(resumeInput.gpa == null ? '' : String(resumeInput.gpa))
      setBudget(resumeInput.budgetUsdPerYear == null ? '' : String(resumeInput.budgetUsdPerYear))
      setPreferredCountry(resumeInput.preferredCountry ?? '')
      setResults(matchUniversities(resumeInput))
      setVisibleResultCount(Math.max(RESULTS_PAGE_SIZE, resumeVisibleCount ?? RESULTS_PAGE_SIZE))
      setStep(4)
      return
    }
    setStep(1)
    setSavedSlug(null)
    setResults([])
    setVisibleResultCount(RESULTS_PAGE_SIZE)
    setInputError('')
    setGpa(DEFAULT_GPA)
    setBudget(DEFAULT_YEARLY_BUDGET)
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
  }, [open, resumeInput, resumeVisibleCount])

  useEffect(() => {
    if (!open) return
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      cancelAnimationFrame(frame)
      previouslyFocused?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href]'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [open, onClose])

  useEffect(() => setInputError(''), [sat, ielts, gpa, budget])

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

  const scoreError = () => {
    if (sat && (!Number.isInteger(Number(sat)) || Number(sat) < 400 || Number(sat) > 1600)) {
      return 'SAT score must be a whole number from 400 to 1600.'
    }
    if (ielts && (Number(ielts) < 0 || Number(ielts) > 9 || !Number.isInteger(Number(ielts) * 2))) {
      return 'IELTS band must be from 0 to 9 in half-band steps.'
    }
    return ''
  }

  const continueStep = () => {
    const error = step === 2 ? scoreError() : ''
    if (error) { setInputError(error); return }
    setInputError('')
    setStep((current) => current + 1)
  }

  const computeAndShow = () => {
    const error = scoreError() || (gpa && (!Number.isFinite(Number(gpa)) || Number(gpa) < 0 || Number(gpa) > 4)
      ? 'GPA must be between 0 and 4.'
      : '') || (budget && (!Number.isFinite(Number(budget)) || Number(budget) < 0)
      ? 'Yearly budget must be zero or greater.'
      : '')
    if (error) { setInputError(error); return }
    setInputError('')
    setResults(matchUniversities(input))
    setVisibleResultCount(RESULTS_PAGE_SIZE)
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

  return createPortal(
    <div className="um-overlay" onClick={onClose}>
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="university-matcher-title"
        className="um-dialog"
      >
        <header className="um-header">
          <div className="um-heading-group"><span className="um-heading-icon"><Target size={24} /></span><div><span className="um-eyebrow">UNIVERSITY MATCHER</span><h2 id="university-matcher-title">Find your place to thrive.</h2><p>{step < 4 ? 'A guided way to explore universities that fit your plans.' : `${results.length} universities to explore`}</p></div></div>
          <button type="button" onClick={onClose} className="um-close" aria-label="Close university matcher"><X size={21} /></button>
        </header>
        <nav className="um-progress" aria-label="Matcher progress">
          {STEPS.map((item, index) => <div key={item.label} className={`um-progress-step ${step > index + 1 ? 'is-complete' : ''} ${step === index + 1 ? 'is-current' : ''}`} aria-current={step === index + 1 ? 'step' : undefined}><span className="um-progress-number">{step > index + 1 ? <Check size={15} /> : `0${index + 1}`}</span><span><strong>{item.label}</strong><small>{item.hint}</small></span></div>)}
        </nav>

        <div ref={resultScrollRef} className="um-content">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="um-step-panel">
                <div className="um-step-intro"><span>01 / STUDY DIRECTION</span><h3>What does your next chapter look like?</h3><p>Choose your degree and the subject you want to explore. You can refine the details later.</p></div>
                <div className="um-field-group"><p className="um-field-heading">Degree level</p><div className="um-degree-grid">
                  {([
                    { value: 'bachelor', label: 'Bachelor', description: 'Undergraduate', icon: GraduationCap },
                    { value: 'master', label: 'Master', description: 'Graduate study', icon: BookOpen },
                    { value: 'phd', label: 'PhD', description: 'Research degree', icon: Sparkles },
                  ] as const).map((degree) => <button key={degree.value} type="button" aria-pressed={degreeLevel === degree.value} onClick={() => setDegreeLevel(degree.value as DegreeLevel)} className={`um-degree-card ${degreeLevel === degree.value ? 'is-selected' : ''}`}><span className="um-degree-icon"><degree.icon size={22} /></span><strong>{degree.label}</strong><small>{degree.description}</small><span className="um-degree-check"><Check size={13} /></span></button>)}
                </div></div>
                <div className="um-field-grid">
                  <label className="um-field"><span className="um-field-heading">Field of study / major</span><span className="um-select-wrap"><select value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)}><option value="">Choose a major</option>{fieldOfStudy && !MAJORS.includes(fieldOfStudy) ? <option value={fieldOfStudy}>{fieldOfStudy}</option> : null}{MAJORS.map((major) => <option key={major} value={major}>{major}</option>)}</select><ChevronDown size={17} /></span></label>
                  <label className="um-field"><span className="um-field-heading">Preferred country <small>Optional</small></span><span className="um-select-wrap"><select value={preferredCountry} onChange={(e) => setPreferredCountry(e.target.value)}><option value="">Any country</option>{COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}</select><ChevronDown size={17} /></span></label>
                </div>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="um-step-panel">
                <div className="um-step-intro"><span>02 / YOUR RESULTS</span><h3>Add the scores you've earned.</h3><p>Your results help shape the list. Leave a test blank if you haven't taken it yet.</p></div>
                <div className="um-score-grid">
                  <label className="um-score-card"><span className="um-score-icon"><Sparkles size={22} /></span><strong>SAT total</strong><span className="um-score-caption">Score from 400 to 1600</span><input type="number" min={400} max={1600} step={10} value={sat} onChange={(e) => setSat(e.target.value)} placeholder="e.g. 1450" /></label>
                  <label className="um-score-card"><span className="um-score-icon"><BookOpen size={22} /></span><strong>IELTS overall</strong><span className="um-score-caption">Band from 0 to 9</span><input type="number" min={0} max={9} step={0.5} value={ielts} onChange={(e) => setIelts(e.target.value)} placeholder="e.g. 7.0" /></label>
                </div>
                <p className="um-note"><ShieldCheck size={18} /> <span>SAT and IELTS alone do not determine admission. Grades, course rigor, essays, recommendations and activities also matter.</span></p>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="um-step-panel">
                <div className="um-step-intro"><span>03 / YOUR PRIORITIES</span><h3>Make the list yours.</h3><p>Add your academic standing and a comfortable yearly living budget to narrow the search.</p></div>
                <div className="um-score-grid">
                  <label className="um-score-card"><span className="um-score-icon"><GraduationCap size={22} /></span><strong>GPA</strong><span className="um-score-caption">On a 0 to 4 scale</span><input type="number" min={0} max={4} step={0.1} value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="e.g. 3.5" /></label>
                  <label className="um-score-card"><span className="um-score-icon"><CircleDollarSign size={22} /></span><strong>Yearly living budget <small>Optional</small></strong><span className="um-score-caption">Amount in USD</span><input type="number" min={0} step={500} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 20000" /></label>
                </div>
                <p className="um-note"><ShieldCheck size={18} /> <span>These details guide your planning list. You can update them and explore again at any time.</span></p>
              </motion.div>
            ) : null}

            {step === 4 ? (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onAnimationComplete={() => {
                if (resumeScrollTop) resultScrollRef.current?.scrollTo({ top: resumeScrollTop })
              }} className="um-results">
                <div className="um-results-hero"><div><span className="um-results-kicker">YOUR SHORTLIST STARTS HERE</span><h3>Universities worth exploring.</h3><p>Built around your goals, scores and priorities.</p></div><span className="um-results-count">{results.length}<small>results</small></span></div>
                <p className="um-note um-results-note"><ShieldCheck size={18} /> <span>Planning fit is not an admission probability. Confirm your major and full entry requirements on each university’s official site.</span></p>
                {results.slice(0, visibleResultCount).map((m) => {
                  const cs = CLASS_STYLE[m.classification]
                  const isSaved = savedSlug === m.university.slug
                  return (
                    <article key={m.university.id} className="um-result-card">
                      <div className="um-result-top">
                        <UniversityLogo id={m.university.id} name={m.university.name} brand={m.university.brand} website={m.university.website} size={40} rounded="0.6rem" />
                        <div className="um-result-title">
                          <h4>{m.university.name}</h4>
                          <p><MapPin size={13} /> {m.university.city}, {m.university.country}{typeof m.university.rank === 'number' ? ` · QS ${formatUniversityRank(m.university, '#')}` : ''}</p>
                        </div>
                        <div className="um-result-fit" title="Planning fit, not admission probability">
                          <strong>{m.fitPercent}%</strong><span>planning fit</span>
                        </div>
                      </div>
                      <div className="um-fit-track" aria-hidden="true"><span style={{ width: `${m.fitPercent}%` }} /></div>
                      <div className="um-result-classification"><span className={`um-match-chip ${cs.chip}`}>{cs.label}</span><span>Why it fits your plan</span></div>
                      <ul className="um-result-reasons">
                        {m.reasons.slice(0, 3).map((r, i) => (
                          <li key={i}><Check size={14} /> <span>{r}</span></li>
                        ))}
                      </ul>
                      <div className="um-result-actions">
                        <button
                          type="button"
                          onClick={() => void setAsTarget(m.university.slug)}
                          disabled={Boolean(savingSlug) || isSaved}
                          className="um-result-target"
                        >
                          {isSaved ? <Check className="h-3.5 w-3.5" /> : savingSlug === m.university.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                          {isSaved ? 'Saved as target' : 'Set as target'}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admission/universities/${m.university.slug}`, { state: {
                            admissionReturnTo: '/admission', matcherInput: input,
                            matcherVisibleCount: visibleResultCount, matcherScrollTop: resultScrollRef.current?.scrollTop ?? 0,
                          } })}
                          className="um-result-profile"
                        >
                          View profile <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  )
                })}
                {visibleResultCount < results.length ? (
                  <button
                    type="button"
                    onClick={() => setVisibleResultCount((count) => Math.min(count + RESULTS_PAGE_SIZE, results.length))}
                    className="um-show-more"
                  >
                    Show more matches ({Math.min(results.length - visibleResultCount, RESULTS_PAGE_SIZE)} more)
                  </button>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {inputError ? <p role="alert" className="um-error">{inputError}</p> : null}
        </div>

        <footer className="um-footer">
          {step > 1 && step < 4 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="um-button um-button-secondary">
              <ArrowLeft size={18} /> Back
            </button>
          ) : (
            <span className="um-footer-hint">{step === 4 ? 'Your list is ready to explore' : 'Takes about a minute'}</span>
          )}

          {step < 3 ? (
            <button type="button" onClick={continueStep} className="um-button um-button-primary">
              Continue <ArrowRight size={18} />
            </button>
          ) : step === 3 ? (
            <button type="button" onClick={computeAndShow} className="um-button um-button-primary">
              <Sparkles size={18} /> See my matches
            </button>
          ) : (
            <button type="button" onClick={() => setStep(1)} className="um-button um-button-secondary">
              <GraduationCap size={18} /> Adjust answers
            </button>
          )}
        </footer>
      </motion.div>
    </div>,
    document.body,
  )
}
