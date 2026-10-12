import { saveTestAudio, readTestAudio, deleteAccountTestAudio } from '@/utils/testAudioStorage'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '../../src/i18n'
import SATSourceContent from '../../src/components/sat/SATSourceContent'
import SATTextHighlights from '../../src/components/sat/SATTextHighlights'
import ArticleReader from '../../src/pages/ArticleReader'
import IELTSReadingInterface from '../../src/components/IELTSReadingInterface'
import { articles } from '../../src/data/articles'
import { resolveIeltsTestById } from '../../src/utils/ieltsTestCatalog'
import { addHighlight, clearHighlights, getHighlights } from '../../src/utils/articleReaderStore'
import { textRange, textOffsets, textClientRects } from '../../src/utils/textRanges'
import type { HighlightStroke } from '../../src/features/sat/practiceTest4'

const pause = () => new Promise(resolve => setTimeout(resolve, 180))
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
async function select(range: Range) {
  window.getSelection()!.removeAllRanges()
  window.getSelection()!.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  await pause()
}
function click(selector: string) {
  const button = document.querySelector<HTMLElement>(selector)
  check(button, `Missing ${selector}`)
  button.click()
}

export async function run() {
  localStorage.clear()
  const recording = new Blob(['saved speaking recording'], { type: 'audio/webm' })
  await saveTestAudio('persistence-test', 'attempt:answer', recording)
  const restored = await readTestAudio('persistence-test', 'attempt:answer')
  check(await restored?.text() === 'saved speaking recording', 'Speaking audio survives closing and reopening IndexedDB')
  check(restored?.type === 'audio/webm', 'Audio keeps its format')
  check(await readTestAudio('different-user', 'attempt:answer') === null, 'Speaking audio is account scoped')
  deleteAccountTestAudio('persistence-test')
  deleteAccountTestAudio('different-user')
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const text = 'Even in lyrics and essays the writer is to some extent a fictional hero with a fictional audience, for if the element of fictional projection disappeared completely, the writing would become direct address, or straight discursive writing, and cease to be literature.'
  const start = text.indexOf('fictional projection')
  let strokes: HighlightStroke[] = [{ id: 'saved', color: 'rgba(244,114,182,0.4)', width: 0, points: [], textRange: { block: 'context', start, end: start + 20, text: text.slice(start, start + 20) } }]
  let width = 180
  let readOnly = false
  const renderSAT = () => flushSync(() => root.render(<div style={{ width, font: '24px/2 Georgia' }}><SATTextHighlights strokes={strokes} enabled={!readOnly} onChange={next => { strokes = next; renderSAT() }}>
    <div data-sat-highlight-block="context">{text.slice(0, start)}<u>{text.slice(start, start + 20)}</u>{text.slice(start + 20)}</div>
  </SATTextHighlights></div>))
  renderSAT()
  await pause()
  const block = container.querySelector<HTMLElement>('[data-sat-highlight-block]')!
  const expected = textClientRects(block, textRange(block, start, start + 20)!)
  check(expected.length > 1, 'Fixture wraps the underlined phrase onto multiple lines')
  const boxes = [...container.querySelectorAll<HTMLElement>('[data-sat-highlight-id]')]
  check(boxes.length === expected.length, 'Only text fragments are painted, without a multiline element box')
  check(boxes.every(box => box.getBoundingClientRect().height < 40), 'Highlight never paints the gap between lines')
  check(boxes.every(box => getComputedStyle(box).pointerEvents === 'none'), 'Paint must allow native text selection through existing highlights')
  await select(textRange(block, start, start + 20)!)
  click('[aria-label="Highlight sky"]')
  await pause()
  check(strokes.length === 1 && strokes[0].color.includes('56,189'), 'Same range recolors without stacking')
  // Selecting across the existing highlight must retain both ends.
  await select(textRange(block, start - 5, start + 25)!)
  click('[aria-label="Highlight amber"]')
  await pause()
  check(strokes.length === 2, 'Can select across an existing highlight')
  check(!container.querySelector('[data-sat-highlight-id="' + strokes[0].id + '"]'), 'A covered highlight cannot darken the new color')
  const paint = container.querySelector<HTMLElement>('[data-sat-highlight-id]')!.getBoundingClientRect()
  const target = document.elementFromPoint(paint.left + 2, paint.top + paint.height / 2)!
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: paint.left + 2, clientY: paint.top + paint.height / 2 }))
  await pause()
  check(document.querySelector('[data-sat-highlight-menu]')?.textContent?.includes('Remove highlight'), 'Native text click opens a management menu that stays open after mouseup')
  click('[data-sat-highlight-menu] button')
  await pause()
  check(strokes.length === 1, 'Removal exposes the remaining saved highlight')
  for (const nextWidth of [280, 620]) {
    width = nextWidth
    renderSAT()
    await pause()
    const fragment = container.querySelector<HTMLElement>('[data-sat-highlight-id]')!.getBoundingClientRect()
    const leaf = textClientRects(block, textRange(block, start, start + 20)!)[0]
    check(Math.abs(fragment.left - leaf.left) < 1 && Math.abs(fragment.top - leaf.top) < 1, 'Highlight follows responsive reflow')
  }
  strokes = JSON.parse(JSON.stringify(strokes))
  readOnly = true
  renderSAT()
  check(container.querySelector('[data-sat-highlight-id]') && !container.querySelector('[role="button"]'), 'Saved review highlights render without editing controls')

  const article = articles[0]
  article.blocks[0].text = 'repeat repeat   spaced text and more words'
  article.vocabulary = []
  clearHighlights(article.slug)
  const renderArticle = () => flushSync(() => root.render(<MemoryRouter initialEntries={[`/articles/${article.slug}`]}><Routes><Route path="/articles/:slug" element={<ArticleReader />} /></Routes></MemoryRouter>))
  renderArticle()
  await pause()
  const paragraph = container.querySelector<HTMLElement>('[data-block-index="0"]')!
  await select(textRange(paragraph, 7, 15)!)
  click('[aria-label="Highlight emerald"]')
  await pause()
  const saved = getHighlights(article.slug)[0]
  check(saved.start === 7 && saved.end === 15 && saved.text === 'repeat  ', 'Article persists repeated text position and exact whitespace')
  check(textOffsets(paragraph, (() => { const r = document.createRange(); r.selectNodeContents(paragraph.querySelector('mark')!); return r })()).start === 7, 'Second repeated occurrence is highlighted')
  addHighlight(article.slug, 0, article.blocks[0].text.slice(10, 24), 'pink', { start: 10, end: 24 })
  await pause()
  check([...paragraph.querySelectorAll('mark')].map(mark => mark.textContent).join('') === article.blocks[0].text.slice(7, 24), 'Overlaps render their complete union without losing text')
  flushSync(() => root.render(<div />))
  renderArticle()
  await pause()
  check(container.querySelector('[data-block-index="0"]')!.textContent === article.blocks[0].text, 'Reopening retains exact article text and highlights')
  check(container.querySelectorAll('mark').length > 0, 'Article highlights survive reopening')

  const source = resolveIeltsTestById('ielts-reading-full-vol26')!
  const test = { ...source, sections: [source.sections[0]] }
  flushSync(() => root.render(<MemoryRouter><IELTSReadingInterface test={test} reviewPayload={{ result: { testId: test.id, date: '2026-10-11', score: 0, correctAnswers: 0, totalQuestions: test.totalQuestions, timeSpent: 0, answers: {} } }} onComplete={() => { throw new Error('Highlighting cannot submit') }} onExit={() => {}} /></MemoryRouter>))
  await pause()
  const pane = container.querySelector<HTMLElement>('#reading-passage-pane')!
  const prose = pane.querySelector<HTMLElement>('.ielts-reading-prose')!
  const original = pane.textContent
  await select(textRange(prose, 10, 35)!)
  click('[data-reading-selection-toolbar] button')
  await pause()
  check(prose.querySelector('.ielts-highlight'), 'IELTS creates a highlight')
  await select(textRange(prose, 20, 50)!)
  click('[data-reading-selection-toolbar] button')
  await pause()
  check([...prose.querySelectorAll('.ielts-highlight')].map(mark => mark.textContent).join('') === prose.textContent!.slice(10, 50), 'IELTS overlap preserves exact selection after unwrapping old marks')
  check(!prose.querySelector('.ielts-highlight .ielts-highlight'), 'IELTS does not nest highlight wrappers')
  check(pane.textContent === original, 'IELTS highlighting never loses passage text')
  const range = textRange(prose, 25, 40)!
  await select(range)
  click('[data-reading-selection-toolbar] button:nth-child(2)')
  await pause()
  check(prose.querySelector('.ielts-note'), 'IELTS notes can overlap a highlight')
  const saveNote = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Save note')!
  saveNote.click()
  await pause()
  const note = prose.querySelector<HTMLElement>('.ielts-note')!
  note.click()
  await pause()
  const deleteNote = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Delete note')!
  check(deleteNote, 'Note opens its management tools')
  deleteNote.click()
  await pause()
  check(!prose.querySelector('.ielts-note') && prose.querySelector('.ielts-highlight'), 'Deleting a note retains the overlapping highlight')
  check(pane.textContent === original, 'Removing notes leaves the passage intact')
  flushSync(() => root.unmount())
  return 'PASS'
}

