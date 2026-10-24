import { formatSATDate, formatSATDuration, type SATResultAnalysis } from './resultAnalysis'
import { SAT_REPORT_STYLES } from './resultReportStyles'

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

export function buildSATReportHtml({
  analysis: a,
  title,
  candidate,
  timestamp,
  mode,
  logoUrl = brandImageUrl(),
}: {
  analysis: SATResultAnalysis
  title: string
  candidate: string
  timestamp: number
  mode: 'exam' | 'practice'
  logoUrl?: string
}) {
  const range = `${a.range[0]}–${a.range[1]}`
  const domains = a.domains
    .map(
      (d) =>
        `<section class="domain"><span class="domain-section">${d.section === 'math' ? 'Math' : 'Reading &amp; Writing'}</span><div class="domain-heading"><strong>${escape(d.domain)}</strong><b>${d.percent}%</b></div><div class="segments" role="img" aria-label="${d.percent}% accuracy">${Array.from({ length: 10 }, (_, i) => `<i${d.percent >= (i + 1) * 10 ? ' class="filled"' : ''}></i>`).join('')}</div><small>${d.correct}/${d.total} correct · ${d.incorrect} incorrect · ${d.unanswered} unanswered</small></section>`,
    )
    .join('')
  const moduleRows = a.modules
    .map(
      (m) =>
        `<tr><td>${escape(m.shortTitle)}</td><td>${m.correct}</td><td>${m.incorrect}</td><td>${m.unanswered}</td><td>${m.percent}%</td><td>${escape(formatSATDuration(m.seconds))}</td></tr>`,
    )
    .join('')
  const sectionScores =
    a.sections.length > 1
      ? `<div class="section-estimates">${a.sections.map((section) => `<div><span>${escape(section.label)}</span><strong>${section.score ?? '—'}<small>${section.score === null ? 'unavailable' : '/ 800'}</small></strong></div>`).join('')}</div>`
      : ''
  const focus = a.prioritySkills
    .slice(0, 2)
    .map(
      (skill) =>
        `<div><strong>${escape(skill.skill)}</strong><em>${skill.total - skill.correct} to revisit · ${skill.correct}/${skill.total} correct</em><p>${escape(a.domains.find((d) => d.section === skill.section && d.domain === skill.domain)?.guidance ?? 'Review the explanation, write the rule, and retry without notes.')}</p></div>`,
    )
    .join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(candidate)} — SAT performance report | Ivygoo</title><style>${SAT_REPORT_STYLES}</style></head><body>
  <div class="toolbar"><p><strong>Your personal Ivygoo report</strong>Preview your results. Save a copy to keep or share.</p><button type="button" onclick="Promise.all(Array.from(document.images, image => image.decode().catch(() => {}))).then(() => window.print())"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>Save as PDF / Print</button></div>
  <main class="sheet"><header class="masthead"><span class="report-brand" role="img" aria-label="Ivygoo"><img src="${escape(logoUrl)}" width="1672" height="941" alt="" decoding="sync"></span><div class="report-label"><b>Personal performance report</b>SAT practice · Ivygoo</div></header>
  <section class="intro"><div><div class="eyebrow">Your progress, in perspective</div><h1>SAT performance <span>report.</span></h1><div class="test-title">${escape(title)}</div></div><div class="identity"><strong>${escape(candidate)}</strong><span>${mode === 'exam' ? 'Exam mode' : 'Practice mode'} · ${a.submitted ? 'Completed' : 'Saved incomplete'}</span><time>${escape(formatSATDate(timestamp))}</time></div></section>
  <section class="score-grid"><div class="total"><div class="kicker">${a.score === null ? 'Available-module accuracy' : a.sections.length === 1 ? 'Estimated section score' : 'Estimated total score'}</div><div class="big-score">${a.score === null ? `${a.report.percent}%` : a.score}</div><div class="scale">${a.score === null ? 'Based on the available questions' : `out of ${a.maximum}`}</div><div class="range"><span>${a.score === null ? 'Questions reviewed' : 'Estimated range'}</span><b>${a.score === null ? a.questions.length : range}</b></div></div>
  <div class="overview">${sectionScores}<div class="overview-heading"><h2>Question overview</h2><span>${a.answered}/${a.questions.length} answered · ${a.completion}% complete</span></div><div class="completion-line" role="img" aria-label="${a.report.correct} correct, ${a.report.incorrect} incorrect, ${a.report.unanswered} unanswered">${[
    ['correct', a.report.correct],
    ['incorrect', a.report.incorrect],
    ['unanswered', a.report.unanswered],
  ]
    .map(
      ([tone, count]) =>
        `<i class="is-${tone}" style="width:${(Number(count) / Math.max(1, a.questions.length)) * 100}%"></i>`,
    )
    .join(
      '',
    )}</div><div class="outcomes"><div><b>${a.report.correct}</b><span>Correct</span></div><div><b>${a.report.incorrect}</b><span>Incorrect</span></div><div><b>${a.report.unanswered}</b><span>Unanswered</span></div></div><div class="mini-stats"><span>Overall accuracy <b>${a.report.percent}%</b></span><span>On answered <b>${a.answeredAccuracy}%</b></span><span>Active time <b>${formatSATDuration(a.seconds)}</b></span></div></div></section>
  <section class="modules"><div class="section-heading"><h2>Module performance</h2><span>${a.modules.length} modules · ${a.questions.length} questions</span></div><table class="module-table"><thead><tr><th scope="col">Module</th><th scope="col">Correct</th><th scope="col">Incorrect</th><th scope="col">Unanswered</th><th scope="col">Accuracy</th><th scope="col">Time</th></tr></thead><tbody>${moduleRows}</tbody></table></section>
  <section class="skills"><div class="section-heading"><h2>Knowledge &amp; skills</h2><span>${a.domains.length} content domains</span></div><p class="description">Accuracy reflects the questions in this attempt, including unanswered questions.</p><div class="domain-grid">${domains}</div></section>
  <section class="focus"><h2>${a.prioritySkills.length ? 'Your next focus' : 'Keep your momentum'}</h2><div class="focus-grid">${focus || '<div><strong>All questions answered correctly</strong><p>Try a different test to apply these skills to new questions.</p></div>'}</div></section>
  <footer class="footer"><p><b>Prepared on Ivygoo</b>Practice scores are estimates, not official SAT results. ${a.complete ? 'Use your answer review and these skill priorities to guide your next session.' : 'Some modules are unavailable; no full-test score is provided.'}</p><span>ivygoo.com<br>Personal practice report</span></footer></main></body></html>`
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
