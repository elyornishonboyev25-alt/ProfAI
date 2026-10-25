import assert from 'node:assert/strict'
import { SAT_TEST_CATALOG, getSATSectionTest, getSATReviewTests } from '../../src/features/sat/catalog'
import { createSATAttempt, scoreSATModules } from '../../src/features/sat/practiceTest4'
import { analyzeSATResult } from '../../src/features/sat/resultAnalysis'
import { buildSATReportHtml } from '../../src/features/sat/resultReport'

export async function run() {
  const test = SAT_TEST_CATALOG[8]
  const questions = test.modules.flatMap((m) => m.questions)
  const attempt = createSATAttempt(test.id, test.modules, 'exam')
  attempt.status = 'submitted'
  attempt.submittedAt = Date.parse('2026-10-24T14:00:00Z')
  attempt.moduleElapsedSeconds = { rw1: 1200, rw2: 1300, math1: 1500, math2: 1600 }
  attempt.answers = Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer]))
  let analysis = analyzeSATResult(test, attempt)
  assert.equal(analysis.score, 1600, 'A perfect attempt has two 800 sections and a 1600 total')
  assert.deepEqual(
    analysis.sections.map((s) => s.score),
    [800, 800],
  )
  assert.equal(analysis.priorities.length, 0, 'Perfect answers do not produce a false weak spot')
  assert.equal(analysis.seconds, 5600)
  const rw = questions.filter((q) => q.section === 'reading-writing')
  const math = questions.filter((q) => q.section === 'math')
  for (let r = 0; r <= rw.length; r++) {
    for (let m = 0; m <= math.length; m++) {
      const answers = Object.fromEntries([...rw.slice(0, r), ...math.slice(0, m)].map((q) => [q.id, q.correctAnswer]))
      const report = scoreSATModules(test.modules, answers)
      const rounded = (range: [number, number]) => Math.round((range[0] + range[1]) / 20) * 10
      assert.equal(
        report.midpoint,
        rounded(report.readingWritingRange) + rounded(report.mathRange),
        `Sections must add up at ${r}/${m} correct`,
      )
      assert.ok(report.midpoint >= 400 && report.midpoint <= 1600 && report.midpoint % 10 === 0)
    }
  }
  attempt.answers = {
    [questions[0].id]: questions[0].correctAnswer,
    [questions[1].id]: 'wrong',
    [questions[2].id]: '   ',
  }
  analysis = analyzeSATResult(test, attempt)
  assert.equal(analysis.report.correct, 1)
  assert.equal(analysis.report.incorrect, 1)
  assert.equal(analysis.report.unanswered, 96)
  assert.equal(analysis.answered, 2)
  assert.equal(analysis.answeredAccuracy, 50)
  assert.equal(analysis.completion, 2)
  for (const rows of [analysis.sections, analysis.domains, analysis.modules, analysis.difficulty, analysis.skills]) {
    assert.equal(
      rows.reduce((sum, row) => sum + row.total, 0),
      98,
    )
    assert.equal(
      rows.reduce((sum, row) => sum + row.correct, 0),
      1,
    )
    assert.equal(
      rows.reduce((sum, row) => sum + row.incorrect, 0),
      1,
    )
    assert.equal(
      rows.reduce((sum, row) => sum + row.unanswered, 0),
      96,
    )
  }
  const mathTest = getSATSectionTest(8, 'math')
  const mathResult = analyzeSATResult(mathTest, {
    ...attempt,
    answers: Object.fromEntries(math.map((q) => [q.id, q.correctAnswer])),
  })
  assert.equal(mathResult.score, 800)
  assert.equal(mathResult.maximum, 800)
  assert.equal(mathResult.sections.length, 1, 'Section practice must not fabricate another section')
  const unfinished = analyzeSATResult(test, { ...attempt, status: 'active', submittedAt: undefined })
  assert.equal(unfinished.score, null)
  assert.ok(unfinished.sections.every((s) => s.score === null))
  const legacy = getSATReviewTests().find((t) => t.id === 'may-2026-us-v1')!
  const legacyResult = analyzeSATResult(legacy, attempt)
  assert.equal(legacyResult.score, null)
  assert.equal(legacyResult.sections.find((s) => s.id === 'math')!.score, null)
  const html = buildSATReportHtml({
    analysis,
    title: 'Test <img src=x onerror="bad()">',
    candidate: 'Aziza O‘ktamova <script>bad()</script>',
    timestamp: attempt.submittedAt,
    mode: 'exam',
    attempt,
    percentiles: { total: { value: 54.8, platform: true }, rw: { value: 40.9, platform: true }, math: null },
  })
  const page = new window.DOMParser().parseFromString(html, 'text/html')
  assert.equal(page.querySelectorAll('script').length, 0, 'Report values cannot inject executable HTML')
  const images = [...page.querySelectorAll('img')]
  assert.equal(images.length, 2, 'Each report page carries only the original Ivygoo brand artwork')
  assert.ok(
    images.every(
      (image) => image.closest('.report-brand') && image.getAttribute('src')!.endsWith('/brand/ivygoo-horizontal.png'),
    ),
  )
  assert.equal(page.querySelectorAll('.module-table tbody tr').length, analysis.modules.length)
  assert.equal(page.querySelector('.identity div')!.textContent, 'Name: Aziza O‘ktamova <script>bad()</script>')
  assert.equal(page.querySelector('.identity .test-name')!.textContent, 'Test <img src=x onerror="bad()">')
  assert.equal(page.querySelectorAll('.domain').length, 8, 'A full test shows all eight SAT content domains')
  assert.ok([...page.querySelectorAll('.bars')].every((bar) => bar.querySelectorAll('i').length === 7))
  assert.equal(page.querySelector('.score-line.is-total strong')!.textContent, String(analysis.score))
  assert.equal(page.querySelector('.score-line.is-total .pct')!.textContent, '54.8th*')
  assert.equal(page.querySelectorAll('.answer-grid > div').length, analysis.questions.length)
  assert.ok(page.querySelector('.page-foot')!.textContent!.includes('Ivygoo'))
  assert.ok(!html.includes('College Board') && !html.includes('Khan Academy'))
  console.log(
    'SAT results: all 2,475 score combinations add up; perfect, mixed, section, unfinished and legacy attempts; consistent report totals; Unicode and HTML escaping passed.',
  )
}
