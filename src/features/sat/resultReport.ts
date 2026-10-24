import { formatSATDate, formatSATDuration, type SATResultAnalysis } from './resultAnalysis'

function escape(value: unknown) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )
}

export function buildSATReportHtml({
  analysis: a,
  title,
  candidate,
  timestamp,
  mode,
}: {
  analysis: SATResultAnalysis
  title: string
  candidate: string
  timestamp: number
  mode: 'exam' | 'practice'
}) {
  const range = `${a.range[0]}–${a.range[1]}`
  const domainColumns = a.sections
    .map(
      (section) =>
        `<section class="domain-column"><h3>${escape(section.label)}</h3>${a.domains
          .filter((d) => d.section === section.id)
          .map(
            (d) => `
    <div class="domain"><div class="domain-heading"><strong>${escape(d.domain)}</strong><b>${d.percent}%</b></div>
    <div class="segments" role="img" aria-label="${d.percent}% accuracy">${Array.from({ length: 10 }, (_, i) => `<i${d.percent >= (i + 1) * 10 ? ' class="filled"' : ''}></i>`).join('')}</div>
    <small>${d.correct} / ${d.total} correct · ${d.incorrect} incorrect · ${d.unanswered} unanswered</small></div>`,
          )
          .join('')}</section>`,
    )
    .join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(candidate)} — SAT score report | Ivygoo</title><style>
  *{box-sizing:border-box}body{margin:0;background:#e9edf2;color:#20272e;font:12px/1.5 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;max-width:794px;margin:22px auto;padding:0 8px;color:#525f6e}.toolbar p{margin:0}.toolbar strong{display:block;color:#20272e}.toolbar button{border:0;border-radius:10px;padding:12px 20px;background:#df0030;color:white;font:700 13px Arial;cursor:pointer}.toolbar button:focus-visible{outline:3px solid #253c74;outline-offset:3px}
  .sheet{width:210mm;min-height:297mm;margin:0 auto 32px;background:#fff;padding:16mm 15mm 12mm;box-shadow:0 10px 60px #1e293b15;display:flex;flex-direction:column;position:relative}.sheet:before{content:"";position:absolute;inset:0 0 auto;height:5px;background:#df0030}
  .masthead{display:flex;justify-content:space-between;gap:20px;align-items:center}.brand{color:#df0030;font-size:32px;line-height:1;font-weight:900;letter-spacing:-1.8px;white-space:nowrap}.brand span{color:#20272e}.brand small{display:block;color:#76808d;font-size:8px;letter-spacing:2.6px;text-transform:uppercase;margin-top:9px;font-weight:700}.report-label{text-align:right;color:#78828f;font-size:9px;letter-spacing:1.5px;text-transform:uppercase}
  .intro{margin:28px 0 24px}.eyebrow{color:#bd1235;text-transform:uppercase;letter-spacing:2px;font-size:9px;font-weight:700}h1{font-size:32px;letter-spacing:-1.3px;line-height:1.12;margin:8px 0 14px}.identity{display:flex;justify-content:space-between;gap:16px;color:#687380}.identity strong{font-size:13px;color:#20272e;overflow-wrap:anywhere}.identity>div{max-width:70%}.identity span{display:block;font-size:10px;margin-top:3px}.date{text-align:right;white-space:nowrap}
  .test-title{padding:12px 16px;background:#f5f6f8;border:1px solid #e3e6eb;border-radius:10px 10px 0 0;font-size:12px;font-weight:700;overflow-wrap:anywhere}.score-grid{display:grid;grid-template-columns:1.05fr 1fr 1.25fr;border:1px solid #e3e6eb;border-top:0;border-radius:0 0 10px 10px;overflow:hidden}.score-grid>div{padding:19px 16px}.score-grid>div+div{border-left:1px solid #e3e6eb}.total{background:#fff5f7}.kicker{font-size:8px;letter-spacing:1.5px;color:#6d7783;font-weight:700;text-transform:uppercase}.big-score{font-size:56px;font-weight:900;letter-spacing:-3px;line-height:1.15;margin:9px 0 3px;color:#c8002b}.scale{font-size:10px;color:#6d7783}.range{font-size:10px;margin-top:18px;color:#636d7b}.range b{display:block;color:#26313f;margin-top:3px}.section-score+.section-score{margin-top:19px;padding-top:13px;border-top:1px solid #e7e9ed}.section-score strong{display:block;font-size:10px;margin-bottom:5px}.section-score b{font-size:29px;line-height:1}.section-score span{font-size:10px;color:#7b8490;margin-left:5px}.section-score small{display:block;color:#697583;font-size:9px;margin-top:5px}.correct-total{font-size:33px;font-weight:800;letter-spacing:-1px;margin:9px 0 8px}.correct-total small{font-size:10px;font-weight:400;letter-spacing:0;color:#72808f}.stat{display:flex;justify-content:space-between;gap:8px;padding:5px 0;color:#6d7783;font-size:10px}.stat b{color:#25303d}.stat+.stat{border-top:1px solid #f0f1f4}
  .skills{margin-top:27px}.section-heading{display:flex;align-items:center;gap:12px;margin-bottom:5px}.section-heading h2{font-size:16px;letter-spacing:-.35px;margin:0}.section-heading:after{content:"";height:1px;flex:1;background:#e5e8ed}.description{color:#78828e;font-size:10px;margin:5px 0 15px}.domain-grid{display:grid;grid-template-columns:repeat(${a.sections.length},minmax(0,1fr));gap:25px}.domain-column h3{font-size:11px;margin:0 0 16px;color:#bd1235}.domain{margin-bottom:18px;break-inside:avoid}.domain-heading{display:flex;justify-content:space-between;gap:10px;font-size:10px;margin-bottom:7px}.domain-heading strong{font-weight:600}.domain-heading b{white-space:nowrap}.segments{display:flex;gap:3px}.segments i{flex:1;height:6px;background:#eceef2;border-radius:1px}.segments i.filled{background:#c92346}.domain small{display:block;color:#818995;font-size:8px;margin-top:5px}.focus{display:flex;gap:14px;background:#f7f8fa;border-left:3px solid #df0030;border-radius:0 8px 8px 0;padding:13px 15px;margin:8px 0 22px;break-inside:avoid}.focus strong{font-size:11px;display:block;margin:3px 0}.focus p{margin:3px 0 0;color:#677380;font-size:10px;line-height:1.6}.footer{margin-top:auto;padding-top:17px;border-top:1px solid #e4e7ec;display:flex;justify-content:space-between;gap:20px;font-size:8px;color:#7a8591}.footer b{color:#bf1739;font-size:10px}.footer p{margin:0;max-width:78%}
  @page{size:A4;margin:0}@media print{body{background:#fff}.toolbar{display:none}.sheet{width:100%;min-height:296mm;margin:0;padding:13mm 14mm 10mm;box-shadow:none}.intro{margin:22px 0 19px}.skills{margin-top:22px}.domain{margin-bottom:15px}.domain,.score-grid,.focus{break-inside:avoid}}
  @media screen and (max-width:820px){.toolbar{padding:0 16px;font-size:11px}.toolbar button{flex:none}.sheet{width:100%;min-height:100vh;padding:32px 24px}.score-grid>div{padding:15px 12px}.big-score{font-size:44px}.domain-grid{gap:18px}}@media screen and (max-width:520px){.report-label{font-size:7px}.brand{font-size:28px}h1{font-size:28px}.identity{flex-wrap:wrap}.score-grid{grid-template-columns:1fr 1fr}.score-grid>div:last-child{grid-column:1/-1;border-left:0;border-top:1px solid #e3e6eb}.domain-grid{grid-template-columns:1fr}.toolbar p{max-width:170px}.footer{flex-direction:column;gap:8px}.footer p{max-width:100%}}
  </style></head><body><div class="toolbar"><p><strong>Your Ivygoo score report</strong>Choose “Save as PDF” in the print window.</p><button type="button" onclick="window.print()">Save as PDF / Print</button></div>
  <main class="sheet"><header class="masthead"><div class="brand"><span>ivy</span>Goo<small>SAT preparation</small></div><div class="report-label">Personal score report<br>SAT practice</div></header>
  <section class="intro"><div class="eyebrow">Your progress, on paper</div><h1>SAT practice<br>score report.</h1><div class="identity"><div><strong>${escape(candidate)}</strong><span>${mode === 'exam' ? 'Exam mode' : 'Practice mode'} · ${a.submitted ? 'Completed' : 'Saved incomplete'}</span></div><div class="date"><strong>${escape(formatSATDate(timestamp))}</strong><span>Test date</span></div></div></section>
  <div class="test-title">${escape(title)}</div><section class="score-grid"><div class="total"><div class="kicker">${a.score === null ? 'Available-module accuracy' : a.sections.length === 1 ? 'Estimated section score' : 'Estimated total score'}</div><div class="big-score">${a.score === null ? `${a.report.percent}%` : a.score}</div><div class="scale">${a.score === null ? 'Based on the available questions' : `out of ${a.maximum}`}</div>${a.score === null ? '' : `<div class="range">Estimated range<b>${range}</b></div>`}</div>
  <div>${a.sections.map((s) => `<div class="section-score"><strong>${escape(s.label)}</strong><b>${s.score ?? '—'}</b><span>${s.score === null ? 'Score unavailable' : '/ 800'}</span><small>${s.correct} / ${s.total} correct${s.score === null ? '' : ` · Range ${s.range[0]}–${s.range[1]}`}</small><small>${s.incorrect} incorrect · ${s.unanswered} unanswered</small></div>`).join('')}</div>
  <div><div class="kicker">Question overview</div><div class="correct-total">${a.report.correct}<small> / ${a.questions.length} correct</small></div>${[
    ['Incorrect', a.report.incorrect],
    ['Unanswered', a.report.unanswered],
    ['Accuracy', `${a.report.percent}%`],
    ['Time used', formatSATDuration(a.seconds)],
  ]
    .map(([label, value]) => `<div class="stat"><span>${label}</span><b>${value}</b></div>`)
    .join('')}</div></section>
  <section class="skills"><div class="section-heading"><h2>Knowledge &amp; skills</h2></div><p class="description">Accuracy across the content domains in this attempt.</p><div class="domain-grid">${domainColumns}</div></section>
  <section class="focus"><div><div class="eyebrow">${a.priorities.length ? 'Your next focus' : 'Keep your momentum'}</div><strong>${escape(a.priorities[0]?.domain ?? 'All questions answered correctly')}</strong><p>${escape(a.priorities[0]?.guidance ?? 'Try a different practice test to check your skills on new questions.')}</p></div></section>
  <footer class="footer"><p><b>Prepared on Ivygoo</b><br>Practice scores are estimates, not official SAT results. ${a.complete ? 'Use this report to guide your next practice session.' : 'Some modules are unavailable; no full-test score is provided.'}</p><span>Personal practice report</span></footer></main></body></html>`
}

/** Open synchronously from the click so browsers can allow the report tab. */
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
