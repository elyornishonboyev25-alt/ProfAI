import TestVocabulary from '@/components/vocab/TestVocabulary'
import UiText from '@/components/common/UiText'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  Lock,
  Mic2,
  PenSquare,
  PlayCircle,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Reveal } from '@/components/fx'
import { useBillingText } from '@/features/billing/copy'
import './mock-ielts-run.css'
import { useAuthStore } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'
import {
  formatMockDuration,
  fullMockLaunchState,
  FULL_MOCK_PROGRESS_EVENT,
  getFullMockById,
  getFullMockCompletedSections,
  getFullMockOverallBand,
  getFullMockResults,
  MOCK_SECTION_COUNT,
  type FullMockEntry,
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

// Official IELTS exam order is enforced: a section unlocks only after every
// earlier section that actually has content is finished. Coming-soon sections
// have no test to run, so they neither unlock nor block the chain.
function resolveStatus(
  sections: MockSection[],
  index: number,
  completed: Set<MockSectionKey>,
): SectionStatus {
  const section = sections[index]
  if (!section.available) return 'coming-soon'
  if (completed.has(section.key)) return 'completed'

  const earlierAvailableDone = sections
    .slice(0, index)
    .filter((earlier) => earlier.available)
    .every((earlier) => completed.has(earlier.key))

  return earlierAvailableDone ? 'current' : 'locked'
}

export default function MockIELTSRun() {
  const text = useBillingText()
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
  const navigate = useNavigate()
  const location = useLocation()
  const { mockId } = useParams<{ mockId: string }>()
  const from = (location.state as { from?: string } | null)?.from

  const mock = useMemo<FullMockEntry | null>(() => (mockId ? getFullMockById(mockId) : null), [mockId])

  const [completedKeys, setCompletedKeys] = useState<MockSectionKey[]>(() =>
    mockId ? getFullMockCompletedSections(mockId) : [],
  )

  // Completion is written by the section runners themselves (on submit / when
  // the examiner grade saves). Re-read whenever that happens, or when the user
  // returns to this tab after finishing a section elsewhere.
  const refreshProgress = useCallback(() => {
    setCompletedKeys(mockId ? getFullMockCompletedSections(mockId) : [])
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
  }, [refreshProgress])

  const completedSet = useMemo(() => new Set(completedKeys), [completedKeys])
  const sectionResults = useMemo(() => {
    void completedKeys
    return mockId ? getFullMockResults(mockId) : {}
  }, [completedKeys, mockId])
  const overallBand = mockId ? getFullMockOverallBand(mockId) : null

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
      navigate(section.launchPath, {
        state: fullMockLaunchState(mock.id, section.key, from),
      })
    },
    [from, mock, navigate],
  )

  if (!mock) {
    return <Navigate to="/mock/ielts" replace />
  }

  const liveDone = mock.sections.filter(
    (section) => section.available && completedSet.has(section.key),
  ).length
  const allSectionsDone = mock.fullyReady && liveDone === MOCK_SECTION_COUNT
  const progressPercent = mock.readyCount === 0 ? 0 : Math.round((liveDone / mock.readyCount) * 100)
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

  return (
    <main className="workspace-page mock-run-page">
      <div className="mock-run-content">
        <Reveal>
          <header className="mock-run-glass mock-run-hero">
            <div className="mock-run-intro">
              <nav
                className="mock-run-nav"
                aria-label={text('Mock navigation', 'Mock navigatsiyasi', 'Навигация по тестам')}
              >
                <button
                  type="button"
                  className="mock-run-back"
                  onClick={() => navigate('/ielts/tests#mocks', { state: { from: from ?? 'mock' } })}
                >
                  <ArrowLeft size={16} />
                  {text('All mocks', 'Barcha mocklar', 'Все тесты')}
                </button>
                <span className="mock-run-chip">FULL MOCK {mock.index}</span>
              </nav>
              <p className="mock-run-eyebrow">IELTS ACADEMIC</p>
              <h1>
                {allSectionsDone ? (
                  text('Your mock results.', 'Mock natijalaringiz.', 'Ваши результаты.')
                ) : (
                  <>
                    IELTS <span>Full Mock {mock.index}</span>
                  </>
                )}
              </h1>
              <p className="mock-run-subtitle">
                {allSectionsDone
                  ? text(
                      'A complete view of your performance across all four skills.',
                      'To‘rtta ko‘nikma bo‘yicha natijalaringiz bir joyda.',
                      'Результаты по всем четырём навыкам в одном месте.',
                    )
                  : text(
                      'Listening, Reading, Writing, then Speaking. Complete all four sections to see your overall band.',
                      'Listening, Reading, Writing, keyin Speaking. Umumiy band uchun to‘rtta bo‘limni yakunlang.',
                      'Аудирование, чтение, письмо и говорение. Завершите все четыре раздела, чтобы увидеть общий балл.',
                    )}
              </p>
              <div className="mock-run-session">
                <div>
                  <Clock3 size={18} />
                  <span>
                    {text('Total session', 'Umumiy vaqt', 'Длительность')}
                    <strong>{formatMockDuration(mock.totalMinutes)}</strong>
                  </span>
                </div>
                <div>
                  <CheckCircle2 size={18} />
                  <span>
                    {text('Sections completed', 'Yakunlangan bo‘limlar', 'Завершённые разделы')}
                    <strong>
                      {liveDone}
                      <small> / {MOCK_SECTION_COUNT}</small>
                    </strong>
                  </span>
                </div>
              </div>
            </div>
            <aside
              className={`mock-run-overall ${allSectionsDone ? 'is-complete' : ''}`}
              aria-label={text('Overall band', 'Umumiy band', 'Общий балл')}
            >
              <div className="mock-run-overall-top">
                <span>
                  <Trophy size={17} />
                  {text('OVERALL BAND', 'UMUMIY BAND', 'ОБЩИЙ БАЛЛ')}
                </span>
                <span className="mock-run-status">
                  {allSectionsDone ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                  {allSectionsDone
                    ? text('Complete', 'Yakunlandi', 'Завершено')
                    : text('In progress', 'Davom etmoqda', 'В процессе')}
                </span>
              </div>
              <div className="mock-run-band">
                {allSectionsDone && overallBand !== null ? overallBand.toFixed(1) : '—'}
                <span>/ 9.0</span>
              </div>
              <p>
                {allSectionsDone
                  ? text('Practice estimate', 'Mashq uchun taxminiy baho', 'Ориентировочный результат')
                  : text(
                      'Available after all four sections',
                      'To‘rtta bo‘limdan keyin ochiladi',
                      'После завершения четырёх разделов',
                    )}
              </p>
              <div
                className="mock-run-progress"
                role="progressbar"
                aria-label={text('Mock completion', 'Mock jarayoni', 'Прогресс теста')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercent}
              >
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mock-run-progress-caption">
                <span>{text('Exam progress', 'Test jarayoni', 'Прогресс экзамена')}</span>
                <strong>{progressPercent}%</strong>
              </div>
            </aside>
          </header>
        </Reveal>

        <div className="mock-run-section-heading">
          <div>
            <p className="mock-run-eyebrow">
              {text('SKILL BREAKDOWN', 'KO‘NIKMALAR KESIMIDA', 'ПО НАВЫКАМ')}
            </p>
            <h2>
              {allSectionsDone
                ? text(
                    'Your results, section by section.',
                    'Har bir bo‘lim bo‘yicha natijalar.',
                    'Результаты каждого раздела.',
                  )
                : text('Your exam journey.', 'Test bosqichlaringiz.', 'Этапы экзамена.')}
            </h2>
          </div>
          <span className="mock-run-chip">
            <CheckCircle2 size={14} />
            {liveDone}/{MOCK_SECTION_COUNT} {text('complete', 'yakunlandi', 'завершено')}
          </span>
        </div>
        <div className="mock-run-section-grid">
          {mock.sections.map((section, index) => {
            const Icon = SECTION_ICONS[section.key]
            const status = resolveStatus(mock.sections, index, completedSet)
            const saved = sectionResults[section.key]
            const isDone = status === 'completed'
            const isCurrent = status === 'current'
            const isLocked = status === 'locked'
            const visibleBand = allSectionsDone && saved ? saved.band : null
            return (
              <article key={section.key} className={`mock-run-glass mock-run-section is-${status}`}>
                <div className="mock-run-section-top">
                  <span className="mock-run-skill-icon">
                    <Icon size={23} />
                  </span>
                  <span className="mock-run-section-number">0{section.order}</span>
                  <span className="mock-run-status">
                    {isDone ? <CheckCircle2 size={13} /> : isLocked ? <Lock size={13} /> : null}
                    {isDone
                      ? text('Completed', 'Yakunlandi', 'Завершено')
                      : isCurrent
                        ? text('Up next', 'Keyingi', 'Следующий')
                        : isLocked
                          ? text('Locked', 'Yopiq', 'Закрыто')
                          : text('Coming soon', 'Tez orada', 'Скоро')}
                  </span>
                </div>
                <div className="mock-run-skill-title">
                  <div>
                    <h3>{section.title}</h3>
                    <p>
                      <Clock3 size={13} />
                      {section.durationMinutes} <UiText text="min" /> <span>·</span>
                      {section.meta}
                    </p>
                  </div>
                  <div className="mock-run-skill-band">
                    {visibleBand !== null ? visibleBand.toFixed(1) : '—'}
                    <small>{text('band', 'band', 'балл')}</small>
                  </div>
                </div>
                <div className="mock-run-skill-meter" aria-hidden="true">
                  <span
                    style={{
                      width: visibleBand !== null ? `${(visibleBand / 9) * 100}%` : isDone ? '100%' : '0%',
                    }}
                  />
                </div>
                {allSectionsDone && saved?.summary && <p className="mock-run-summary">{saved.summary}</p>}
                <div className="mock-run-section-footer">
                  <span>
                    {allSectionsDone && saved?.result
                      ? `${saved.result.correctAnswers}/${saved.result.totalQuestions} ${text('correct answers', 'to‘g‘ri javob', 'правильных ответов')}`
                      : isDone
                        ? text('Section finished', 'Bo‘lim yakunlandi', 'Раздел завершён')
                        : isCurrent
                          ? text('Ready when you are', 'Boshlashingiz mumkin', 'Можно начать')
                          : isLocked
                            ? text(
                                'Finish the previous section first',
                                'Avval oldingi bo‘limni yakunlang',
                                'Сначала завершите предыдущий раздел',
                              )
                            : text(
                                'This section is not available yet',
                                'Bu bo‘lim hali mavjud emas',
                                'Этот раздел пока недоступен',
                              )}
                  </span>
                  {isDone && allSectionsDone && saved?.result ? (
                    <button type="button" className="mock-run-review" onClick={() => reviewSection(section)}>
                      {text('Review answers', 'Javoblarni ko‘rish', 'Просмотр ответов')}
                      <ArrowUpRight size={16} />
                    </button>
                  ) : isCurrent ? (
                    <button type="button" className="mock-run-start" onClick={() => launchSection(section)}>
                      <PlayCircle size={16} />
                      <UiText text="Start" />
                    </button>
                  ) : isDone ? (
                    <CheckCircle2 size={18} className="mock-run-complete-icon" />
                  ) : (
                    <Lock size={16} />
                  )}
                </div>
                {allSectionsDone && saved && (
                  <div className="mock-run-section-review">
                    <TestVocabulary testId={saved.testId} skill={section.key} variant="review" compact />
                    {!!saved.review?.length && (
                      <details>
                        <summary>
                          {text(
                            `Review ${section.title.toLowerCase()} responses`,
                            `${section.title} javoblarini ko‘rish`,
                            `Просмотр ответов: ${section.title}`,
                          )}
                          <ChevronDown size={16} />
                        </summary>
                        <div className="mock-run-responses">
                          {saved.review.map((item, responseIndex) => (
                            <div key={responseIndex}>
                              <h4>{item.label}</h4>
                              <p>
                                {item.response ||
                                  text('No response recorded.', 'Javob yozilmagan.', 'Ответ не записан.')}
                              </p>
                              {item.feedback && <p className="mock-run-feedback">{item.feedback}</p>}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
        <footer className="mock-run-glass mock-run-footer">
          <span className="mock-run-footer-icon">
            <Sparkles size={20} />
          </span>
          <p>
            {allSectionsDone
              ? text(
                  'Listening and Reading are automatically scored. Writing and Speaking use AI evaluation. This is a practice result, not an official IELTS score.',
                  'Listening va Reading avtomatik, Writing va Speaking AI yordamida baholanadi. Bu mashq natijasi, rasmiy IELTS bahosi emas.',
                  'Чтение и аудирование оцениваются автоматически, письмо и говорение — с помощью ИИ. Это тренировочный результат, а не официальный балл IELTS.',
                )
              : text(
                  'Scores and review remain hidden until all four sections are complete.',
                  'Natijalar va tahlil to‘rtta bo‘lim yakunlangach ochiladi.',
                  'Результаты и разбор доступны после завершения всех четырёх разделов.',
                )}
          </p>
        </footer>
      </div>
    </main>
  )
}
