import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calculator,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  Clock3,
  ExternalLink,
  Headphones,
  LogIn,
  Mic,
  PenLine,
  Sparkles,
  Trophy,
  User,
  UserPlus,
} from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useRegisterModalStore, type RegisterModalState } from '@/store/registerModalStore'
import {
  addCustomTaskToDay,
  ensureRollingWeek,
  generateWeeklyPlan,
  loadActivityLog,
  loadOnboardingProfile,
  loadWeeklyPlan,
  saveOnboardingProfile,
  saveWeeklyPlan,
  taskAutoCompleted,
  toggleCustomTask,
  type ActivityKey,
  type ExamTarget,
  type OnboardingProfile,
  type WeeklyPlan,
} from '@/utils/weeklyPlanner'

function toDateISO(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resolveDefaultDayId(weeklyPlan: WeeklyPlan) {
  const todayISO = toDateISO(new Date())
  return weeklyPlan.days.find((day) => day.dateISO === todayISO)?.id ?? weeklyPlan.days[0]?.id ?? null
}

function saveToAccountProfile(firstName: string, lastName: string, targetExam: ExamTarget) {
  try {
    const key = 'smarttest-account-profile-v1'
    const existing = localStorage.getItem(key)
    const prev = existing ? JSON.parse(existing) : {}
    const updated = { ...prev, fullName: `${firstName} ${lastName}`.trim(), targetExam }
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

const EXAM_CARDS = [
  {
    key: 'IELTS' as ExamTarget,
    label: 'IELTS',
    subtitle: 'Academic & General Training',
    modules: ['Reading', 'Listening', 'Writing', 'Speaking'],
  },
  {
    key: 'SAT' as ExamTarget,
    label: 'SAT',
    subtitle: 'Scholastic Assessment Test',
    modules: ['Math', 'Reading & Writing'],
  },
  {
    key: 'BOTH' as ExamTarget,
    label: 'Both',
    subtitle: 'Complete Preparation',
    modules: ['IELTS', 'SAT', 'All 6 Modules'],
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

const ACTIVITY_ROUTE: Record<ActivityKey, string> = {
  'ielts-reading': '/ielts/reading',
  'ielts-listening': '/ielts/listening',
  'ielts-writing': '/ielts/writing',
  'ielts-speaking': '/speaking-community',
  'sat-math': '/sat/math',
  'sat-rw': '/sat/reading-writing',
  'vocabulary': '/vocabulary',
  'mock': '/mock',
}

const ACTIVITY_ICON: Record<ActivityKey, React.ReactNode> = {
  'ielts-reading': <BookOpen className="h-3.5 w-3.5" />,
  'ielts-listening': <Headphones className="h-3.5 w-3.5" />,
  'ielts-writing': <PenLine className="h-3.5 w-3.5" />,
  'ielts-speaking': <Mic className="h-3.5 w-3.5" />,
  'sat-math': <Calculator className="h-3.5 w-3.5" />,
  'sat-rw': <BookOpen className="h-3.5 w-3.5" />,
  'vocabulary': <BookOpen className="h-3.5 w-3.5" />,
  'mock': <Trophy className="h-3.5 w-3.5" />,
}

const STEP_LABELS = ['Profile', 'Timeline', 'Generate']

const PLAN_GENERATION_STEPS = [
  'Analysing your exam target',
  'Balancing daily workload',
  'Arranging module practice',
  'Polishing your 7-day plan',
]

const slideVariants = {
  enterRight: { x: 60, opacity: 0 },
  enterLeft: { x: -60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitLeft: { x: -60, opacity: 0 },
  exitRight: { x: 60, opacity: 0 },
}

function playPlanSuccessSound() {
  if (typeof window === 'undefined') return
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return

  try {
    const context = new AudioContextCtor()
    const masterGain = context.createGain()
    masterGain.gain.setValueAtTime(0.0001, context.currentTime)
    masterGain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03)
    masterGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7)
    masterGain.connect(context.destination)

    ;[523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const startAt = context.currentTime + index * 0.11
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, startAt)
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(0.24, startAt + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.34)
      oscillator.connect(gain)
      gain.connect(masterGain)
      oscillator.start(startAt)
      oscillator.stop(startAt + 0.36)
    })

    window.setTimeout(() => void context.close().catch(() => undefined), 900)
  } catch {
    // Audio feedback is optional; plan generation should never fail because sound is blocked.
  }
}

export default function WeeklyPlannerLab() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const openRegisterModal = useRegisterModalStore((state: RegisterModalState) => state.openRegisterModal)

  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [targetExam, setTargetExam] = useState<ExamTarget>('IELTS')
  const [daysToExam, setDaysToExam] = useState(60)
  const [customDays, setCustomDays] = useState('')
  const [useCustomDays, setUseCustomDays] = useState(false)
  const [dailyHours, setDailyHours] = useState(3)

  const [customTitle, setCustomTitle] = useState('')
  const [customDuration, setCustomDuration] = useState(30)
  const [customDayId, setCustomDayId] = useState<string>('')
  const [activityRefreshToken, setActivityRefreshToken] = useState(0)
  const [generationStage, setGenerationStage] = useState<'idle' | 'generating' | 'success'>('idle')
  const [generationMessageIndex, setGenerationMessageIndex] = useState(0)
  const [showPlanCreatedBanner, setShowPlanCreatedBanner] = useState(false)

  const firstNameRef = useRef<HTMLInputElement>(null)
  const planSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setPlan(null)
      setShowOnboarding(false)
      return
    }

    const storedProfile = loadOnboardingProfile(user?.id)
    if (!storedProfile) {
      // Plan setup now lives on the dedicated /onboarding page (a full
      // multi-step quiz) instead of an inline modal — we surface a CTA in the
      // render below rather than auto-opening a dialog over the dashboard.
      setProfile(null)
      setPlan(null)
      setShowOnboarding(false)
      return
    }
    const storedPlan = loadWeeklyPlan(user?.id)
    const rollingPlan = ensureRollingWeek(storedProfile, storedPlan, new Date())
    const defaultDayId = resolveDefaultDayId(rollingPlan)
    setProfile(storedProfile)
    setPlan(rollingPlan)
    setSelectedDayId(defaultDayId)
    setCustomDayId(defaultDayId ?? '')
    saveWeeklyPlan(rollingPlan, user?.id)
    setShowOnboarding(false)
  }, [user?.id])

  useEffect(() => {
    const timerId = window.setInterval(() => setActivityRefreshToken((v) => v + 1), 60000)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    if (!showOnboarding || typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [showOnboarding])

  useEffect(() => {
    if (showOnboarding && onboardingStep === 1) {
      setTimeout(() => firstNameRef.current?.focus(), 200)
    }
  }, [showOnboarding, onboardingStep])

  useEffect(() => {
    if (generationStage !== 'generating') {
      setGenerationMessageIndex(0)
      return
    }

    const intervalId = window.setInterval(() => {
      setGenerationMessageIndex((current) => (current + 1) % PLAN_GENERATION_STEPS.length)
    }, 520)

    return () => window.clearInterval(intervalId)
  }, [generationStage])

  const activityLog = useMemo(() => loadActivityLog(user?.id), [user?.id, activityRefreshToken])

  const selectedDay = useMemo(() => {
    if (!plan) return null
    return plan.days.find((d) => d.id === selectedDayId) ?? plan.days[0] ?? null
  }, [plan, selectedDayId])

  const generatedCompletedCount = useMemo(() => {
    if (!selectedDay) return 0
    return selectedDay.generatedTasks.filter((t) => taskAutoCompleted(t, selectedDay.dateISO, activityLog)).length
  }, [activityLog, selectedDay])

  const resolvedDays = useCustomDays ? Math.max(1, Number(customDays) || 1) : daysToExam

  const planIntensity = resolvedDays <= 21
    ? { label: 'Intensive', color: 'text-red-700 bg-red-50' }
    : resolvedDays <= 60
    ? { label: 'Focused', color: 'text-orange-700 bg-orange-50' }
    : { label: 'Standard', color: 'text-green-700 bg-green-50' }

  const goToStep = (next: 1 | 2 | 3, dir: 'forward' | 'back') => {
    setDirection(dir)
    setOnboardingStep(next)
  }

  const createOnboarding = () => {
    const safeFirst = firstName.trim()
    const safeLast = lastName.trim()
    if (!safeFirst || !safeLast || generationStage !== 'idle') return

    setGenerationStage('generating')

    window.setTimeout(() => {
      const nextProfile: OnboardingProfile = {
        firstName: safeFirst,
        lastName: safeLast,
        targetExam,
        daysToExam: Math.max(1, resolvedDays),
        dailyHours: Math.max(3, dailyHours),
        createdAt: new Date().toISOString(),
      }

      const nextPlan = generateWeeklyPlan(nextProfile, new Date())
      const defaultDayId = resolveDefaultDayId(nextPlan)

      saveOnboardingProfile(nextProfile, user?.id)
      saveWeeklyPlan(nextPlan, user?.id)
      saveToAccountProfile(safeFirst, safeLast, targetExam)

      setProfile(nextProfile)
      setPlan(nextPlan)
      setSelectedDayId(defaultDayId)
      setCustomDayId(defaultDayId ?? '')
      setGenerationStage('success')
      playPlanSuccessSound()

      window.setTimeout(() => {
        setShowOnboarding(false)
        setOnboardingStep(1)
        setGenerationStage('idle')
        setShowPlanCreatedBanner(true)
        window.setTimeout(() => {
          planSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 120)
        window.setTimeout(() => setShowPlanCreatedBanner(false), 4600)
      }, 800)
    }, 2200)
  }

  const addCustomTask = () => {
    if (!plan || !customTitle.trim()) return
    const dayId = customDayId || selectedDay?.id
    if (!dayId) return
    const nextPlan = addCustomTaskToDay(plan, dayId, {
      title: customTitle,
      durationMinutes: Math.max(10, customDuration),
    })
    setPlan(nextPlan)
    saveWeeklyPlan(nextPlan, user?.id)
    setCustomTitle('')
    setCustomDuration(30)
  }

  const toggleCustom = (dayId: string, taskId: string) => {
    if (!plan) return
    const nextPlan = toggleCustomTask(plan, dayId, taskId)
    setPlan(nextPlan)
    saveWeeklyPlan(nextPlan, user?.id)
  }

  const selectedExamCard = EXAM_CARDS.find((c) => c.key === targetExam)!

  const onboardingModal = showOnboarding ? (
    <div className="fixed inset-0 z-[280] overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
      />

      <div className="relative flex min-h-full items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-[0_48px_100px_rgba(15,23,42,0.38)]"
        >
          {/* Top gradient strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

          {/* Header */}
          <div className="relative px-7 pt-7 pb-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">
                  <Sparkles className="h-3 w-3" />
                  First-Time Setup
                </span>
                <h2 className="mt-3 text-[1.75rem] font-black leading-tight text-slate-900">
                  {onboardingStep === 1 && 'Build Your Study Profile'}
                  {onboardingStep === 2 && 'Set Your Study Timeline'}
                  {onboardingStep === 3 && 'Your Plan is Ready'}
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  {onboardingStep === 1 && "Tell us about yourself so we can tailor your 7-day study plan."}
                  {onboardingStep === 2 && "Set your exam deadline and daily study capacity."}
                  {onboardingStep === 3 && "Review your personalized plan before we generate it."}
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3] as const).map((step) => (
                    <div
                      key={step}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        step === onboardingStep
                          ? 'w-6 bg-red-600'
                          : step < onboardingStep
                          ? 'w-2 bg-red-300'
                          : 'w-2 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  Step {onboardingStep} of 3
                </span>
              </div>
            </div>
          </div>

          {/* Step content with slide animation */}
          <div className="overflow-hidden px-7 pb-7 pt-6">
            <AnimatePresence mode="wait" initial={false}>
              {onboardingStep === 1 && (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  initial={direction === 'forward' ? 'enterRight' : 'enterLeft'}
                  animate="center"
                  exit={direction === 'forward' ? 'exitLeft' : 'exitRight'}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Name inputs */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1.5">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={firstNameRef}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter first name"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1.5">
                        Last Name
                      </label>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>

                  {/* Exam target */}
                  <div className="mt-6">
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                      What are you preparing for?
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {EXAM_CARDS.map((card) => {
                        const selected = targetExam === card.key
                        return (
                          <button
                            key={card.key}
                            type="button"
                            onClick={() => setTargetExam(card.key)}
                            className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                              selected
                                ? 'border-red-500 bg-gradient-to-br from-red-600 to-rose-600 shadow-[0_8px_24px_rgba(220,38,38,0.32)]'
                                : 'border-slate-200 bg-white hover:border-red-200 hover:shadow-md'
                            }`}
                          >
                            {selected && (
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
                            )}
                            <div className={`mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                              selected ? 'bg-white/20' : 'bg-red-50'
                            }`}>
                              {card.key === 'IELTS' && <BookOpen className={`h-4.5 w-4.5 ${selected ? 'text-white' : 'text-red-600'}`} />}
                              {card.key === 'SAT' && <Calculator className={`h-4.5 w-4.5 ${selected ? 'text-white' : 'text-red-600'}`} />}
                              {card.key === 'BOTH' && <Trophy className={`h-4.5 w-4.5 ${selected ? 'text-white' : 'text-red-600'}`} />}
                            </div>
                            <p className={`text-base font-black ${selected ? 'text-white' : 'text-slate-900'}`}>
                              {card.label}
                            </p>
                            <p className={`mt-0.5 text-[11px] font-medium leading-tight ${selected ? 'text-red-100' : 'text-slate-500'}`}>
                              {card.subtitle}
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {card.modules.map((mod) => (
                                <span
                                  key={mod}
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                    selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {mod}
                                </span>
                              ))}
                            </div>
                            {selected && (
                              <div className="absolute right-3 top-3">
                                <CheckCircle2 className="h-4 w-4 text-white/80" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 2 && (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  initial={direction === 'forward' ? 'enterRight' : 'enterLeft'}
                  animate="center"
                  exit={direction === 'forward' ? 'exitLeft' : 'exitRight'}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Days to exam */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                      How many days until your exam?
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {DAY_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => { setDaysToExam(preset.value); setUseCustomDays(false) }}
                          className={`flex flex-col items-center rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                            !useCustomDays && daysToExam === preset.value
                              ? 'border-red-500 bg-red-600 shadow-[0_6px_16px_rgba(220,38,38,0.28)]'
                              : 'border-slate-200 bg-white hover:border-red-200'
                          }`}
                        >
                          <span className={`text-sm font-black ${!useCustomDays && daysToExam === preset.value ? 'text-white' : 'text-slate-800'}`}>
                            {preset.label}
                          </span>
                          <span className={`mt-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            !useCustomDays && daysToExam === preset.value ? 'bg-white/25 text-white' : preset.badgeColor
                          }`}>
                            {preset.badge}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Custom days input */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUseCustomDays(!useCustomDays)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                          useCustomDays ? 'border-red-500 bg-red-600' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {useCustomDays && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </button>
                      <span className="text-xs font-semibold text-slate-600">Custom:</span>
                      <input
                        type="number"
                        min={1}
                        placeholder="e.g. 45"
                        value={customDays}
                        onFocus={() => setUseCustomDays(true)}
                        onChange={(e) => { setCustomDays(e.target.value); setUseCustomDays(true) }}
                        className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                      <span className="text-xs text-slate-500">days</span>
                    </div>
                  </div>

                  {/* Daily hours */}
                  <div className="mt-6">
                    <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">
                      How many hours can you study daily? <span className="normal-case font-normal text-slate-400">(min 3h)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {HOURS_OPTIONS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setDailyHours(h)}
                          className={`flex h-14 w-16 flex-col items-center justify-center rounded-xl border-2 transition-all duration-150 ${
                            dailyHours === h
                              ? 'border-red-500 bg-red-600 shadow-[0_6px_16px_rgba(220,38,38,0.28)]'
                              : 'border-slate-200 bg-white hover:border-red-200'
                          }`}
                        >
                          <span className={`text-lg font-black ${dailyHours === h ? 'text-white' : 'text-slate-800'}`}>{h}h</span>
                          <span className={`text-[9px] font-semibold uppercase ${dailyHours === h ? 'text-red-100' : 'text-slate-400'}`}>
                            {h === 3 ? 'min' : h === 4 ? 'good' : h === 5 ? 'great' : 'max'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 p-3.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <Sparkles className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Your rolling week plan auto-updates every Monday. System tasks are marked complete after 30 active minutes in the relevant module.
                    </p>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 3 && (
                <motion.div
                  key="step3"
                  variants={slideVariants}
                  initial={direction === 'forward' ? 'enterRight' : 'enterLeft'}
                  animate="center"
                  exit={direction === 'forward' ? 'exitLeft' : 'exitRight'}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Summary card */}
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                    <div className="h-1 w-full bg-gradient-to-r from-red-600 to-rose-500" />
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 mb-4">Your Study Plan Summary</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Learner</p>
                          <p className="mt-1 text-base font-black text-slate-900">{firstName} {lastName}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Exam</p>
                          <p className="mt-1 text-base font-black text-slate-900">{selectedExamCard.label}</p>
                          <p className="text-[11px] text-slate-500">{selectedExamCard.subtitle}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Days to Exam</p>
                          <p className="mt-1 text-base font-black text-slate-900">{resolvedDays} days</p>
                          <span className={`inline-block mt-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${planIntensity.color}`}>
                            {planIntensity.label} Plan
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daily Study</p>
                          <p className="mt-1 text-base font-black text-slate-900">{dailyHours} hours/day</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedExamCard.modules.map((mod) => (
                          <span key={mod} className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-center text-sm text-slate-500">
                    Your 7-day rolling plan will be generated with daily tasks for each module.
                    Tasks auto-complete as you study.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-100 px-7 py-4">
            <div>
              {onboardingStep > 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep((onboardingStep - 1) as 1 | 2 | 3, 'back')}
                  disabled={generationStage !== 'idle'}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                {STEP_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                      i + 1 === onboardingStep
                        ? 'bg-red-600 text-white shadow-[0_4px_10px_rgba(220,38,38,0.4)]'
                        : i + 1 < onboardingStep
                        ? 'bg-red-100 text-red-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {i + 1 < onboardingStep ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                    </div>
                    {i < 2 && <div className={`h-px w-5 ${i + 1 < onboardingStep ? 'bg-red-300' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>

              {onboardingStep < 3 ? (
                <button
                  type="button"
                  onClick={() => goToStep((onboardingStep + 1) as 2 | 3, 'forward')}
                  disabled={onboardingStep === 1 && (!firstName.trim() || !lastName.trim())}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.32)] transition hover:shadow-[0_10px_24px_rgba(220,38,38,0.42)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <motion.button
                  type="button"
                  onClick={createOnboarding}
                  disabled={generationStage !== 'idle'}
                  whileHover={generationStage === 'idle' ? { scale: 1.02 } : undefined}
                  whileTap={generationStage === 'idle' ? { scale: 0.98 } : undefined}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.36)] transition hover:shadow-[0_12px_28px_rgba(220,38,38,0.46)] disabled:cursor-wait disabled:opacity-75"
                >
                  <Sparkles className="h-4 w-4" />
                  {generationStage === 'idle' ? 'Generate My Plan' : 'Generating...'}
                </motion.button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {generationStage !== 'idle' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-white/88 backdrop-blur-xl"
              >
                <motion.div
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(248,113,113,0.22),transparent_34%),radial-gradient(circle_at_32%_72%,rgba(251,146,60,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,241,242,0.72))]"
                />
                {[0, 1, 2, 3, 4, 5].map((dot) => (
                  <motion.span
                    key={`plan-orb-${dot}`}
                    aria-hidden="true"
                    className="absolute h-2 w-2 rounded-full bg-red-400/45 shadow-[0_0_22px_rgba(239,68,68,0.45)]"
                    initial={{
                      x: `${18 + dot * 13}%`,
                      y: `${22 + (dot % 3) * 19}%`,
                      opacity: 0,
                      scale: 0.6,
                    }}
                    animate={{
                      y: [`${22 + (dot % 3) * 19}%`, `${18 + (dot % 3) * 22}%`, `${22 + (dot % 3) * 19}%`],
                      opacity: [0.2, 0.68, 0.2],
                      scale: [0.8, 1.35, 0.8],
                    }}
                    transition={{
                      duration: 2.6 + dot * 0.18,
                      repeat: Infinity,
                      ease: [0.45, 0, 0.55, 1],
                      delay: dot * 0.12,
                    }}
                  />
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.94, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 12, scale: 0.94, filter: 'blur(8px)' }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="relative mx-5 w-full max-w-md overflow-hidden rounded-[2rem] border border-red-100 bg-white/95 p-6 text-center shadow-[0_36px_90px_rgba(127,29,29,0.24)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-rose-400 to-orange-400" />
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                    {generationStage === 'generating' ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                          className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,rgba(220,38,38,0),rgba(220,38,38,0.16),rgba(220,38,38,0.95),rgba(251,146,60,0.75),rgba(220,38,38,0))] p-[3px]"
                        >
                          <div className="h-full w-full rounded-full bg-white" />
                        </motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.08, 1], opacity: [0.72, 1, 0.72] }}
                          transition={{ repeat: Infinity, duration: 1.45, ease: [0.45, 0, 0.55, 1] }}
                          className="absolute inset-3 rounded-full bg-gradient-to-br from-red-50 to-rose-100 shadow-inner"
                        />
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ repeat: Infinity, duration: 4.2, ease: 'linear' }}
                          className="absolute h-16 w-16 rounded-full border border-dashed border-red-200"
                        />
                        <Sparkles className="relative h-8 w-8 text-red-600" />
                      </>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_20px_38px_rgba(16,185,129,0.32)]"
                      >
                        <CheckCircle2 className="h-10 w-10" />
                      </motion.div>
                    )}
                  </div>
                  <p className="mt-4 text-2xl font-black text-slate-900">
                    {generationStage === 'generating' ? 'Creating your study plan...' : 'Plan created successfully'}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${generationStage}-${generationMessageIndex}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-2 text-sm leading-6 text-slate-500"
                    >
                      {generationStage === 'generating'
                        ? PLAN_GENERATION_STEPS[generationMessageIndex]
                        : 'Taking you to your weekly plan now.'}
                    </motion.p>
                  </AnimatePresence>

                  {generationStage === 'generating' ? (
                    <div className="relative mt-5 overflow-hidden rounded-full border border-red-100 bg-white/80 p-1 shadow-inner">
                      <motion.div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#dc2626,#fb7185,#fb923c,#dc2626)] bg-[length:220%_100%] shadow-[0_0_22px_rgba(239,68,68,0.35)]"
                        initial={{ width: '18%', backgroundPosition: '0% 50%' }}
                        animate={{ width: ['18%', '54%', '78%', '92%'], backgroundPosition: ['0% 50%', '100% 50%'] }}
                        transition={{ duration: 2.1, repeat: Infinity, repeatType: 'reverse', ease: [0.45, 0, 0.55, 1] }}
                      />
                      <motion.span
                        aria-hidden="true"
                        className="absolute inset-y-1 left-0 w-16 rounded-full bg-white/50 blur-md"
                        animate={{ x: ['-30%', '680%'] }}
                        transition={{ duration: 1.55, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                      />
                    </div>
                  ) : null}

                  {generationStage === 'generating' ? (
                    <div className="mt-5 grid gap-2 text-left">
                      {PLAN_GENERATION_STEPS.map((step, index) => {
                        const isActive = index === generationMessageIndex
                        const isComplete = index < generationMessageIndex
                        return (
                          <div
                            key={step}
                            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition-all ${
                              isActive
                                ? 'border-red-200 bg-red-50 text-red-700 shadow-[0_10px_22px_rgba(220,38,38,0.12)]'
                                : isComplete
                                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-100 bg-slate-50 text-slate-400'
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${isActive ? 'animate-pulse bg-red-500' : isComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {step}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                      Your personalized 7-day plan is ready.
                    </p>
                  )}

                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    {generationStage === 'generating'
                      ? 'Please keep this tab open'
                      : 'Success'}
                  </p>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  ) : null

  return (
    <section ref={planSectionRef} className="panel-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Weekly Planner Lab</h2>
          <p className="mt-1 text-sm text-slate-600">
            Generated tasks are system-controlled. Custom tasks are editable and manually checkable.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          <CalendarRange className="h-3.5 w-3.5" />
          Rolling 7-Day Window
        </div>
      </div>

      {!user ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black text-slate-900">Sign in to generate your plan</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The setup questions appear after you create an account or sign in, so your plan stays connected to your profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openRegisterModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.3)]"
              >
                <UserPlus className="h-4 w-4" />
                Create Account
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            </div>
          </div>
        </div>
      ) : profile && plan ? (
        <>
          <AnimatePresence>
            {showPlanCreatedBanner ? (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-[0_16px_34px_rgba(16,185,129,0.14)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-black">Your plan has been created</p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Your personalized 7-day study plan is ready below.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Profile summary */}
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-red-100 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-600">Learner</p>
              <p className="mt-1 text-lg font-black text-slate-900">{profile.firstName} {profile.lastName}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-600">Target Exam</p>
              <p className="mt-1 text-lg font-black text-slate-900">{profile.targetExam}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-600">Daily Hours</p>
              <p className="mt-1 text-lg font-black text-slate-900">{profile.dailyHours}h</p>
            </div>
          </div>

          {/* Custom task adder */}
          <div className="mt-4 rounded-2xl border border-red-100 bg-white p-4">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-red-600">
              <ClipboardPlus className="h-3.5 w-3.5" />
              Add Custom Task
            </p>
            <div className="mt-2.5 grid gap-2 lg:grid-cols-[200px_minmax(0,1fr)_110px_auto]">
              <select
                value={customDayId || selectedDay?.id || ''}
                onChange={(e) => setCustomDayId(e.target.value)}
                className="h-11 rounded-xl border border-red-100 bg-white px-3 text-sm text-slate-800 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              >
                {plan.days.map((day) => (
                  <option key={day.id} value={day.id}>{day.weekdayLabel}</option>
                ))}
              </select>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="New custom task title"
                onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                className="h-11 rounded-xl border border-red-100 bg-white px-3 text-sm text-slate-800 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
              <input
                type="number"
                min={10}
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value) || 10)}
                className="h-11 rounded-xl border border-red-100 bg-white px-3 text-sm text-slate-800 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
              <button
                type="button"
                onClick={addCustomTask}
                className="h-11 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(220,38,38,0.28)] transition hover:shadow-[0_8px_20px_rgba(220,38,38,0.38)]"
              >
                Add
              </button>
            </div>
          </div>

          {/* Day selector + tasks */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[200px_1fr]">
            <aside className="space-y-2">
              {plan.days.map((day) => {
                const selected = selectedDay?.id === day.id
                const dayCompleted = day.generatedTasks.filter((t) => taskAutoCompleted(t, day.dateISO, activityLog)).length
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => { setSelectedDayId(day.id); setCustomDayId(day.id) }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? 'border-red-300 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.28)]'
                        : 'border-red-100 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-bold">{day.weekdayLabel}</p>
                      {dayCompleted > 0 && (
                        <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${selected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {dayCompleted}/{day.generatedTasks.length}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${selected ? 'text-red-100' : 'text-slate-500'}`}>{day.dateISO}</p>
                  </button>
                )
              })}
            </aside>

            <div className="rounded-2xl border border-red-100 bg-white p-5">
              {selectedDay ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-black text-slate-900">{selectedDay.weekdayLabel} Plan</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1">
                        <span className="text-xs font-bold text-red-700">{generatedCompletedCount}</span>
                        <span className="text-xs text-red-500">/</span>
                        <span className="text-xs font-semibold text-red-600">{selectedDay.generatedTasks.length}</span>
                        <span className="text-xs font-semibold text-red-600">completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {selectedDay.generatedTasks.map((task, taskIndex) => {
                      const completed = taskAutoCompleted(task, selectedDay.dateISO, activityLog)
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: taskIndex * 0.05, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                            completed
                              ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-white shadow-[0_2px_14px_rgba(16,185,129,0.12)]'
                              : 'border-slate-200 bg-white hover:border-red-100 hover:shadow-[0_4px_18px_rgba(220,38,38,0.08)]'
                          }`}
                        >
                          {/* Left accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-500 ${
                            completed
                              ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                              : 'bg-gradient-to-b from-slate-200 to-slate-300 group-hover:from-red-300 group-hover:to-rose-400'
                          }`} />

                          {/* Completion shimmer overlay */}
                          <AnimatePresence>
                            {completed && (
                              <motion.div
                                key="shimmer"
                                initial={{ x: '-100%', opacity: 0.6 }}
                                animate={{ x: '200%', opacity: 0 }}
                                transition={{ duration: 0.65, ease: 'easeOut' }}
                                className="pointer-events-none absolute inset-0 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent"
                              />
                            )}
                          </AnimatePresence>

                          <div className="flex items-center gap-3 pl-5 pr-4 py-3.5">
                            {/* Status indicator (read-only circle) */}
                            <div className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              completed
                                ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                                : 'border-slate-300 bg-slate-50'
                            }`}>
                              <AnimatePresence>
                                {completed && (
                                  <motion.svg
                                    key="check"
                                    initial={{ scale: 0, opacity: 0, rotate: -30 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.05 }}
                                    className="h-2.5 w-2.5 text-white"
                                    fill="none"
                                    viewBox="0 0 12 12"
                                  >
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                  </motion.svg>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Task info */}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-semibold leading-snug transition-all duration-300 ${
                                completed ? 'text-slate-400 line-through decoration-emerald-400' : 'text-slate-900'
                              }`}>
                                {task.title}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                  <Clock3 className="h-3 w-3" />
                                  {task.durationMinutes} min
                                </span>
                                <AnimatePresence>
                                  {completed && (
                                    <motion.span
                                      key="tracked"
                                      initial={{ opacity: 0, x: -6 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -6 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-[10px] font-bold text-emerald-600"
                                    >
                                      · Activity tracked ✓
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Right: Done badge or Start button */}
                            <AnimatePresence mode="wait">
                              {completed ? (
                                <motion.span
                                  key="done-badge"
                                  initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
                                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                  exit={{ scale: 0.4, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Done
                                </motion.span>
                              ) : (
                                <motion.button
                                  key="start-btn"
                                  initial={{ scale: 0.85, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.85, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  type="button"
                                  onClick={() => navigate(ACTIVITY_ROUTE[task.activityKey])}
                                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-all duration-150 hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 hover:border-transparent hover:text-white hover:shadow-[0_4px_14px_rgba(220,38,38,0.3)] active:scale-95"
                                >
                                  {ACTIVITY_ICON[task.activityKey]}
                                  Start
                                  <ExternalLink className="h-3 w-3 opacity-70" />
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {selectedDay.customTasks.length > 0 && (
                    <div className="mt-5">
                      <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                        Custom Tasks
                      </p>
                      <div className="space-y-2">
                        {selectedDay.customTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggleCustom(selectedDay.id, task.id)}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition ${
                              task.completed
                                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
                                task.completed ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                              }`}>
                                {task.completed && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className={`text-sm font-semibold ${task.completed ? 'line-through opacity-70' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                              {task.completed ? '✓ Done' : `${task.durationMinutes} min`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No day selected.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/60 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-[0_12px_24px_rgba(220,38,38,0.3)]">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <p className="text-lg font-black text-slate-900">Create your personalized study plan</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Answer a few quick questions and we&apos;ll build a rolling 7-day roadmap to your target score.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="cta-sheen inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(220,38,38,0.32)] transition hover:shadow-[0_16px_32px_rgba(220,38,38,0.42)]"
            >
              <Sparkles className="h-4 w-4" />
              Start setup
            </button>
          </div>
        </div>
      )}

      {typeof document !== 'undefined' && onboardingModal
        ? createPortal(onboardingModal, document.body)
        : onboardingModal}
    </section>
  )
}
