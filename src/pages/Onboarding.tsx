import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  CalendarRange,
  Camera,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Globe2,
  MapPin,
  School,
  Sparkles,
  Target,
  Trophy,
  User,
  Upload,
} from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandMark } from '@/components/brand/BrandLogo'
import { setFlashToast } from '@/utils/authFlash'
import { updateAccount, uploadAvatar } from '@/lib/profileApi'
import { compressImageToDataUrl } from '@/utils/imageCompress'
import {
  generateWeeklyPlan,
  loadOnboardingProfile,
  saveOnboardingProfile,
  saveWeeklyPlan,
  type ExamTarget,
  type OnboardingProfile,
} from '@/utils/weeklyPlanner'

type StepId = 1 | 2 | 3 | 4 | 5 | 6

type Gender = 'FEMALE' | 'MALE' | 'PREFER_NOT_TO_SAY'

const GRADE_LEVELS = ['8th grade', '9th grade', '10th grade', '11th grade', '12th grade', 'Gap year', 'University'] as const

const DESTINATIONS = [
  { value: 'United States', flag: '🇺🇸' },
  { value: 'United Kingdom', flag: '🇬🇧' },
  { value: 'Canada', flag: '🇨🇦' },
  { value: 'Australia', flag: '🇦🇺' },
  { value: 'Germany', flag: '🇩🇪' },
  { value: 'Singapore', flag: '🇸🇬' },
] as const

const EXAM_CARDS = [
  {
    key: 'IELTS' as ExamTarget,
    label: 'IELTS',
    subtitle: 'Academic & General Training',
    icon: BookOpen,
    modules: ['Reading', 'Listening', 'Writing', 'Speaking'],
  },
  {
    key: 'SAT' as ExamTarget,
    label: 'SAT',
    subtitle: 'Scholastic Assessment Test',
    icon: Calculator,
    modules: ['Math', 'Reading & Writing'],
  },
  {
    key: 'BOTH' as ExamTarget,
    label: 'Both',
    subtitle: 'Complete preparation track',
    icon: Trophy,
    modules: ['IELTS', 'SAT', 'All 6 modules'],
  },
]

const DAY_PRESETS = [
  { label: '21 days', value: 21, badge: 'Intensive', badgeColor: 'bg-red-100 text-red-700' },
  { label: '30 days', value: 30, badge: 'Focused', badgeColor: 'bg-orange-100 text-orange-700' },
  { label: '60 days', value: 60, badge: 'Standard', badgeColor: 'bg-amber-100 text-amber-700' },
  { label: '90 days', value: 90, badge: 'Comfortable', badgeColor: 'bg-green-100 text-green-700' },
  { label: '180+ days', value: 180, badge: 'Long-term', badgeColor: 'bg-blue-100 text-blue-700' },
]

const HOURS_OPTIONS = [3, 4, 5, 6]

const AVATAR_PRESETS = [
  'aziza',
  'kamron',
  'dilnoza',
  'sardor',
  'malika',
  'javohir',
  'zarina',
  'temur',
] as const

// College Board weekend dates for the 2026–27 international testing year.
// Keeping the ISO value makes countdowns timezone-safe and easy to update.
const SAT_TEST_DATES = [
  { value: '2026-08-22', label: '22 Aug 2026' },
  { value: '2026-09-12', label: '12 Sep 2026' },
  { value: '2026-10-03', label: '3 Oct 2026' },
  { value: '2026-11-07', label: '7 Nov 2026' },
  { value: '2026-12-05', label: '5 Dec 2026' },
  { value: '2027-03-06', label: '6 Mar 2027' },
  { value: '2027-05-01', label: '1 May 2027' },
  { value: '2027-06-05', label: '5 Jun 2027' },
] as const

