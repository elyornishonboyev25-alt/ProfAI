import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

async function main() {
  const catalog = JSON.parse(await readFile('backend/src/data/educationalMedia.json', 'utf8'))
  const all = []
  for (const kind of ['shadowing', 'podcasts']) {
    assert.equal(catalog[kind].length, kind === 'podcasts' ? 300 : 22)
    for (const item of catalog[kind]) {
      assert.match(item.youtubeId, /^[\w-]{11}$/)
      assert.equal(item.sourceUrl, `https://www.youtube.com/watch?v=${item.youtubeId}`)
      assert.ok((kind === 'shadowing' ? ['American Film Institute', 'Jimmy Kimmel Live', 'Access Hollywood', 'Brandon Murray', 'Simon Sinek', 'TNT', 'BBC', 'The Rock', 'grazef6'] : ['BBC Learning English', 'VOA Learning English', 'Think Fast, Talk Smart', 'College Essay Guy']).includes(item.source))
      assert.ok(item.thumbnailUrl && item.channelUrl && item.focus && item.verifiedAt)
      assert.ok(item.durationSec > 15 && item.durationSec <= (kind === 'shadowing' ? 120 : 10800))
      assert.ok(['A2', 'B1', 'B2', 'C1'].includes(item.cefr))
      all.push(item.youtubeId)
    }
  }
  assert.equal(new Set(all).size, 322, '322 unique videos across both libraries')
  assert.equal(catalog.shadowing[0].youtubeId, 'sANOOw_MeK0', 'First lesson is clear natural speech by Morgan Freeman')
  assert.ok(catalog.shadowing.every(item => ['Actors', 'Motivation'].includes(item.category)))
  const normalizedTitles = catalog.podcasts.map(item => item.title.toLowerCase().replace(/English Rewind|6 Minute English|Real Easy English|BBC Learning English/gi, '').replace(/[^a-z0-9]/g, ''))
  assert.equal(new Set(normalizedTitles).size, 300, 'No duplicate podcast titles after series-label normalization')
  assert.equal(catalog.podcasts.slice(100).filter(item => item.source === 'BBC Learning English').length, 120)
  assert.equal(catalog.podcasts.slice(100).filter(item => item.source === 'Think Fast, Talk Smart').length, 80)
  assert.equal(catalog.podcasts.filter(item => item.category === 'Admissions').length, 15)
  console.log('PASS: catalog counts, uniqueness, approved sources, valid metadata and duration bounds')

  const directory = await mkdtemp(join(tmpdir(), 'profai-learning-ui-'))
  const apiBundle = join(directory, 'api.cjs')
  const mocks = {
    auth: `export const requireAuth = (req, res, next) => { if (req.originalUrl.startsWith('/recordings') && !req.headers.authorization) return res.status(401).json({message:'Authentication required.'}); req.user = {id:'test-user'}; next(); }; export const requireVideoSubmissionAccess = requireAuth;`,
    prisma: `const delegate = { findUnique: async ({where}) => where.youtubeId === 'sANOOw_MeK0' ? {title:'Legacy metadata',author:'Legacy source',captionKind:'manual',wordCount:10,segments:[{id:'one',orderIndex:0,startSec:0,endSec:3,text:'Synthetic cached cue.'},{id:'two',orderIndex:1,startSec:3,endSec:6,text:'Another synthetic cached cue.'}]} : null, upsert: async () => null }; const recordings = new Map(); const recordingDelegate = { upsert: async ({where, create}) => { const key = JSON.stringify(where); if (!recordings.has(key)) recordings.set(key, {id:'c000000000000000000000000', ...create, createdAt:new Date()}); return recordings.get(key); }, findUnique: async ({where, select}) => { const value = [...recordings.values()].find(row => row.id === where.id); return value ? Object.fromEntries(Object.keys(select).map(key => [key,value[key]])) : null; } }; export const prisma = { shadowingVideo: delegate, podcastVideo: delegate, shadowingRecording: recordingDelegate };`,
    captions: `export const extractYouTubeId = input => input.match(/[?&]v=([\\w-]{11})/)?.[1] ?? null;
      export async function buildShadowingDraft() { globalThis.__mediaExtractions = (globalThis.__mediaExtractions || 0) + 1; return {captionKind:'manual',wordCount:10,segments:[{orderIndex:0,startSec:0,endSec:3,text:'Synthetic educational cue for testing.'},{orderIndex:1,startSec:3,endSec:6,text:'Another synthetic cue for testing.'}]}; }
      export const buildPodcastDraft = buildShadowingDraft;`,
  }
  await build({ entryPoints: ['scripts/tests/educational-media-api.ts'], bundle: true, platform: 'node', format: 'cjs', outfile: apiBundle, external: ['node:assert/strict'], plugins: [{ name: 'isolated-media-api', setup(build) {
    build.onResolve({ filter: /\/middleware\/(?:auth|videoSubmissionAccess)\.js$/ }, () => ({ path: 'auth', namespace: 'media-test' }))
    build.onResolve({ filter: /\/lib\/prisma\.js$/ }, () => ({ path: 'prisma', namespace: 'media-test' }))
    build.onResolve({ filter: /shadowing\.service\.js$/ }, () => ({ path: 'captions', namespace: 'media-test' }))
    build.onLoad({ filter: /.*/, namespace: 'media-test' }, args => ({ contents: mocks[args.path], loader: 'js' }))
  } }] })
  await createRequire(import.meta.url)(apiBundle).run()

  const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
  const { JSDOM } = requireBackend('jsdom')
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:5199', pretendToBeVisual: true })
  try {
    for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'CustomEvent', 'Event', 'SVGElement', 'getComputedStyle']) globalThis[key] = dom.window[key]
    Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
    globalThis.localStorage = dom.window.localStorage
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
    globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
    globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
    dom.window.scrollTo = () => {}
    dom.window.HTMLMediaElement.prototype.pause = function () {}
    dom.window.HTMLElement.prototype.scrollIntoView = () => {}
    dom.window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })
    const outfile = join(directory, 'suite.cjs')
    await build({ entryPoints: ['scripts/tests/educational-media-ui.tsx'], bundle: true, platform: 'node', format: 'cjs', outfile, tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}' }, external: ['node:assert/strict'], sourcemap: 'inline', loader: { '.css': 'empty' }, plugins: [{ name: 'isolated-media-access', setup(build) {
      // Billing has its own access tests. These fixtures exercise opened lessons.
      build.onResolve({ filter: /\/billing\/AccessGate$/ }, () => ({ path: 'access', namespace: 'media-access-test' }))
      build.onLoad({ filter: /.*/, namespace: 'media-access-test' }, () => ({ contents: 'import {useEffect} from "react"; export default function AccessGate({children,onUnlocked,resource}) { useEffect(() => { onUnlocked?.() }, [resource]); return children }', loader: 'js', resolveDir: process.cwd() }))
    } }] })
    await createRequire(import.meta.url)(outfile).run()
  } finally { dom.window.close(); await rm(directory, { recursive: true, force: true }) }
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1) })
