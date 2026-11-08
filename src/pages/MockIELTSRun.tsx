import FullMockResults from '@/components/ielts/FullMockResults'
import FullMockDialog from '@/components/ielts/FullMockDialog'
import UiText from '@/components/common/UiText'
import AttemptEntryBoundary from '@/components/tests/AttemptEntryBoundary'
import { getInProcessAttempts } from '@/utils/inProcessAttempts'
import IeltsTestExitGuard from '@/components/ielts/IeltsTestExitGuard'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { useFullscreen } from '@/hooks/useFullscreen'
import ImprovedResponse from '@/components/ielts/ImprovedResponse'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Headphones,
  Layers3,
  Lock,
  Maximize2,
  Mic2,
  PenSquare,
  PlayCircle,
  ShieldCheck,
  Shuffle,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useBillingText } from '@/features/billing/copy'
import './mock-ielts-run.css'
import { regradeFullMockSpeaking } from '@/services/fullMockSpeakingReview'
import { useAuthStore } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'
import { useSpeakingStore } from '@/store/speakingStore'
import { markSpeakingTestCompleted } from '@/utils/ieltsSpeakingCatalog'
import {
  formatMockDuration,
  fullMockLaunchState,
  FULL_MOCK_PROGRESS_EVENT,
  getFullMockById,
  getFullMockChosenMode,
  getFullMockCompletedSections,
  getFullMockOverallBand,
  getFullMockResults,
  saveFullMockSectionResult,
  setFullMockMode,
  MOCK_SECTION_COUNT,
  type FullMockEntry,
  type FullMockMode,
  type MockSection,
  type MockSectionKey,
} from '@/utils/ieltsMockCatalog'

const SECTION_ICONS: Record<MockSectionKey, LucideIcon> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenSquare,
  speaking: Mic2,
}

const SECTION_TRACKS = {
  listening: 'IELTS_LISTENING', reading: 'IELTS_READING',
  writing: 'IELTS_WRITING', speaking: 'IELTS_SPEAKING',
} as const

type SectionStatus = 'completed' | 'current' | 'locked' | 'coming-soon'

// Exam mode enforces the official order: a section unlocks only after every
// earlier section that has content is finished. Practice mode opens every
// unfinished section. Coming-soon sections neither unlock nor block the chain.
function resolveStatus(
  sections: MockSection[],
  index: number,
  completed: Set<MockSectionKey>,
  mode: FullMockMode,
): SectionStatus {
  const section = sections[index]
  if (!section.available) return 'coming-soon'
  if (completed.has(section.key)) return 'completed'
  if (mode === 'practice') return 'current'

  const earlierAvailableDone = sections
    .slice(0, index)
    .filter((earlier) => earlier.available)
    .every((earlier) => completed.has(earlier.key))

  return earlierAvailableDone ? 'current' : 'locked'
}

export default function MockIELTSRun() {
  const { mockId } = useParams<{ mockId: string }>()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  return <AttemptEntryBoundary exam="IELTS"><IeltsTestExitGuard mockId={mockId} active={() => !!mockId && getInProcessAttempts('IELTS', owner).some(attempt => attempt.mockId === mockId)}>
    <MockIELTSRunContent />
  </IeltsTestExitGuard></AttemptEntryBoundary>
}