const STEP_META: { id: StepId; label: string; eyebrow: string; title: string; hint: string }[] = [
  { id: 1, label: 'Identity', eyebrow: 'About you', title: 'Create your learner identity', hint: 'Your name and avatar personalize your dashboard and certificates.' },
  { id: 2, label: 'Background', eyebrow: 'Your context', title: 'Where are you starting from?', hint: 'Your country and grade help us make the plan realistic.' },
  { id: 3, label: 'Goal', eyebrow: 'Your target', title: 'What are you preparing for?', hint: 'Pick the exam you want a tailored roadmap for.' },
  { id: 4, label: 'Timeline', eyebrow: 'Your schedule', title: 'Set your scores and study pace', hint: 'We balance daily workload around your deadline and free time.' },
  { id: 5, label: 'Destination', eyebrow: 'Study abroad', title: 'Where do you want to study?', hint: 'Choose target countries and the subject you want to pursue.' },
  { id: 6, label: 'Review', eyebrow: 'Almost there', title: 'Review your study plan', hint: 'Confirm the details and we will generate your rolling 7-day plan.' },
]

const PLAN_GENERATION_STEPS = [
  'Analysing your exam target',
  'Balancing daily workload',
  'Arranging module practice',
  'Polishing your 7-day plan',
]

function saveToAccountProfile(firstName: string, lastName: string, targetExam: ExamTarget) {
  try {
    const key = 'smarttest-account-profile-v1'
    const existing = localStorage.getItem(key)
    const prev = existing ? JSON.parse(existing) : {}
    const updated = { ...prev, fullName: `${firstName} ${lastName}`.trim(), targetExam }
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // ignore — account profile mirror is best-effort.
  }
}

