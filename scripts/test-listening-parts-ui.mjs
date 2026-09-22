import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const { JSDOM } = requireBackend('jsdom')

async function main() {
  const directory = await mkdtemp(join(tmpdir(), 'profai-listening-parts-'))
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:5173', pretendToBeVisual: true })
  try {
    for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLMediaElement', 'Element', 'Node', 'CustomEvent', 'Event', 'SVGElement', 'getComputedStyle', 'AbortController', 'AbortSignal']) {
      globalThis[key] = dom.window[key]
    }
    Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
    globalThis.localStorage = dom.window.localStorage
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
    globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
    globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
    dom.window.scrollTo = () => {}
    dom.window.HTMLElement.prototype.scrollIntoView = () => {}
    dom.window.HTMLMediaElement.prototype.play = () => Promise.resolve()
    dom.window.HTMLMediaElement.prototype.pause = () => {}
    dom.window.HTMLMediaElement.prototype.load = () => {}
    dom.window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })
    const outfile = join(directory, 'suite.cjs')
    await build({
      entryPoints: ['scripts/tests/listening-parts-ui.tsx'], bundle: true, platform: 'node', format: 'cjs',
      outfile, tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}' }, external: ['node:assert/strict'],
    })
    await createRequire(import.meta.url)(outfile).run()
  } finally {
    dom.window.close()
    await rm(directory, { recursive: true, force: true })
  }
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1) })
