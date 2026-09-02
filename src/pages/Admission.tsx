import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Compass, GraduationCap, Globe2, Sparkles, Target, Trophy } from 'lucide-react'
import { AmbientBackdrop, CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import UniversityLogo from '@/components/admission/UniversityLogo'
import UniversityMatcher from '@/components/admission/UniversityMatcher'
import LucideIcon from '@/components/admission/LucideIcon'
import {
  getUniversities,
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
  const universities = getUniversities()
  const topFour = universities.slice(0, 4)
  const studyHours = Math.round(totalLessonMinutes / 60)

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />
      <UniversityMatcher open={matcherOpen} onClose={() => setMatcherOpen(false)} />

      <div className="relative mx-auto w-full max-w-6xl space-y-7">
        {/* ----------------------------- Hero ----------------------------- */}
        <Reveal>
          <section className="premium-hero min-h-[29rem] p-6 sm:p-9">
            <img
              src="/assets/admission/campus-hero.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center opacity-35"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.99)_0%,rgba(255,248,248,0.94)_52%,rgba(255,255,255,0.62)_100%)]" />
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
              <div>
                <div className="premium-top-controls">
                  <span className="premium-top-chip">
                    <Sparkles className="h-3.5 w-3.5" />
                    Applications · University Journey
                  </span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Plan your <span className="arena-title-accent-red">university application</span> journey
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  Use guided lessons and ProfAI’s current university catalog to structure your research and next steps.
                  University details can change, so consequential requirements should always be confirmed on the
                  institution’s official website. Catalog ranking context: {QS_EDITION}.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {lessonPhases.map((phase) => (
                    <span
                      key={phase.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                    >
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md text-white"
                        style={{ background: phase.gradient }}
                      >
                        <LucideIcon name={phase.icon} className="h-3 w-3" />
                      </span>
                      {phase.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Lessons</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={LESSON_COUNT} />
                  </p>
                  <p className="hero-metric-note">≈ {studyHours}h guided track</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Universities</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={UNIVERSITY_COUNT} />
                  </p>
                  <p className="hero-metric-note">{QS_EDITION}</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Ranked by</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">QS 2027</p>
                  <p className="hero-metric-note">Current catalog edition</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ----------------------- Find-my-university banner ----------------------- */}
        <Reveal delay={0.03}>
          <button
            onClick={() => setMatcherOpen(true)}
            className="cta-sheen group relative flex w-full items-center gap-4 overflow-hidden rounded-[1.6rem] border border-blue-300/60 bg-gradient-to-r from-[#7f1d1d] via-[#2563eb] to-[#1d4ed8] p-6 text-left shadow-[0_22px_55px_rgba(37,99,235,0.3)]"
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
              Start <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </Reveal>

        {/* ----------------------- Two destination cards ----------------------- */}
        <Stagger className="grid gap-5 lg:grid-cols-2">
          {/* Lessons */}
          <StaggerItem className="h-full">
            <Tilt3D className="h-full rounded-[1.8rem]" max={6} lift={14}>
              <button
                onClick={() => navigate('/admission/lessons')}
                className="group relative flex h-full w-full flex-col overflow-hidden rounded-[1.8rem] border border-indigo-100 bg-white p-7 text-left shadow-[0_22px_55px_rgba(79,70,229,0.12)] transition hover:border-indigo-200 hover:shadow-[0_30px_70px_rgba(79,70,229,0.2)]"
              >
                <img src="/assets/admission/student-library.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.08] transition duration-700 group-hover:scale-105 group-hover:opacity-[0.12]" />
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-2xl transition group-hover:opacity-40"
                  style={{ background: 'radial-gradient(circle,#6366f1,transparent 70%)' }}
                />
                <div className="relative flex items-center justify-between">
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
                <h2 className="relative mt-5 text-2xl font-black tracking-tight text-slate-900">Lessons</h2>
                <p className="relative mt-2 text-[14px] leading-6 text-slate-600">
                  Guided study-abroad lessons covering country research, tests, application writing, scholarships and
                  visa preparation. Follow the sequence or open the topic you need now.
                </p>

                <div className="relative mt-5 grid grid-cols-2 gap-2">
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

                <div className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
                    <Compass className="h-4 w-4" />
                    Start from Lesson 1
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition group-hover:gap-2">
                    Open lessons
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </Tilt3D>
          </StaggerItem>

          {/* Universities */}
          <StaggerItem className="h-full">
            <Tilt3D className="h-full rounded-[1.8rem]" max={6} lift={14}>
              <button
                onClick={() => navigate('/admission/universities')}
                className="group relative flex h-full w-full flex-col overflow-hidden rounded-[1.8rem] border border-blue-100 bg-white p-7 text-left shadow-[0_22px_55px_rgba(37,99,235,0.12)] transition hover:border-blue-200 hover:shadow-[0_30px_70px_rgba(37,99,235,0.2)]"
              >
                <img src="/assets/admission/international-students.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.08] transition duration-700 group-hover:scale-105 group-hover:opacity-[0.13]" />
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-2xl transition group-hover:opacity-40"
                  style={{ background: 'radial-gradient(circle,#3b82f6,transparent 70%)' }}
                />
                <div className="relative flex items-center justify-between">
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
                <h2 className="relative mt-5 text-2xl font-black tracking-tight text-slate-900">Universities</h2>
                <p className="relative mt-2 text-[14px] leading-6 text-slate-600">
                  Explore ProfAI’s complete QS 2027 catalog with ranking context, university profiles and official links
                  where available. Confirm current programme requirements directly with each institution.
                </p>

                <div className="relative mt-5 space-y-2">
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

                <div className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
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
            </Tilt3D>
          </StaggerItem>
        </Stagger>

        {/* ----------------------- How it works strip ----------------------- */}
        <Reveal delay={0.05}>
          <section className="rounded-[1.6rem] border border-blue-100 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8">
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
    </div>
  )
}
