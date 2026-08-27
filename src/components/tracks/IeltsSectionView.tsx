import {
  ArrowLeft,
  AudioLines,
  BookOpen,
  CheckCircle2,
  Headphones,
  Mic2,
  PenSquare,
  Sparkles,
  TimerReset,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'

export type IeltsSectionKey = 'reading' | 'listening' | 'writing' | 'speaking'

type IeltsSectionViewProps = {
  section: IeltsSectionKey
  backPath?: string
  backLabel?: string
  backState?: { from?: string } | null
  showBack?: boolean
}

type ModuleCard = {
  title: string
  detail: string
  icon: 'book' | 'audio' | 'pen' | 'mic'
}

type SectionConfig = {
  title: string
  subtitle: string
  chip: string
  heroMetricLabel: string
  heroMetricValue: string
  modeLabel: string
  modeValue: string
  feedbackLabel: string
  feedbackValue: string
  primaryAction: string
  secondaryAction: string
  modules: ModuleCard[]
  insightTitle: string
  insightDescription: string
}

const SECTION_CONFIG: Record<IeltsSectionKey, SectionConfig> = {
  reading: {
    title: 'IELTS Reading Studio',
    subtitle: 'Passage strategy, scan-and-locate drills, and inference control with timing discipline.',
    chip: 'IELTS Reading Section',
    heroMetricLabel: 'Passages',
    heroMetricValue: '3',
    modeLabel: 'Training',
    modeValue: 'Timed',
    feedbackLabel: 'Analysis',
    feedbackValue: 'AI',
    primaryAction: 'Open Reading Session',
    secondaryAction: 'Passage Timer',
    modules: [
      { title: 'Passage Navigation', detail: 'Map headings, paragraph logic, and question matching flow.', icon: 'book' },
      { title: 'Inference Lab', detail: 'Practice implied meaning and evidence selection under pressure.', icon: 'book' },
      { title: 'True/False/NG', detail: 'Eliminate traps using precise statement verification technique.', icon: 'book' },
    ],
    insightTitle: 'Reading Precision',
    insightDescription: 'Track speed, accuracy, and trap-question behavior for each passage block.',
  },
  listening: {
    title: 'IELTS Listening Studio',
    subtitle: 'Audio section training with note-completion rhythm and distractor control.',
    chip: 'IELTS Listening Section',
    heroMetricLabel: 'Sections',
    heroMetricValue: '4',
    modeLabel: 'Audio',
    modeValue: 'Live',
    feedbackLabel: 'Review',
    feedbackValue: 'AI',
    primaryAction: 'Start Listening Drill',
    secondaryAction: 'Headset Check',
    modules: [
      { title: 'Section 1 Accuracy', detail: 'Personal detail capture and spelling control drills.', icon: 'audio' },
      { title: 'Section 2 Focus', detail: 'Map, form, and instruction-based response speed training.', icon: 'audio' },
      { title: 'Section 3/4 Control', detail: 'Lecture and discussion tracking with keyword prediction.', icon: 'audio' },
    ],
    insightTitle: 'Audio Timing Intelligence',
    insightDescription: 'Listen-once simulation with pause analytics and missed-keyword alerts.',
  },
  writing: {
    title: 'IELTS Writing Studio',
    subtitle: 'Professional writing workspace for timed drafts, structure control, and intelligent feedback loops.',
    chip: 'IELTS Writing Section',
    heroMetricLabel: 'Tasks',
    heroMetricValue: '2',
    modeLabel: 'Draft Mode',
    modeValue: 'Timed',
    feedbackLabel: 'Scoring',
    feedbackValue: 'AI',
    primaryAction: 'New Writing Session',
    secondaryAction: 'Open Timer Mode',
    modules: [
      { title: 'Task 1 Visual Reports', detail: 'Line, bar, pie, process, and map response training with structure hints.', icon: 'pen' },
      { title: 'Task 2 Essay Studio', detail: 'Opinion, discussion, and problem-solution prompts with exam pacing.', icon: 'pen' },
      { title: 'AI Feedback', detail: 'Coherence, vocabulary, grammar, and task response insights per draft.', icon: 'pen' },
    ],
    insightTitle: 'Draft Intelligence',
    insightDescription: 'Paragraph rhythm, transition quality, and lexical variation checks are prepared in the draft pipeline.',
  },
  speaking: {
    title: 'IELTS Speaking Studio',
    subtitle: 'Realistic speaking environment with recording workflow, replay control, and pronunciation analysis.',
    chip: 'IELTS Speaking Section',
    heroMetricLabel: 'Parts',
    heroMetricValue: '3',
    modeLabel: 'Session',
    modeValue: 'Live',
    feedbackLabel: 'Feedback',
    feedbackValue: 'AI',
    primaryAction: 'Start Recording',
    secondaryAction: 'Mic Check',
    modules: [
      { title: 'Part 1 Fluency', detail: 'Quick interview drills focused on fluency and natural expression.', icon: 'mic' },
      { title: 'Part 2 Cue Card', detail: 'Cue card mode with prep timer and structured 2-minute speaking flow.', icon: 'mic' },
      { title: 'Part 3 Discussion', detail: 'Advanced discussion mode with critical reasoning prompts.', icon: 'mic' },
    ],
    insightTitle: 'Speech Analysis',
    insightDescription: 'Band estimate, pronunciation consistency, and fluency scoring block is integrated in the flow.',
  },
}

function resolveModuleIcon(icon: ModuleCard['icon']) {
  if (icon === 'audio') return AudioLines
  if (icon === 'pen') return PenSquare
  if (icon === 'mic') return Mic2
  return BookOpen
}

function renderHeroMetric(value: string) {
  // Animate when the metric is purely numeric; otherwise show the literal text.
  if (/^\d+$/.test(value)) {
    return <CountUp value={Number(value)} />
  }
  return value
}

export function IeltsSectionView({
  section,
  backPath = '/ielts',
  backLabel = 'Back',
  backState = null,
  showBack = true,
}: IeltsSectionViewProps) {
  const navigate = useNavigate()
  const content = SECTION_CONFIG[section]
  const ieltsTitleSuffix = content.title.startsWith('IELTS ') ? content.title.slice(6) : content.title

  const handlePrimaryAction = () => {
    if (section === 'reading') {
      navigate('/ielts/reading/tests')
      return
    }
    if (section === 'listening') {
      navigate('/ielts/listening/tests')
      return
    }
    if (section === 'writing') {
      navigate('/ielts/writing/tests')
      return
    }
    navigate('/ielts/speaking/tests')
  }

  const handleSecondaryAction = () => {
    if (section === 'reading') {
      navigate('/ielts/reading/tests')
      return
    }
    if (section === 'listening') {
      navigate('/ielts/listening/tests')
      return
    }
    if (section === 'writing') {
      navigate('/ielts/writing/tests')
      return
    }
    navigate('/ielts/speaking/tests')
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-hero p-6 sm:p-9">
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="premium-top-controls">
                {showBack ? (
                  <button
                    onClick={() => navigate(backPath, backState ? { state: backState } : undefined)}
                    className="premium-back-btn"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {backLabel}
                  </button>
                ) : null}
                <span className="premium-top-chip">{content.chip}</span>
              </div>
              <h1 className="premium-section-title mt-4">
                IELTS <span className="arena-title-accent-red">{ieltsTitleSuffix}</span>
              </h1>
              <p className="premium-section-subtitle">{content.subtitle}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:w-[28rem]">
              <div className="premium-stat">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">{content.heroMetricLabel}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{renderHeroMetric(content.heroMetricValue)}</p>
              </div>
              <div className="premium-stat">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">{content.modeLabel}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{content.modeValue}</p>
              </div>
              <div className="premium-stat">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">{content.feedbackLabel}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{content.feedbackValue}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 flex flex-wrap gap-2">
            <button className="arena-primary-btn cta-sheen" onClick={handlePrimaryAction}>
              {content.primaryAction}
              <Sparkles className="ml-2 h-4 w-4" />
            </button>
            <button className="arena-secondary-btn" onClick={handleSecondaryAction}>
              <TimerReset className="mr-2 h-4 w-4 text-blue-600" />
              {content.secondaryAction}
            </button>
          </div>
        </section>
      </Reveal>

      <Stagger className="mt-6 grid gap-4 md:grid-cols-3">
        {content.modules.map((item) => {
          const Icon = resolveModuleIcon(item.icon)
          return (
            <StaggerItem key={item.title} className="h-full">
              <Tilt3D className="h-full rounded-3xl" max={6}>
                <article className="surface-card h-full p-5">
                  <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-700">{item.detail}</p>
                </article>
              </Tilt3D>
            </StaggerItem>
          )
        })}
      </Stagger>

      <Stagger className="mt-6 grid gap-4 md:grid-cols-2">
        <StaggerItem>
          <div className="surface-card p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Practice Workflow
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              Timed mode, error-log sync, and coaching cues are active for this section.
            </p>
            <div className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Practice pipeline ready
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="surface-card p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              {section === 'listening' ? <Headphones className="h-4 w-4 text-blue-700" /> : <Sparkles className="h-4 w-4 text-blue-700" />}
              {content.insightTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-700">{content.insightDescription}</p>
            <div className="mt-3 inline-flex items-center text-xs font-semibold text-blue-700">
              <Sparkles className="mr-1 h-4 w-4" />
              Insight channel active
            </div>
          </div>
        </StaggerItem>
      </Stagger>
    </div>
  )
}
