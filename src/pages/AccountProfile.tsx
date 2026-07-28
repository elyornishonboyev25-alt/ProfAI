import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  AtSign,
  BarChart3,
  Camera,
  Check,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useToastStore, type ToastState } from '@/store/toastStore'
import {
  fetchAccount,
  removeAvatar,
  updateAccount,
  uploadAvatar,
  type AccountProfileFields,
  type ExamTargetKey,
} from '@/lib/profileApi'
import { setNickname as apiSetNickname, checkNicknameAvailable } from '@/lib/speakingApi'
import { compressImageToDataUrl } from '@/utils/imageCompress'
import { getUniversityBySlug } from '@/data/admission'
import { CountUp, Reveal } from '@/components/fx'
import BadgeShelf from '@/components/achievements/BadgeShelf'

const NICKNAME_RE = /^[A-Za-z][A-Za-z0-9_]{2,19}$/

const EMPTY_PROFILE: AccountProfileFields = {
  phone: '',
  country: '',
  timezone: '',
  targetExam: 'BOTH',
  targetScore: '',
  examDate: '',
  bio: '',
  fieldOfStudy: '',
  gpa: '',
  degreeLevel: 'bachelor',
  budgetUsd: null,
  targetUniversitySlug: null,
  isPublic: true,
  showResults: true,
  showLeaderboard: true,
  showUniversity: true,
  showBadges: true,
}

const PRIVACY_TOGGLES: { key: keyof AccountProfileFields; label: string; detail: string }[] = [
  { key: 'isPublic', label: 'Public profile', detail: 'Let other learners find and view your profile by nickname.' },
  { key: 'showResults', label: 'Show results & skill chart', detail: 'Display your skill averages and accuracy on your public profile.' },
  { key: 'showLeaderboard', label: 'Show leaderboard rank', detail: 'Reveal your competitive rank and division to visitors.' },
  { key: 'showUniversity', label: 'Show target university', detail: 'Show the university you are aiming for.' },
  { key: 'showBadges', label: 'Show badges', detail: 'Display your pinned achievement badges.' },
]

