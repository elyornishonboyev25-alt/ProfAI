// Local Kokoro British English narration. See docs/FULL_MOCK_INTROS.md for setup/licensing.
import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
const output = process.argv[2]
if (!output) throw new Error('Usage: node scripts/record-ielts-intro-voice.mjs <output-directory>')
await mkdir(output, { recursive: true })
const python = resolve(process.env.IELTS_INTRO_PYTHON || 'tmp/kokoro-runtime/venv/Scripts/python.exe')
const result = spawnSync(python, [resolve('scripts/record-ielts-intro-voice.py'), resolve(output)], {
  windowsHide: true, stdio: 'inherit', env: { ...process.env, PYTHONUNBUFFERED: '1' },
})
if (result.status !== 0) throw new Error(`Narration failed (${result.status}): ${result.error?.message || 'See the synthesis output'}`)
