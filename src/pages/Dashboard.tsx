import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Target, Clock3, History } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAsyncData } from '@/hooks/useAsyncData'
import { apiClient } from '@/lib/apiClient'
import type { DashboardOverview } from '@/types/platform'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'
import { loadLearningFocus } from '@/utils/learningFocus'
import { mergeLocalDashboardPerformance } from '@/utils/localProfilePerformance'
import { useCopy } from '@/i18n/interface'
import StudyObject from '@/components/visuals/StudyObject'
import { formatDashboardDay, formatDashboardActivityDate } from '@/utils/dashboardDates'

const cache = new Map<string, DashboardOverview>()
function emptyOverview(): DashboardOverview {
  return {
    metrics: { totalTests: 0, averageScore: 0, weeklyStudySeconds: 0, currentRank: null, currentStreak: 0 },
    weeklyProgress: Array.from({ length: 7 }, (_, index) => {
      const date = new Date(); date.setDate(date.getDate() - 6 + index)
      return { date: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`, label: '', testsCompleted: 0, questionsAnswered: 0, studyTimeSec: 0, active: false }
    }),
    recommendedTests: [], activityTimeline: [], miniLeaderboard: [],
  }
}
export default function Dashboard() {
  const { c, language } = useCopy()
  const user = useAuthStore(s => s.user)
  const profile = loadOnboardingProfile(user?.id)
  const key = user?.id || 'guest'
  const { data, loading, error, refetch } = useAsyncData<DashboardOverview>(async () => {
    const fresh = await apiClient.get<DashboardOverview>('/dashboard/overview', { auth: Boolean(user) })
    cache.set(key, fresh); return fresh
  }, [key])
  const base = data || cache.get(key)
  const overview = useMemo(() => user ? mergeLocalDashboardPerformance(base || emptyOverview(), user.id) : (base || emptyOverview()), [base, user])
  const focus = loadLearningFocus(user?.id)
  const exam = overview.targets?.targetExam || profile?.targetExam || 'IELTS'
  const application = focus === 'APPLICATIONS'
  const sat = focus === 'SAT' || (!focus && exam === 'SAT')
  const explore = focus === 'EXPLORE'
  const goal = application ? c('University Applications') : explore ? c('Choose a goal') : sat ? `SAT ${overview.targets?.targetSatScore || profile?.targetSatScore || ''}` : `IELTS ${overview.targets?.targetIeltsScore || profile?.targetIeltsScore || ''}`
  const title = application ? 'Find your university' : explore ? 'Choose a goal' : sat ? 'Start your SAT practice' : 'Start your IELTS practice'
  const destination = application ? '/admission/universities' : explore ? '/test-preparation' : sat ? '/sat' : '/ielts'
  const firstName = (profile?.firstName || user?.fullName || 'Learner').split(' ')[0]
  const activities = overview.activityTimeline.slice(0, 3)
  return <div className="workspace-page liquid-page liquid-home">
    <header className="liquid-page-heading"><p className="liquid-eyebrow">{c('Home')}</p><h1>{c(overview.metrics.totalTests ? 'Welcome back,' : 'Welcome,')} {firstName}.</h1><p>{c('Your next step starts here.')}</p></header>
    {error && <div className="liquid-inline-error" role="alert"><span>{c('Unable to refresh your activity.')}</span><button onClick={() => void refetch()}>{c('Try again')}</button></div>}
    <div className="liquid-home-goal"><span className="liquid-goal-chip"><Target size={17} />{c('My goal')} <strong>{goal}</strong></span><Link to="/focus" className="liquid-text-link">{c('Edit goal')}<ArrowRight size={14} /></Link></div>
    <div className="liquid-home-grid">
      <section className="glass-surface liquid-focus-card"><div><p className="liquid-eyebrow">{c('Today’s focus')}</p><h2>{c(title)}</h2><p>{c(application ? 'Build a shortlist of places where you would like to study.' : 'Choose a skill and start with an exercise that fits your day.')}</p><Link to={destination} className="liquid-button primary">{c(application ? 'Explore universities' : explore ? 'Explore preparation' : 'Start practicing')}<ArrowRight size={18} /></Link></div><StudyObject kind={application ? 'globe' : sat ? 'calculator' : 'headphones'} /></section>
      <section className="glass-surface liquid-week-card" aria-busy={loading}><h2>{c('This week')}</h2><div className="liquid-week-days">{overview.weeklyProgress.slice(-7).map(day => <div key={day.date}><span>{formatDashboardDay(day.date, language)}</span><i className={day.active ? 'active' : ''}>{day.active && <Check size={11} />}</i></div>)}</div><div className="liquid-week-stat"><span>{c('Study time')}</span><strong>{Math.round(overview.metrics.weeklyStudySeconds / 60)} {language === 'ru' ? 'мин' : 'min'}</strong></div><div className="liquid-week-stat"><span>{c('Completed practices')}</span><strong>{overview.weeklyProgress.reduce((sum, d) => sum + d.testsCompleted, 0)}</strong></div></section>
    </div>
    <section className="glass-surface liquid-activity"><header><h2>{c('Your recent activity')}</h2><Link to="/profile" className="liquid-text-link">{c('View all results')}<ArrowRight size={15} /></Link></header>
      {loading && !base ? <p role="status" className="liquid-empty">{c('Loading your workspace')}</p> : activities.length ? activities.map(item => <div className="liquid-activity-row" key={item.id}><Clock3 size={18} /><div><strong>{item.title}</strong><small>{formatDashboardActivityDate(item.date, language)}</small></div></div>) : <div className="liquid-empty"><History size={23} className="mb-3" /><strong>{c('Your first result belongs here.')}</strong><p>{c('Complete a practice to begin building your progress history.')}</p></div>}
    </section>
    {overview.journeyPlan?.result && <Link to="/journey-plan" className="glass-surface liquid-resource-row"><div><h3>{c('My journey plan')}</h3><p>{overview.journeyPlan.result.readinessLabel}</p></div><ArrowRight size={20} /></Link>}
    <div className="liquid-exam-grid">
      <Link to="/academic-skills" className="glass-surface liquid-resource-row"><div><h3>{c('Additional practice')}</h3><p>{c('Audio, articles, vocabulary and pronunciation.')}</p></div><ArrowRight size={20} /></Link>
      <Link to="/admission" className="glass-surface liquid-resource-row"><div><h3>{c('Application guidance')}</h3><p>{c('Your saved universities and step-by-step lessons.')}</p></div><ArrowRight size={20} /></Link>
    </div>
  </div>
}
