import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleDollarSign, GraduationCap, Heart, MapPin, Search, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy } from 'lucide-react'
import { useCopy, translateInterface as c } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import UniversityLogo from './UniversityLogo'
import { formatUniversityRank, QS_EDITION } from '@/data/admission'
import { universities } from '@/data/admission/universities'
import { matchUniversities, type DegreeLevel, type MatchInput } from '@/data/admission/match'
import { fetchAccount, updateAccount } from '@/lib/profileApi'
import { useAuthStore } from '@/store/authStore'
import { useUniversityShortlist } from '@/hooks/useUniversityShortlist'
import { useToastStore } from '@/store/toastStore'
import './university-matcher.css'

const COUNTRIES = Array.from(new Set(universities.map((u) => u.country))).sort()
const MAJORS = ['Computer Science', 'Business Management', 'Economics', 'Engineering', 'Medicine', 'Law', 'Psychology', 'Data Science', 'Artificial Intelligence', 'Finance', 'Accounting', 'Marketing', 'Architecture', 'International Relations', 'Political Science', 'Biology / Life Sciences', 'Chemistry', 'Physics', 'Mathematics', 'Education', 'Public Health', 'Nursing', 'Media & Communications', 'Art & Design']
const STEPS = [
  { label: 'Study goals', hint: 'Your direction' },
  { label: 'Test scores', hint: 'Your results' },
  { label: 'Budget & GPA', hint: 'Your priorities' },
]
const DEGREES = [
  { value: 'bachelor', label: 'Bachelor', description: 'Undergraduate', icon: GraduationCap },
  { value: 'master', label: 'Master', description: 'Graduate study', icon: BookOpen },
  { value: 'phd', label: 'PhD', description: 'Research degree', icon: Sparkles },
] as const
const PAGE_SIZE = 12
const EMPTY_FORM = { degree: 'bachelor' as DegreeLevel, major: '', country: '', sat: '', ielts: '', gpa: '', budget: '' }
type Form = typeof EMPTY_FORM
type Draft = { form: Form; step: number; count: number; query: string; country: string; category: string; scroll: number }

function readDraft(key: string): Draft | null {
  try {
    const d = JSON.parse(sessionStorage.getItem(key) ?? 'null')
    if (!d || !d.form || !Object.keys(EMPTY_FORM).every((k) => typeof d.form[k] === 'string')) return null
    if (!DEGREES.some((degree) => degree.value === d.form.degree)) return null
    return { form: d.form, step: [1, 2, 3].includes(d.step) ? d.step : 1,
      count: Number.isInteger(d.count) ? Math.max(PAGE_SIZE, Math.min(d.count, universities.length)) : PAGE_SIZE,
      query: typeof d.query === 'string' ? d.query : '', country: typeof d.country === 'string' ? d.country : '',
      category: ['all', 'match', 'reach', 'saved'].includes(d.category) ? d.category : 'all',
      scroll: Number.isFinite(d.scroll) ? Math.max(0, d.scroll) : 0 }
  } catch { return null }
}

function toInput(form: Form): MatchInput {
  return { degreeLevel: form.degree, fieldOfStudy: form.major || null, preferredCountry: form.country || null,
    satTotal: form.sat ? Number(form.sat) : null, ieltsOverall: form.ielts ? Number(form.ielts) : null,
    gpa: form.gpa ? Number(form.gpa) : null, budgetUsdPerYear: form.budget ? Number(form.budget) : null }
}

function validate(form: Form, all = false) {
  if (form.sat && (!Number.isInteger(Number(form.sat)) || Number(form.sat) < 400 || Number(form.sat) > 1600)) return 'SAT score must be a whole number from 400 to 1600.'
  if (form.ielts && (!Number.isFinite(Number(form.ielts)) || Number(form.ielts) < 0 || Number(form.ielts) > 9 || !Number.isInteger(Number(form.ielts) * 2))) return 'IELTS band must be from 0 to 9 in half-band steps.'
  if (all && form.gpa && (!Number.isFinite(Number(form.gpa)) || Number(form.gpa) < 0 || Number(form.gpa) > 4)) return 'GPA must be between 0 and 4.'
  if (all && form.budget && (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0)) return 'Yearly budget must be zero or greater.'
  return ''
}

