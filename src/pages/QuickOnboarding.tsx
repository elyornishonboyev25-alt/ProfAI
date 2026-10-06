import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Camera, ChevronLeft, Minus, Plus, Target } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { fetchAccount, updateAccount, uploadAvatar } from '@/lib/profileApi'
import { compressImageToDataUrl } from '@/utils/imageCompress'
import { captureAnalyticsEvent } from '@/lib/analytics'
import { clearGuestDiagnosticHandoff, takeGuestDiagnosticDestination } from '@/lib/guestDiagnostic'
import { loadOnboardingProfile, saveOnboardingProfile } from '@/utils/weeklyPlanner'
import { useCopy } from '@/i18n/interface'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import LanguageSelector from '@/components/layout/LanguageSelector'
import BaselineMockPrompt, { SAT_BASELINE_PATH, IELTS_BASELINE_PATH } from '@/components/dashboard/BaselineMockPrompt'
import { SAT_CURRENT_SCORE_MIN, SAT_TARGET_SCORE_MIN, SAT_SCORE_MAX } from '@/features/sat/scoreGoals'

const nicknamePattern = /^[A-Za-z][A-Za-z0-9_]{2,19}$/
type Exam = 'IELTS' | 'SAT'

function scoreLimits(exam: Exam, target: boolean) {
  return exam === 'IELTS' ? { min: target ? 4 : 0, max: 9, step: 0.5 } : { min: target ? SAT_TARGET_SCORE_MIN : SAT_CURRENT_SCORE_MIN, max: SAT_SCORE_MAX, step: 10 }
}

function parseScore(draft: string, exam: Exam, target: boolean): number | null {
  const text = draft.trim().replace(',', '.')
  if (!text) return null
  const score = Number(text)
  const { min, max } = scoreLimits(exam, target)
  if (!Number.isFinite(score) || score < min || score > max) return NaN
  if (exam === 'IELTS' ? !Number.isInteger(score * 2) : !Number.isInteger(score)) return NaN
  return score
}

