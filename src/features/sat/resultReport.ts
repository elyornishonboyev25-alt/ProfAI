import { formatSATDate, formatSATDuration, satAnswerStatus, type SATResultAnalysis } from './resultAnalysis'
import { filledSegments, nationalPercentile, ordinal, SAT_DOMAIN_SPECS, SAT_REPORT_DOMAIN_ORDER, SKILL_BAR_SEGMENTS } from './resultInsights'
import { SAT_REPORT_STYLES } from './resultReportStyles'
import type { SATAttempt } from './practiceTest4'

type ReportPercentile = { value: number; platform: boolean } | null

function escape(value: unknown) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )
}

function brandImageUrl() {
  const origin =
    typeof window !== 'undefined' && /^https?:/.test(window.location.origin)
      ? window.location.origin
      : 'https://ivygoo.com'
  return `${origin}/brand/ivygoo-horizontal.png`
}

function percentileBox(entry: ReportPercentile | undefined) {
  return entry ? `<span class="pct">${escape(ordinal(entry.value))}*</span>` : '<span class="pct is-empty">—</span>'
}

export function buildSATReportHtml({
  analysis: a,
  title,
  candidate,
  email,
  timestamp,
  mode,
  attempt,
  percentiles = {},
  logoUrl = brandImageUrl(),
}: {
  analysis: SATResultAnalysis
  title: string
  candidate: string
  email?: string
  timestamp: number
  mode: 'exam' | 'practice'
  attempt?: SATAttempt
  percentiles?: { total?: ReportPercentile; rw?: ReportPercentile; math?: ReportPercentile }
  logoUrl?: string
}) {
  const single = a.sections.length === 1
  const totalScale = a.maximum === 800 ? '200–800' : '400–1600'
  const estimate = (value: number | null, scale: 800 | 1600): ReportPercentile =>
    value === null ? null : { value: nationalPercentile(value, scale), platform: false }
  const sectionScore = (id: string) => a.sections.find((section) => section.id === id)?.score ?? null
  // Callers without platform data still get the published-percentile estimate.
  percentiles = {
    total: percentiles.total !== undefined ? percentiles.total : estimate(a.score, a.maximum === 800 ? 800 : 1600),
    rw: percentiles.rw !== undefined ? percentiles.rw : estimate(sectionScore('reading-writing'), 800),
    math: percentiles.math !== undefined ? percentiles.math : estimate(sectionScore('math'), 800),
  }
  const platform = [percentiles.total, percentiles.rw, percentiles.math].some((entry) => entry?.platform)
  const sectionScores = single
    ? ''
    : `<p class="label">Section scores</p>${a.sections
        .map(
          (section) =>
            `<p class="section-name">${escape(section.label === 'Reading & Writing' ? 'Reading and Writing' : section.label)}</p><div class="score-line"><strong>${section.score ?? '—'}</strong><div class="score-meta"><small>200–800</small>${percentileBox(section.id === 'math' ? percentiles.math : percentiles.rw)}</div></div>`,
        )
        .join('')}`
  const domainColumns = a.sections
    .map((section) => {
      const rows = SAT_REPORT_DOMAIN_ORDER[section.id]
        .map((name) => {
          const domain = a.domains.find((entry) => entry.section === section.id && entry.domain === name)
          const spec = SAT_DOMAIN_SPECS[name]
          const filled = domain ? filledSegments(domain.percent) : 0
          const tone = domain && domain.percent < 50 ? ' is-low' : ''
          return `<div class="domain"><strong>${escape(name)}<em>${domain ? `${domain.correct}/${domain.total} correct` : 'Not in this test'}</em></strong><small>(${spec.share}% of test section, ${spec.questions} questions)</small><div class="bars${tone}" role="img" aria-label="${domain ? `${domain.percent}% accuracy` : 'Not assessed'}">${Array.from({ length: SKILL_BAR_SEGMENTS }, (_, i) => `<i${i < filled ? ' class="on"' : ''}></i>`).join('')}</div></div>`
        })
        .join('')
      return `<div><h3>${section.id === 'math' ? 'Math' : 'Reading and Writing'}</h3>${rows}</div>`
    })
    .join('')
  const moduleRows = a.modules
    .map(
      (m) =>
        `<tr><td>${escape(m.shortTitle)}</td><td>${m.correct}</td><td>${m.incorrect}</td><td>${m.unanswered}</td><td>${m.percent}%</td><td>${escape(formatSATDuration(m.seconds))}</td></tr>`,
    )
    .join('')
  const answerSheet = attempt
    ? a.modules
        .map(
          (m) =>
            `<section class="answer-module"><h3>${escape(m.title)}<span>${m.correct}/${m.total} correct</span></h3><div class="answer-grid">${m.questions
              .map((q) => {
                const status = satAnswerStatus(q, attempt)
                const response = attempt.answers[q.id]?.trim()
                return `<div class="is-${status}"><span>${q.number}</span><span class="yours" title="Your answer">${escape(response || '—')}</span><span class="key" title="Correct answer">${escape(q.correctAnswer)}</span><span class="mark">${status === 'correct' ? '✓' : '✕'}</span></div>`
              })
              .join('')}</div></section>`,
        )
        .join('')
    : ''
  const date = escape(formatSATDate(timestamp))
  const masthead = `<header class="masthead"><div class="brand-lockup"><span class="report-brand" role="img" aria-label="Ivygoo"><img src="${escape(logoUrl)}" width="1672" height="941" alt="" decoding="sync"></span><span class="exam-tag">SAT</span></div><div class="identity"><div><b>Name:</b> ${escape(candidate)}</div>${email ? `<span>${escape(email)}</span>` : ''}<span class="test-name">${escape(title)}</span><span>${date} · ${mode === 'exam' ? 'Exam mode' : 'Practice mode'}${a.submitted ? '' : ' · Saved incomplete'}</span></div></header>`
  const footer = (page: number) =>
    `<footer class="page-foot"><span><b>Ivygoo</b> · Practice score report · ivygoo.com</span><span>Practice scores are estimates, not official SAT results. · Page ${page}</span></footer>`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(candidate)} — SAT score report | Ivygoo</title><style>${SAT_REPORT_STYLES}</style></head><body>
  <div class="toolbar"><p><strong>Your Ivygoo SAT score report</strong>Preview your scores, then save a copy as PDF or print it.</p><button type="button" onclick="Promise.all(Array.from(document.images, image => image.decode().catch(() => {}))).then(() => window.print())"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>Save as PDF / Print</button></div>
  <main class="sheet">${masthead}
  <h1>Your Scores</h1>
  <section class="score-box${single ? ' is-single' : ''}">
    <div><h2>SAT Scores</h2>
      <p class="label">${single ? 'Section score' : 'Total score'}</p>
      <div class="score-line is-total"><strong>${a.score ?? (a.submitted ? `${a.report.percent}%` : '—')}</strong><div class="score-meta"><small>${a.score === null ? 'accuracy' : totalScale}</small>${percentileBox(percentiles.total)}</div></div>
      ${sectionScores}
      <p class="footnote">* ${platform ? 'Percentiles indicate the percentage of all Ivygoo test takers to date who achieved a score equal to or lower than yours on their first attempt at this test.' : 'Estimated percentiles based on published SAT user percentiles. They update to Ivygoo learner percentiles as more learners complete this test.'}${a.score === null ? ' A scaled score appears after every module is completed.' : ` Estimated range ${a.range[0]}–${a.range[1]}.`}</p>
    </div>
    <div><h2>Knowledge and Skills</h2><p class="ks-intro">View your performance across the ${single ? 4 : 8} content domains measured on the SAT${single ? ' section' : ''}.</p><div class="ks-columns${single ? ' is-single' : ''}">${domainColumns}</div></div>
  </section>
  ${footer(1)}</main>
  <main class="sheet details">${masthead}
  <h1>Score <span>details</span></h1>
  <div class="summary"><div><span>Correct</span><b>${a.report.correct}/${a.questions.length}</b></div><div><span>Incorrect</span><b>${a.report.incorrect}</b></div><div><span>Unanswered</span><b>${a.report.unanswered}</b></div><div><span>Accuracy</span><b>${a.report.percent}%</b></div><div><span>Active time</span><b>${escape(formatSATDuration(a.seconds))}</b></div></div>
  <table class="module-table"><thead><tr><th scope="col">Module</th><th scope="col">Correct</th><th scope="col">Incorrect</th><th scope="col">Unanswered</th><th scope="col">Accuracy</th><th scope="col">Time</th></tr></thead><tbody>${moduleRows}</tbody></table>
  ${answerSheet ? `<p class="answer-legend"><span># · Your answer · Correct answer</span><span>✓ correct · ✕ incorrect or unanswered</span></p><div class="answers">${answerSheet}</div>` : ''}
  ${footer(2)}</main></body></html>`
}

/** Keep opening synchronous so the learner's click can create the report tab. */
export function openSATReport(options: Parameters<typeof buildSATReportHtml>[0]) {
  const report = window.open('', '_blank')
  if (!report) return false
  try {
    report.opener = null
    report.document.open()
    report.document.write(buildSATReportHtml(options))
    report.document.close()
    return true
  } catch {
    report.close()
    return false
  }
}
