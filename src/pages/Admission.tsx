import UiText from '@/components/common/UiText'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Compass, GraduationCap, Globe2, Sparkles, Target, Trophy } from 'lucide-react'
import { CountUp, Reveal, Stagger, StaggerItem } from '@/components/fx'
import { ArenaBackdrop } from '@/components/visuals/ArenaVisuals'
import { getCompletedLessons, subscribeLessonProgress } from '@/utils/admissionProgressStore'
import './admission-home.css'
import UniversityLogo from '@/components/admission/UniversityLogo'
import UniversityMatcher from '@/components/admission/UniversityMatcher'
import LucideIcon from '@/components/admission/LucideIcon'
import {
  getUniversities,
  getLessons,
  getLessonsByPhase,
  lessonPhases,
  LESSON_COUNT,
  QS_2027_RANKED_UNIVERSITY_COUNT,
  UNIVERSITY_COUNT,
  totalLessonMinutes,
  QS_EDITION,
} from '@/data/admission'

export default function Admission() {
  const navigate = useNavigate()
  const [matcherOpen, setMatcherOpen] = useState(false)
  const [completed, setCompleted] = useState(() => getCompletedLessons())
  const universities = getUniversities()
  const topFour = universities.slice(0, 4)
  const studyHours = Math.round(totalLessonMinutes / 60)
  const orderedLessons = getLessons()
  const completedLessonCount = orderedLessons.filter((lesson) => completed.has(lesson.slug)).length
  const nextLesson = orderedLessons.find((lesson) => !completed.has(lesson.slug))
  const resumeLesson = completedLessonCount > 0 && nextLesson
  const lessonCardPath = resumeLesson ? `/admission/lessons/${nextLesson.slug}` : '/admission/lessons'

  useEffect(() => subscribeLessonProgress(() => setCompleted(getCompletedLessons())), [])

  return (
    <main className="workspace-page admission-home relative min-h-screen overflow-x-clip px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <ArenaBackdrop />
      <UniversityMatcher open={matcherOpen} onClose={() => setMatcherOpen(false)} />

      <div className="relative z-10 mx-auto w-full max-w-[78rem] space-y-6">
        <header className="admission-home-heading">
          <span className="admission-home-kicker"><Sparkles className="h-3.5 w-3.5" /> University journey</span>
          <h1>University <span>Applications</span></h1>
          <p>Plan your next steps, explore universities and move forward with confidence.</p>
        </header>
        {/* ----------------------------- Hero ----------------------------- */}
        <Reveal>
          <section className="premium-hero admission-home-hero min-h-[29rem] p-6 sm:p-9">
            <img
              src="/assets/admission/campus-hero.webp"
              alt=""
              className="admission-home-hero-photo absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="admission-home-hero-wash absolute inset-0" />
            <div className="admission-home-hero-grid relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
              <div>
                <div className="premium-top-controls">
                  <span className="premium-top-chip">
                    <Compass className="h-3.5 w-3.5" />
                    {completedLessonCount ? `${completedLessonCount} of ${LESSON_COUNT} lessons completed` : 'Your application roadmap'}
                  </span>
                </div>
                <h2 className="premium-section-title mt-4">
                   <UiText text={"Plan your"} /> <span className="arena-title-accent-red"> <UiText text={"university application"} /> </span>  <UiText text={"journey"} /> </h2>
                <p className="premium-section-subtitle max-w-3xl">
                  Use guided lessons and ProfAI’s current university catalog to structure your research and next steps.
                  University details can change, so consequential requirements should always be confirmed on the
                  institution’s official website. Catalog ranking context: {QS_EDITION}.
                </p>

                <div className="admission-home-phase-list mt-5 flex flex-wrap gap-2" aria-label="Open a lesson phase">
                  {lessonPhases.map((phase) => (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => {
                        const firstLesson = getLessonsByPhase(phase.id)[0]
                        if (firstLesson) navigate(`/admission/lessons/${firstLesson.slug}`)
                      }}
                      className="admission-home-phase-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                      aria-label={`Start ${phase.title} phase`}
                    >
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md text-white"
                        style={{ background: phase.gradient }}
                      >
                        <LucideIcon name={phase.icon} className="h-3 w-3" />
                      </span>
                      {phase.title}
                    </button>
                  ))}
                </div>
                <div className="admission-home-actions">
                  <button type="button" onClick={() => navigate('/admission/lessons')} className="admission-home-primary">Explore lessons <ArrowRight className="h-4 w-4" /></button>
                  <button type="button" onClick={() => navigate('/admission/universities')} className="admission-home-secondary">Browse universities <Globe2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="admission-home-metrics grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <div className="hero-metric-card admission-home-metric">
                  <p className="hero-metric-label"> <UiText text={"Lessons"} /> </p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={LESSON_COUNT} />
                  </p>
                  <p className="hero-metric-note">≈ {studyHours}h guided track</p>
                </div>
                <div className="hero-metric-card admission-home-metric">
                  <p className="hero-metric-label"> <UiText text={"Universities"} /> </p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={UNIVERSITY_COUNT} />
                  </p>
                  <p className="hero-metric-note">{QS_EDITION}</p>
                </div>
                <div className="hero-metric-card admission-home-metric">
                  <p className="hero-metric-label"> <UiText text={"Ranked by"} /> </p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">QS 2027</p>
                  <p className="hero-metric-note"> <UiText text={"Current catalog edition"} /> </p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ----------------------- Find-my-university banner ----------------------- */}
        <Reveal delay={0.03}>
          <button
            onClick={() => setMatcherOpen(true)}
            className="admission-home-match group relative flex w-full items-center gap-4 overflow-hidden rounded-[1.6rem] p-6 text-left"
            type="button"
          >
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <Target className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black text-white">Explore university matches</p>
              <p className="mt-0.5 text-sm font-medium text-blue-50/90">
                Compare the current catalog using your SAT, IELTS, GPA and study preferences as planning signals.
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-blue-700 transition group-hover:gap-2 sm:inline-flex">
               <UiText text={"Start"} /> <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </Reveal>

        {/* ----------------------- Two destination cards ----------------------- */}
        <Stagger className="admission-home-card-grid grid gap-5 lg:grid-cols-2">
          {/* Lessons */}
          <StaggerItem className="h-full">
              <button
                onClick={() => navigate(lessonCardPath)}
                className="admission-home-destination admission-home-lessons group relative flex h-full w-full flex-col overflow-hidden rounded-[1.8rem] text-left transition"
                type="button"
              >
                <img src="/assets/admission/student-library.webp" alt="" className="admission-home-card-photo absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-2xl transition group-hover:opacity-40"
                  style={{ background: 'radial-gradient(circle,#6366f1,transparent 70%)' }}
                />
                <div className="admission-home-card-top relative flex items-center justify-between">
                  <span
                    className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#312e81,#4f46e5)' }}
                  >
                    <GraduationCap className="h-8 w-8" />
                  </span>
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-700">
                    {LESSON_COUNT} lessons · 5 phases
                  </span>
                </div>
                <h2 className="admission-home-card-title relative mt-5 text-2xl font-black tracking-tight text-slate-900"> <UiText text={"Lessons"} /> </h2>
                <p className="admission-home-card-description relative mt-2 text-[14px] leading-6 text-slate-600">
                  Guided study-abroad lessons covering country research, tests, application writing, scholarships and
                  visa preparation. Follow the sequence or open the topic you need now.
                </p>

                <div className="admission-home-card-phases relative mt-5 grid grid-cols-2 gap-2">
                  {lessonPhases.slice(0, 4).map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                    >
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                        style={{ background: phase.gradient }}
                      >
                        <LucideIcon name={phase.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-[12px] font-semibold text-slate-700">{phase.title}</span>
                    </div>
                  ))}
                </div>

                <div className="admission-home-card-footer relative mt-auto flex items-center justify-between border-t border-slate-200/70 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
                    <Compass className="h-4 w-4" />
                    {completedLessonCount ? `${completedLessonCount}/${LESSON_COUNT} lessons completed` : 'Start from Lesson 1'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition group-hover:gap-2">
                    {resumeLesson ? 'Continue lesson' : 'Open lessons'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
          </StaggerItem>

          {/* Universities */}
          <StaggerItem className="h-full">
              <button
                onClick={() => navigate('/admission/universities')}
                className="admission-home-destination admission-home-universities group relative flex h-full w-full flex-col overflow-hidden rounded-[1.8rem] text-left transition"
                type="button"
              >
                <img src="/assets/admission/international-students.webp" alt="" className="admission-home-card-photo absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-2xl transition group-hover:opacity-40"
                  style={{ background: 'radial-gradient(circle,#3b82f6,transparent 70%)' }}
                />
                <div className="admission-home-card-top relative flex items-center justify-between">
                  <span
                    className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#7f1d1d,#2563eb)' }}
                  >
                    <Trophy className="h-8 w-8" />
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
                    {QS_2027_RANKED_UNIVERSITY_COUNT.toLocaleString('en-US')} ranked · QS 2027
                  </span>
                </div>
                <h2 className="admission-home-card-title relative mt-5 text-2xl font-black tracking-tight text-slate-900"> <UiText text={"Universities"} /> </h2>
                <p className="admission-home-card-description relative mt-2 text-[14px] leading-6 text-slate-600">
                  Explore ProfAI’s complete QS 2027 catalog with ranking context, university profiles and official links
                  where available. Confirm current programme requirements directly with each institution.
                </p>

                <div className="admission-home-rankings relative mt-5 space-y-2">
                  {topFour.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                    >
                      <span className="w-6 text-center text-sm font-black text-slate-400">{u.rank}</span>
                      <UniversityLogo id={u.id} name={u.name} brand={u.brand} website={u.website} size={34} rounded="0.55rem" />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-800">
                        {u.shortName}
                      </span>
                      <span className="text-[12px] font-black text-slate-900">{u.overallScore}</span>
                    </div>
                  ))}
                </div>

                <div className="admission-home-card-footer relative mt-auto flex items-center justify-between border-t border-slate-200/70 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
                    <Globe2 className="h-4 w-4" />
                    {UNIVERSITY_COUNT} catalog profiles
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition group-hover:gap-2">
                    Open rankings
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
          </StaggerItem>
        </Stagger>

        {/* ----------------------- How it works strip ----------------------- */}
        <Reveal delay={0.05}>
          <section className="admission-home-steps rounded-[1.6rem] p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-black tracking-tight text-slate-900">How the journey works</h3>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Learn the path',
                  text: 'Work through the 30-lesson track to master every step, from choosing a country to your visa interview.',
                },
                {
                  step: '02',
                  title: 'Choose your universities',
                  text: 'Compare QS-ranked universities by score and indicators, then build a balanced shortlist that fits you.',
                },
                {
                  step: '03',
                  title: 'Apply with confidence',
                  text: 'Use the test-prep, writing and speaking tools across the app to turn your shortlist into offers.',
                },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <span className="text-2xl font-black text-blue-200">{item.step}</span>
                  <h4 className="mt-1 text-base font-bold text-slate-900">{item.title}</h4>
                  <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </main>
  )
}
