import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import TestLibraryCatalog from '@/components/catalog/TestLibraryCatalog'
import { TestLibraryContext } from '@/components/catalog/TestLibraryContext'
import type { CompactIeltsTestRow } from '@/components/catalog/CompactIeltsCatalog'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'
import i18n from '@/i18n'

export async function run() {
  localStorage.clear()
  await i18n.changeLanguage('en')
  useAuthStore.setState({ user: { id: 'library-owner' } as AuthUser })
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const launched: string[] = []
  let clearedSearch = false
  const rows: CompactIeltsTestRow[] = [
    { id: 'ielts-listening-1', number: 1, title: 'Listening Full Test 1', subtitle: 'Complete academic listening simulation', badge: 'Full test', detail: '4 parts · 40 questions', durationMinutes: 30, available: true, completed: true, band: 0, scoreLabel: '0/40 correct' },
    { id: 'ielts-listening-2', number: 2, title: 'Listening Full Test 2', subtitle: 'Complete academic listening simulation', badge: 'Full test', detail: '4 parts · 40 questions', durationMinutes: 30, available: true },
    { id: 'unavailable', number: 3, title: 'Listening Full Test 3', subtitle: 'New full test in preparation', badge: 'Full test', detail: '4 parts · 40 questions', available: false },
  ]
  const render = (search = '') => act(async () => root.render(<MemoryRouter><TestLibraryContext.Provider value={{ search, onSearchChange: () => { clearedSearch = true } }}><TestLibraryCatalog section="listening" embedded rows={rows} searchTerm="" onSearchChange={() => {}} onBack={() => {}} onLaunch={row => launched.push(row.id)} /></TestLibraryContext.Provider></MemoryRouter>))
  const cards = () => [...container.querySelectorAll<HTMLElement>('.tl-card')]
  const changeSelect = async (selector: string, value: string) => act(async () => {
    const select = container.querySelector<HTMLSelectElement>(selector)!
    select.value = value
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  try {
    await render()
    assert.equal(cards().length, 3)
    const originalImages = cards().map(card => card.querySelector<HTMLImageElement>('.tl-card-landscape')!.getAttribute('src'))
    assert.equal(new Set(originalImages).size, cards().length, 'each test has its own landscape asset')
    assert.match(container.querySelector('.tl-stats')!.textContent!, /2Available1Completed50%/)
    assert.match(cards()[0].textContent!, /Band 0\.0/, 'a zero band is a valid real result')
    assert.equal(cards()[0].querySelector('progress')!.value, 0)
    assert.equal(cards()[1].querySelector('.tl-performance'), null, 'uncompleted tests have no invented score')
    assert.equal(cards()[2].querySelector('button.tl-launch')!.hasAttribute('disabled'), true)
    await act(async () => cards()[0].querySelector<HTMLButtonElement>('.tl-launch')!.click())
    assert.deepEqual(launched, ['ielts-listening-1'], 'the existing access-checked launch callback runs')
    await render('Full Test 2')
    assert.equal(cards().length, 1)
    assert.match(cards()[0].textContent!, /Listening Full Test 2/)
    assert.match(container.querySelector('.tl-stats')!.textContent!, /2Available1Completed50%/, 'search does not change completion statistics')
    await render()
    await changeSelect('.tl-sort select', 'newest')
    assert.match(cards()[0].textContent!, /Listening Full Test 3/)
    assert.equal(cards()[0].querySelector('.tl-card-landscape')!.getAttribute('src'), originalImages[2], 'sorting preserves each test’s own image')
    await changeSelect('.tl-sort select', 'catalog')
    await act(async () => cards()[1].querySelector<HTMLButtonElement>('.tl-bookmark')!.click())
    await act(async () => container.querySelector<HTMLInputElement>('.tl-checkbox input')!.click())
    assert.equal(cards().length, 1)
    assert.match(cards()[0].textContent!, /Listening Full Test 2/)
    await act(async () => useAuthStore.setState({ user: { id: 'other-library-owner' } as AuthUser }))
    assert.equal(cards().length, 0, 'bookmarks never leak across accounts')
    await act(async () => container.querySelector<HTMLButtonElement>('.tl-empty button')!.click())
    assert.equal(cards().length, 3)
    assert.equal(clearedSearch, true, 'reset also clears the header query')
    await changeSelect('.tl-filter-popover select', 'completed')
    assert.equal(cards().length, 1)
    assert.match(cards()[0].textContent!, /Listening Full Test 1/)
    console.log('PASS: premium library real scores, stable statistics, search, sorting, filters, disabled tests, launch and account-scoped bookmarks')
  } finally { await act(async () => root.unmount()) }
}