function ScoreInput({ exam, target, label, placeholder, value, onChange }: {
  exam: Exam
  target: boolean
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  const { min, max, step } = scoreLimits(exam, target)
  const id = `${exam.toLowerCase()}-${target ? 'target' : 'current'}-score`
  const parsed = parseScore(value, exam, target)
  const nudge = (direction: -1 | 1) => {
    const base = parsed !== null && !Number.isNaN(parsed) ? parsed : min - (direction === 1 ? step : 0)
    const next = Math.min(max, Math.max(min, Math.round((base + direction * step) * 10) / 10))
    onChange(String(next))
  }

  return <div className="liquid-form-field">
    <label htmlFor={id}>{label}</label>
    <div className={`liquid-score-input ${parsed !== null && Number.isNaN(parsed) ? 'is-invalid' : ''}`}>
      <input id={id} type="text" inputMode={exam === 'IELTS' ? 'decimal' : 'numeric'} autoComplete="off" placeholder={placeholder} value={value} aria-invalid={parsed !== null && Number.isNaN(parsed)} onKeyDown={event => {
        if (event.key === 'ArrowUp' && parsed !== max) { event.preventDefault(); nudge(1) }
        if (event.key === 'ArrowDown' && parsed !== null && parsed !== min) { event.preventDefault(); nudge(-1) }
      }} onChange={event => {
        const next = event.target.value.replace(',', '.')
        if (exam === 'IELTS' ? /^\d{0,2}(?:\.\d{0,1})?$/.test(next) : /^\d{0,4}$/.test(next)) onChange(next)
      }} />
      <div className="liquid-score-controls">
        <button type="button" aria-label={`Decrease ${exam} ${target ? 'target' : 'current'} score`} disabled={parsed === null || parsed === min} onClick={() => nudge(-1)}><Minus size={16} /></button>
        <button type="button" aria-label={`Increase ${exam} ${target ? 'target' : 'current'} score`} disabled={parsed === max} onClick={() => nudge(1)}><Plus size={16} /></button>
      </div>
    </div>
  </div>
}

export default function QuickOnboarding() {
  const { c } = useCopy()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const complete = useAuthStore(state => state.setOnboardingCompleted)
  const clearSession = useAuthStore(state => state.clearSession)
  const setUserNickname = useAuthStore(state => state.setUserNickname)
  const setUserAvatar = useAuthStore(state => state.setUserAvatar)
  const previous = loadOnboardingProfile(user?.id, user?.fullName)
  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? null)
  const [currentIelts, setCurrentIelts] = useState(previous?.currentIeltsScore?.toString() ?? '')
  const [targetIelts, setTargetIelts] = useState(previous?.targetIeltsScore?.toString() ?? '')
  const [currentSat, setCurrentSat] = useState(previous?.currentSatScore?.toString() ?? '')
  const [targetSat, setTargetSat] = useState(previous?.targetSatScore?.toString() ?? '')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setLoading(true)
    setError('')
    setLoadFailed(false)
    void fetchAccount().then(({ nickname: savedNickname, avatarUrl, profile }) => {
      if (cancelled) return
      setNickname(savedNickname ?? '')
      setAvatar(avatarUrl)
      setCurrentIelts(profile.currentIeltsScore?.toString() ?? '')
      setTargetIelts(profile.targetIeltsScore?.toString() ?? '')
      setCurrentSat(profile.currentSatScore?.toString() ?? '')
      setTargetSat(profile.targetSatScore?.toString() ?? '')
    }).catch(() => { if (!cancelled) { setLoadFailed(true); setError('Unable to load your profile. Please try again.') } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id, loadAttempt])

  async function chooseAvatar(file?: File) {
    if (!file || uploading) return
    setUploading(true)
    setError('')
    try {
      const dataUrl = await compressImageToDataUrl(file, { size: 320, quality: 0.86 })
      const result = await uploadAvatar(dataUrl)
      const next = result.avatarUrl ?? dataUrl
      setAvatar(next)
      setUserAvatar(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : c('Photo could not be saved. Please try again.'))
    } finally {
      setUploading(false)
    }
  }

  function continueToScores() {
    if (!nicknamePattern.test(nickname.trim())) {
      setError(c('Use 3–20 letters, numbers or underscores. Start with a letter.'))
      return
    }
    setError('')
    setStep(2)
  }

  function goBack() {
    if (saving || uploading) return
    if (step === 2) {
      setError('')
      setStep(1)
    } else if (user?.onboardingCompleted) {
      navigate('/dashboard')
    } else {
      clearSession()
      navigate('/', { replace: true })
    }
  }

  async function finish(skipScores = false, baselineExam?: Exam) {
    if (saving || loading || uploading) return
    const currentIeltsScore = skipScores ? null : parseScore(currentIelts, 'IELTS', false)
    const targetIeltsScore = skipScores ? null : parseScore(targetIelts, 'IELTS', true)
    const currentSatScore = skipScores ? null : parseScore(currentSat, 'SAT', false)
    const targetSatScore = skipScores ? null : parseScore(targetSat, 'SAT', true)
    if ([currentIeltsScore, targetIeltsScore, currentSatScore, targetSatScore].some(score => score !== null && Number.isNaN(score))) {
      setError(c('Enter IELTS scores in 0.5 steps (current 0–9, target 4–9). SAT current scores: 400–1600; targets: 1000–1600.'))
      return
    }
    if ((currentIeltsScore !== null && targetIeltsScore !== null && currentIeltsScore > targetIeltsScore)
      || (currentSatScore !== null && targetSatScore !== null && currentSatScore > targetSatScore)) {
      setError(c('A target score must be at least your current score.'))
      return
    }
    setSaving(true)
    setError('')
    const ieltsGoal = targetIeltsScore
    const satGoal = targetSatScore
    const targetExam = ieltsGoal !== null && satGoal !== null ? 'BOTH' : ieltsGoal !== null ? 'IELTS' : satGoal !== null ? 'SAT' : baselineExam ?? null
    try {
      const savedNickname = nickname.trim()
      if (savedNickname !== user?.nickname) {
        await apiClient.put('/profile/nickname', { nickname: savedNickname }, { auth: true })
        setUserNickname(savedNickname)
      }
      await updateAccount({
        onboardingCompletedAt: new Date().toISOString(),
        targetExam,
        targetScore: targetExam === 'IELTS' && ieltsGoal !== null ? `IELTS ${ieltsGoal}` : targetExam === 'SAT' && satGoal !== null ? `SAT ${satGoal}` : null,
        currentIeltsScore,
        targetIeltsScore: ieltsGoal,
        currentSatScore,
        targetSatScore: satGoal,
      })
      const names = (user?.fullName || 'Learner').trim().split(/\s+/)
      saveOnboardingProfile({
        ...previous,
        firstName: previous?.firstName || names[0],
        lastName: previous?.lastName || names.slice(1).join(' '),
        targetExam: targetExam ?? 'IELTS',
        daysToExam: previous?.daysToExam || 90,
        dailyHours: previous?.dailyHours || 1,
        currentIeltsScore: currentIeltsScore ?? undefined,
        targetIeltsScore: ieltsGoal ?? undefined,
        currentSatScore: currentSatScore ?? undefined,
        targetSatScore: satGoal ?? undefined,
        createdAt: previous?.createdAt || new Date().toISOString(),
      }, user?.id)
      complete(true)
      clearGuestDiagnosticHandoff()
      captureAnalyticsEvent('onboarding_completed', { completion_method: skipScores ? 'skip_scores' : 'score_goals', target_exam: targetExam ?? 'none' })
      const destination = takeGuestDiagnosticDestination('/dashboard')
      navigate(baselineExam === 'SAT' ? SAT_BASELINE_PATH : baselineExam === 'IELTS' ? IELTS_BASELINE_PATH : destination, { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : c('We could not save your profile. Please try again.'))
      setSaving(false)
    }
  }

  const scoreCard = (exam: Exam, current: string, target: string, setCurrent: (value: string) => void, setTarget: (value: string) => void) => {
    return <section className="liquid-score-card" aria-label={`${exam} scores`} key={exam}>
      <div className="liquid-score-card-heading"><span><Target size={19} /></span><div><strong>{exam}</strong><small>{c(exam === 'IELTS' ? 'Band score' : 'Total score')}</small></div></div>
      <div className="liquid-score-fields">
        <ScoreInput exam={exam} target={false} label={c('Current score')} placeholder={c('Not sure yet')} value={current} onChange={value => { setCurrent(value); setError('') }} />
        <ScoreInput exam={exam} target label={c('Target score')} placeholder={c('Set later')} value={target} onChange={value => { setTarget(value); setError('') }} />
      </div>
      {exam === 'SAT' && <p className="mt-2 text-xs leading-5 text-slate-500">{c('SAT targets start at 1000. Your current score can be 400–1600.')}</p>}
    </section>
  }

  return <div className="liquid-onboarding"><header><Link to="/" aria-label="ProfAI"><BrandLockup iconSize={42} /></Link><LanguageSelector /></header>
    <main className="glass-surface liquid-onboarding-panel liquid-onboarding-panel--profile">
      <p className="liquid-eyebrow">{step} / 2</p>
      <h1>{c(step === 1 ? 'Make your profile yours.' : 'Where are you now?')}</h1>
      <p>{c(step === 1 ? 'Choose a nickname and add a photo so your workspace feels like yours.' : 'Add your current and target scores. We will use them to suggest your next practice.')}</p>
      {loading && <p className="liquid-empty" role="status">{c('Loading your profile…')}</p>}
      {!loading && error && <p className="liquid-inline-error" role="alert">{c(error)}{loadFailed && <button type="button" onClick={() => setLoadAttempt(value => value + 1)}>{c('Try again')}</button>}</p>}
      <fieldset disabled={loading || loadFailed || saving || uploading}>
        {step === 1 ? <div className="liquid-profile-setup">
          <label className="liquid-avatar-picker">
            <span className="liquid-avatar-preview"><ProfileAvatar src={avatar} alt="" /></span>
            <span><strong>{c(uploading ? 'Saving photo…' : 'Add a profile photo')}</strong><small>{c('Optional · JPG, PNG or WebP')}</small></span>
            <Camera size={20} aria-hidden="true" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { void chooseAvatar(event.target.files?.[0]); event.target.value = '' }} />
          </label>
          <label className="liquid-form-field">{c('Nickname')}<input type="text" autoComplete="nickname" maxLength={20} placeholder="your_name" value={nickname} onChange={event => { setNickname(event.target.value); setError('') }} /><small>{c('3–20 letters, numbers or underscores. Start with a letter.')}</small></label>
        </div> : <div className="liquid-score-grid">
          {scoreCard('IELTS', currentIelts, targetIelts, setCurrentIelts, setTargetIelts)}
          {scoreCard('SAT', currentSat, targetSat, setCurrentSat, setTargetSat)}
          <BaselineMockPrompt sat={!currentSat.trim()} ielts={!currentIelts.trim()} disabled={loading || loadFailed || saving || uploading} onStart={exam => void finish(false, exam)} />
          <p className="liquid-score-note">{c('You can leave either exam blank and update your scores later.')}</p>
        </div>}
      </fieldset>
      <footer>
        <button type="button" className="liquid-text-link" disabled={saving || uploading} onClick={goBack}><ChevronLeft size={16} /> {c('Back')}</button>
        <div className="liquid-onboarding-actions">
          {step === 2 && !user?.onboardingCompleted && <button type="button" className="liquid-text-link" disabled={loading || loadFailed || saving || uploading} onClick={() => void finish(true)}>{c('Set scores later')}</button>}
          <button type="button" className="liquid-button primary" disabled={loading || loadFailed || saving || uploading} onClick={() => step === 1 ? continueToScores() : void finish()}>{c(saving ? 'Saving…' : step === 1 ? 'Continue' : 'Open my workspace')}<ArrowRight size={17} /></button>
        </div>
      </footer>
    </main>
  </div>
}
