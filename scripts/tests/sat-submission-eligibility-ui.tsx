import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SATMockRun from '@/pages/SATMockRun'
import { SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { createSATAttempt } from '@/features/sat/practiceTest4'
import { loadSATAttempt, saveSATAttempt } from '@/features/sat/attemptStorage'
import { isSATLeaderboardEligible, minimumSATLeaderboardSeconds } from '@/features/sat/leaderboardEligibility'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import i18n from '@/i18n'
import SATResultReview from '@/pages/SATResultReview'

export async function run() {
  localStorage.clear(); window.sessionStorage.clear(); await i18n.changeLanguage('en')
  useAuthStore.setState({ user: { id:'sat-eligibility-fixture', fullName:'Fixture Learner', role:'USER' } as never })
  const paper = SAT_TEST_CATALOG[3]
  const draft = createSATAttempt(paper.id, paper.modules, 'practice')
  assert.equal(minimumSATLeaderboardSeconds(paper.modules), 1800)
  assert.equal(minimumSATLeaderboardSeconds(paper.modules.filter(module => module.section === 'math')), 600)
  const submitted = { ...draft, status:'submitted' as const, submittedAt:Date.now(), moduleTimerStartedAt:undefined,
    moduleElapsedSeconds:{ [paper.modules[0].id]: 20 }, leaderboardEligible:false, eligibilityNoticeAcknowledged:false }
  saveSATAttempt(submitted)
  assert.equal(isSATLeaderboardEligible(submitted, paper.modules), false)
  assert.equal(isSATLeaderboardEligible({ ...submitted, leaderboardEligible:true, moduleElapsedSeconds:{ [paper.modules[0].id]:1800 } }, paper.modules), true)
  const get = apiClient.get, post = apiClient.post
  const requests: { path:string; body:unknown }[] = []
  apiClient.get = (async () => ({ rows:[], participants:0, average:null, me:null, percentiles:{ total:null,rw:null,math:null } })) as typeof get
  apiClient.post = (async (path:string, body:unknown) => { requests.push({ path, body }); return {} }) as typeof post
  const element = document.getElementById('root')!
  let root = createRoot(element)
  const render = async () => act(async () => root.render(<MemoryRouter initialEntries={[{ pathname:'/sat/mock/3/run', state:{ resumeIntent:true } }]}><Routes><Route path="/sat/mock/:mockId/run" element={<SATMockRun />} /><Route path="/sat/results/:attemptId" element={<SATResultReview />} /></Routes></MemoryRouter>))
  try {
    await render()
    assert.equal(document.querySelector('[role=alertdialog]'), null, 'Fast attempts go straight to results')
    assert.ok(document.querySelector('.srx-score-stage'), 'Scores open on the dedicated result route')
    assert.equal(loadSATAttempt(paper.id)?.leaderboardEligible, false)
    assert.ok(requests.some(request => (request.body as { breakdown?: { leaderboardEligible?: boolean } })?.breakdown?.leaderboardEligible === false), 'The score still syncs with its ranking exclusion')
    assert.equal(requests.some(request => request.path.includes('/xp/')), false, 'Fast submissions cannot add leaderboard XP')
    await act(async () => root.unmount()); root = createRoot(element)
    await render()
    assert.equal(document.querySelector('[role=alertdialog]'), null, 'Reload goes straight to results again')
    console.log('PASS: SAT submission opens results directly, keeps the score, excludes fast attempts from ranking/XP and survives reload')
  } finally { await act(async () => root.unmount()); apiClient.get = get; apiClient.post = post }
}
