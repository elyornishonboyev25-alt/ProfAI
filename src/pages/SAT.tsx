import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookMarked, CheckCircle2, FileSearch, Lock } from 'lucide-react'
import ExamCountdown from '@/components/exam/ExamCountdown'
import CatalogHero from '@/components/catalog/CatalogHero'
import { ActionButton, EmptyState, Surface } from '@/components/ui/system'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

const MOCK_COUNT = 30

type MockCard = {
  id: number
  title: string
  available: boolean
  completed: boolean
  difficulty: string
}

export default function SAT() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const profile = loadOnboardingProfile(user?.id)
  const [filter, setFilter] = useState<'available' | 'completed'>('available')

  const mocks = useMemo<MockCard[]>(
    () =>
      Array.from({ length: MOCK_COUNT }, (_, index) => ({
        id: index + 1,
        title: index + 1 === 4
          ? 'College Board Practice Test 04'
          : `Digital SAT Full Mock ${String(index + 1).padStart(2, '0')}`,
        available: index + 1 === 4,
        completed: false,
        difficulty: index + 1 === 4 ? 'Official' : index < 10 ? 'Foundation' : index < 20 ? 'Advanced' : 'Mastery',
      })),
    [],
  )

  const availableMocks = mocks.filter((mock) => mock.available)
  const completedMocks = mocks.filter((mock) => mock.completed)
  const visibleMocks = filter === 'completed' ? completedMocks : availableMocks

  return (
    <div className="workspace-page min-h-screen overflow-x-clip px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-[92rem] space-y-5">
        <CatalogHero
          tone="blue"
          backLabel="Dashboard"
          onBack={() => navigate('/dashboard')}
          eyebrow="Digital SAT"
          title={<>Your Digital SAT practice, <span className="text-blue-600">in one place.</span></>}
          subtitle="Take a full official-style test, review mistakes, and build the vocabulary you need."
          filters={[
            { id: 'available', label: 'Available tests', count: availableMocks.length },
            { id: 'completed', label: 'Completed', count: completedMocks.length },
          ]}
          activeFilter={filter}
          onFilterChange={(id) => setFilter(id as typeof filter)}
          summary={[
            { label: 'Exam time', value: '2h 14m' },
            { label: 'Score', value: '400–1600' },
          ]}
          actions={(
            <>
              <ActionButton onClick={() => navigate('/mock/sat', { state: { mockId: 4, from: '/sat' } })}>
                Start Practice Test 04 <ArrowRight className="h-4 w-4" />
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => navigate('/sat/mistakes')}>
                <FileSearch className="h-4 w-4" /> Review mistakes
              </ActionButton>
            </>
          )}
        />

        <ExamCountdown
          exam="SAT"
          tone="blue"
          date={profile?.satExamDate}
          currentScore={profile?.currentSatScore}
          targetScore={profile?.targetSatScore}
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Surface className="p-4 sm:p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Full practice test</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Ready when you are</h2>
              <p className="mt-1 text-sm text-slate-500">Reading &amp; Writing and Math in one complete test.</p>
            </div>

            {visibleMocks.length ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {visibleMocks.map((mock) => (
                  <article
                    key={mock.id}
                    className="flex min-h-[15rem] flex-col rounded-[1.35rem] border border-blue-200 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 p-5 shadow-[0_14px_30px_rgba(37,99,235,0.1)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                        {String(mock.id).padStart(2, '0')}
                      </span>
                      <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-emerald-100 px-2.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Ready
                      </span>
                    </div>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">{mock.difficulty} test</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{mock.title}</h3>
                    <p className="mt-2 text-xs font-semibold text-slate-500">120 questions · 4 modules · 134 minutes</p>
                    <ActionButton
                      className="mt-auto w-full"
                      onClick={() => navigate('/mock/sat', { state: { mockId: mock.id, from: '/sat' } })}
                    >
                      Start full test <ArrowRight className="h-4 w-4" />
                    </ActionButton>
                  </article>
                ))}

                <div className="flex min-h-[15rem] flex-col justify-center rounded-[1.35rem] border border-dashed border-blue-200 bg-blue-50/45 p-5 text-center">
                  <Lock className="mx-auto h-5 w-5 text-blue-500" />
                  <h3 className="mt-3 text-base font-black text-slate-900">29 more tests are being prepared</h3>
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">They will appear here when they are ready to use.</p>
                </div>
              </div>
            ) : (
              <EmptyState
                className="mt-5"
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="No completed SAT tests yet"
                description="Finish Practice Test 04 and it will appear here with your score and review."
                action={(
                  <ActionButton onClick={() => setFilter('available')}>View available test</ActionButton>
                )}
              />
            )}
          </Surface>

          <aside className="space-y-4">
            <button
              onClick={() => navigate('/sat/mistakes')}
              className="ui-surface group w-full p-5 text-left"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white"><FileSearch className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-black text-slate-950">Review mistakes</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">Find repeated errors and focus on the questions that can raise your score.</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-black text-blue-700">Open review <ArrowRight className="h-4 w-4" /></span>
            </button>

            <button
              onClick={() => navigate('/vocabulary/sat')}
              className="ui-surface group w-full bg-blue-50/75 p-5 text-left"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white"><BookMarked className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-black text-slate-950">SAT Vocabulary</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">600 words with matching, recall, quiz, and typing practice.</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-black text-blue-700">Study words <ArrowRight className="h-4 w-4" /></span>
            </button>
          </aside>
        </section>
      </div>
    </div>
  )
}
