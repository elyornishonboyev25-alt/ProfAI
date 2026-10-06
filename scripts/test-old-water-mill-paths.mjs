import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const drawing = JSON.parse(await readFile('src/assets/ielts/old-water-mill-paths.json', 'utf8'))
assert.equal(drawing.width, 1194)
assert.equal(drawing.height, 610)
const rgb = Buffer.alloc(drawing.width * drawing.height * 3, 255)
for (const { fill, d } of drawing.paths) {
  assert.match(fill, /^#[a-f0-9]{6}$/)
  const color = Number.parseInt(fill.slice(1), 16)
  const rectangles = [...d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)z/g)]
  assert.equal(rectangles.map(match => match[0]).join(''), d)
  for (const [, xText, yText, wText, hText, closeText] of rectangles) {
    const [x, y, w, h] = [xText, yText, wText, hText].map(Number)
    assert.equal(wText, closeText)
    assert.ok(w > 0 && h > 0 && x + w <= drawing.width && y + h <= drawing.height)
    for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) {
      const index = (row * drawing.width + col) * 3
      rgb[index] = color >> 16; rgb[index + 1] = color >> 8; rgb[index + 2] = color
    }
  }
}
// Independently decoded RGB of the user's supplied 120020 screenshot, cropped
// to (120, 180, 1194, 610): choices plus the complete plan, without page chrome.
assert.equal(createHash('sha256').update(rgb).digest('hex'), 'cf05375f10bd8e068e79dcbf233cb0fb76b2573dc38f2a3e7316cc9b8905b150')
console.log('PASS: all 728,340 supplied map pixels, lettering and options retained as native paths')