// The screenshot's plain passage must never paint text on the next line.
export async function runSATGeometry(nativePaint = true) {
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const text = 'Radar and sonar can detect objects or people through walls, but they are too costly for consumer use. Researchers Fadel Adib and Dina Katabi have shown, however, that there may be a comparatively ______ alternative: small changes to the Wi-Fi technology used in smartphones can give users a cheap way to count people or even identify their gestures through walls.'
  const start = text.indexOf('however')
  const end = start + 16
  const stroke: HighlightStroke = { id: 'screenshot', color: 'rgba(56,189,248,0.40)', width: 0, points: [], textRange: { block: 'context', start, end, text: text.slice(start, end) } }
  for (const zoom of [0.7, 1, 1.2, 1.6]) for (const width of [380, 672, 880]) {
    flushSync(() => root.render(<div style={{ zoom, width, padding: 20 }}><SATTextHighlights strokes={[stroke]} enabled={false}>
      <div data-sat-highlight-block="context"><SATSourceContent html={'<p>' + text.replace('______', '<span>______</span>') + '</p>'} className="font-serif text-[18px] font-medium leading-[1.5]" /></div>
    </SATTextHighlights></div>))
    await pause()
    const block = container.querySelector<HTMLElement>('[data-sat-highlight-block]')!
    const glyphs = Array.from({ length: end - start }, (_, i) => textRange(block, start + i, start + i + 1)!.getBoundingClientRect())
    const paints = [...container.querySelectorAll<HTMLElement>('[data-sat-highlight-id]')].map(el => el.getBoundingClientRect())
    check(paints.length > 0, 'Screenshot highlight is restored')
    if (nativePaint) {
      check(typeof CSS.highlights !== 'undefined', 'Browser supports native text highlighting')
      const nativeHighlights = [...CSS.highlights].filter(([name]) => name.startsWith('sat-text-'))
      check(nativeHighlights.length === 1, 'Each saved highlight uses its own native text range')
      check([...nativeHighlights[0][1]].map(range => range.toString()).join('') === text.slice(start, end), 'Native paint contains only the selected text, never text on the following line')
      check([...container.querySelectorAll<HTMLElement>('[data-sat-highlight-id]')].every(el => getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)'), 'Management hit areas never paint rectangles over adjacent lines')
    } else {
      check([...container.querySelectorAll<HTMLElement>('[data-sat-highlight-id]')].every(el => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'), 'Browsers without native highlights still paint saved text highlights')
    }
    for (const paint of paints) {
      check(glyphs.some(glyph => Math.abs(paint.top - glyph.top) < 1 && Math.abs(paint.height - glyph.height) < 1), `Screenshot highlight paints only the selected line at width ${width}, zoom ${zoom}: ${JSON.stringify({ top: paint.top, height: paint.height, glyphs: glyphs.map(g=>({top:g.top,height:g.height})) })}`)
    }
  }
  flushSync(() => root.unmount())
  if (nativePaint) check(![...CSS.highlights.keys()].some(name => name.startsWith('sat-text-')), 'Unmount removes native highlight ranges and styles')
  return 'PASS'
}
