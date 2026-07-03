import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, GraduationCap } from 'lucide-react'
import { AmbientBackdrop, CountUp, Reveal, Stagger, StaggerItem } from '@/components/fx'
import LucideIcon from '@/components/admission/LucideIcon'
import { getLessonsByPhase, lessonPhases, LESSON_COUNT, totalLessonMinutes } from '@/data/admission'
import { getCompletedLessons, subscribeLessonProgress } from '@/utils/admissionProgressStore'

const LEVEL_TONE: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function AdmissionLessons() {
  const navigate = useNavigate()
  const studyHours = Math.round(totalLessonMinutes / 60)
  const [completed, setCompleted] = useState<Set<string>>(() => getCompletedLessons())
  useEffect(() => subscribeLessonProgress(() => setCompleted(getCompletedLessons())), [])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />

      <div className="relative mx-auto w-full max-w-6xl space-y-7">
        <Reveal>
          <section className="premium-hero p-6 sm:p-9">
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
              <div>
                <div className="premium-top-controls">
                  <button onClick={() => navigate('/admission')} className="premium-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Admission
                  </button>
                  <span className="premium-top-chip">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Study-Abroad Track
                  </span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Study Abroad <span className="arena-title-accent-red">Lessons</span>
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  A {LESSON_COUNT}-lesson roadmap that walks you through the entire journey — five phases, from your first
                  decision to thriving on campus. Follow it in order, or jump straight to the phase you need next.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Lessons</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={LESSON_COUNT} />
                  </p>
                  <p className="hero-metric-note">Across 5 phases</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Study time</p>
                  <p className="hero-metric-value-sm">
                    ≈ <CountUp value={studyHours} />h
                  </p>
                  <p className="hero-metric-note">Self-paced</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Level</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">All levels</p>
                  <p className="hero-metric-note">Beginner → Advanced</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Phases */}
        {lessonPhases.map((phase, phaseIndex) => {
          const phaseLessons = getLessonsByPhase(phase.id)
          const phaseDone = phaseLessons.filter((lesson) => completed.has(lesson.slug)).length
          return (
            <Reveal key={phase.id} delay={0.03}>
              <section>
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
                        Phase {phaseIndex + 1} · {phaseLessons.length} lessons
                      </p>
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

                {/* Lessons grid */}
                <Stagger className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {phaseLessons.map((lesson) => (
                    <StaggerItem key={lesson.id} className="h-full">
                      <button
                        onClick={() => navigate(`/admission/lessons/${lesson.slug}`)}
                        className="group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(15,23,42,0.12)]"
                        style={{ borderTop: `3px solid ${phase.accent}` }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ background: completed.has(lesson.slug) ? 'linear-gradient(135deg,#10b981,#059669)' : phase.gradient }}
                          >
                            {completed.has(lesson.slug) ? <CheckCircle2 className="h-5 w-5" /> : <LucideIcon name={lesson.icon} className="h-5 w-5" />}
                          </span>
                          <span className="text-2xl font-black text-slate-100 transition group-hover:text-slate-200">
                            {String(lesson.order).padStart(2, '0')}
                          </span>
                        </div>
                        <h3 className="mt-3 text-[15px] font-black leading-snug tracking-tight text-slate-900">
                          {lesson.title}
                        </h3>
                        <p className="mt-2 flex-1 text-[13px] leading-6 text-slate-600 line-clamp-3">{lesson.summary}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="inline-flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {lesson.durationMin} min
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 ${LEVEL_TONE[lesson.level]}`}>
                              {lesson.level}
                            </span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500" />
                        </div>
                      </button>
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
