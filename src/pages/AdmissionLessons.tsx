import UiText from '@/components/common/UiText'
import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, Route, Sparkles } from 'lucide-react'
import { AmbientBackdrop, CountUp, ProgressRing, Reveal } from '@/components/fx'
import LucideIcon from '@/components/admission/LucideIcon'
import { getLessonsByPhase, lessonPhases, LESSON_COUNT, totalLessonMinutes } from '@/data/admission'
import { getCompletedLessons, subscribeLessonProgress } from '@/utils/admissionProgressStore'
import '@/styles/admission-roadmap.css'

const LEVEL_TONE: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export default function AdmissionLessons() {
  const navigate = useNavigate()
  const studyHours = Math.round(totalLessonMinutes / 60)
  const [completed, setCompleted] = useState<Set<string>>(() => getCompletedLessons())
  useEffect(() => subscribeLessonProgress(() => setCompleted(getCompletedLessons())), [])
  const nextLesson = lessonPhases.flatMap((phase) => getLessonsByPhase(phase.id)).find((lesson) => !completed.has(lesson.slug))

  return (
    <div className="admission-roadmap-page workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />

      <div className="relative mx-auto w-full max-w-6xl space-y-7">
        <Reveal>
          <section className="premium-hero p-6 sm:p-9">
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
              <div>
                <div className="premium-top-controls">
                  <span className="premium-top-chip">
                    <GraduationCap className="h-3.5 w-3.5" />
                     <UiText text={"Study-Abroad Track"} /> </span>
                </div>
                <h1 className="premium-section-title mt-4">
                   <UiText text={"Study Abroad"} /> <span className="arena-title-accent-red"> <UiText text={"Lessons"} /> </span>
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  A {LESSON_COUNT} <UiText text={"-lesson roadmap that walks you through the entire journey — five phases, from your first decision to thriving on campus. Follow it in order, or jump straight to the phase you need next."} /> </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label"> <UiText text={"Lessons"} /> </p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={LESSON_COUNT} />
                  </p>
                  <p className="hero-metric-note"> <UiText text={"Across 5 phases"} /> </p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label"> <UiText text={"Study time"} /> </p>
                  <p className="hero-metric-value-sm">
                    ≈ <CountUp value={studyHours} />h
                  </p>
                  <p className="hero-metric-note"> <UiText text={"Self-paced"} /> </p>
                </div>
                <div className="hero-metric-card interactive-lift flex-row items-center gap-3">
                  <ProgressRing value={(completed.size / LESSON_COUNT) * 100} size={68} stroke={7}>
                    <span className="text-xs font-black text-slate-900">{Math.round((completed.size / LESSON_COUNT) * 100)}%</span>
                  </ProgressRing>
                  <div>
                    <p className="hero-metric-label"> <UiText text={"Overall progress"} /> </p>
                    <p className="mt-1 text-lg font-black text-slate-900">{completed.size}/{LESSON_COUNT}</p>
                    <p className="text-[10px] font-semibold text-slate-500"> <UiText text={"Lessons completed"} /> </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {nextLesson ? <button type="button" onClick={() => navigate(`/admission/lessons/${nextLesson.slug}`)} className="roadmap-next-link"><span className="roadmap-next-icon"><Sparkles size={21} /></span><span><small>YOUR NEXT MILESTONE</small><strong>Lesson {nextLesson.order}: {nextLesson.title}</strong></span><span className="roadmap-next-action">Continue <ArrowRight size={17} /></span></button> : <div className="roadmap-next-link"><span className="roadmap-next-icon"><CheckCircle2 size={21} /></span><span><small>ROADMAP COMPLETE</small><strong>All {LESSON_COUNT} lessons finished. Great work!</strong></span></div>}

        {/* Phases */}
        {lessonPhases.map((phase, phaseIndex) => {
          const phaseLessons = getLessonsByPhase(phase.id)
          const phaseDone = phaseLessons.filter((lesson) => completed.has(lesson.slug)).length
          return (
            <Reveal key={phase.id} delay={0.03}>
              <section className="roadmap-phase" style={{ '--phase-accent': phase.accent } as CSSProperties}>
                {/* Phase header */}
                <div
                  className="relative overflow-hidden rounded-[1.5rem] p-5 text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] sm:p-6"
                  style={{ background: phase.gradient }}
                >
                  <div
                    className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full opacity-30 blur-2xl"
                    style={{ background: 'radial-gradient(circle,#ffffff,transparent 70%)' }}
                  />
                  <div className="relative flex items-center gap-4">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                      <LucideIcon name={phase.icon} className="h-7 w-7" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                         <UiText text={"Phase"} /> {phaseIndex + 1} · {phaseLessons.length}  <UiText text={"lessons"} /> </p>
                      <h2 className="text-xl font-black tracking-tight sm:text-2xl">{phase.title}</h2>
                      <p className="mt-0.5 text-[13px] font-medium text-white/80">{phase.subtitle}</p>
                    </div>
                    {phaseDone > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-black backdrop-blur">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {phaseDone}/{phaseLessons.length}
                      </span>
                    ) : null}
                  </div>
                  {/* phase progress line (concept: 23-StudyAbroad-Lessons) */}
                  <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white/90 transition-[width] duration-700"
                      style={{ width: `${phaseLessons.length ? (phaseDone / phaseLessons.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="roadmap-steps">
                  {phaseLessons.map((lesson) => {
                    const done = completed.has(lesson.slug)
                    const current = nextLesson?.slug === lesson.slug
                    return <button key={lesson.id} type="button" onClick={() => navigate(`/admission/lessons/${lesson.slug}`)} className={`roadmap-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`} aria-label={`Open lesson ${lesson.order}: ${lesson.title}`}>
                      <span className="roadmap-step-marker">{done ? <CheckCircle2 size={22} /> : current ? <Route size={22} /> : <BookOpen size={19} />}</span>
                      <span className="roadmap-step-copy"><small>LESSON {String(lesson.order).padStart(2, '0')} · {lesson.durationMin} MIN</small><strong>{lesson.title}</strong><span>{lesson.summary}</span><em className={`roadmap-level ${LEVEL_TONE[lesson.level]}`}>{done ? 'Completed' : current ? 'Up next' : lesson.level}</em></span>
                      <ArrowRight className="roadmap-step-arrow" size={19} />
                    </button>
                  })}
                </div>
              </section>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
