import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Camera, ChevronLeft, Target } from 'lucide-react'
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

const nicknamePattern = /^[A-Za-z][A-Za-z0-9_]{2,19}$/
const ieltsScores = Array.from({ length: 19 }, (_, index) => index / 2)
const satScores = Array.from({ length: 121 }, (_, index) => 400 + index * 10)

type Exam = 'IELTS' | 'SAT'

export default function QuickOnboarding() {
  const { c } = useCopy()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const complete = useAuthStore(state => state.setOnboardingCompleted)
  const setUserNickname = useAuthStore(state => state.setUserNickname)
  const setUserAvatar = useAuthStore(state => state.setUserAvatar)
  const previous = loadOnboardingProfile(user?.id, user?.fullName)
  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? null)
  const [currentIelts, setCurrentIelts] = useState<number | null>(previous?.currentIeltsScore ?? null)
  const [targetIelts, setTargetIelts] = useState<number | null>(previous?.targetIeltsScore ?? null)
  const [currentSat, setCurrentSat] = useState<number | null>(previous?.currentSatScore ?? null)
  const [targetSat, setTargetSat] = useState<number | null>(previous?.targetSatScore ?? null)
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
      setCurrentIelts(profile.currentIeltsScore)
      setTargetIelts(profile.targetIeltsScore)
      setCurrentSat(profile.currentSatScore)
      setTargetSat(profile.targetSatScore)
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

  async function finish(skipScores = false) {
    if (saving || loading || uploading) return
    if (!skipScores && ((currentIelts !== null && targetIelts !== null && currentIelts > targetIelts)
      || (currentSat !== null && targetSat !== null && currentSat > targetSat))) {
      setError(c('A target score must be at least your current score.'))
      return
    }
    setSaving(true)
    setError('')
    const ieltsGoal = skipScores ? null : targetIelts
    const satGoal = skipScores ? null : targetSat
    const targetExam = ieltsGoal !== null && satGoal !== null ? 'BOTH' : ieltsGoal !== null ? 'IELTS' : satGoal !== null ? 'SAT' : null
    try {
      const savedNickname = nickname.trim()
      if (savedNickname !== user?.nickname) {
        await apiClient.put('/profile/nickname', { nickname: savedNickname }, { auth: true })
        setUserNickname(savedNickname)
      }
      await updateAccount({
        onboardingCompletedAt: new Date().toISOString(),
        targetExam,
        targetScore: targetExam === 'IELTS' ? `IELTS ${ieltsGoal}` : targetExam === 'SAT' ? `SAT ${satGoal}` : null,
        currentIeltsScore: skipScores ? null : currentIelts,
        targetIeltsScore: ieltsGoal,
        currentSatScore: skipScores ? null : currentSat,
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
        currentIeltsScore: skipScores ? undefined : currentIelts ?? undefined,
        targetIeltsScore: ieltsGoal ?? undefined,
        currentSatScore: skipScores ? undefined : currentSat ?? undefined,
        targetSatScore: satGoal ?? undefined,
        createdAt: previous?.createdAt || new Date().toISOString(),
      }, user?.id)
      complete(true)
      clearGuestDiagnosticHandoff()
      captureAnalyticsEvent('onboarding_completed', { completion_method: skipScores ? 'skip_scores' : 'score_goals', target_exam: targetExam ?? 'none' })
      navigate(takeGuestDiagnosticDestination('/dashboard'), { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : c('We could not save your profile. Please try again.'))
      setSaving(false)
    }
  }

  const scoreCard = (exam: Exam, current: number | null, target: number | null, setCurrent: (value: number | null) => void, setTarget: (value: number | null) => void) => {
    const values = exam === 'IELTS' ? ieltsScores : satScores
    return <section className="liquid-score-card" aria-label={`${exam} scores`} key={exam}>
      <div className="liquid-score-card-heading"><span><Target size={19} /></span><div><strong>{exam}</strong><small>{c(exam === 'IELTS' ? 'Band score' : 'Total score')}</small></div></div>
      <div className="liquid-score-fields">
        <label className="liquid-form-field">{c('Current score')}<select value={current ?? ''} onChange={event => setCurrent(event.target.value === '' ? null : Number(event.target.value))}><option value="">{c('Not sure yet')}</option>{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="liquid-form-field">{c('Target score')}<select value={target ?? ''} onChange={event => setTarget(event.target.value === '' ? null : Number(event.target.value))}><option value="">{c('Set later')}</option>{values.filter(value => exam === 'SAT' || value >= 4).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
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
          <p className="liquid-score-note">{c('You can leave either exam blank and update your scores later.')}</p>
        </div>}
        <footer>
          {step === 2 ? <button type="button" className="liquid-text-link" onClick={() => { setError(''); setStep(1) }}><ChevronLeft size={16} /> {c('Back')}</button> : user?.onboardingCompleted ? <Link className="liquid-text-link" to="/dashboard">{c('Cancel')}</Link> : <span />}
          <div className="liquid-onboarding-actions">
            {step === 2 && !user?.onboardingCompleted && <button type="button" className="liquid-text-link" onClick={() => void finish(true)}>{c('Set scores later')}</button>}
            <button type="button" className="liquid-button primary" onClick={() => step === 1 ? continueToScores() : void finish()}>{c(saving ? 'Saving…' : step === 1 ? 'Continue' : 'Open my workspace')}<ArrowRight size={17} /></button>
          </div>
        </footer>
      </fieldset>
    </main>
  </div>
}
