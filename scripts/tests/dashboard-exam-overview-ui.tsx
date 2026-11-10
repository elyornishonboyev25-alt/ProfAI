import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import i18n from '@/i18n'
import DashboardExamOverview, { dashboardSatSections } from '@/components/dashboard/DashboardExamOverview'
import IELTS from '@/pages/IELTS'
import SAT from '@/pages/SAT'
import SATSectionTabs from '@/components/sat/SATSectionTabs'
import { useAuthStore } from '@/store/authStore'
import { accountStorageFor } from '@/utils/accountStorage'
import { getSATReviewTests, isSATTestComplete } from '@/features/sat/catalog'
import { createSATAttempt, scoreSATModules } from '@/features/sat/practiceTest4'
import { clearSATAttempt, saveSATAttempt, saveSATAttemptToHistory } from '@/features/sat/attemptStorage'
import type { AuthUser } from '@/types/platform'

export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
  const owner = 'dashboard-overview-test'
  const login = (id: string) => useAuthStore.getState().setSession({ user: { id, fullName: id, onboardingCompleted: true } as AuthUser, accessToken: `token-${id}`, refreshToken: `refresh-${id}` })
  login(owner)
  const test = getSATReviewTests().find(test => test.modules.length === 4 && isSATTestComplete(test))!
  assert.ok(test)
  const attempt = createSATAttempt(test.id, test.modules, 'exam')
  saveSATAttempt(attempt)
  assert.equal(dashboardSatSections(), null, 'An active attempt must not fabricate a SAT score')
  attempt.status = 'submitted'
  attempt.submittedAt = Date.now()
  saveSATAttempt(attempt)
  const actual = scoreSATModules(test.modules, attempt.answers)
  assert.equal(dashboardSatSections()?.total, actual.midpoint)
  assert.equal(dashboardSatSections()!.math + dashboardSatSections()!.reading, actual.midpoint, 'Subject values must belong to the same scored attempt')
  saveSATAttemptToHistory(attempt, 'submitted')
  clearSATAttempt(test.id)
  saveSATAttempt(createSATAttempt(test.id, test.modules, 'exam'))
  assert.equal(dashboardSatSections()?.total, actual.midpoint, 'Retakes must preserve archived scores')
  login('another-dashboard-owner')
  assert.equal(dashboardSatSections(), null, 'Exam summaries must not leak another account’s scores')
  login(owner)
  accountStorageFor(owner).setItem(`smarttest:ielts-exam-date:${owner}`, '2027-02-25')
  const root = createRoot(document.getElementById('root')!)
  await act(async () => root.render(<MemoryRouter><DashboardExamOverview owner={owner} ielts={6.5} sat={actual.midpoint} ieltsTarget={7.5} satTarget={1550} /></MemoryRouter>))
  assert.equal(document.querySelectorAll('.dashboard-exam-overview').length, 2)
  assert.equal(document.querySelectorAll('.dashboard-exam-skills button').length, 6)
  assert.match(document.querySelector('.dashboard-exam-plan summary')!.textContent!, /2027/)
  assert.doesNotMatch(document.body.textContent!, /Review mistakes and practice|Strengthen Math/)
  await act(async () => root.render(<MemoryRouter><Routes><Route path="/" element={<SATSectionTabs section="mocks" />} /><Route path="/sat/question-bank" element={<p>Question Bank inside SAT</p>} /></Routes></MemoryRouter>))
  const bank = document.getElementById('sat-tab-question-bank') as HTMLButtonElement
  assert.ok(bank, 'Question Bank is a SAT tab, alongside Math and full mocks')
  await act(async () => bank.click())
  assert.match(document.body.textContent!, /Question Bank inside SAT/)
  for (const [path, Component, destination] of [['/ielts', IELTS, '/ielts/tests'], ['/sat', SAT, '/sat/mocks']] as const) {
    await act(async () => root.render(<MemoryRouter key={path} initialEntries={[path]}><Routes><Route path={path} element={<Component />} /><Route path={destination} element={<p>Direct test library</p>} /></Routes></MemoryRouter>))
    assert.match(document.body.textContent!, /Direct test library/, `${path} must not display the retired Arena page`)
  }
  await act(async () => root.unmount())
  console.log('Dashboard exam summaries: real scores, archived retakes, account isolation, saved date and retired routes passed')
}