const slideVariants = {
  enterRight: { x: 48, opacity: 0 },
  enterLeft: { x: -48, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitLeft: { x: -48, opacity: 0 },
  exitRight: { x: 48, opacity: 0 },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const setUserAvatar = useAuthStore((state: AuthState) => state.setUserAvatar)
  const setUserFullName = useAuthStore((state: AuthState) => state.setUserFullName)
  const setOnboardingCompleted = useAuthStore((state: AuthState) => state.setOnboardingCompleted)
  const { minimalMotion } = useMotionPreferences()

  const [step, setStep] = useState<StepId>(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<Gender>('PREFER_NOT_TO_SAY')
  const [country, setCountry] = useState('Uzbekistan')
  const [gradeLevel, setGradeLevel] = useState('11th grade')
  const [targetCountries, setTargetCountries] = useState<string[]>(['United States'])
  const [fieldOfStudy, setFieldOfStudy] = useState('')
  const [targetExam, setTargetExam] = useState<ExamTarget>('IELTS')
  const [daysToExam, setDaysToExam] = useState(60)
  const [customDays, setCustomDays] = useState('')
  const [useCustomDays, setUseCustomDays] = useState(false)
  const [dailyHours, setDailyHours] = useState(3)
  const [ieltsExamDate, setIeltsExamDate] = useState('')
  const [satExamDate, setSatExamDate] = useState<string>(SAT_TEST_DATES[0].value)
  const [currentIeltsScore, setCurrentIeltsScore] = useState(6)
  const [targetIeltsScore, setTargetIeltsScore] = useState(7.5)
  const [currentSatScore, setCurrentSatScore] = useState(1050)
  const [targetSatScore, setTargetSatScore] = useState(1450)
  const [stage, setStage] = useState<'idle' | 'generating' | 'success'>('idle')
  const [messageIndex, setMessageIndex] = useState(0)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl ?? '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saveError, setSaveError] = useState('')

  const firstNameRef = useRef<HTMLInputElement>(null)

  const saveAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setAvatarUploading(true)
    try {
      const dataUrl = await compressImageToDataUrl(file, { size: 320, quality: 0.86 })
      const result = await uploadAvatar(dataUrl)
      const next = result.avatarUrl ?? dataUrl
      setAvatarPreview(next)
      setUserAvatar(next)
    } catch {
      const localUrl = URL.createObjectURL(file)
      setAvatarPreview(localUrl)
    } finally {
      setAvatarUploading(false)
    }
  }

  const choosePreset = async (name: string) => {
    const src = `/assets/avatars/${name}.svg`
    setAvatarPreview(src)
    setUserAvatar(src)
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      await saveAvatarFile(new File([blob], `${name}.svg`, { type: blob.type || 'image/svg+xml' }))
    } catch {
      // The local preset remains available even when the profile API is offline.
    }
  }

  // Prefill from an existing profile (if the learner is re-running setup) or the
  // account display name so the first step is never empty.
  useEffect(() => {
    const existing = loadOnboardingProfile(user?.id)
    if (existing) {
      setFirstName(existing.firstName)
      setLastName(existing.lastName)
      setGender(existing.gender ?? 'PREFER_NOT_TO_SAY')
      setCountry(existing.country ?? 'Uzbekistan')
      setGradeLevel(existing.gradeLevel ?? '11th grade')
      setTargetCountries(existing.targetCountries?.length ? existing.targetCountries : ['United States'])
      setFieldOfStudy(existing.fieldOfStudy ?? '')
      setTargetExam(existing.targetExam)
      setDaysToExam(existing.daysToExam)
      setDailyHours(existing.dailyHours)
      setIeltsExamDate(existing.ieltsExamDate ?? '')
      setSatExamDate(existing.satExamDate ?? SAT_TEST_DATES[0].value)
      setCurrentIeltsScore(existing.currentIeltsScore ?? 6)
      setTargetIeltsScore(existing.targetIeltsScore ?? 7.5)
      setCurrentSatScore(existing.currentSatScore ?? 1050)
      setTargetSatScore(existing.targetSatScore ?? 1450)
      return
    }
    const parts = (user?.fullName ?? '').trim().split(/\s+/)
    if (parts[0]) setFirstName(parts[0])
    if (parts.length > 1) setLastName(parts.slice(1).join(' '))
  }, [user?.id, user?.fullName])

  useEffect(() => {
    if (step === 1) {
      const id = window.setTimeout(() => firstNameRef.current?.focus(), 220)
      return () => window.clearTimeout(id)
    }
  }, [step])

  useEffect(() => {
    if (stage !== 'generating') {
      setMessageIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % PLAN_GENERATION_STEPS.length)
    }, 520)
    return () => window.clearInterval(id)
  }, [stage])

  const selectedExamDate = targetExam === 'SAT' ? satExamDate : targetExam === 'IELTS' ? ieltsExamDate : [ieltsExamDate, satExamDate].filter(Boolean).sort()[0] ?? ''
  const dateBasedDays = useMemo(() => {
    if (!selectedExamDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const exam = new Date(`${selectedExamDate}T00:00:00`)
    return Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / 86400000))
  }, [selectedExamDate])
  const resolvedDays = useCustomDays
    ? Math.max(1, Number(customDays) || 1)
    : dateBasedDays ?? daysToExam

  const planIntensity = useMemo(
    () =>
      resolvedDays <= 21
        ? { label: 'Intensive', color: 'text-red-700 bg-red-50' }
        : resolvedDays <= 60
          ? { label: 'Focused', color: 'text-orange-700 bg-orange-50' }
          : { label: 'Standard', color: 'text-green-700 bg-green-50' },
    [resolvedDays],
  )

  const selectedExamCard = EXAM_CARDS.find((card) => card.key === targetExam)!
  const nameReady = firstName.trim().length > 0 && lastName.trim().length > 0
  const examProfileReady =
    targetExam === 'IELTS'
      ? Boolean(ieltsExamDate) && targetIeltsScore >= currentIeltsScore
      : targetExam === 'SAT'
        ? Boolean(satExamDate) && targetSatScore >= currentSatScore
        : Boolean(ieltsExamDate && satExamDate) && targetIeltsScore >= currentIeltsScore && targetSatScore >= currentSatScore
  const backgroundReady = country.trim().length >= 2 && gradeLevel.trim().length > 0
  const destinationReady = targetCountries.length > 0 && fieldOfStudy.trim().length >= 2
  const canContinue =
    step === 1
      ? nameReady
      : step === 2
        ? backgroundReady
        : step === 4
          ? examProfileReady
          : step === 5
            ? destinationReady
            : true

  const goTo = (next: StepId, dir: 'forward' | 'back') => {
    setDirection(dir)
    setStep(next)
  }

  const handleContinue = () => {
    if (step < 6) goTo((step + 1) as StepId, 'forward')
  }

  const handleBack = () => {
    if (step > 1) goTo((step - 1) as StepId, 'back')
    else navigate('/dashboard')
  }

  const generatePlan = () => {
    if (!nameReady || stage !== 'idle') return
    setSaveError('')
    setStage('generating')

    window.setTimeout(async () => {
      const profile: OnboardingProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        country: country.trim(),
        gradeLevel,
        targetCountries,
        fieldOfStudy: fieldOfStudy.trim(),
        targetExam,
        daysToExam: Math.max(1, resolvedDays),
        dailyHours: Math.max(3, dailyHours),
        ieltsExamDate: targetExam === 'SAT' ? undefined : ieltsExamDate || undefined,
        satExamDate: targetExam === 'IELTS' ? undefined : satExamDate || undefined,
        currentIeltsScore: targetExam === 'SAT' ? undefined : currentIeltsScore,
        targetIeltsScore: targetExam === 'SAT' ? undefined : targetIeltsScore,
        currentSatScore: targetExam === 'IELTS' ? undefined : currentSatScore,
        targetSatScore: targetExam === 'IELTS' ? undefined : targetSatScore,
        createdAt: new Date().toISOString(),
      }

      const plan = generateWeeklyPlan(profile, new Date())
      saveOnboardingProfile(profile, user?.id)
      saveWeeklyPlan(plan, user?.id)
      saveToAccountProfile(profile.firstName, profile.lastName, targetExam)
      setUserFullName(`${profile.firstName} ${profile.lastName}`.trim())
      // Persist the exam target to the permanent backend profile so it pre-fills
      // the profile page and survives across devices (best-effort).
      try {
        await updateAccount({
          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
          gender,
          country: country.trim(),
          gradeLevel,
          targetExam,
          targetScore:
            targetExam === 'IELTS'
              ? `IELTS ${targetIeltsScore}`
              : targetExam === 'SAT'
                ? `SAT ${targetSatScore}`
                : `IELTS ${targetIeltsScore} / SAT ${targetSatScore}`,
          examDate: selectedExamDate || null,
          targetCountries,
          currentIeltsScore: targetExam === 'SAT' ? null : currentIeltsScore,
          targetIeltsScore: targetExam === 'SAT' ? null : targetIeltsScore,
          currentSatScore: targetExam === 'IELTS' ? null : currentSatScore,
          targetSatScore: targetExam === 'IELTS' ? null : targetSatScore,
          dailyStudyHours: dailyHours,
          fieldOfStudy: fieldOfStudy.trim(),
          onboardingCompletedAt: new Date().toISOString(),
        })
        setOnboardingCompleted(true)
      } catch (requestError) {
        setStage('idle')
        setSaveError(requestError instanceof Error ? requestError.message : 'Your profile could not be saved. Please try again.')
        return
      }

      setStage('success')
      window.setTimeout(() => {
        setFlashToast({
          type: 'success',
          title: 'Your study plan is ready',
          message: 'Your personalized 7-day rolling plan is live on your dashboard.',
        })
        navigate('/dashboard')
      }, 1100)
    }, 2200)
  }

  const meta = STEP_META[step - 1]

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-8 sm:py-12">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[10%] h-72 w-72 rounded-full bg-red-300/25 blur-3xl" />
        <div className="absolute bottom-[8%] right-[10%] h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,113,113,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(248,113,113,0.05)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        {/* Brand + progress */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition hover:bg-red-50/80"
          >
            <BrandMark size={40} className="shadow-[0_10px_22px_rgba(220,38,38,0.32)]" />
            <span className="text-sm font-black tracking-tight text-slate-900">ProfAI</span>
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white/85 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-red-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Smart onboarding
          </span>
        </div>

        {/* Step rail */}
        <div className="mt-7 flex items-center gap-2">
          {STEP_META.map((item, index) => {
            const active = item.id === step
            const done = item.id < step
            return (
              <div key={item.id} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-all ${
                      active
                        ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-[0_6px_14px_rgba(220,38,38,0.4)]'
                        : done
                          ? 'bg-red-100 text-red-600'
                          : 'bg-white text-slate-400 ring-1 ring-slate-200'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : item.id}
                  </span>
                  <span className={`hidden text-xs font-bold sm:block ${active ? 'text-slate-900' : done ? 'text-red-600' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
                {index < STEP_META.length - 1 ? (
                  <span className={`h-[3px] flex-1 rounded-full transition-colors ${done ? 'bg-red-300' : 'bg-slate-200'}`} />
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <motion.div
          initial={minimalMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0.14 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="panel-surface relative mt-6 flex-1 overflow-hidden rounded-[2rem] border border-red-100/90 bg-white/95 shadow-[0_30px_80px_rgba(127,29,29,0.16)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

          <div className="px-6 pb-6 pt-7 sm:px-9 sm:pb-9">
            {/* Heading */}
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-red-600">
                {step === 1 ? (
                  <User className="h-5 w-5" />
                ) : step === 2 ? (
                  <MapPin className="h-5 w-5" />
                ) : step === 3 ? (
                  <Target className="h-5 w-5" />
                ) : step === 4 ? (
                  <CalendarRange className="h-5 w-5" />
                ) : step === 5 ? (
                  <Globe2 className="h-5 w-5" />
                ) : (
                  <GraduationCap className="h-5 w-5" />
                )}
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-600">{meta.eyebrow}</p>
                <h1 className="mt-0.5 text-[1.6rem] font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
                  {meta.title}
                </h1>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{meta.hint}</p>
              </div>
            </div>

            {/* Step body */}
            <div className="mt-7 min-h-[268px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  variants={minimalMotion ? undefined : slideVariants}
                  initial={minimalMotion ? false : direction === 'forward' ? 'enterRight' : 'enterLeft'}
                  animate="center"
                  exit={minimalMotion ? undefined : direction === 'forward' ? 'exitLeft' : 'exitRight'}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 1 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2 rounded-[1.5rem] border border-red-100 bg-gradient-to-br from-white via-rose-50/60 to-red-50 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="relative mx-auto shrink-0 sm:mx-0">
                            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-gradient-to-br from-red-500 to-rose-700 text-2xl font-black text-white shadow-[0_14px_30px_rgba(220,38,38,0.3)] ring-4 ring-red-200">
                              {avatarPreview ? (
                                <img src={avatarPreview} alt="Selected avatar" className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-9 w-9" />
                              )}
                            </div>
                            <span className="absolute bottom-1 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
                              <Camera className="h-3.5 w-3.5" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-black text-slate-900">Choose your avatar</p>
                                <p className="text-[11px] text-slate-500">Pick a style or upload your own photo.</p>
                              </div>
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[11px] font-black text-red-700 shadow-sm transition hover:bg-red-50">
                                <Upload className="h-3.5 w-3.5" />
                                {avatarUploading ? 'Saving…' : 'Upload photo'}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  className="sr-only"
                                  disabled={avatarUploading}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    if (file) void saveAvatarFile(file)
                                    event.currentTarget.value = ''
                                  }}
                                />
                              </label>
                            </div>
                            <div className="mt-3 grid grid-cols-8 gap-1.5">
                              {AVATAR_PRESETS.map((name) => {
                                const src = `/assets/avatars/${name}.svg`
                                const active = avatarPreview.includes(`/${name}.svg`)
                                return (
                                  <button
                                    key={name}
                                    type="button"
                                    aria-label={`Choose ${name} avatar`}
                                    onClick={() => void choosePreset(name)}
                                    className={`aspect-square overflow-hidden rounded-full border-2 bg-white p-0.5 transition hover:-translate-y-0.5 ${
                                      active ? 'border-red-500 shadow-[0_5px_14px_rgba(220,38,38,0.25)]' : 'border-white ring-1 ring-red-100'
                                    }`}
                                  >
                                    <img src={src} alt="" className="h-full w-full rounded-full object-cover" />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.1em] text-slate-500">First name</span>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                          <input
                            ref={firstNameRef}
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && nameReady && handleContinue()}
                            placeholder="Enter first name"
                            className="h-12 w-full rounded-2xl border border-red-100 bg-white pl-11 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      </label>
                      <div className="sm:col-span-2">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                          Avatar style
                        </span>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {([
                            ['FEMALE', 'Girl', 'Personalizes avatar suggestions'],
                            ['MALE', 'Boy', 'Personalizes avatar suggestions'],
                            ['PREFER_NOT_TO_SAY', 'Prefer not to say', 'Keeps this private'],
                          ] as const).map(([value, label, detail]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setGender(value)}
                              className={`rounded-2xl border px-3 py-3 text-left transition ${
                                gender === value
                                  ? 'border-red-500 bg-red-50 shadow-[0_8px_20px_rgba(220,38,38,0.12)]'
                                  : 'border-slate-200 bg-white hover:border-red-200'
                              }`}
                            >
                              <span className={`text-sm font-black ${gender === value ? 'text-red-700' : 'text-slate-800'}`}>{label}</span>
                              <span className="mt-0.5 block text-[10px] text-slate-500">{detail}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.1em] text-slate-500">Last name</span>
                        <input
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          onKeyDown={(event) => event.key === 'Enter' && nameReady && handleContinue()}
                          placeholder="Enter last name"
                          className="h-12 w-full rounded-2xl border border-red-100 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        />
                      </label>
                      <div className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                        <Flame className="h-5 w-5 shrink-0 text-red-500" />
                        <p className="text-xs leading-relaxed text-slate-600">
                          Your plan, XP, streaks and certificates are saved to your account — pick up exactly where you left off on any device.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                          Country
                        </span>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                          <input
                            value={country}
                            onChange={(event) => setCountry(event.target.value)}
                            placeholder="Uzbekistan"
                            className="h-12 w-full rounded-2xl border border-red-100 bg-white pl-11 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                          Current grade
                        </span>
                        <div className="relative">
                          <School className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                          <select
                            value={gradeLevel}
                            onChange={(event) => setGradeLevel(event.target.value)}
                            className="h-12 w-full appearance-none rounded-2xl border border-red-100 bg-white pl-11 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          >
                            {GRADE_LEVELS.map((grade) => <option key={grade}>{grade}</option>)}
                          </select>
                        </div>
                      </label>
                      <div className="sm:col-span-2 rounded-[1.5rem] border border-red-100 bg-gradient-to-br from-white to-red-50/70 p-5">
                        <p className="text-sm font-black text-slate-900">Why we ask this</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Your school stage changes the balance between exam preparation, university research and application deadlines. This information stays private.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {EXAM_CARDS.map((card) => {
                        const selected = targetExam === card.key
                        const Icon = card.icon
                        return (
                          <button
                            key={card.key}
                            type="button"
                            onClick={() => setTargetExam(card.key)}
                            className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                              selected
                                ? 'border-red-500 bg-gradient-to-br from-red-600 to-rose-600 shadow-[0_12px_28px_rgba(220,38,38,0.32)]'
                                : 'border-slate-200 bg-white hover:border-red-200 hover:shadow-md'
                            }`}
                          >
                            {selected ? (
                              <motion.div
                                initial={minimalMotion ? false : { scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={minimalMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 18 }}
                                className="absolute right-3 top-3"
                              >
                                <CheckCircle2 className="h-4 w-4 text-white/85" />
                              </motion.div>
                            ) : null}
                            <span className={`mb-2.5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-white/20' : 'bg-red-50'}`}>
                              <Icon className={`h-5 w-5 ${selected ? 'text-white' : 'text-red-600'}`} />
                            </span>
                            <p className={`text-lg font-black ${selected ? 'text-white' : 'text-slate-900'}`}>{card.label}</p>
                            <p className={`mt-0.5 text-[11px] font-medium leading-tight ${selected ? 'text-red-100' : 'text-slate-500'}`}>{card.subtitle}</p>
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {card.modules.map((mod) => (
                                <span
                                  key={mod}
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                  {mod}
                                </span>
                              ))}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {targetExam !== 'SAT' ? (
                          <div className="rounded-2xl border border-red-100 bg-red-50/45 p-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-red-600" />
                              <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-700">IELTS profile</p>
                            </div>
                            <label className="mt-3 block">
                              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Booked exam date</span>
                              <input
                                type="date"
                                min={new Date().toISOString().slice(0, 10)}
                                value={ieltsExamDate}
                                onChange={(event) => {
                                  setIeltsExamDate(event.target.value)
                                  setUseCustomDays(false)
                                }}
                                className="h-10 w-full rounded-xl border border-red-100 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              />
                            </label>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <label>
                                <span className="mb-1 block text-[10px] font-bold text-slate-400">Current band</span>
                                <input type="number" min={0} max={9} step={0.5} value={currentIeltsScore} onChange={(event) => setCurrentIeltsScore(Number(event.target.value))} className="h-10 w-full rounded-xl border border-red-100 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-red-300" />
                              </label>
                              <label>
                                <span className="mb-1 block text-[10px] font-bold text-slate-400">Target band</span>
                                <input type="number" min={0} max={9} step={0.5} value={targetIeltsScore} onChange={(event) => setTargetIeltsScore(Number(event.target.value))} className="h-10 w-full rounded-xl border border-red-100 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-red-300" />
                              </label>
                            </div>
                          </div>
                        ) : null}

                        {targetExam !== 'IELTS' ? (
                          <div className="rounded-2xl border border-blue-100 bg-blue-50/45 p-4">
                            <div className="flex items-center gap-2">
                              <Calculator className="h-4 w-4 text-blue-600" />
                              <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-700">SAT profile</p>
                            </div>
                            <label className="mt-3 block">
                              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Official test date</span>
                              <select
                                value={satExamDate}
                                onChange={(event) => {
                                  setSatExamDate(event.target.value)
                                  setUseCustomDays(false)
                                }}
                                className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                              >
                                {SAT_TEST_DATES.map((date) => <option key={date.value} value={date.value}>{date.label}</option>)}
                              </select>
                            </label>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <label>
                                <span className="mb-1 block text-[10px] font-bold text-slate-400">Current score</span>
                                <input type="number" min={400} max={1600} step={10} value={currentSatScore} onChange={(event) => setCurrentSatScore(Number(event.target.value))} className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-blue-300" />
                              </label>
                              <label>
                                <span className="mb-1 block text-[10px] font-bold text-slate-400">Target score</span>
                                <input type="number" min={400} max={1600} step={10} value={targetSatScore} onChange={(event) => setTargetSatScore(Number(event.target.value))} className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-blue-300" />
                              </label>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Study runway</p>
                            <p className="text-sm font-black text-slate-800">{resolvedDays} days until the nearest exam</p>
                          </div>
                        </div>
                        {!selectedExamDate ? (
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            I have
                            <input
                              type="number"
                              min={1}
                              value={customDays || daysToExam}
                              onChange={(event) => {
                                setCustomDays(event.target.value)
                                setUseCustomDays(true)
                              }}
                              className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold text-slate-800 outline-none focus:border-red-300"
                            />
                            days
                          </label>
                        ) : null}
                      </div>

                      <p className="mb-3 mt-6 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                        Hours you can study daily <span className="font-medium normal-case text-slate-400">(min 3h)</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {HOURS_OPTIONS.map((hours) => {
                          const active = dailyHours === hours
                          return (
                            <button
                              key={hours}
                              type="button"
                              onClick={() => setDailyHours(hours)}
                              className={`flex h-14 w-16 flex-col items-center justify-center rounded-xl border-2 transition-all duration-150 ${
                                active ? 'border-red-500 bg-red-600 shadow-[0_6px_16px_rgba(220,38,38,0.28)]' : 'border-slate-200 bg-white hover:border-red-200'
                              }`}
                            >
                              <span className={`text-lg font-black ${active ? 'text-white' : 'text-slate-800'}`}>{hours}h</span>
                              <span className={`text-[9px] font-semibold uppercase ${active ? 'text-red-100' : 'text-slate-400'}`}>
                                {hours === 3 ? 'min' : hours === 4 ? 'good' : hours === 5 ? 'great' : 'max'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {step === 5 ? (
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Target countries</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {DESTINATIONS.map((destination) => {
                          const active = targetCountries.includes(destination.value)
                          return (
                            <button
                              key={destination.value}
                              type="button"
                              onClick={() =>
                                setTargetCountries((current) =>
                                  active
                                    ? current.filter((item) => item !== destination.value)
                                    : current.length < 3
                                      ? [...current, destination.value]
                                      : current,
                                )
                              }
                              className={`rounded-2xl border p-3 text-left transition ${
                                active
                                  ? 'border-red-500 bg-red-50 shadow-[0_8px_20px_rgba(220,38,38,0.12)]'
                                  : 'border-slate-200 bg-white hover:border-red-200'
                              }`}
                            >
                              <span className="text-xl">{destination.flag}</span>
                              <span className={`mt-1 block text-xs font-black ${active ? 'text-red-700' : 'text-slate-800'}`}>
                                {destination.value}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Choose up to three destinations.</p>
                      <label className="mt-5 block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                          Intended field of study
                        </span>
                        <div className="relative">
                          <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                          <input
                            value={fieldOfStudy}
                            onChange={(event) => setFieldOfStudy(event.target.value)}
                            placeholder="Computer Science, Economics, Medicine..."
                            className="h-12 w-full rounded-2xl border border-red-100 bg-white pl-11 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      </label>
                    </div>
                  ) : null}

                  {step === 6 ? (
                    <div>
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                        <div className="h-1 w-full bg-gradient-to-r from-red-600 to-rose-500" />
                        <div className="grid gap-3 p-5 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Learner</p>
                            <p className="mt-1 text-base font-black text-slate-900">{firstName} {lastName}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Background</p>
                            <p className="mt-1 text-base font-black text-slate-900">{gradeLevel}</p>
                            <p className="text-[11px] text-slate-500">{country}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Study abroad goal</p>
                            <p className="mt-1 text-base font-black text-slate-900">{fieldOfStudy}</p>
                            <p className="line-clamp-1 text-[11px] text-slate-500">{targetCountries.join(' · ')}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target exam</p>
                            <p className="mt-1 text-base font-black text-slate-900">{selectedExamCard.label}</p>
                            <p className="text-[11px] text-slate-500">
                              {targetExam === 'IELTS'
                                ? `${currentIeltsScore} → ${targetIeltsScore} band`
                                : targetExam === 'SAT'
                                  ? `${currentSatScore} → ${targetSatScore} score`
                                  : `IELTS ${currentIeltsScore} → ${targetIeltsScore} · SAT ${currentSatScore} → ${targetSatScore}`}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Days to exam</p>
                            <p className="mt-1 text-base font-black text-slate-900">{resolvedDays} days</p>
                            {selectedExamDate ? <p className="text-[11px] font-semibold text-slate-500">{new Date(`${selectedExamDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p> : null}
                            <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${planIntensity.color}`}>
                              {planIntensity.label} plan
                            </span>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daily study</p>
                            <p className="mt-1 text-base font-black text-slate-900">{dailyHours} hours/day</p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock3 className="h-4 w-4 text-red-400" />
                        Your rolling 7-day plan auto-updates every Monday and completes tasks as you study.
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 1 ? 'Exit' : 'Back'}
              </button>

              {step < 6 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="cta-sheen inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-6 py-2.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(220,38,38,0.34)] transition hover:shadow-[0_16px_32px_rgba(220,38,38,0.44)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex flex-col items-end">
                <motion.button
                  type="button"
                  onClick={generatePlan}
                  disabled={stage !== 'idle'}
                  whileHover={stage === 'idle' && !minimalMotion ? { scale: 1.02 } : undefined}
                  whileTap={stage === 'idle' && !minimalMotion ? { scale: 0.98 } : undefined}
                  className="cta-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-6 py-2.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(220,38,38,0.36)] transition hover:shadow-[0_16px_34px_rgba(220,38,38,0.46)] disabled:cursor-wait disabled:opacity-75"
                >
                  <Sparkles className="h-4 w-4" />
                  {stage === 'idle' ? 'Generate my plan' : 'Generating...'}
                </motion.button>
                {saveError ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-bold text-red-700">
                    {saveError}
                  </p>
                ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Generation overlay */}
          <AnimatePresence>
            {stage !== 'idle' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-xl"
              >
                <motion.div
                  initial={minimalMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
                  animate={minimalMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-5 w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-7 text-center shadow-[0_36px_90px_rgba(127,29,29,0.22)]"
                >
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                    {stage === 'generating' ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                          className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,rgba(220,38,38,0),rgba(220,38,38,0.16),rgba(220,38,38,0.95),rgba(251,146,60,0.75),rgba(220,38,38,0))] p-[3px]"
                        >
                          <div className="h-full w-full rounded-full bg-white" />
                        </motion.div>
                        <Sparkles className="relative h-8 w-8 text-red-600" />
                      </>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_20px_38px_rgba(16,185,129,0.32)]"
                      >
                        <CheckCircle2 className="h-10 w-10" />
                      </motion.div>
                    )}
                  </div>
                  <p className="mt-4 text-2xl font-black text-slate-900">
                    {stage === 'generating' ? 'Creating your study plan...' : 'Plan created'}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${stage}-${messageIndex}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="mt-2 text-sm leading-6 text-slate-500"
                    >
                      {stage === 'generating' ? PLAN_GENERATION_STEPS[messageIndex] : 'Taking you to your dashboard now.'}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
