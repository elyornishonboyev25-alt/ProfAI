/** A4 pages share their layout between the fitted preview and printed report. */
export const SAT_REPORT_STYLES = `
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing:border-box; }
body { margin:0; color:#161b26; background:radial-gradient(ellipse at 6% 0,#f1d9e2aa,transparent 40%),radial-gradient(ellipse at 96% 20%,#cfd9ea99,transparent 42%),linear-gradient(150deg,#f3f5f9,#e6eaf1); font:13px/1.5 'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.toolbar { display:flex; justify-content:space-between; align-items:center; gap:20px; width:calc(100% - 32px); max-width:1180px; margin:16px auto; color:#6f7b8f; }
.toolbar p { margin:0; font-size:12px; line-height:1.7; }
.toolbar strong { display:block; color:#283246; font-size:14px; }
.toolbar button { display:flex; align-items:center; gap:9px; min-height:46px; flex:none; border:1px solid #ffffff80; border-radius:14px; padding:12px 20px; background:linear-gradient(135deg,#ec1846,#b8082f); box-shadow:0 10px 24px #b8082f33,inset 0 1px 0 #ffffff55; color:#fff; font:650 13px 'Segoe UI',Arial,sans-serif; cursor:pointer; }
.toolbar button:hover { filter:brightness(1.06); }
.toolbar button:focus-visible { outline:3px solid #283246; outline-offset:4px; }
.report-pages { display:flex; flex-direction:column; align-items:center; gap:24px; padding:0 16px 16px; }
.page-preview { flex:none; width:calc(210mm * var(--report-preview-scale, 1)); height:calc(297mm * var(--report-preview-scale, 1)); }
.sheet { position:relative; display:flex; flex-direction:column; width:210mm; height:297mm; padding:14mm; border:1px solid #fff; border-radius:20px; background:linear-gradient(125deg,#ffffff,#fbfcfe 60%,#f6f7fb); box-shadow:0 26px 70px #2a395522,inset 0 1px 0 #fff; transform:scale(var(--report-preview-scale, 1)); transform-origin:top left; }
.sheet:before { content:''; position:absolute; inset:0 0 auto; height:4px; border-radius:20px 20px 0 0; background:linear-gradient(90deg,#c8102e,#e8566f 30%,#c9d1de 70%,#9aa6b8); }
.sheet > *, .score-box > *, .ks-columns > *, .summary > *, .answer-module { min-width:0; }
.masthead { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
.brand-lockup { display:flex; align-items:center; gap:12px; }
.report-brand { display:block; position:relative; width:150px; height:54px; overflow:hidden; flex:none; border-radius:10px; background:#fff; }
.report-brand img { display:block; width:100%; height:100%; object-fit:contain; }
.exam-tag { display:grid; place-items:center; height:54px; padding:0 18px; border:2px solid #161b26; border-radius:4px; font-size:24px; font-weight:800; letter-spacing:.5px; }
.identity { max-width:55%; text-align:right; font-size:14px; line-height:1.6; color:#283246; overflow-wrap:anywhere; }
.identity b { font-weight:800; }
.identity span { display:block; color:#6a7486; font-size:12px; }
.identity .test-name { color:#283246; font-weight:650; }
h1 { line-height:1.05; font-weight:800; letter-spacing:-1.4px; margin:12px 0 12px; font-size:34px; }
h1 span { color:#c8102e; }
.score-box { display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr); border:1.5px solid #9aa6b8; border-radius:4px; background:#fff; gap:24px; padding:20px 24px 18px; }
.score-box.is-single { grid-template-columns:repeat(2,minmax(0,1fr)); }
h2 { line-height:1.15; font-weight:800; letter-spacing:-.5px; margin:0 0 10px; font-size:22px; }
.label { margin:0 0 4px; font-weight:800; letter-spacing:.6px; text-transform:uppercase; font-size:12px; }
.score-line { display:flex; flex-wrap:wrap; align-items:flex-end; gap:16px; margin-bottom:10px; }
.score-line strong { line-height:.95; font-weight:800; letter-spacing:-1.5px; font-size:44px; }
.score-line.is-total strong { letter-spacing:-3px; font-size:64px; }
.score-meta { display:flex; flex-direction:column; align-items:flex-start; gap:3px; padding-bottom:6px; }
.score-meta small { color:#5a6475; font-size:13px; }
.pct { display:inline-block; border:1.5px solid #9aa6b8; font-weight:800; background:#fff; padding:5px 9px; font-size:15px; }
.score-line.is-total .pct { padding:6px 10px; font-size:18px; }
.pct.is-empty { color:#8a93a3; font-weight:650; font-size:14px; }
.section-name { font-weight:800; margin:2px 0 0; font-size:17px; }
.footnote { color:#4d5768; margin:12px 0 0; font-size:11px; line-height:1.45; }
.ks-intro { color:#4d5768; margin:-4px 0 12px; font-size:12px; }
.ks-columns { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.ks-columns.is-single { grid-template-columns:minmax(0,1fr); }
.ks-columns h3 { font-weight:800; margin:0 0 10px; font-size:14px; }
.domain { break-inside:avoid; margin-bottom:11px; }
.domain strong { display:flex; flex-wrap:wrap; justify-content:space-between; gap:2px 8px; font-weight:800; font-size:11px; }
.domain strong em { color:#6a7486; font-style:normal; font-weight:650; white-space:nowrap; font-size:9px; }
.domain small { display:block; color:#4d5768; margin:1px 0 5px; font-size:10px; }
.bars { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:4px; }
.bars i { border:1.5px solid #9aa6b8; background:#fff; height:11px; }
.bars i.on { border-color:#161b26; background:#161b26; }
.bars.is-math i.on { border-color:#161b26; background:#161b26; }
.bars.is-low i.on { border-color:#c8102e; background:#c8102e; }
.page-foot { display:flex; justify-content:space-between; gap:16px; margin-top:auto; padding-top:16px; color:#6a7486; font-size:9px; }
.page-foot span:last-child { text-align:right; }
.page-foot b { color:#283246; }
.details h1 { margin:12px 0 12px; font-size:28px; }
.summary { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
.summary div { border:1.5px solid #d3d9e3; border-radius:4px; background:#fff; padding:8px; }
.summary span { display:block; color:#6a7486; font-weight:700; letter-spacing:.6px; text-transform:uppercase; font-size:9px; }
.summary b { display:block; margin-top:4px; font-weight:800; font-size:17px; }
table { width:100%; border-collapse:collapse; table-layout:fixed; background:#fff; }
.module-table { border:1.5px solid #9aa6b8; margin-bottom:12px; }
.module-table th { padding:10px 14px; border-bottom:1.5px solid #9aa6b8; background:#f4f6f9; text-align:left; font-size:11px; letter-spacing:.3px; text-transform:uppercase; }
.module-table th:first-child { width:25%; }
.module-table th:last-child { width:19%; }
.module-table td { padding:10px 14px; border-bottom:1px solid #e3e7ee; font-size:13px; }
.module-table td:first-child { font-weight:700; }
.answers { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.answer-module { break-inside:avoid; border:1.5px solid #9aa6b8; border-radius:4px; background:#fff; }
.answer-module h3 { display:flex; flex-wrap:wrap; justify-content:space-between; gap:2px 6px; margin:0; border-bottom:1.5px solid #9aa6b8; background:#f4f6f9; padding:6px 8px; font-size:10px; }
.answer-module h3 span { color:#6a7486; font-weight:650; font-size:9px; }
.answer-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:2px 6px; padding:4px 6px 6px; }
.answer-grid div { display:grid; grid-template-columns:18px minmax(0,1fr) minmax(0,1fr) 10px; align-items:center; gap:3px; border-bottom:1px solid #eef1f5; padding:1px; font-size:9px; }
.answer-grid div > span:first-child { color:#6a7486; font-weight:700; }
.answer-grid .yours { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.answer-grid .key { color:#0d7a55; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.answer-grid .is-incorrect .yours { color:#c8102e; font-weight:700; }
.answer-grid .is-unanswered .yours { color:#9a6b12; }
.answer-grid .is-correct .yours { color:#0d7a55; font-weight:700; }
.mark { font-weight:900; text-align:center; }
.is-correct .mark { color:#0d7a55; }
.is-incorrect .mark, .is-unanswered .mark { color:#c8102e; }
.answer-legend { display:flex; flex-wrap:wrap; gap:4px 18px; margin:0 0 12px; color:#6a7486; font-size:10px; }
.module-table th, .module-table td { padding:5px 8px; font-size:10px; overflow-wrap:anywhere; }
@media print {
  body { background:#fff; }
  .toolbar { display:none; }
  .report-pages { display:block; padding:0; }
  .page-preview { width:auto; height:auto; break-inside:avoid; }
  .page-preview + .page-preview { break-before:page; }
  .sheet { width:100%; height:276mm; padding:4mm; border:0; border-radius:0; box-shadow:none; background:#fff; transform:none; }
  .sheet:before { display:none; }
}
@media screen and (max-width:600px) {
  .toolbar { flex-direction:column; align-items:stretch; gap:10px; margin:12px auto; }
  .toolbar p { font-size:11px; } .toolbar strong { font-size:13px; }
}
`