// Keep matching evidence intact while presenting it in the learner's language.
function reasonCopy(reason: string) {
  if (reason === 'No numeric SAT cutoff is published, so no SAT gap was invented') return c('Check the university’s SAT policy for your entry route.')
  if (reason === 'No numeric IELTS cutoff is published, so no IELTS gap was invented') return c('Check the IELTS requirement for your exact programme.')
  if (reason === 'This university publishes no comparable numeric cutoff for the scores you entered') return c('Check programme requirements to compare your scores.')
  if (reason === 'Graduate admission is programme-specific; undergraduate test policies were not used') return c('Graduate requirements vary by programme.')
  const test = reason.match(/^(SAT|IELTS) ([\d.]+) (meets|is near|is below) the (?:official )?(?:published )?([\d.]+) (?:published )?benchmark/)
  if (test) return c(test[3] === 'meets' ? '{{test}} {{score}} meets the published {{benchmark}} benchmark.' : test[3] === 'is near' ? '{{test}} {{score}} is near the published {{benchmark}} benchmark.' : '{{test}} {{score}} is below the published {{benchmark}} benchmark.', { test: test[1], score: test[2], benchmark: test[4] })
  const subject = reason.match(/^(.+) (appears in the official undergraduate subject list|is mentioned in this university’s overview);/)
  if (subject) return c(subject[2].startsWith('appears') ? '{{subject}} is listed for undergraduate study. Check the entry route.' : '{{subject}} appears in the university overview. Confirm the exact degree.', { subject: c(subject[1]) })
  const checkSubject = reason.match(/^Check whether (.+) is offered for your degree level$/)
  if (checkSubject) return c('Confirm that {{subject}} is offered for your degree.', { subject: c(checkSubject[1]) })
  const country = reason.match(/^In your preferred country \((.+)\)$/)
  if (country) return c('In your preferred country: {{country}}.', { country: country[1] })
  const cost = reason.match(/^Living cost ~\$(.+)\/yr (is above|fits) your budget$/)
  if (cost) return c(cost[2] === 'fits' ? 'Published living cost: about ${{amount}} per year, within your budget.' : 'Published living cost: about ${{amount}} per year, above your budget.', { amount: cost[1] })
  return c(reason)
}

export default function UniversityMatcher() {
  const userId = useAuthStore((state) => state.user?.id)
  return <MatcherWorkspace key={userId ?? 'guest'} userId={userId} />
}