function PrivacyToggle({
  label,
  detail,
  enabled,
  onToggle,
}: {
  label: string
  detail: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-3 rounded-xl border border-red-200 bg-white/90 px-3 py-2.5 text-left"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">{detail}</p>
      </div>
      <span
        className={`mt-0.5 inline-flex h-6 min-w-[2.7rem] items-center rounded-full border px-1 transition ${
          enabled ? 'justify-end border-emerald-300 bg-emerald-100' : 'justify-start border-slate-300 bg-slate-100'
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  )
}

export default function AccountProfile() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const setUserNickname = useAuthStore((state) => state.setUserNickname)
  const setUserAvatar = useAuthStore((state) => state.setUserAvatar)
  const pushToast = useToastStore((state: ToastState) => state.pushToast)

  const [form, setForm] = useState<AccountProfileFields>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const savedNickname = user?.nickname ?? ''
  const [nicknameDraft, setNicknameDraft] = useState(savedNickname)
  const [nickStatus, setNickStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken'>('idle')
  const [savingNickname, setSavingNickname] = useState(false)
  const nickDebounce = useRef<number | null>(null)

  // Load the permanently-stored profile from the backend.
  useEffect(() => {
    let active = true
    setLoading(true)
    fetchAccount()
      .then((data) => {
        if (!active) return
        setForm({ ...EMPTY_PROFILE, ...data.profile })
        setAvatarUrl(data.avatarUrl)
        if (data.nickname) setNicknameDraft(data.nickname)
      })
      .catch(() => {
        if (!active) return
        pushToast({ type: 'info', title: 'Offline', message: 'Could not load your saved profile. Changes will sync when the server is reachable.' })
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [pushToast])

  useEffect(() => {
    setNicknameDraft(savedNickname)
  }, [savedNickname])

  // Live nickname availability check.
  useEffect(() => {
    if (nickDebounce.current) window.clearTimeout(nickDebounce.current)
    const v = nicknameDraft.trim()
    if (!v || v === savedNickname) {
      setNickStatus('idle')
      return
    }
    if (!NICKNAME_RE.test(v)) {
      setNickStatus('invalid')
      return
    }
    setNickStatus('checking')
    nickDebounce.current = window.setTimeout(async () => {
      const ok = await checkNicknameAvailable(v)
      setNickStatus(ok ? 'available' : 'taken')
    }, 450)
    return () => {
      if (nickDebounce.current) window.clearTimeout(nickDebounce.current)
    }
  }, [nicknameDraft, savedNickname])

  const completion = useMemo(() => {
    const fields = [form.country, form.targetScore, form.examDate, form.fieldOfStudy, form.gpa, form.phone, avatarUrl, savedNickname]
    const filled = fields.filter((v) => (v ?? '').toString().trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [form, avatarUrl, savedNickname])

  const targetUniversity = form.targetUniversitySlug ? getUniversityBySlug(form.targetUniversitySlug) : undefined

  const updateField = <K extends keyof AccountProfileFields>(key: K, value: AccountProfileFields[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await updateAccount({
        phone: form.phone,
        country: form.country,
        timezone: form.timezone,
        targetExam: form.targetExam,
        targetScore: form.targetScore,
        examDate: form.examDate,
        bio: form.bio,
        fieldOfStudy: form.fieldOfStudy,
        gpa: form.gpa,
        degreeLevel: form.degreeLevel,
        budgetUsd: form.budgetUsd,
      })
      setForm((prev) => ({ ...prev, ...res.profile }))
      pushToast({ type: 'success', title: 'Profile saved', message: 'Your profile is stored on your account and synced across devices.' })
    } catch (e) {
      pushToast({ type: 'error', title: 'Could not save', message: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleFlag = async (key: keyof AccountProfileFields) => {
    const next = !form[key]
    setForm((prev) => ({ ...prev, [key]: next }))
    try {
      await updateAccount({ [key]: next } as Partial<AccountProfileFields>)
    } catch {
      setForm((prev) => ({ ...prev, [key]: !next }))
      pushToast({ type: 'error', title: 'Could not update', message: 'Privacy setting was not saved. Try again.' })
    }
  }

  const onPickAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingAvatar(true)
    try {
      const dataUrl = await compressImageToDataUrl(file, { size: 256 })
      const res = await uploadAvatar(dataUrl)
      setAvatarUrl(res.avatarUrl)
      setUserAvatar(res.avatarUrl)
      pushToast({ type: 'success', title: 'Photo updated', message: 'Your profile photo has been saved.' })
    } catch (e) {
      pushToast({ type: 'error', title: 'Upload failed', message: e instanceof Error ? e.message : 'Choose a smaller image and try again.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const onRemoveAvatar = async () => {
    setUploadingAvatar(true)
    try {
      await removeAvatar()
      setAvatarUrl(null)
      setUserAvatar(null)
    } catch {
      pushToast({ type: 'error', title: 'Could not remove', message: 'Try again.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveNickname = async () => {
    const value = nicknameDraft.trim()
    if (!NICKNAME_RE.test(value) || nickStatus !== 'available') return
    setSavingNickname(true)
    try {
      await apiSetNickname(value)
      setUserNickname(value)
      setNickStatus('idle')
      pushToast({ type: 'success', title: 'Nickname saved', message: 'Your public handle has been updated.' })
    } catch (e) {
      pushToast({ type: 'error', title: 'Could not save', message: e instanceof Error ? e.message : 'That nickname may be taken.' })
    } finally {
      setSavingNickname(false)
    }
  }

  const initials = (savedNickname || user?.fullName || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />

      <Reveal>
        <section className="premium-hero p-6 sm:p-9">
          <div className="premium-top-controls">
            <button onClick={() => navigate('/dashboard')} className="premium-back-btn">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </button>
            <span className="premium-top-chip">
              <Sparkles className="h-3.5 w-3.5" />
              My Profile
            </span>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-rose-600 text-3xl font-black text-white shadow-[0_16px_36px_rgba(220,38,38,0.32)]">
                  {avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : initials}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600 shadow-md transition hover:bg-red-50 disabled:opacity-60"
                  title="Change photo"
                >
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              {avatarUrl ? (
                <button onClick={() => void onRemoveAvatar()} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              ) : null}
            </div>

            {/* Identity */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{user?.fullName ?? 'Learner'}</h1>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {savedNickname ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2.5 py-0.5 text-sm font-bold text-red-700">
                    <AtSign className="h-3.5 w-3.5" />
                    {savedNickname}
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">Set a nickname below</span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  <Lock className="h-3 w-3" /> {user?.email} · only you
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Level {user?.level ?? 1} · {user?.xp ?? 0} XP · Profile {completion}% complete
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(savedNickname ? `/u/${savedNickname}` : '/account')}
                disabled={!savedNickname}
                className="arena-primary-btn justify-center disabled:opacity-50"
              >
                <UserRound className="mr-2 h-4 w-4" /> View public profile
              </button>
              <button onClick={() => navigate('/profile')} className="arena-secondary-btn justify-center">
                <BarChart3 className="mr-2 h-4 w-4" /> Performance
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      {loading ? (
        <div className="mt-6 flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          {/* Nickname */}
          <section className="mt-6 surface-card p-6">
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
              <AtSign className="h-5 w-5 text-red-600" />
              Public nickname
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Other learners only ever see this handle — never your email. It is how people find you in the Community.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-red-200 bg-white px-3">
                <span className="text-lg font-bold text-red-500">@</span>
                <input
                  value={nicknameDraft}
                  onChange={(e) => setNicknameDraft(e.target.value.replace(/\s/g, ''))}
                  placeholder="your_handle"
                  maxLength={20}
                  className="w-full bg-transparent py-2.5 text-sm font-semibold text-slate-900 outline-none"
                />
                {nickStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
                {nickStatus === 'available' ? <Check className="h-4 w-4 text-emerald-500" /> : null}
              </div>
              <button
                type="button"
                onClick={() => void saveNickname()}
                disabled={savingNickname || nickStatus !== 'available'}
                className="arena-primary-btn justify-center disabled:opacity-50"
              >
                {savingNickname ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save nickname
              </button>
            </div>
            {nickStatus === 'taken' ? <p className="mt-1.5 text-xs font-medium text-red-600">Already taken — try another.</p> : null}
            {nickStatus === 'invalid' ? <p className="mt-1.5 text-xs font-medium text-red-600">3–20 chars: letters, numbers or underscore, starting with a letter.</p> : null}
          </section>

          {/* Personal + targets */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="surface-card p-6">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                <UserRound className="h-5 w-5 text-red-600" />
                Personal & exam targets
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Phone
                  <input value={form.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} className="input mt-1" placeholder="+998 ..." />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Country
                  <input value={form.country ?? ''} onChange={(e) => updateField('country', e.target.value)} className="input mt-1" placeholder="Country" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Target exam
                  <select value={form.targetExam ?? 'BOTH'} onChange={(e) => updateField('targetExam', e.target.value as ExamTargetKey)} className="input mt-1">
                    <option value="BOTH">IELTS + SAT</option>
                    <option value="IELTS">IELTS</option>
                    <option value="SAT">SAT</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Target score
                  <input value={form.targetScore ?? ''} onChange={(e) => updateField('targetScore', e.target.value)} className="input mt-1" placeholder="IELTS 7.5 / SAT 1450" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Exam date
                  <input type="date" value={form.examDate ?? ''} onChange={(e) => updateField('examDate', e.target.value)} className="input mt-1" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Field of study
                  <input value={form.fieldOfStudy ?? ''} onChange={(e) => updateField('fieldOfStudy', e.target.value)} className="input mt-1" placeholder="Computer Science" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  GPA
                  <input value={form.gpa ?? ''} onChange={(e) => updateField('gpa', e.target.value)} className="input mt-1" placeholder="3.8 / 4.0" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Degree level
                  <select value={form.degreeLevel ?? 'bachelor'} onChange={(e) => updateField('degreeLevel', e.target.value)} className="input mt-1">
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master</option>
                    <option value="phd">PhD</option>
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Bio
                <textarea value={form.bio ?? ''} onChange={(e) => updateField('bio', e.target.value)} className="input mt-1 min-h-[92px] resize-y" placeholder="Short introduction, study goals, preferred pace..." />
              </label>
              <div className="mt-4">
                <button type="button" onClick={() => void saveProfile()} disabled={saving} className="arena-primary-btn disabled:opacity-60">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save profile
                </button>
              </div>
            </article>

            <div className="space-y-6">
              {/* Privacy */}
              <article className="surface-card p-6">
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                  Privacy & visibility
                </h2>
                <p className="mt-1 text-xs text-slate-500">Control exactly what other learners can see. Your email is never shown to anyone.</p>
                <div className="mt-4 space-y-2.5">
                  {PRIVACY_TOGGLES.map((t) => (
                    <PrivacyToggle key={t.key} label={t.label} detail={t.detail} enabled={Boolean(form[t.key])} onToggle={() => void toggleFlag(t.key)} />
                  ))}
                </div>
              </article>

              {/* Target university */}
              <article className="surface-card p-6">
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                  <GraduationCap className="h-5 w-5 text-red-600" />
                  Target university
                </h2>
                {targetUniversity ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{targetUniversity.name}</p>
                      <p className="text-xs text-slate-500">{targetUniversity.city}, {targetUniversity.country} · QS #{targetUniversity.rank}</p>
                    </div>
                    <button onClick={() => navigate(`/admission/universities/${targetUniversity.slug}`)} className="shrink-0 text-xs font-bold text-red-600 hover:underline">
                      View
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No target yet. Use the matcher to find a university that fits your scores.</p>
                )}
                <button onClick={() => navigate('/admission')} className="arena-secondary-btn mt-3 w-full justify-center">
                  <Target className="mr-2 h-4 w-4" /> Find my university
                </button>
              </article>
            </div>
          </section>

          {/* Badges */}
          <section className="mt-6 surface-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Sparkles className="h-5 w-5 text-red-600" />
                Achievement badges
              </h2>
              <span className="soft-chip">Earned from mock / exam results</span>
            </div>
            <div className="mt-4">
              <BadgeShelf />
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/50 px-4 py-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Mail className="h-4 w-4" />
              Your profile is saved to your account and stays on every device you sign in to.
            </p>
          </section>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="surface-card p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Profile complete</p>
              <p className="mt-1 text-2xl font-black text-slate-900"><CountUp value={completion} suffix="%" /></p>
            </div>
            <div className="surface-card p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Account level</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{user?.level ?? 1}</p>
            </div>
            <div className="surface-card p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Visibility</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{form.isPublic ? 'Public' : 'Private'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
