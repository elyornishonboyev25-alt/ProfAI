import React, { act } from 'react'
import i18n from '../../src/i18n'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import PublicProfile from '../../src/pages/PublicProfile'
import { useAuthStore } from '../../src/store/authStore'
import { useBadgeStore } from '../../src/store/badgeStore'
import { pinBadge } from '../../src/lib/profileApi'
import type { PublicProfilePayload } from '../../src/lib/profileApi'
import { accountStorageFor } from '../../src/utils/accountStorage'
import { mergeProfileBadges } from '../../src/utils/profileBadges'

export async function run() {
  await i18n.changeLanguage('en')
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
  assert.equal(badgeCards().querySelectorAll('.achievement-card').length, 9, 'Only saved badges render for every viewer, including unpinned and ninth badges')
  assert.match(badgeCards().textContent!, /SAT Master/)
  const satCard = [...badgeCards().querySelectorAll('.achievement-card')].find((card) => card.querySelector('h3')?.textContent === 'SAT Master')!
  assert.match(satCard.textContent!, /Tier 7/)
  assert.match(satCard.querySelector('.achievement-card__score')!.textContent!, /1510/)
  assert.match(container.textContent!, /Computer Science/)
  assert.match(container.textContent!, /Saved bio/)
  assert.ok(!container.textContent!.includes('private@example.test'))
  await act(async () => { await pinBadge('7', false) })
  assert.ok(!badgeCards().textContent!.includes('Pinned'), 'Saved pin changes refresh the public profile')
  assert.equal(badgeCards().querySelectorAll('.achievement-card').length, 9, 'Unpinning never removes saved badges')
  payload = { ...payload, profile: { ...payload.profile, isSelf: false, bio: 'Updated bio' } }
  await act(async () => window.dispatchEvent(new Event('focus')))
  assert.equal(badgeCards().querySelectorAll('.achievement-card').length, 9, 'Another learner never receives owner local badges')
  assert.match(container.textContent!, /Updated bio/, 'Returning to the page refreshes saved fields')
  payload = { ...payload, visibility: { ...payload.visibility, showBadges: false, showResults: false }, badges: [], stats: null }
  await act(async () => window.dispatchEvent(new Event('smarttest:profile-updated')))
  assert.ok(!container.textContent!.includes('Achievement badges'))
  assert.ok(!container.textContent!.includes('Skill averages'), 'Section privacy stays effective')
  payload = { ...payload, profile: { ...payload.profile, premium: true, isSelf: false } }
  await act(async () => window.dispatchEvent(new Event('smarttest:profile-updated')))
  assert.ok(container.querySelector('.premium-identity-badge'), 'Premium is visible on another learner’s profile')
  assert.ok(container.querySelector('.premium-member-hero'), 'Premium profiles have the gold identity treatment')
  assert.ok(!container.textContent!.includes('private@example.test'), 'The public profile does not display an email')
  payload = { ...payload, profile: { ...payload.profile, premium: false } }
  await act(async () => window.dispatchEvent(new Event('smarttest:profile-updated')))
  assert.ok(!container.querySelector('.premium-identity-badge'), 'A refreshed expired subscription removes the badge')
  assert.ok(!container.querySelector('.premium-member-hero'), 'Free profiles keep their standard appearance')
  const storage = accountStorageFor('owner')
  const historyKey = 'smarttest-writing-analysis-v1:owner'
  storage.setItem(historyKey, JSON.stringify([{
    attemptKey: 'saved-writing', savedAt: '2026-10-08T00:00:00.000Z', testTitle: 'Essay',
    taskType: 'task2', overallBand: 7.5, timeSpent: 2400, xpAwarded: 0,
  }]))
  payload = { ...payload, profile: { ...payload.profile, isSelf: true, xp: 781 },
    visibility: { ...payload.visibility, showResults: true, showBadges: true },
    stats: { totalAttempts: 6, averageScore: 59.5, averageAccuracy: 59.5 },
    xpBreakdown: [{ source: 'TEST', amount: 511 }, { source: 'DAILY_LOGIN', amount: 270 }],
    competitive: { rank: 3, division: 'GOLD', divisionLabel: 'Gold', rankingScore: 781 },
  }
  await act(async () => window.dispatchEvent(new Event('smarttest:attempt-submitted')))
  const statValues = () => [...container.querySelectorAll('.surface-card.p-4 > p')].map((node) => node.textContent)
  assert.deepEqual(statValues(), ['6', '59.5%', '59.5%', '#3'], 'Unsynced device records cannot change public test totals or averages')
  const ownerSections = [...container.querySelectorAll('article')].map((node) => node.textContent)
  const ownerHero = container.querySelector('section')!.textContent!
  assert.match(ownerHero, /781 XP/)
  assert.ok(!ownerHero.includes('850 XP'), 'Local estimated XP cannot inflate the public total')
  assert.ok(!container.textContent!.includes('Saved practice'), 'Device history cannot invent an XP source')
  payload = { ...payload, profile: { ...payload.profile, isSelf: false } }
  await act(async () => {
    useAuthStore.setState({ user: { ...useAuthStore.getState().user!, id: 'visitor' } })
    window.dispatchEvent(new Event('focus'))
  })
  assert.deepEqual([...container.querySelectorAll('article')].map((node) => node.textContent), ownerSections,
    'Stats, XP sources, badges, skills and rank are identical for the owner and another account')
  assert.match(container.querySelector('section')!.textContent!, /781 XP/)
  assert.deepEqual(statValues(), ['6', '59.5%', '59.5%', '#3'])
  storage.removeItem(historyKey)
  const successfulFetch = globalThis.fetch
  globalThis.fetch = async () => Response.json({ message: 'Temporarily unavailable' }, { status: 503 })
  await act(async () => window.dispatchEvent(new Event('focus')))
  assert.ok(container.textContent!.includes('Could not load this profile.'))
  assert.ok(!container.textContent!.includes('Profile not found'), 'A server failure is never presented as a missing profile or zero result')
  globalThis.fetch = successfulFetch
  const retry = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Try again')!
  await act(async () => retry.click())
  assert.ok(container.textContent!.includes('781 XP'), 'Retry restores the verified profile')
  await act(async () => root.unmount())
  console.log('Public profile passed: complete badge collection, matching labels, account isolation, privacy and saved changes refresh.')
}
