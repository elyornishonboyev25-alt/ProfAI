// Local British English neural narration. See docs/FULL_MOCK_INTROS.md for setup/licensing.
import { spawnSync } from 'node:child_process'
import { readFile, mkdir, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
const output = process.argv[2]
if (!output) throw new Error('Usage: node scripts/record-ielts-intro-voice.mjs <output-directory>')
await mkdir(output, { recursive: true })
const executable = resolve(process.env.IELTS_INTRO_PIPER || 'tmp/intro-voice/piper/piper.exe')
const model = resolve(process.env.IELTS_INTRO_VOICE || 'tmp/intro-voice/en_GB-cori-high.onnx')
const catalog = JSON.parse(await readFile(new URL('../src/data/fullMockIntros.json', import.meta.url), 'utf8'))
const requests = []
for (const [section, intro] of Object.entries(catalog)) {
  for (const [index, scene] of intro.scenes.entries()) {
    const file = resolve(output, `${section}-${index}.wav`)
    // Resume a deliberately supplied working directory after interrupted generation.
    if (process.env.IELTS_INTRO_VOICE_DIR && await stat(file).then(value => value.size > 44).catch(() => false)) continue
    requests.push({ text: scene.text, output_file: file })
  }
}
if (requests.length) {
  console.log(`Synthesizing ${requests.length} neural narration chapters…`)
  const result = spawnSync(executable, ['--model', model, '--json-input', '--length_scale', '1.08', '--sentence_silence', '0.45'], {
    cwd: dirname(executable), input: requests.map(value => JSON.stringify(value)).join('\n') + '\n', encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`Neural narration failed (${result.status}): ${result.error?.message || result.stderr}`)
}
console.log('All neural narration chapters ready')
