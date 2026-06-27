import { ArrowLeft, ArrowRight, BookOpen, Clock3, Headphones, Mic2, PenSquare, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import { TOEFL_TESTS } from '@/data/toefl/toeflTests'

const sections = [
  {
    id: 'reading',
    title: 'Reading',
    description: 'Academic passages with inference, vocabulary and detail questions — auto-scored 0–30.',
    icon: BookOpen,
    chips: ['academic texts', 'auto-scored', '0–30'],
  },
  {
    id: 'listening',
    title: 'Listening',
    description: 'Lectures and conversations with note-taking. Transcript-based so it works offline.',
    icon: Headphones,
    chips: ['lectures', 'note-taking', '0–30'],
  },
  {
    id: 'speaking',
    title: 'Speaking',
    description: 'Independent + integrated tasks with on-screen prep and response timers.',
    icon: Mic2,
    chips: ['4 tasks', 'timed', 'model tips'],
  },
  {
    id: 'writing',
    title: 'Writing',
    description: 'Integrated and Academic-Discussion tasks with a live word counter and timer.',
    icon: PenSquare,
    chips: ['2 tasks', 'word count', 'rubric tips'],
  },
] as const

const LEVEL_STYLE: Record<string, string> = {
  Foundation: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Intermediate: 'border-teal-200 bg-teal-50 text-teal-700',
  Advanced: 'border-indigo-200 bg-indigo-50 text-indigo-700',
}

export default function TOEFL() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#e6f7f6] via-[#eef9f8] to-[#e3f3f5] px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-teal-200/45 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-0 h-96 w-96 rounded-full bg-cyan-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        {/* Hero */}
        <Reveal>
          <section className="relative overflow-hidden rounded-[2rem] border border-teal-200 bg-gradient-to-br from-white via-teal-50/60 to-cyan-100/50 p-6 shadow-[0_22px_50px_rgba(13,148,136,0.16)] sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/tests')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-teal-700">
                    TOEFL iBT Track
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Master the <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">TOEFL iBT</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  Four sections — Reading, Listening, Speaking and Writing — each scored 0–30 for a total of 0–120.
                  Take a full timed practice test and get an instant Reading &amp; Listening score.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:w-[31rem]">
                <div className="rounded-2xl border border-teal-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Sections</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    <CountUp value={4} />
                  </p>
                  <p className="text-[11px] text-slate-500">R · L · S · W</p>
                </div>
                <div className="rounded-2xl border border-teal-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Max score</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    <CountUp value={120} />
                  </p>
                  <p className="text-[11px] text-slate-500">0–30 each</p>
                </div>
                <div className="rounded-2xl border border-teal-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Practice tests</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    <CountUp value={TOEFL_TESTS.length} />
                  </p>
                  <p className="text-[11px] text-slate-500">full sets</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Section overview */}
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <StaggerItem key={section.id} className="h-full">
                <Tilt3D className="h-full rounded-2xl" max={6}>
                  <div className="h-full rounded-2xl border border-teal-100 bg-white p-5 shadow-[0_14px_30px_rgba(13,148,136,0.08)]">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-3 text-lg font-black tracking-tight text-slate-900">{section.title}</h2>
                    <p className="mt-1.5 text-[13px] leading-6 text-slate-500">{section.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {section.chips.map((chip) => (
                        <span key={chip} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </Tilt3D>
              </StaggerItem>
            )
          })}
        </Stagger>

        {/* Practice tests */}
        <Reveal>
          <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-[0_18px_44px_rgba(13,148,136,0.08)] sm:p-8">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              <h2 className="text-xl font-black tracking-tight text-slate-900">Full practice tests</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Each test runs all four sections in order. Reading and Listening are scored instantly; Speaking and Writing
              are timed practice with model-answer tips.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {TOEFL_TESTS.map((test) => (
                <article
                  key={test.id}
                  className="group flex flex-col rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-teal-50/40 p-5 transition hover:border-teal-200 hover:shadow-[0_16px_36px_rgba(13,148,136,0.12)]"
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-black ${LEVEL_STYLE[test.level] ?? LEVEL_STYLE.Intermediate}`}>
                      {test.level}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" /> ~{test.durationMin} min
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black tracking-tight text-slate-900">{test.title}</h3>
                  <p className="mt-1.5 flex-1 text-[13px] leading-6 text-slate-500">{test.blurb}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{test.reading.questions.length} reading Q</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{test.listening.questions.length} listening Q</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{test.speaking.length} speaking</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5">{test.writing.length} writing</span>
                  </div>
                  <button
                    onClick={() => navigate(`/toefl/test/${test.id}`)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(13,148,136,0.3)] transition hover:-translate-y-0.5"
                  >
                    Start test
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  )
}
