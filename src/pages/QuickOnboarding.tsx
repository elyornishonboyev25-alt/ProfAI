import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Calculator, Compass, GraduationCap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { fetchAccount, updateAccount } from '@/lib/profileApi'
import { captureAnalyticsEvent } from '@/lib/analytics'
import { clearGuestDiagnosticHandoff, takeGuestDiagnosticDestination } from '@/lib/guestDiagnostic'
import { loadOnboardingProfile, saveOnboardingProfile } from '@/utils/weeklyPlanner'
import { saveLearningFocus, loadLearningFocus, type LearningFocus } from '@/utils/learningFocus'
import { useCopy } from '@/i18n/interface'
import { BrandLockup } from '@/components/brand/BrandLogo'
import LanguageSelector from '@/components/layout/LanguageSelector'

export default function QuickOnboarding() {
  const { c } = useCopy()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const complete = useAuthStore(s => s.setOnboardingCompleted)
  const previous = loadOnboardingProfile(user?.id)
  const [focus, setFocus] = useState<LearningFocus>(loadLearningFocus(user?.id) || (previous?.targetExam === 'SAT' ? 'SAT' : 'IELTS'))
  const [step, setStep] = useState(1)
  const [ielts, setIelts] = useState(previous?.targetIeltsScore || 7)
  const [sat, setSat] = useState(previous?.targetSatScore || 1400)
  const [minutes, setMinutes] = useState(previous?.dailyHours ? Math.min(720, Math.max(60, Math.round(previous.dailyHours) * 60)) : 60)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(Boolean(user?.onboardingCompleted && !previous))
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  useEffect(() => {
    if (!user?.onboardingCompleted || loadOnboardingProfile(user.id)) return
    let cancelled = false
    setLoading(true); setLoadError(false)
    void fetchAccount().then(({ profile }) => {
      if (cancelled) return
      if (!loadLearningFocus(user.id)) setFocus(profile.targetExam === 'SAT' ? 'SAT' : 'IELTS')
      if (profile.targetIeltsScore != null) setIelts(profile.targetIeltsScore)
      if (profile.targetSatScore != null) setSat(profile.targetSatScore)
      if (profile.dailyStudyHours != null) setMinutes(Math.min(720, Math.max(60, profile.dailyStudyHours * 60)))
    }).catch(() => { if (!cancelled) setLoadError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id, user?.onboardingCompleted, loadAttempt])
  const examFocus = focus === 'IELTS' || focus === 'SAT'
  async function finish(skip = false) {
    if (saving || loading || loadError) return
    setSaving(true); setError(false)
    const selected = skip ? 'EXPLORE' : focus
    const hasExam = selected === 'IELTS' || selected === 'SAT'
    try {
      await updateAccount({
        onboardingCompletedAt: new Date().toISOString(),
        ...(hasExam ? {
          targetExam: selected, dailyStudyHours: minutes / 60,
          ...(selected === 'IELTS' ? { targetIeltsScore: ielts, targetScore: `IELTS ${ielts}` } : { targetSatScore: sat, targetScore: `SAT ${sat}` }),
        } : {}),
      })
      if (hasExam) {
        const names = (user?.fullName || 'Learner').trim().split(' ')
        saveOnboardingProfile({
          ...previous, firstName: previous?.firstName || names[0], lastName: previous?.lastName || names.slice(1).join(' '),
          targetExam: selected, daysToExam: previous?.daysToExam || 90, dailyHours: minutes / 60,
          ...(selected === 'IELTS' ? { targetIeltsScore: ielts } : { targetSatScore: sat }),
          createdAt: previous?.createdAt || new Date().toISOString(),
        }, user?.id)
      }
      saveLearningFocus(selected, user?.id)
      complete(true)
      clearGuestDiagnosticHandoff()
      captureAnalyticsEvent('onboarding_completed', { completion_method: skip ? 'skip' : 'quick_goal', target_exam: selected })
      navigate(takeGuestDiagnosticDestination('/dashboard'), { replace: true })
    } catch { setError(true); setSaving(false) }
  }
  return <div className="liquid-onboarding"><header><Link to="/" aria-label="ProfAI"><BrandLockup iconSize={42} /></Link><LanguageSelector /></header>
    <main className="glass-surface liquid-onboarding-panel"><p className="liquid-eyebrow">{step} / 2</p><h1>{c(step === 1 ? 'What would you like to focus on?' : 'Make it your own.')}</h1><p>{c(step === 1 ? 'Choose your starting point. You can explore everything later.' : examFocus ? 'Set a target and a comfortable daily pace.' : focus === 'APPLICATIONS' ? 'Research universities and learn how applications work.' : 'Choose preparation when you are ready.')}</p>
      {loading && <p className="liquid-empty" role="status">{c('Loading your saved goals…')}</p>}
      {loadError && <div className="liquid-inline-error" role="alert"><span>{c('Unable to load your saved goals.')}</span><button onClick={() => setLoadAttempt(value => value + 1)}>{c('Try again')}</button></div>}
      <fieldset disabled={loading || loadError || saving}>
      {step === 1 ? <div className="liquid-choice-grid" role="group" aria-label={c('Choose a goal')}>{[
        { id: 'IELTS' as const, label: 'IELTS', description: 'English proficiency', icon: BookOpen },
        { id: 'SAT' as const, label: 'SAT', description: 'University readiness', icon: Calculator },
        { id: 'APPLICATIONS' as const, label: 'University Applications', description: 'Your university journey', icon: GraduationCap },
        { id: 'EXPLORE' as const, label: 'I’m not sure yet', description: 'Explore the available paths.', icon: Compass },
      ].map(item => <button key={item.id} className={`liquid-choice ${focus === item.id ? 'selected' : ''}`} aria-pressed={focus === item.id} onClick={() => setFocus(item.id)}><item.icon size={24} /><strong>{c(item.label)}</strong><small>{c(item.description)}</small></button>)}</div> : examFocus ? <div>
        <label className="liquid-form-field">{c('Target score')}<select value={focus === 'IELTS' ? ielts : sat} onChange={e => focus === 'IELTS' ? setIelts(Number(e.target.value)) : setSat(Number(e.target.value))}>{[...new Set(focus === 'IELTS' ? [5,5.5,6,6.5,7,7.5,8,8.5,9,ielts] : [1000,1100,1200,1300,1400,1500,1600,sat])].sort((a,b) => a-b).map(score => <option key={score} value={score}>{focus} {score}</option>)}</select></label>
        <label className="liquid-form-field">{c('Daily practice')}<select value={minutes} onChange={e => setMinutes(Number(e.target.value))}>{[...new Set([60,120,180,minutes])].sort((a,b) => a-b).map(value => <option value={value} key={value}>{value / 60} {c(value === 60 ? 'hour' : 'hours')}</option>)}</select></label>
      </div> : <div className="liquid-empty"><Compass size={32} className="mb-4" /><p>{c('Start with a university search or an introductory lesson.')}</p></div>}
      {error && <p className="liquid-inline-error" role="alert">{c('We could not save your choices. Please try again.')}</p>}
      <footer><button className="liquid-text-link" disabled={saving} onClick={() => step === 1 ? user?.onboardingCompleted ? navigate('/dashboard') : void finish(true) : setStep(1)}>{c(step === 1 ? user?.onboardingCompleted ? 'Cancel' : 'Skip for now' : 'Back')}</button><button className="liquid-button primary" disabled={saving} onClick={() => step === 1 ? setStep(2) : void finish()}>{c(saving ? 'Saving' : step === 1 ? 'Continue' : 'Open my workspace')}<ArrowRight size={17} /></button></footer>
      {user?.onboardingCompleted && <Link className="liquid-text-link mt-6" to="/study-profile">{c('Detailed study profile')}</Link>}
      </fieldset>
      {user?.onboardingCompleted && (loading || loadError) && <Link className="liquid-text-link mt-6" to="/dashboard">{c('Cancel')}</Link>}
    </main>
  </div>
}
