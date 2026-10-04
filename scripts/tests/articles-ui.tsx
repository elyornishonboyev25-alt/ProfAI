import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import assert from 'node:assert/strict'
import '../../src/i18n'
import Articles from '../../src/pages/Articles'
import ArticleReader from '../../src/pages/ArticleReader'
import ArticleCover from '../../src/components/articles/ArticleCover'
import VocabularyActivity from '../../src/pages/VocabularyActivity'
import { articles } from '../../src/data/articles'
import { addHighlight, addNote, getArticleBookmark, setReaderPrefs } from '../../src/utils/articleReaderStore'
import { saveArticleProgress } from '../../src/utils/articleProgressStore'

const container = document.getElementById('root')!
const compact = (text: string) => text.replace(/\s+/g, ' ').trim()
const curated = articles.filter(article => article.source)
export async function run() {
  localStorage.clear()
  for (const article of articles) {
    const cover = renderToStaticMarkup(<ArticleCover article={article} />)
    assert.ok(cover.includes('linear-gradient('), `${article.title}: existing generated cover`)
    assert.ok(!cover.includes('<img'), `${article.title}: no dependency on remote cover images`)
  }
  const first = curated[0], last = curated.at(-1)!
  saveArticleProgress(first.slug, 50)
  saveArticleProgress(last.slug, 100)
  let root = createRoot(container)
  await act(async () => root.render(<MemoryRouter initialEntries={['/articles']}><Articles /></MemoryRouter>))
  assert.equal(container.querySelectorAll('.liquid-article-card').length, 204)
  for (const article of articles) assert.ok(container.querySelector(`a[href="/articles/${article.slug}"]`), `${article.title}: catalog link`)
  assert.equal(container.querySelector(`a[href="/articles/${first.slug}"] progress`)?.getAttribute('value'), '50')
  const search = container.querySelector<HTMLInputElement>('input[type="search"]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(search, last.title)
    search.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
  assert.ok(container.querySelector(`a[href="/articles/${last.slug}"]`), 'New articles are searchable')
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(search, '')
    search.dispatchEvent(new window.Event('input', { bubbles: true }))
    const filter = container.querySelector('select')!
    filter.value = 'Psychology'
    filter.dispatchEvent(new window.Event('change', { bubbles: true }))
  })
  assert.equal(container.querySelectorAll('.liquid-article-card').length, articles.filter(a => a.category === 'Psychology').length)
  await act(async () => root.unmount())

  const highlightText = first.blocks[1].text.slice(0, 45)
  addHighlight(first.slug, 1, highlightText, 'amber')
  addNote(first.slug, 'A useful reading note', highlightText)
  for (const article of [articles[0], first, curated[Math.floor(curated.length / 2)], last]) {
    root = createRoot(container)
    await act(async () => root.render(<MemoryRouter initialEntries={[`/articles/${article.slug}`]}><Routes><Route path="/articles/:slug" element={<ArticleReader />} /></Routes></MemoryRouter>))
    for (const [index, block] of article.blocks.entries()) {
      const rendered = container.querySelector(`[data-block-index="${index}"]`)!
      assert.ok(rendered, `${article.title}: block ${index}`)
      assert.equal(compact(rendered.textContent!), compact(block.text), `${article.title}: complete block text`)
    }
    assert.equal(container.querySelectorAll('article footer').length, article.source ? 1 : 0)
    if (article.source) {
      assert.ok(container.querySelector(`footer a[href="${article.source.url}"]`))
      assert.ok(container.textContent!.includes(article.source.copyright))
      assert.ok(container.querySelector(`a[href="/vocabulary/articles/${article.slug}"]`))
    }
    if (article === first) {
      assert.equal(container.querySelector('mark')?.textContent, highlightText, 'Saved highlight survives opening an imported article')
      await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Bookmark article"]')!.click())
      assert.ok(getArticleBookmark(first.slug))
      await act(async () => setReaderPrefs({ theme: 'dark' }))
      assert.ok(container.querySelector('footer')?.className.includes('text-slate-400'), 'Source credits follow the reader theme')
    }
    await act(async () => root.unmount())
  }
  root = createRoot(container)
  await act(async () => root.render(<MemoryRouter initialEntries={[`/articles/${first.slug}`]}><Routes><Route path="/articles/:slug" element={<ArticleReader />} /></Routes></MemoryRouter>))
  assert.equal(container.querySelector('button[aria-label="Remove article bookmark"]')?.getAttribute('aria-pressed'), 'true', 'Bookmark persists after reopening')
  await act(async () => root.unmount())
  for (const article of [first, last]) {
    root = createRoot(container)
    await act(async () => root.render(<MemoryRouter initialEntries={[`/vocabulary/articles/${article.slug}/flashcards`]}><Routes><Route path="/vocabulary/articles/:articleSlug/:activity?" element={<VocabularyActivity />} /></Routes></MemoryRouter>))
    assert.ok(container.textContent!.includes(article.title), 'Imported vocabulary uses the existing activity route')
    assert.ok(container.textContent!.includes(article.vocabulary[0].term), 'Source glossary loads into flashcards')
    await act(async () => root.unmount())
  }
  console.log('PASS: 204 shared covers/cards, search, category filters, reader text, source credits, saved highlights/bookmarks, themes and vocabulary routes.')
}
