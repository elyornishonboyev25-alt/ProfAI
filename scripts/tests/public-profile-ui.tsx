import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import PublicProfile from '../../src/pages/PublicProfile'
import { useAuthStore } from '../../src/store/authStore'
import { useBadgeStore } from '../../src/store/badgeStore'
import { pinBadge } from '../../src/lib/profileApi'
import type { PublicProfilePayload } from '../../src/lib/profileApi'
import { accountStorageFor } from '../../src/utils/accountStorage'
import { mergeLocalPublicProfilePerformance } from '../../src/utils/localProfilePerformance'
import { mergeProfileBadges } from '../../src/utils/profileBadges'

export async function run() {
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const records = ['IELTS_LISTENING', 'IELTS_READING', 'IELTS_WRITING', 'IELTS_SPEAKING', 'IELTS_OVERALL', 'SAT_MATH', 'SAT_ENGLISH', 'SAT_OVERALL', 'SAT_MATH'] as const
  let payload: PublicProfilePayload = {
    profile: { nickname: 'learner', displayName: 'learner', avatarUrl: null, level: 2, xp: 100, streak: 0, longestStreak: 0,
      memberSince: '2026-01-01', online: true, lastSeen: null, isSelf: true, bio: 'Saved bio', country: 'Uzbekistan', fieldOfStudy: 'Computer Science' },
    visibility: { showBadges: true, showResults: true, showLeaderboard: true, showUniversity: true },
    stats: { totalAttempts: 0, averageScore: 0, averageAccuracy: 0 }, skillAnalytics: null, competitive: null,
    university: null, xpBreakdown: [], badges: records.map((track, i) => ({
      id: String(i), userId: 'owner', track, tier: i === 8 ? 8 : 7, band: track.startsWith('SAT') ? (track === 'SAT_OVERALL' ? 1510 : 710) : 7,
      pinned: i === 7, source: 'mock', unlockedAt: '2026-01-01', updatedAt: '2026-01-01',
    })),
  }
  useAuthStore.setState({ user: { id: 'owner', fullName: 'Learner', nickname: 'learner', email: 'private@example.test', role: 'USER',
    premium: false, xp: 100, level: 2, currentStreak: 0 }, accessToken: 'test' })
  useBadgeStore.setState({ records: [
    { userId: 'owner', track: 'SAT_MATH', tier: 7, band: 710, unlockedAt: '2026-01-01' },
    { userId: 'owner', track: 'IELTS_READING', tier: 9, band: 9, unlockedAt: '2026-01-01' },
    { userId: 'other', track: 'IELTS_WRITING', tier: 9, band: 9, unlockedAt: '2026-01-01' },
  ] })
  assert.equal(mergeProfileBadges(payload.badges, useBadgeStore.getState().records, 'owner').length, 10)
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/profile/badges/pin')) {
      const patch = JSON.parse(String(options?.body))
      payload = { ...payload, badges: payload.badges.map((b) => b.id === patch.id ? { ...b, pinned: patch.pinned } : b) }
      return Response.json({ badge: payload.badges.find((b) => b.id === patch.id) })
    }
    assert.ok(String(url).includes('/profile/public/learner'))
    return Response.json(payload)
  }
  await act(async () => root.render(<MemoryRouter initialEntries={['/public/learner']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes><Route path="/public/:nickname" element={<PublicProfile />} /></Routes>
  </MemoryRouter>))
  const badgeCards = () => [...container.querySelectorAll('article')].find((el) => el.textContent?.includes('Achievement badges'))!
  const cards = () => badgeCards().querySelectorAll('.achievement-card')
  assert.equal(cards().length, 10, 'All badges render, including unpinned, ninth and owner offline badges')
  assert.match(badgeCards().textContent!, /SAT Master/)
  assert.equal(cards()[0].getAttribute('data-pinned'), 'true', 'Pinned badges appear first in the new card design')
  assert.match(cards()[0].textContent!, /Tier 7/)
  assert.equal(cards()[0].querySelector('.achievement-card__score strong')?.textContent, '1510')
  assert.match(container.textContent!, /Computer Science/)
  assert.match(container.textContent!, /Saved bio/)
  assert.ok(!container.textContent!.includes('private@example.test'))
  await act(async () => { await pinBadge('7', false) })
  assert.ok(!badgeCards().textContent!.includes('Pinned'), 'Saved pin changes refresh the public profile')
  assert.equal(cards().length, 10, 'Unpinning never removes badges')
  payload = { ...payload, profile: { ...payload.profile, isSelf: false, bio: 'Updated bio' } }
  await act(async () => window.dispatchEvent(new Event('focus')))
  assert.equal(cards().length, 9, 'Another learner never receives owner local badges')
  assert.match(container.textContent!, /Updated bio/, 'Returning to the page refreshes saved fields')
  payload = { ...payload, visibility: { ...payload.visibility, showBadges: false, showResults: false }, badges: [], stats: null }
  await act(async () => window.dispatchEvent(new Event('smarttest:profile-updated')))
  assert.ok(!container.textContent!.includes('Achievement badges'))
  assert.ok(!container.textContent!.includes('Skill averages'), 'Section privacy stays effective')
  const storage = accountStorageFor('owner')
  const historyKey = 'smarttest-writing-analysis-v1:owner'
  storage.setItem(historyKey, JSON.stringify([{
    attemptKey: 'saved-writing', savedAt: '2026-10-08T00:00:00.000Z', testTitle: 'Essay',
    taskType: 'task2', overallBand: 7.5, timeSpent: 2400, xpAwarded: 0,
  }]))
  const statsPayload = { ...payload, profile: { ...payload.profile, isSelf: true },
    visibility: { ...payload.visibility, showResults: true },
    stats: { totalAttempts: 1, averageScore: 83.33, averageAccuracy: 83.33 },
    recentAttempts: [{ completedAt: '2026-10-08T00:00:00.000Z', test: { title: 'IELTS Writing Essay', category: 'IELTS' as const } }],
  }
  assert.equal(mergeLocalPublicProfilePerformance(statsPayload, 'owner').stats!.totalAttempts, 1,
    'A server result also saved on the device is counted once, as on the main profile')
  const unsynced = mergeLocalPublicProfilePerformance({ ...statsPayload, recentAttempts: [] }, 'owner')
  assert.equal(unsynced.stats!.totalAttempts, 2, 'A genuinely unsynced result is included')
  assert.equal(unsynced.stats!.averageScore, 83.33, 'Both profile views retain the same precision')
  storage.removeItem(historyKey)
  await act(async () => root.unmount())
  console.log('Public profile passed: complete badge collection, matching labels, account isolation, privacy and saved changes refresh.')
}
