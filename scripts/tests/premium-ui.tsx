import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import Premium from '../../src/pages/Premium'
import { Sidebar } from '../../src/components/layout/Sidebar'
import { useAuthStore } from '../../src/store/authStore'
import { useCommunityTrial, useFeatureTrial } from '../../src/hooks/useFeatureTrial'
import { isPremiumUser as clientPremium } from '../../src/utils/premiumAccess'
import { isPremiumUser as serverPremium } from '../../backend/src/utils/premium'
import type { AuthUser } from '../../src/types/platform'
import i18n from '../../src/i18n'

function TrialStatus() {
  const practice = useFeatureTrial('writing')
  const community = useCommunityTrial()
  return <output data-testid="trial-status">{JSON.stringify({
    practiceUnlimited: practice.remaining === Infinity && !practice.locked,
    communityUnlimited: community.secondsRemaining === Infinity && !community.locked,
  })}</output>
}

export async function run() {
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const base: AuthUser = {
    id: 'premium-ui-test', fullName: 'Test learner', email: 'learner@example.test',
    nickname: 'ordinary-learner', role: 'USER', premium: false,
    xp: 0, level: 1, currentStreak: 0, onboardingCompleted: true,
  }
  localStorage.setItem('profai:free-trial:v1', JSON.stringify({ [base.id]: { writing: 999, communitySeconds: 999999 } }))
  await act(async () => root.render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Premium /><Sidebar onToggle={() => {}} /><TrialStatus />
    </MemoryRouter>,
  ))
  try {
    for (const user of [null, base, { ...base, premium: true }]) {
      await act(async () => useAuthStore.setState({ user }))
      assert.ok(container.querySelector('a[href*="t.me/"]'), 'Guests and free users can view purchase options')
      assert.equal(container.querySelector('#premium-status-title'), null)
      assert.equal(container.querySelector('.liquid-upgrade-link')?.textContent, 'Upgrade')
      assert.equal(container.querySelector('output')?.textContent, '{"practiceUnlimited":false,"communityUnlimited":false}')
    }
    for (const identity of [
      { nickname: 'erkinov' }, { nickname: ' ERKINOV ' }, { nickname: 'erkinov7' },
      { nickname: 'firdavs' }, { email: 'erkiinov09@gmail.com' }, { role: 'ADMIN' as const },
    ]) {
      const user = { ...base, ...identity }
      assert.equal(clientPremium(user), true)
      assert.equal(serverPremium(user), true)
      await act(async () => useAuthStore.setState({ user }))
      assert.equal(container.querySelector('#premium-status-title')?.textContent, 'Unlimited is active')
      assert.equal(container.querySelector('a[href*="t.me/"]'), null, 'Premium owners are never asked to purchase again')
      assert.equal(container.querySelector('.liquid-upgrade-link')?.textContent, 'Unlimited')
      assert.equal(container.querySelector('output')?.textContent, '{"practiceUnlimited":true,"communityUnlimited":true}')
    }
    await act(async () => i18n.changeLanguage('uz'))
    assert.equal(container.querySelector('#premium-status-title')?.textContent, 'Cheksiz tarif faol')
    await act(async () => i18n.changeLanguage('ru'))
    assert.equal(container.querySelector('#premium-status-title')?.textContent, 'Безлимитный тариф активен')
    console.log('Premium UI passed: active plan, purchase visibility, sidebar, exhausted trial bypass, identity matching and translations.')
  } finally {
    await act(async () => root.unmount())
  }
}
