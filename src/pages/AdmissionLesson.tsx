import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Lightbulb, Target } from 'lucide-react'
import { AmbientBackdrop, Burst, Reveal } from '@/components/fx'
import { isLessonCompleted, toggleLessonCompleted } from '@/utils/admissionProgressStore'
import LucideIcon from '@/components/admission/LucideIcon'
import { getAdjacentLessons, getLessonBySlug, getPhaseById } from '@/data/admission'
import type { LessonBlock } from '@/data/admission'

function Block({ block, accent }: { block: LessonBlock; accent: string }) {
  switch (block.type) {
    case 'lead':
      return <p className="text-[17px] font-medium leading-8 text-slate-700">{block.text}</p>
    case 'heading':
      return <h2 className="mt-8 text-xl font-black tracking-tight text-slate-900">{block.text}</h2>
    case 'paragraph':
      return <p className="mt-4 text-[15px] leading-7 text-slate-600">{block.text}</p>
    case 'list':
      return (
        <ul className="mt-4 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] leading-7 text-slate-600">
              <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0" style={{ color: accent }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <p className="text-[14px] leading-7 text-amber-900">{block.text}</p>
        </div>
      )
    case 'callout':
      return (
        <div
          className="mt-5 rounded-2xl border p-5"
          style={{ borderColor: `${accent}40`, background: `${accent}0d` }}
        >
          <p className="text-[14px] font-black uppercase tracking-[0.1em]" style={{ color: accent }}>
            {block.title}
          </p>
          <p className="mt-1.5 text-[15px] leading-7 text-slate-700">{block.text}</p>
        </div>
      )
    default:
      return null
  }
}

export default function AdmissionLesson() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const lesson = slug ? getLessonBySlug(slug) : undefined
  const phase = lesson ? getPhaseById(lesson.phaseId) : undefined
  const { prev, next } = slug ? getAdjacentLessons(slug) : {}

  const [completed, setCompleted] = useState(() => (slug ? isLessonCompleted(slug) : false))
  const [justCompleted, setJustCompleted] = useState(false)

  // Reset scroll when moving between lessons.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    setCompleted(slug ? isLessonCompleted(slug) : false)
    setJustCompleted(false)
  }, [slug])

  const handleToggleComplete = () => {
    if (!slug) return
    const nowCompleted = toggleLessonCompleted(slug)
    setCompleted(nowCompleted)
    setJustCompleted(nowCompleted)
  }

  if (!lesson || !phase) {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
        <AmbientBackdrop variant="red" />
        <div className="relative mx-auto max-w-3xl rounded-2xl border border-blue-100 bg-white p-10 text-center">
          <h1 className="text-2xl font-black text-slate-900">Lesson not found</h1>
          <p className="mt-2 text-slate-500">This lesson doesn’t exist or hasn’t been added yet.</p>
          <button type="button" onClick={() => navigate('/admission/lessons')} className="premium-back-btn mt-6">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to lessons
          </button>
        </div>
      </div>
    )
  }

  const accent = phase.accent

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />

      <div className="relative mx-auto w-full max-w-3xl space-y-6">
        {/* Hero */}
        <Reveal>
          <section
            className="relative overflow-hidden rounded-[1.8rem] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] sm:p-8"
            style={{ background: phase.gradient }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle,#ffffff,transparent 70%)' }}
            />
            <div className="relative">
              <button
                onClick={() => navigate('/admission/lessons')}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All lessons
              </button>

              <div className="mt-5 flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <LucideIcon name={lesson.icon} className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                    Lesson {String(lesson.order).padStart(2, '0')} · {phase.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-white/80">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {lesson.durationMin} min read
                    </span>
                    <span className="rounded-full bg-white/15 px-2 py-0.5">{lesson.level}</span>
                  </div>
                </div>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight">{lesson.title}</h1>
              <p className="mt-2 text-[15px] leading-7 text-white/85">{lesson.summary}</p>
            </div>
          </section>
        </Reveal>

        {/* Body */}
        <Reveal delay={0.04}>
          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
            {lesson.blocks.map((block, i) => (
              <Block key={i} block={block} accent={accent} />
            ))}

            {/* Key takeaways */}
            <div className="mt-9 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                <CheckCircle2 className="h-5 w-5" style={{ color: accent }} />
                Key takeaways
              </h3>
              <ul className="mt-3 space-y-2">
                {lesson.keyTakeaways.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px] leading-6 text-slate-700">
                    <span
                      className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: accent }}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action step */}
            <div
              className="mt-4 flex items-start gap-3 rounded-2xl border p-5"
              style={{ borderColor: `${accent}40`, background: `${accent}0d` }}
            >
              <Target className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: accent }} />
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.1em]" style={{ color: accent }}>
                  Your action step
                </p>
                <p className="mt-1 text-[15px] leading-7 text-slate-700">{lesson.actionStep}</p>
              </div>
            </div>
          </article>
        </Reveal>

        {/* Mark complete (concept: 23-StudyAbroad-Lessons path nodes) */}
        <Reveal delay={0.02}>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
            <Burst count={20} play={justCompleted} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    completed ? 'bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.35)]' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-900">{completed ? 'Lesson completed' : 'Finished this lesson?'}</p>
                  <p className="text-[12px] text-slate-500">
                    {completed ? 'It now counts toward your roadmap progress.' : 'Mark it to track your roadmap progress.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleComplete}
                className={`interactive-lift rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  completed
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'cta-sheen bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_10px_22px_rgba(37,99,235,0.28)]'
                }`}
              >
                {completed ? 'Completed ✓' : 'Mark as complete'}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Prev / Next */}
        <Reveal delay={0.04}>
          <div className="grid gap-3 sm:grid-cols-2">
            {prev ? (
              <button
                onClick={() => navigate(`/admission/lessons/${prev.slug}`)}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-md"
              >
                <ArrowLeft className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:-translate-x-1" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Previous</span>
                  <span className="block truncate text-[14px] font-bold text-slate-800">{prev.title}</span>
                </span>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}
            {next ? (
              <button
                onClick={() => navigate(`/admission/lessons/${next.slug}`)}
                className="group flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:border-slate-300 hover:shadow-md"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Next</span>
                  <span className="block truncate text-[14px] font-bold text-slate-800">{next.title}</span>
                </span>
                <ArrowRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/admission/universities')}
                className="group flex items-center justify-end gap-3 rounded-2xl border p-4 text-right text-white transition hover:shadow-lg"
                style={{ background: phase.gradient }}
              >
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">Finished!</span>
                  <span className="block text-[14px] font-bold">Explore universities →</span>
                </span>
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
