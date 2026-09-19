import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Reuse the backend's existing jsdom dependency; install backend dependencies
// before running this DOM integration suite. All generated files stay in /tmp.
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const { JSDOM } = requireBackend('jsdom')

async function main() {
  const directory = await mkdtemp(join(tmpdir(), 'profai-vocabulary-ui-'))
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:5173', pretendToBeVisual: true })
  try {
    for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'CustomEvent', 'Event', 'SVGElement', 'getComputedStyle', 'AbortController', 'AbortSignal']) {
      globalThis[key] = dom.window[key]
    }
    Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
    globalThis.localStorage = dom.window.localStorage
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
    globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
    globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
    dom.window.scrollTo = () => {}
    dom.window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })
    const outfile = join(directory, 'suite.cjs')
    await build({
      entryPoints: ['scripts/tests/vocabulary-ui.tsx'], bundle: true, platform: 'node', format: 'cjs',
      outfile, tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}' }, external: ['node:assert/strict'],
    })
    await createRequire(import.meta.url)(outfile).run()
  } finally {
    dom.window.close()
    await rm(directory, { recursive: true, force: true })
  }
}

// Imported app services may retain background timers after React unmounts.
main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1) })