function MockIELTSRunContent() {
  const { enter, supported, isFullscreen } = useFullscreen()
  const text = useBillingText()
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
  const navigate = useNavigate()
  const location = useLocation()
  const { mockId } = useParams<{ mockId: string }>()
  const routeState = location.state as { from?: string; completedSection?: MockSectionKey } | null
  const from = routeState?.from
  const revision = useAccountDataRevision()
  const dialogId = useId()

  const mock = useMemo<FullMockEntry | null>(() => (mockId ? getFullMockById(mockId) : null), [mockId])

  const [completedKeys, setCompletedKeys] = useState<MockSectionKey[]>(() =>
    mockId ? getFullMockCompletedSections(mockId) : [],
  )
  const [chosenMode, setChosenMode] = useState<FullMockMode | null>(() => (mockId ? getFullMockChosenMode(mockId) : null))
  const [picker, setPicker] = useState(false)
  const [pickedMode, setPickedMode] = useState<FullMockMode>('exam')
  const [handoff, setHandoff] = useState<MockSectionKey | null>(routeState?.completedSection ?? null)
  const [openFeedback, setOpenFeedback] = useState<MockSectionKey | null>(null)

  // Completion is written by the section runners themselves (on submit / when
  // the examiner grade saves). Re-read whenever that happens, or when the user
  // returns to this tab after finishing a section elsewhere.
  const refreshProgress = useCallback(() => {
    setCompletedKeys(mockId ? getFullMockCompletedSections(mockId) : [])
    setChosenMode(mockId ? getFullMockChosenMode(mockId) : null)
  }, [mockId])

  useEffect(() => {
    refreshProgress()
    window.addEventListener(FULL_MOCK_PROGRESS_EVENT, refreshProgress)
    window.addEventListener('storage', refreshProgress)
    window.addEventListener('focus', refreshProgress)
    document.addEventListener('visibilitychange', refreshProgress)
    return () => {
      window.removeEventListener(FULL_MOCK_PROGRESS_EVENT, refreshProgress)
      window.removeEventListener('storage', refreshProgress)
      window.removeEventListener('focus', refreshProgress)
      document.removeEventListener('visibilitychange', refreshProgress)
    }
  }, [refreshProgress, revision, userId])

  useEffect(() => { setHandoff(routeState?.completedSection ?? null) }, [routeState?.completedSection])

  const completedSet = useMemo(() => new Set(completedKeys), [completedKeys])
  const sectionResults = useMemo(() => {
    void completedKeys
    return mockId ? getFullMockResults(mockId) : {}
  }, [completedKeys, mockId])
  const overallBand = mockId ? getFullMockOverallBand(mockId) : null
  // Attempts started before modes existed followed exam rules.
  const mode: FullMockMode | null = chosenMode ?? (completedKeys.length ? 'exam' : null)

  useEffect(() => {
    if (!mock?.fullyReady || completedKeys.length !== MOCK_SECTION_COUNT || overallBand === null) return
    const results = getFullMockResults(mock.id)
    for (const section of mock.sections) {
      const saved = results[section.key]
      if (!saved) continue
      awardBadge({
        userId, track: SECTION_TRACKS[section.key],
        band: saved.band, mode: 'full_mock', source: 'ielts-full-mock', silent: true,
      })
    }
    awardBadge({
      userId,
      track: 'IELTS_OVERALL',
      band: overallBand,
      mode: 'full_mock',
      source: 'ielts-full-mock',
    })
  }, [awardBadge, completedKeys.length, mock, overallBand, userId])

  const launchSection = useCallback(
    (section: MockSection) => {
      if (!section.launchPath || !mock) return
      void enter()
      navigate(section.launchPath, {
        state: fullMockLaunchState(mock.id, section.key, from),
      })
    },
    [enter, from, mock, navigate],
  )

  if (!mock) {
    return <Navigate to="/mock/ielts" replace />
  }

  const liveDone = mock.sections.filter(
    (section) => section.available && completedSet.has(section.key),
  ).length
  const allSectionsDone = mock.fullyReady && liveDone === MOCK_SECTION_COUNT
  const reviewSection = (section: MockSection) => {
    const saved = sectionResults[section.key]
    if (!saved?.result || !section.launchPath) return
    navigate(section.launchPath, {
      state: {
        entry: 'mock-ielts',
        from: from ?? 'mock',
        mock: { id: mock.id, section: section.key },
        reviewPayload: { result: saved.result, showCorrectAnswers: true },
      },
    })
  }

  if (allSectionsDone) return <FullMockResults key={`${userId}:${mock.id}`} mock={mock} results={sectionResults} overall={overallBand}
    onBack={() => navigate('/ielts/tests#mocks', { state: { from: from ?? 'mock' } })} onReview={reviewSection}
    onRegrade={async () => {
      const saved = sectionResults.speaking
      if (!saved?.speaking) throw new Error('No saved Speaking answers were found.')
      const evaluation = await regradeFullMockSpeaking(userId ?? 'guest', saved)
      if ((useAuthStore.getState().user?.id ?? null) !== userId || getFullMockResults(mock.id).speaking?.completedAt !== saved.completedAt) return
      const current = getFullMockResults(mock.id).speaking!
      if (current.assessmentStatus === 'graded') return
      const existing = current.speaking?.evaluation.improvedAnswers ?? []
      evaluation.improvedAnswers = [...existing.filter(item => !evaluation.improvedAnswers?.some(answer => answer.answerIndex === item.answerIndex)), ...(evaluation.improvedAnswers ?? [])].sort((a, b) => a.answerIndex - b.answerIndex)
      let answerIndex = 0
      saveFullMockSectionResult(mock.id, 'speaking', { ...saved, band: evaluation.overallBand, assessmentStatus: 'graded', summary: evaluation.summary,
        speaking: { ...saved.speaking, evaluation },
        review: saved.speaking.transcript.map(turn => {
          const index = turn.role === 'candidate' ? answerIndex++ : -1
          return { label: turn.role === 'candidate' ? 'Your answer' : 'Examiner', response: turn.text,
            improvedVersion: index >= 0 ? evaluation.improvedAnswers?.find(item => item.answerIndex === index && item.original === turn.text)?.improved : undefined }
        }),
      })
      try {
        markSpeakingTestCompleted(saved.testId, userId ?? undefined)
        useSpeakingStore.getState().addSession({ userId, modeLabel: `Speaking Full Mock ${mock.index}`, kind: 'examiner', date: saved.completedAt,
          overallBand: evaluation.overallBand, fluencyBand: evaluation.fluencyBand, lexicalBand: evaluation.lexicalBand, grammarBand: evaluation.grammarBand, pronunciationBand: evaluation.pronunciationBand,
          durationSec: evaluation.stats.durationSec, wordCount: evaluation.stats.wordCount, fillerCount: evaluation.stats.fillerCount, summary: evaluation.summary, evaluation, transcript: saved.speaking.transcript,
        })
      } catch { /* The saved exam report remains available if optional history storage is full. */ }
    }} />

  const effectiveMode: FullMockMode = mode ?? 'exam'
  const statuses = mock.sections.map((_, index) => resolveStatus(mock.sections, index, completedSet, effectiveMode))
  const nextSection = mock.sections.find((_, index) => statuses[index] === 'current') ?? null
  const practice = mode === 'practice'
  const canChangeMode = mode !== null && liveDone === 0
  const backToCatalog = () => navigate('/ielts/tests#mocks', { state: { from: from ?? 'mock' } })
  const closeHandoff = () => {
    setHandoff(null)
    navigate(location.pathname + location.search, { replace: true, state: { from } })
  }
  const minutes = text('min', 'daq', 'мин')
  const modeLabel = (value: FullMockMode) => value === 'exam'
    ? text('Exam mode', 'Imtihon rejimi', 'Режим экзамена')
    : text('Practice mode', 'Mashq rejimi', 'Режим практики')
  const scoreLabel = (key: MockSectionKey) => {
    const saved = sectionResults[key]
    if (!saved) return null
    if (saved.assessmentStatus === 'pending') return { band: '—', note: text('Assessment pending', 'Baholanmoqda', 'Ожидает оценки') }
    return {
      band: saved.band.toFixed(1),
      note: saved.result
        ? `${saved.result.correctAnswers}/${saved.result.totalQuestions} ${text('correct', 'to‘g‘ri', 'верно')}`
        : key === 'writing' ? 'Task 1 + Task 2' : text('Parts 1–3', '1–3 qismlar', 'Части 1–3'),
    }
  }

  const primaryAction = mode === null
    ? { label: text('Start mock', 'Mockni boshlash', 'Начать тест'), run: () => { setPickedMode('exam'); setPicker(true) } }
    : nextSection
      ? {
          label: liveDone === 0 && !practice
            ? text(`Start ${nextSection.title}`, `${nextSection.title}ni boshlash`, `Начать: ${nextSection.title}`)
            : text(`Continue: ${nextSection.title}`, `Davom etish: ${nextSection.title}`, `Продолжить: ${nextSection.title}`),
          run: () => launchSection(nextSection),
        }
      : null

  const handoffSection = handoff ? mock.sections.find(section => section.key === handoff) ?? null : null
  const handoffScore = handoff && practice ? scoreLabel(handoff) : null
  const handoffNext = handoff ? nextSection : null

  return (
    <main className="workspace-page mock-run-page">
      <div className="mock-run-content">
        <header className="mrp-glass mrp-header">
          <div className="mrp-header-bar">
            <button type="button" className="mrp-chip-button" onClick={backToCatalog}>
              <ArrowLeft size={16} />
              {text('All mocks', 'Barcha mocklar', 'Все тесты')}
            </button>
            {supported && !isFullscreen && <button type="button" className="mrp-chip-button" onClick={() => void enter()}><Maximize2 size={15} /> {text('Full screen', 'To‘liq ekran', 'Полный экран')}</button>}
          </div>
          <div className="mrp-header-main">
            <div className="mrp-title">
              <p className="mrp-eyebrow">IELTS ACADEMIC · FULL MOCK {String(mock.index).padStart(2, '0')}</p>
              <h1><UiText text={"Full Mock"} /> {mock.index}</h1>
              <ul className="mrp-facts">
                <li><Clock3 size={14} />{formatMockDuration(mock.totalMinutes)}</li>
                <li><Layers3 size={14} />{MOCK_SECTION_COUNT} {text('sections', 'bo‘lim', 'раздела')}</li>
                {mode && <li className={`mrp-mode-tag is-${mode}`}>{mode === 'exam' ? <ShieldCheck size={14} /> : <Shuffle size={14} />}{modeLabel(mode)}</li>}
              </ul>
            </div>
            <div className="mrp-header-actions">
              {primaryAction && <button type="button" className="mrp-primary mock-run-start" onClick={primaryAction.run}><PlayCircle size={18} />{primaryAction.label}</button>}
              {canChangeMode && <button type="button" className="mrp-link" onClick={() => { setPickedMode(mode ?? 'exam'); setPicker(true) }}>{text('Change mode', 'Rejimni o‘zgartirish', 'Сменить режим')}</button>}
            </div>
          </div>
        </header>

        <ol className="mrp-sections" aria-label={text('Mock sections', 'Mock bo‘limlari', 'Разделы теста')}>
          {mock.sections.map((section, index) => {
            const Icon = SECTION_ICONS[section.key]
            const status = statuses[index]
            const saved = sectionResults[section.key]
            const score = practice ? scoreLabel(section.key) : null
            const canStart = mode !== null && status === 'current'
            const hasFeedback = practice && status === 'completed' && !saved?.result && !!saved?.review?.length
            const feedbackOpen = openFeedback === section.key
            return (
              <li key={section.key} className={`mrp-glass mock-run-section mrp-section is-${status}`}>
                <div className="mrp-section-row">
                  <span className="mrp-skill-icon"><Icon size={22} /><small>0{section.order}</small></span>
                  <div className="mrp-section-copy">
                    <h2>{section.title}</h2>
                    <p><Clock3 size={13} />{section.durationMinutes} {minutes}<span aria-hidden="true">·</span><UiText text={section.meta} /></p>
                  </div>
                  <span className={`mrp-status is-${status}`}>
                    {status === 'completed' ? <CheckCircle2 size={13} /> : status === 'locked' ? <Lock size={12} /> : null}
                    {status === 'completed'
                      ? text('Completed', 'Yakunlandi', 'Завершено')
                      : status === 'current'
                        ? mode === null ? text('Ready', 'Tayyor', 'Готово') : practice ? text('Not started', 'Boshlanmagan', 'Не начат') : text('Up next', 'Keyingi', 'Следующий')
                        : status === 'locked'
                          ? text('Locked', 'Yopiq', 'Закрыто')
                          : text('Coming soon', 'Tez orada', 'Скоро')}
                  </span>
                  <div className="mrp-section-score">
                    {score ? <><strong className="mock-run-skill-band">{score.band}</strong><small>{score.note}</small></>
                      : status === 'completed' ? <small className="mrp-hidden-score"><Lock size={12} />{text('Score after Speaking', 'Ball Speakingdan keyin', 'Балл после Speaking')}</small>
                        : null}
                  </div>
                  <div className="mrp-section-action">
                    {practice && status === 'completed' && saved?.result ? (
                      <button type="button" className="mrp-secondary mock-run-review" onClick={() => reviewSection(section)}>
                        {text('Review answers', 'Javoblarni ko‘rish', 'Просмотр ответов')}<ArrowUpRight size={15} />
                      </button>
                    ) : hasFeedback ? (
                      <button type="button" className="mrp-secondary" aria-expanded={feedbackOpen} onClick={() => setOpenFeedback(feedbackOpen ? null : section.key)}>
                        {text('View feedback', 'Tahlilni ko‘rish', 'Посмотреть разбор')}<ChevronDown size={15} className={feedbackOpen ? 'is-open' : undefined} />
                      </button>
                    ) : canStart ? (
                      <button type="button" className="mrp-start mock-run-start" onClick={() => launchSection(section)}>
                        <PlayCircle size={16} />{text('Start', 'Boshlash', 'Начать')}
                      </button>
                    ) : status === 'completed' ? (
                      <CheckCircle2 size={20} className="mrp-done-icon" aria-hidden="true" />
                    ) : status === 'locked' ? (
                      <Lock size={17} className="mrp-lock-icon" aria-label={text('Finish the previous section first', 'Avval oldingi bo‘limni yakunlang', 'Сначала завершите предыдущий раздел')} />
                    ) : null}
                  </div>
                </div>
                {feedbackOpen && saved && (
                  <div className="mrp-feedback mock-run-section-review">
                    {saved.summary && <p className="mock-run-summary">{saved.summary}</p>}
                    <div className="mock-run-responses">
                      {saved.review!.map((item, responseIndex) => (
                        <div key={responseIndex}>
                          <h4><UiText text={item.label} /></h4>
                          <p>{item.response || text('No response recorded.', 'Javob yozilmagan.', 'Ответ не записан.')}</p>
                          {item.feedback && <p className="mock-run-feedback">{item.feedback}</p>}
                          {(section.key === 'writing' || (section.key === 'speaking' && item.label === 'Your answer')) && item.response.trim() ? <ImprovedResponse text={item.improvedVersion} /> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <p className="mrp-note">
          {mode === null
            ? text(
                'Choose Exam mode for real test conditions, or Practice mode to take sections one by one. Your overall band appears after all four sections.',
                'Haqiqiy imtihon sharoiti uchun Imtihon rejimini, bo‘limlarni alohida ishlash uchun Mashq rejimini tanlang. Umumiy band to‘rtta bo‘limdan keyin chiqadi.',
                'Выберите режим экзамена для реальных условий или режим практики, чтобы проходить разделы по одному. Общий балл появится после всех четырёх разделов.',
              )
            : practice
              ? text(
                  'Practice mode: take sections in any order. Each band appears as soon as the section is finished; the overall band appears after all four.',
                  'Mashq rejimi: bo‘limlarni istalgan tartibda ishlang. Har bir bo‘lim bandi darhol chiqadi, umumiy band esa to‘rttasi tugagach.',
                  'Режим практики: разделы в любом порядке. Балл раздела виден сразу, общий балл — после всех четырёх.',
                )
              : text(
                  'Exam mode: sections run in the official order. Scores and review stay hidden until Speaking is finished.',
                  'Imtihon rejimi: bo‘limlar rasmiy tartibda. Natijalar va tahlil Speaking tugagach ochiladi.',
                  'Режим экзамена: разделы идут в официальном порядке. Результаты откроются после Speaking.',
                )}
        </p>
      </div>

      <FullMockDialog open={picker} labelledBy={`${dialogId}-mode`} describedBy={`${dialogId}-mode-copy`} closeLabel={text('Close', 'Yopish', 'Закрыть')} onClose={() => setPicker(false)} wide>
        <span className="mrp-dialog-icon"><GraduationCap size={24} /></span>
        <h2 id={`${dialogId}-mode`}>{text(`How do you want to take Full Mock ${mock.index}?`, `Full Mock ${mock.index}ni qanday ishlaysiz?`, `Как вы хотите пройти Full Mock ${mock.index}?`)}</h2>
        <p id={`${dialogId}-mode-copy`}>{text('You can change the mode until the first section is submitted.', 'Birinchi bo‘lim topshirilguncha rejimni o‘zgartirish mumkin.', 'Режим можно сменить до сдачи первого раздела.')}</p>
        <div className="mrp-modes" role="radiogroup" aria-label={text('Mock mode', 'Mock rejimi', 'Режим теста')}>
          {(['exam', 'practice'] as const).map(value => {
            const exam = value === 'exam'
            const points = exam
              ? [
                  text('Official order: Listening → Reading → Writing → Speaking', 'Rasmiy tartib: Listening → Reading → Writing → Speaking', 'Официальный порядок: Listening → Reading → Writing → Speaking'),
                  text('You confirm before each new section starts', 'Har bir yangi bo‘lim oldidan tasdiqlaysiz', 'Перед каждым разделом вы подтверждаете старт'),
                  text('All scores are revealed after Speaking', 'Barcha natijalar Speakingdan keyin ochiladi', 'Все баллы откроются после Speaking'),
                ]
              : [
                  text('Take the four sections in any order', 'To‘rtta bo‘limni istalgan tartibda ishlang', 'Разделы в любом порядке'),
                  text('See each band and review right after the section', 'Har bir bo‘lim bandi va tahlili darhol chiqadi', 'Балл и разбор сразу после раздела'),
                  text('Overall band once all four are complete', 'Umumiy band to‘rttasi tugagach', 'Общий балл после всех четырёх'),
                ]
            return (
              <button key={value} type="button" role="radio" aria-checked={pickedMode === value} data-autofocus={pickedMode === value ? '' : undefined}
                className={`mrp-mode${pickedMode === value ? ' is-selected' : ''}`} onClick={() => setPickedMode(value)}>
                <span className="mrp-mode-top">
                  <span className="mrp-mode-icon">{exam ? <ShieldCheck size={20} /> : <Shuffle size={20} />}</span>
                  <span className="mrp-mode-badge">{exam ? text('Real test', 'Haqiqiy test', 'Как на экзамене') : text('Flexible', 'Erkin', 'Гибко')}</span>
                  <span className="mrp-mode-radio" aria-hidden="true" />
                </span>
                <strong>{modeLabel(value)}</strong>
                <ul>{points.map(point => <li key={point}><CheckCircle2 size={14} />{point}</li>)}</ul>
              </button>
            )
          })}
        </div>
        <div className="mrp-dialog-actions">
          <button type="button" className="mrp-secondary" onClick={() => setPicker(false)}>{text('Cancel', 'Bekor qilish', 'Отмена')}</button>
          <button type="button" className="mrp-primary" onClick={() => {
            setFullMockMode(mock.id, pickedMode)
            setChosenMode(pickedMode)
            setPicker(false)
            if (pickedMode === 'exam') {
              const first = mock.sections.find(section => section.available && !completedSet.has(section.key))
              if (first) launchSection(first)
            }
          }}>
            {pickedMode === 'exam'
              ? <><PlayCircle size={18} />{text('Start Listening', 'Listeningni boshlash', 'Начать Listening')}</>
              : <>{text('Continue in practice mode', 'Mashq rejimida davom etish', 'Продолжить в режиме практики')}<ArrowRight size={17} /></>}
          </button>
        </div>
      </FullMockDialog>

      <FullMockDialog open={!!handoffSection} labelledBy={`${dialogId}-handoff`} describedBy={`${dialogId}-handoff-copy`} closeLabel={text('Close', 'Yopish', 'Закрыть')} onClose={closeHandoff}>
        {handoffSection && <>
          <span className="mrp-dialog-icon is-done"><CheckCircle2 size={24} /></span>
          <p className="mrp-eyebrow">{text('SECTION SUBMITTED', 'BO‘LIM TOPSHIRILDI', 'РАЗДЕЛ СДАН')}</p>
          <h2 id={`${dialogId}-handoff`}>{text(`${handoffSection.title} complete`, `${handoffSection.title} yakunlandi`, `${handoffSection.title} завершён`)}</h2>
          <p id={`${dialogId}-handoff-copy`}>
            {practice
              ? text('Your result is saved. You can review it now or continue with another section.', 'Natijangiz saqlandi. Uni hozir ko‘rishingiz yoki boshqa bo‘limga o‘tishingiz mumkin.', 'Результат сохранён. Посмотрите его или перейдите к другому разделу.')
              : text('Your answers are saved. Scores are revealed after the final section.', 'Javoblaringiz saqlandi. Natijalar oxirgi bo‘limdan keyin ochiladi.', 'Ответы сохранены. Баллы откроются после последнего раздела.')}
          </p>
          {handoffScore && <div className="mrp-handoff-score"><strong>{handoffScore.band}</strong><span>{text('band', 'band', 'балл')}<small>{handoffScore.note}</small></span></div>}
          {handoffNext && <div className="mrp-handoff-next">
            <span className="mrp-skill-icon">{(() => { const Icon = SECTION_ICONS[handoffNext.key]; return <Icon size={20} /> })()}</span>
            <div>
              <small>{text('Up next', 'Keyingi bo‘lim', 'Следующий раздел')}</small>
              <strong>{handoffNext.title}</strong>
              <span>{handoffNext.durationMinutes} {minutes} · <UiText text={handoffNext.meta} /></span>
            </div>
          </div>}
          {handoffNext && !practice && <p className="mrp-handoff-hint">{text('The timer starts as soon as you begin. Make sure you are ready.', 'Boshlaganingiz zahoti taymer ishga tushadi. Tayyor ekaningizga ishonch hosil qiling.', 'Таймер запустится сразу после начала. Убедитесь, что вы готовы.')}</p>}
          <div className="mrp-dialog-actions">
            {practice && handoffSection.key !== 'writing' && handoffSection.key !== 'speaking' && sectionResults[handoffSection.key]?.result
              ? <button type="button" className="mrp-secondary" onClick={() => reviewSection(handoffSection)}>{text('Review answers', 'Javoblarni ko‘rish', 'Просмотр ответов')}</button>
              : <button type="button" className="mrp-secondary" onClick={closeHandoff}>{practice ? text('Back to mock', 'Mockga qaytish', 'К тесту') : text('Take a break', 'Tanaffus', 'Перерыв')}</button>}
            {handoffNext
              ? <button type="button" data-autofocus className="mrp-primary" onClick={() => { setHandoff(null); launchSection(handoffNext) }}>
                  <PlayCircle size={18} />{text(`I'm ready — start ${handoffNext.title}`, `Tayyorman — ${handoffNext.title}ni boshlash`, `Я готов — начать ${handoffNext.title}`)}
                </button>
              : <button type="button" data-autofocus className="mrp-primary" onClick={closeHandoff}>{text('Done', 'Tayyor', 'Готово')}</button>}
          </div>
        </>}
      </FullMockDialog>
    </main>
  )
}
