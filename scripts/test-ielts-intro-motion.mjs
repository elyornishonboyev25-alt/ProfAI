import assert from 'node:assert/strict'
import { cursorAt } from './ielts-intro-motion.mjs'

const moves = [
  { start: 1, end: 3, from: { x: 100, y: 150 }, to: { x: 500, y: 350 }, easing: 'smootherstep' },
  { start: 4, end: 5, from: { x: 500, y: 350 }, to: { x: 800, y: 350 }, easing: 'linear' },
]
assert.deepEqual(cursorAt(moves, 0), moves[0].from)
assert.deepEqual(cursorAt(moves, 3.9), moves[0].to)
assert.deepEqual(cursorAt(moves, 10), moves[1].to)
const samples = Array.from({ length: 121 }, (_, n) => cursorAt(moves, 1 + n / 60))
const speeds = samples.slice(1).map((point, n) => point.x - samples[n].x)
assert.ok(speeds.every(speed => speed >= 0 && speed < 7), 'Smooth movement never reverses or jumps between frames')
assert.ok(speeds[0] < .01 && speeds.at(-1) < .01, 'A gesture eases only at its start and end')
assert.ok(speeds.slice(25, 95).every(speed => speed > 2), 'Continuous movement cannot stop at screenshot boundaries')
for (let n = 1; n < 60; n++) {
  assert.ok(Math.abs(cursorAt(moves, 4 + n / 60).x - (500 + n * 5)) < 1e-8, 'A selection drag has steady velocity')
}
assert.deepEqual(cursorAt([{ ...moves[0], end: 1 }], 1), moves[0].to)
console.log('PASS: continuous 60fps cursor paths, gentle acceleration, steady selection drag, idle holds and no screenshot-boundary stalls')
