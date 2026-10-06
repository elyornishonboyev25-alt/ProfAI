import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const drawing = JSON.parse(await readFile('src/assets/ielts/aluminium-recycling-paths.json', 'utf8'))
assert.equal(drawing.width, 422)
assert.equal(drawing.height, 452)
assert.deepEqual(drawing.sourceCrop, { x: 45, y: 159, width: 422, height: 452 })
const rgb = Buffer.alloc(drawing.width * drawing.height * 3, 255)
for (const { fill, d } of drawing.paths) {
  assert.match(fill, /^#[a-f0-9]{6}$/)
  const colour = Number.parseInt(fill.slice(1), 16)
  const rectangles = [...d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)z/g)]
  assert.equal(rectangles.map(match => match[0]).join(''), d)
  for (const [, xText, yText, wText, hText, closeText] of rectangles) {
    const [x, y, w, h] = [xText, yText, wText, hText].map(Number)
    assert.equal(wText, closeText)
    assert.ok(w > 0 && h > 0 && x + w <= drawing.width && y + h <= drawing.height)
    for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) {
      const index = (row * drawing.width + col) * 3
      rgb[index] = colour >> 16; rgb[index + 1] = colour >> 8; rgb[index + 2] = colour
    }
  }
}
// RGB decoded independently from the user's Sample-Process.webp, at the source
// crop above. Artwork, fonts, logos, machinery and every arrow are preserved.
const sourceHash = '5748a60ccb5d24e5479e1d083d6301b00985393003d6127cf3207680dfdc2f79'
assert.equal(drawing.sourceRgbSha256, sourceHash)
assert.equal(createHash('sha256').update(rgb).digest('hex'), sourceHash)
console.log('PASS: all 190,744 original aluminium artwork pixels retained as native vector paths')
