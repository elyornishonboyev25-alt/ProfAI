import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import i18n from '../../src/i18n'
import Leaderboard from '../../src/pages/Leaderboard'
import { apiClient } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'
import type {
  AuthUser,
  LeaderboardResponse,
  LeaderboardRow,
} from '../../src/types/platform'

const container = document.getElementById('root')!
const rows = Array.from(
  { length: 25 },
  (_, index) =>
    ({
      premium: index === 0,
      rank: index + 1,
      previousRank: index + 1,
      rankDelta: 0,
      rankTrend: 'same',
      userId: `learner-${index + 1}`,
      fullName: `Learner ${index + 1}`,
      avatarUrl: null,
      totalXp: 1000 - index * 20,
      testsCompleted: index === 0 ? 0 : 2,
      accuracy: index === 0 ? 0 : 80,
      streak: 3,
      isCurrentUser: index === 24,
    }) as LeaderboardRow,
)
const response = (
  period: LeaderboardResponse['period'],
  boardRows = rows,
): LeaderboardResponse => ({
  period,
  category: null,
  currentUserRank: boardRows.find((row) => row.isCurrentUser)?.rank ?? null,
  weeklyPremiumWinner: null,
  weeklyPerformanceBoard: [],
  podium: boardRows.slice(0, 3),
  rows: boardRows,
  antiCheatRules: [
    'Rankings use the total XP shown on each learner’s profile, highest first.',
  ],
})
const button = (label: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
    (item) =>
      item.textContent === label || item.getAttribute('aria-label') === label,
  )!
const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'learner-25', fullName: 'Learner 25', xp: 99_999 } as AuthUser,
  })
  const originalGet = apiClient.get
  let fail = false
  let delayed: ((value: LeaderboardResponse) => void) | null = null
  const signals: AbortSignal[] = []
  apiClient.get = (async (path: string, options?: { signal?: AbortSignal }) => {
    if (options?.signal) signals.push(options.signal)
    if (fail) throw new Error('Offline: please retry')
    const period = new URL(`http://test${path}`).searchParams.get(
      'period',
    ) as LeaderboardResponse['period']
    if (period === 'all')
      return await new Promise<LeaderboardResponse>((resolve) => {
        delayed = resolve
      })
    return response(period)
  }) as typeof apiClient.get
  const root = createRoot(container)
  try {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <Leaderboard />
        </MemoryRouter>,
      ),
    )
    await flush()
    assert.ok(container.querySelector('.leaderboard-podium-card.is-premium-member .premium-identity-badge'), 'Premium is visible on the podium')
    assert.ok(container.querySelector('tbody tr.is-premium-member .premium-identity-badge'), 'Premium is visible in the rankings')
    assert.ok(!container.querySelectorAll('tbody tr')[1].querySelector('.premium-identity-badge'), 'Free learners have no Premium badge')
    assert.equal(
      container.querySelectorAll('tbody tr').length,
      10,
      'only the top 10 learners are listed',
    )
    assert.deepEqual(
      Array.from(container.querySelectorAll('tbody .leaderboard-rank'), (rank) => Number(rank.textContent)),
      Array.from({ length: 10 }, (_, index) => index + 1),
      'rankings retain the server order from first through tenth',
    )
    assert.equal(container.querySelector('.leaderboard-pagination'), null, 'lower ranks cannot be reached through pagination')
    assert.equal(container.querySelector('.leaderboard-pinned'), null, 'a learner outside the top 10 is not added as an extra row')
    assert.ok(!container.textContent?.includes('Learner 25'), 'the current learner outside the top 10 is not listed elsewhere')
    assert.ok(container.querySelector('.leaderboard-count')?.textContent?.includes('10 learners'))
    assert.ok(container.querySelector('.leaderboard-personal-rank')?.textContent?.includes('#25'), 'personal rank remains accurate outside the top 10')
    assert.ok(
      container
        .querySelector('.leaderboard-personal-bottom')
        ?.textContent?.includes('520'),
      'period XP comes from server, not the profile fallback',
    )
    assert.equal(
      container.querySelector('.leaderboard-result')?.textContent,
      '—',
      'untested learner has no invented result percentage',
    )
    assert.ok(
      container
        .querySelector('.leaderboard-snapshot')
        ?.textContent?.includes('80.0%'),
      'untested learners do not lower the result average',
    )
    const search = container.querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!
    const typeSearch = async (value: string) =>
      act(async () => {
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!.call(search, value)
        search.dispatchEvent(new window.Event('input', { bubbles: true }))
      })
    await typeSearch('learner 10')
    assert.equal(container.querySelectorAll('tbody tr').length, 1)
    assert.ok(
      container.querySelector('tbody .leaderboard-rank')?.textContent === '10',
      'search preserves global rank',
    )
    await typeSearch('learner 11')
    assert.equal(container.querySelector('tbody'), null, 'search cannot reveal rank 11')
    await typeSearch('learner 25')
    assert.equal(container.querySelector('tbody'), null, 'search cannot reveal the current learner outside the top 10')
    await typeSearch('Nobody matches this')
    assert.ok(container.textContent?.includes('No learners found'))
    assert.ok(
      !container.textContent?.includes(
        'Your next session could put you on the board',
      ),
      'search does not turn a populated board into a global empty state',
    )
    await act(async () => button('Clear search').click())
    assert.equal(container.querySelectorAll('tbody tr').length, 10)
    await act(async () => button('All Time').click())
    assert.equal(
      container.querySelector('tbody'),
      null,
      'old period rows disappear while another period loads',
    )
    await act(async () => button('Last 30 days').click())
    await flush()
    assert.equal(button('Last 30 days').getAttribute('aria-pressed'), 'true')
    assert.equal(container.querySelectorAll('tbody tr').length, 10, 'the monthly board also shows only the top 10')
    await act(async () =>
      delayed!(
        response('all', [{ ...rows[0], fullName: 'Stale all-time leader' }]),
      ),
    )
    assert.ok(
      !container.textContent?.includes('Stale all-time leader'),
      'late responses cannot overwrite the active period',
    )
    assert.ok(
      signals.some((signal) => signal.aborted),
      'obsolete requests are cancelled',
    )
    fail = true
    await act(async () => button('Refresh').click())
    await flush()
    assert.ok(
      container
        .querySelector('[role="alert"]')
        ?.textContent?.includes('Offline'),
    )
    assert.equal(
      container.querySelector('tbody'),
      null,
      'failed reload does not present stale rankings',
    )
    assert.equal(
      container.querySelector('.leaderboard-empty'),
      null,
      'network errors are not described as no participants',
    )
    fail = false
    await act(async () => button('Retry').click())
    await flush()
    assert.equal(container.querySelectorAll('tbody tr').length, 10)
    await act(async () => i18n.changeLanguage('uz'))
    assert.ok(container.textContent?.includes('Oxirgi 7 kun'))
    assert.equal(
      container.querySelector<HTMLInputElement>('input[type="search"]')!
        .placeholder,
      'O‘quvchilarni qidirish',
    )
    console.log(
      'Leaderboard UI passed: top 10 only, restricted search, personal rank, server XP, missing results, period races, abort, error/retry and Uzbek copy.',
    )
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet
  }
}
