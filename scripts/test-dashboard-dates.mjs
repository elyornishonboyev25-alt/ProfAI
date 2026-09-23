import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/utils/dashboardDates.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } })
const { formatDashboardDay, formatDashboardActivityDate } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))

// Reproduces the previous crash with the actual dashboard route's ISO format.
const serverDate = '2026-09-23T00:00:00.000Z'
assert.throws(() => new Intl.DateTimeFormat('en-US').format(new Date(serverDate + 'T12:00:00')), RangeError)
for (const timezone of ['UTC', 'Asia/Tashkent', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
  process.env.TZ = timezone
  assert.equal(formatDashboardDay(serverDate, 'en'), 'Wed')
  assert.equal(formatDashboardDay('2026-09-23', 'en'), 'Wed')
  assert.equal(formatDashboardDay(serverDate, 'ru'), 'ср')
}
for (const invalid of ['', 'not-a-date', '2026-99-99T00:00:00.000Z']) {
  assert.equal(formatDashboardDay(invalid, 'en'), '—')
  assert.equal(formatDashboardActivityDate(invalid, 'en'), '—')
}
assert.notEqual(formatDashboardActivityDate(serverDate, 'en'), '—')
console.log('Dashboard date regression passed: API timestamps, fallback dates, Russian, four time zones and invalid dates.')