function MatcherWorkspace({ userId }: { userId?: string }) {
  const { c } = useCopy()
  const [params, setParams] = useSearchParams()
  const showingResults = params.get('view') === 'results'
  const storageKey = `ivygoo-university-matches-v2:${userId ?? 'guest'}`
  const [initial] = useState(() => readDraft(storageKey))
  const [form, setForm] = useState<Form>(initial?.form ?? EMPTY_FORM)
  const [step, setStep] = useState(initial?.step ?? 1)
  const [count, setCount] = useState(initial?.count ?? PAGE_SIZE)
  const [query, setQuery] = useState(initial?.query ?? '')
  const [country, setCountry] = useState(initial?.country ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'all')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const edited = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const scroll = useRef(initial?.scroll ?? 0)
  const restoreScroll = useRef(showingResults ? initial?.scroll ?? 0 : 0)
  const { isShortlisted, toggleShortlist, shortlistCount } = useUniversityShortlist()
  const pushToast = useToastStore((state) => state.pushToast)

  useEffect(() => {
    if (!userId) return
    let active = true
    fetchAccount().then(({ profile: p }) => {
      if (!active) return
      setTarget(p.targetUniversitySlug)
      if (initial || edited.current || showingResults) return
      setForm({ degree: p.degreeLevel === 'master' || p.degreeLevel === 'phd' ? p.degreeLevel : 'bachelor',
        major: p.fieldOfStudy ?? '', country: COUNTRIES.includes(p.country ?? '') ? p.country! : '',
        sat: p.currentSatScore == null ? '' : String(p.currentSatScore), ielts: p.currentIeltsScore == null ? '' : String(p.currentIeltsScore),
        gpa: p.gpa ?? '', budget: p.budgetUsd == null ? '' : String(p.budgetUsd) })
    }).catch(() => {})
    return () => { active = false }
  }, [userId, initial, showingResults])

  useEffect(() => {
    const save = () => {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ form, step, count, query, country, category, scroll: scroll.current })) } catch { /* Keep working when storage is unavailable. */ }
    }
    save()
    const trackScroll = () => { scroll.current = window.scrollY }
    window.addEventListener('scroll', trackScroll, { passive: true })
    window.addEventListener('pagehide', save)
    return () => { save(); window.removeEventListener('scroll', trackScroll); window.removeEventListener('pagehide', save) }
  }, [storageKey, form, step, count, query, country, category])

  useEffect(() => {
    if (!showingResults || !restoreScroll.current) return
    const top = restoreScroll.current
    const frame = requestAnimationFrame(() => { restoreScroll.current = 0; window.scrollTo({ top, behavior: 'instant' }) })
    return () => cancelAnimationFrame(frame)
  }, [showingResults, initial])

  const input = useMemo(() => toInput(form), [form])
  const matches = useMemo(() => showingResults && !validate(form, true) ? matchUniversities(input) : [], [input, showingResults, form])
  const filtered = useMemo(() => matches.filter((m) => {
    const u = m.university
    const search = query.trim().toLowerCase()
    return (!search || `${u.name} ${u.shortName} ${u.city} ${u.country}`.toLowerCase().includes(search))
      && (!country || u.country === country)
      && (category === 'all' || (category === 'saved' ? isShortlisted(u.slug) : m.classification === category))
  }), [matches, query, country, category, isShortlisted])

  const change = <K extends keyof Form>(key: K, value: Form[K]) => { edited.current = true; setForm((prev) => ({ ...prev, [key]: value })); setError('') }
  const moveTo = (next: number) => { setStep(next); setError(''); heading.current?.focus({ preventScroll: true }) }
  const submit = () => {
    const message = validate(form, true)
    if (message) { setError(message); return }
    setError(''); setCount(PAGE_SIZE); setQuery(''); setCountry(''); setCategory('all'); scroll.current = 0; restoreScroll.current = 0
    setParams({ view: 'results' }); window.scrollTo({ top: 0 })
  }
  const adjust = () => { scroll.current = 0; restoreScroll.current = 0; setParams({}); moveTo(1); window.scrollTo({ top: 0 }) }
  const saveTarget = async (slug: string) => {
    setSaving(slug)
    try {
      await updateAccount({ targetUniversitySlug: slug, showUniversity: true }); setTarget(slug)
      pushToast({ type: 'success', title: 'Target saved', message: 'This university is now your target and shows on your profile.' })
    } catch (e) { pushToast({ type: 'error', title: 'Could not save', message: e instanceof Error ? e.message : 'Try again.' }) }
    finally { setSaving(null) }
  }
  const summary = [DEGREES.find((d) => d.value === form.degree)!.label, form.major || 'Any subject', form.country || 'Any country']
  const scores = [['SAT', form.sat || '—'], ['IELTS', form.ielts || '—'], ['GPA', form.gpa || '—']]

  return <main className="workspace-page um-page">
    <div className="um-workspace">
      <nav className="um-topbar" aria-label={c('University navigation')}>
        <Link to="/admission" className="um-back"><ArrowLeft size={16} /><UiText text="University Applications" /></Link>
        <Link to="/admission/shortlist" className="um-shortlist-link"><Heart size={16} /><UiText text="Shortlist" /><span>{shortlistCount}</span></Link>
      </nav>
      <header className="um-page-heading">
        <span className="um-heading-icon"><Target size={25} /></span>
        <div><h1>{showingResults ? <UiText text="Your university matches" /> : <UiText text="Find your university." />}</h1>
          <p><UiText text={showingResults ? 'A starting point for your next chapter. Explore, compare and save your favourites.' : 'Your goals, your scores, your next chapter. Let’s find a place for you.'} /></p></div>
        {showingResults && <button type="button" className="um-button um-button-secondary" onClick={adjust}><SlidersHorizontal size={16} /><UiText text="Adjust answers" /></button>}
      </header>
      {!showingResults ? <div className="um-builder">
        <aside className="um-guide um-glass">
          <div className="um-guide-title"><GraduationCap size={22} /><h2><UiText text="A plan that fits you" /></h2></div>
          <p><UiText text="Three simple steps. A world of possibilities." /></p>
          <nav className="um-progress" aria-label={c('Matcher progress')}>
            {STEPS.map((item, index) => <button key={item.label} type="button" disabled={index + 1 > step} onClick={() => moveTo(index + 1)} className={`um-progress-step ${step === index + 1 ? 'is-current' : ''} ${step > index + 1 ? 'is-complete' : ''}`} aria-current={step === index + 1 ? 'step' : undefined}>
              <span className="um-progress-number">{step > index + 1 ? <Check size={17} /> : index + 1}</span><span><strong><UiText text={item.label} /></strong><small><UiText text={item.hint} /></small></span>
            </button>)}
          </nav>
          <div className="um-guide-bottom"><ShieldCheck size={20} /><p><UiText text="Explore at your pace. You can leave any score blank and update it later." /></p></div>
        </aside>
        <form className="um-form um-glass" noValidate onSubmit={(event) => {
          event.preventDefault()
          if (step === 3) { submit(); return }
          const message = step === 2 ? validate(form) : ''
          if (message) { setError(message); return }
          moveTo(step + 1)
        }}>
          <div className="um-form-body">
            <div className="um-step-caption"><span><UiText text="Step {{value1}} of {{value2}}" values={{ value1: String(step), value2: '3' }} /></span><span><UiText text="Takes about a minute" /></span></div>
            <h2 ref={heading} tabIndex={-1}>{step === 1 ? <UiText text="Where do you want to go?" /> : step === 2 ? <UiText text="Add the scores you've earned." /> : <UiText text="Make the list yours." />}</h2>
            <p className="um-intro"><UiText text={step === 1 ? 'Choose your degree and the subject you want to explore. You can refine the details later.' : step === 2 ? "Your results help shape the list. Leave a test blank if you haven't taken it yet." : 'Add your academic standing and a comfortable yearly living budget to narrow the search.'} /></p>
            {step === 1 ? <>
              <fieldset className="um-field-group"><legend><UiText text="Degree level" /></legend><div className="um-degree-grid">
                {DEGREES.map((d) => <button key={d.value} type="button" aria-pressed={form.degree === d.value} onClick={() => change('degree', d.value)} className={`um-degree-card ${form.degree === d.value ? 'is-selected' : ''}`}><d.icon size={25} /><strong><UiText text={d.label} /></strong><small><UiText text={d.description} /></small><span className="um-degree-check">{form.degree === d.value && <Check size={12} />}</span></button>)}
              </div></fieldset>
              <div className="um-field-grid">
                <label className="um-field"><span><UiText text="Field of study / major" /></span><span className="um-select-wrap"><select value={form.major} onChange={(e) => change('major', e.target.value)}><option value="">{c('Any subject')}</option>{form.major && !MAJORS.includes(form.major) && <option>{form.major}</option>}{MAJORS.map((m) => <option key={m} value={m}>{c(m)}</option>)}</select><ChevronDown size={16} /></span></label>
                <label className="um-field"><span><UiText text="Preferred country" /></span><span className="um-select-wrap"><select value={form.country} onChange={(e) => change('country', e.target.value)}><option value="">{c('Any country')}</option>{COUNTRIES.map((v) => <option key={v}>{v}</option>)}</select><ChevronDown size={16} /></span></label>
              </div>
            </> : <div className="um-score-grid">
              {(step === 2 ? [
                { key: 'sat', label: 'SAT total', hint: 'Score from 400 to 1600', placeholder: '1450', min: 400, max: 1600, step: 1, icon: Sparkles },
                { key: 'ielts', label: 'IELTS overall', hint: 'Band from 0 to 9', placeholder: '7.0', min: 0, max: 9, step: 0.5, icon: BookOpen },
              ] : [
                { key: 'gpa', label: 'GPA', hint: 'On a 0 to 4 scale', placeholder: '3.5', min: 0, max: 4, step: 0.01, icon: GraduationCap },
                { key: 'budget', label: 'Yearly living budget', hint: 'Amount in USD', placeholder: '20000', min: 0, max: undefined, step: 1, icon: CircleDollarSign },
              ]).map((field) => <label className="um-score-card" key={field.key}><span className="um-score-icon"><field.icon size={23} /></span><strong><UiText text={field.label} /></strong><span className="um-score-caption"><UiText text={field.hint} /></span><input type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step} value={form[field.key as keyof Form]} placeholder={field.placeholder} onChange={(e) => change(field.key as keyof Form, e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'um-input-error' : undefined} /></label>)}
            </div>}
            {error && <p id="um-input-error" role="alert" className="um-error">{c(error)}</p>}
            <p className="um-note"><ShieldCheck size={17} /><span><UiText text={step === 2 ? 'SAT and IELTS alone do not determine admission. Grades, course rigor, essays, recommendations and activities also matter.' : step === 3 ? 'Living budget excludes tuition. Costs are compared only where a yearly USD figure is available.' : 'Your preferences help order the catalog. Check each university’s exact programme before applying.'} /></span></p>
          </div>
          <footer className="um-footer">{step > 1 ? <button type="button" onClick={() => moveTo(step - 1)} className="um-button um-button-secondary"><ArrowLeft size={16} /><UiText text="Back" /></button> : <Link to="/admission/universities" className="um-text-link"><UiText text="Browse universities" /></Link>}
            <button type="submit" className="um-button um-button-primary"><UiText text={step === 3 ? 'See my matches' : 'Continue'} /><ArrowRight size={17} /></button></footer>
        </form>
      </div> : <>
        <section className="um-profile-summary um-glass" aria-label={c('Your preferences')}>
          <div className="um-summary-goals"><span className="um-summary-icon"><GraduationCap size={24} /></span><div><strong>{summary.map((s) => c(s)).join(' / ')}</strong><p><UiText text="Your preferences" />{form.budget && <> / ${Number(form.budget).toLocaleString()} <UiText text="living budget per year" /></>}</p></div></div>
          <dl className="um-summary-scores">{scores.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </section>
        <section className="um-results-section" aria-labelledby="um-results-title">
          <div className="um-results-heading"><div><h2 id="um-results-title"><UiText text="Universities worth exploring." /></h2><p role="status"><strong>{filtered.length.toLocaleString()}</strong> <UiText text="universities found" /> <span>/ {QS_EDITION}</span></p></div>
            <div className="um-results-legend"><span className="um-legend-dot" /><UiText text="Planning fit, not admission probability" /></div></div>
          <div className="um-filters um-glass">
            <label className="um-search"><Search size={18} /><input type="search" aria-label={c('Search universities')} placeholder={c('Search universities')} value={query} onChange={(e) => { setQuery(e.target.value); setCount(PAGE_SIZE) }} /></label>
            <label className="um-filter-country"><MapPin size={17} /><select aria-label={c('Country')} value={country} onChange={(e) => { setCountry(e.target.value); setCount(PAGE_SIZE) }}><option value="">{c('All countries')}</option>{COUNTRIES.map((v) => <option key={v}>{v}</option>)}</select><ChevronDown size={15} /></label>
            <div className="um-filter-tabs" role="group" aria-label={c('Filter matches')}>{[['all', 'All matches'], ['match', 'Explore'], ['reach', 'Dream'], ['saved', 'Shortlisted']].map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} className={category === value ? 'is-active' : ''} onClick={() => { setCategory(value); setCount(PAGE_SIZE) }}><UiText text={label} /></button>)}</div>
          </div>
          {validate(form, true) && <p role="alert" className="um-error">{c(validate(form, true))} <button type="button" className="um-text-link" onClick={adjust}><UiText text="Adjust answers" /></button></p>}
          <div className="um-results-grid">
            {filtered.slice(0, count).map((m) => {
              const u = m.university
              const saved = isShortlisted(u.slug)
              return <article key={u.id} className="um-result-card um-glass">
                <div className="um-result-top"><UniversityLogo id={u.id} name={u.name} brand={u.brand} website={u.website} size={52} rounded="14px" /><span className={`um-match-chip ${m.classification === 'reach' ? 'is-dream' : ''}`}><UiText text={m.classification === 'reach' ? 'Dream' : 'Explore'} /></span><button type="button" className={`um-save ${saved ? 'is-saved' : ''}`} aria-pressed={saved} aria-label={c(saved ? 'Remove from shortlist' : 'Save university') + ': ' + u.name} onClick={() => toggleShortlist(u.slug)}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button></div>
                <h3><Link to={`/admission/universities/${u.slug}`} state={{ admissionReturnTo: '/admission/matches' }}>{u.name}</Link></h3>
                <p className="um-location"><MapPin size={14} />{u.city}, {u.country}</p>
                <div className="um-card-metrics"><span><Trophy size={14} />{typeof u.rank === 'number' ? `QS ${formatUniversityRank(u, '#')}` : c('Ranking not listed')}</span><span title={c('Planning fit, not admission probability')}><strong>{m.fitPercent}%</strong> <UiText text="planning fit" /></span></div>
                <div className="um-fit-track" aria-hidden="true"><span style={{ width: `${m.fitPercent}%` }} /></div>
                <ul className="um-result-reasons">{m.reasons.filter((reason) => !reason.startsWith('No numeric ') || !m.reasons.includes('This university publishes no comparable numeric cutoff for the scores you entered')).slice(0, 3).map((reason) => <li key={reason}><Check size={14} /><span>{reasonCopy(reason)}</span></li>)}</ul>
                <div className="um-result-actions"><button type="button" onClick={() => void saveTarget(u.slug)} disabled={Boolean(saving) || target === u.slug} className="um-target"><Target size={15} /><UiText text={target === u.slug ? 'Saved as target' : saving === u.slug ? 'Saving…' : 'Set as target'} /></button><Link to={`/admission/universities/${u.slug}`} state={{ admissionReturnTo: '/admission/matches' }} className="um-view-profile"><UiText text="View profile" /><ArrowRight size={15} /></Link></div>
              </article>
            })}
          </div>
          {!filtered.length && <div className="um-empty um-glass"><Search size={30} /><h3><UiText text={category === 'saved' ? 'Your shortlist is empty' : 'No universities found'} /></h3><p><UiText text={category === 'saved' ? 'Save universities you want to compare and revisit.' : 'Try a different search or reset your filters.'} /></p><button type="button" className="um-button um-button-secondary" onClick={() => { setQuery(''); setCountry(''); setCategory('all'); setCount(PAGE_SIZE) }}><UiText text="Reset filters" /></button></div>}
          {count < filtered.length && <div className="um-more"><p>{Math.min(count, filtered.length)} / {filtered.length.toLocaleString()}</p><button type="button" className="um-button um-button-secondary" onClick={() => setCount((n) => n + PAGE_SIZE)}><UiText text="Show more universities" /><ChevronDown size={17} /></button></div>}
          <p className="um-note um-bottom-note"><ShieldCheck size={18} /><span><UiText text="Planning fit is not an admission probability. Confirm your major and full entry requirements on each university’s official site." /></span></p>
        </section>
      </>}
      <div className="um-endnote"><GraduationCap size={17} aria-hidden="true" /><span><UiText text="Your next chapter starts with a little exploration." /></span><Link to="/admission/universities"><UiText text="Browse universities" /><ArrowRight size={14} /></Link></div>
    </div>
  </main>
}
