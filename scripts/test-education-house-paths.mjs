import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const drawing = JSON.parse(await readFile('src/assets/ielts/education-house-paths.json', 'utf8'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
assert.equal(hash(await readFile('src/assets/ielts/listening-test14-education-house.jpg')), drawing.sourceSha256)
assert.equal(drawing.width, 860)
assert.equal(drawing.height, 680)
const rgb = Buffer.alloc(860 * 680 * 3, 255)
for (const { fill, d } of drawing.paths) {
  assert.match(fill, /^#[a-f0-9]{6}$/)
  const color = Number.parseInt(fill.slice(1), 16)
  const rectangles = [...d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)z/g)]
  assert.equal(rectangles.map(match => match[0]).join(''), d)
  for (const [, xText, yText, wText, hText, closeText] of rectangles) {
    const [x, y, w, h] = [xText, yText, wText, hText].map(Number)
    assert.equal(wText, closeText)
    assert.ok(w > 0 && h > 0 && x + w <= 860 && y + h <= 680)
    for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) {
      const index = (row * 860 + col) * 3
      rgb[index] = color >> 16; rgb[index + 1] = color >> 8; rgb[index + 2] = color
    }
  }
}
// Independent checksum of all RGB pixels decoded from the original JPEG.
assert.equal(hash(rgb), '88e1e091fced059b6056b80193fd10689f52ff582e8bfe9b2221de5f2560e143')
console.log('PASS: all 584,800 original diagram pixels preserved in native paths')
