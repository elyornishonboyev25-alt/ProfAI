/** Screen preview and print use the same report; print removes only the surrounding controls. */
export const SAT_REPORT_STYLES = `
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; }
body { margin:0; color:#161b26; background:radial-gradient(ellipse at 6% 0,#f1d9e2aa,transparent 40%),radial-gradient(ellipse at 96% 20%,#cfd9ea99,transparent 42%),linear-gradient(150deg,#f3f5f9,#e6eaf1); font:13px/1.5 'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.toolbar { display:flex; justify-content:space-between; align-items:center; gap:20px; max-width:1180px; margin:26px auto 18px; padding:0 8px; color:#6f7b8f; }
.toolbar p { margin:0; font-size:12px; line-height:1.7; } .toolbar strong { display:block; color:#283246; font-size:14px; }
.toolbar button { display:flex; align-items:center; gap:9px; min-height:46px; flex:none; border:1px solid #ffffff80; border-radius:14px; padding:12px 20px; background:linear-gradient(135deg,#ec1846,#b8082f); box-shadow:0 10px 24px #b8082f33,inset 0 1px 0 #ffffff55; color:#fff; font:650 13px 'Segoe UI',Arial,sans-serif; cursor:pointer; }
.toolbar button:hover { filter:brightness(1.06); } .toolbar button:focus-visible { outline:3px solid #283246; outline-offset:4px; }
.sheet { position:relative; width:1180px; margin:0 auto 30px; padding:42px 52px 34px; border:1px solid #fff; border-radius:26px; background:linear-gradient(125deg,#ffffff,#fbfcfe 60%,#f6f7fb); box-shadow:0 26px 70px #2a395522,inset 0 1px 0 #fff; overflow:hidden; }
.sheet:before { content:''; position:absolute; inset:0 0 auto; height:4px; background:linear-gradient(90deg,#c8102e,#e8566f 30%,#c9d1de 70%,#9aa6b8); }
.sheet + .sheet { margin-top:0; }
.masthead { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
.brand-lockup { display:flex; align-items:center; gap:12px; }
.report-brand { display:block; position:relative; width:150px; height:54px; overflow:hidden; flex:none; border-radius:10px; background:#fff; }
.report-brand img { display:block; width:100%; height:100%; object-fit:contain; }
.exam-tag { display:grid; place-items:center; height:54px; padding:0 18px; border:2px solid #161b26; border-radius:4px; font-size:24px; font-weight:800; letter-spacing:.5px; }
.identity { text-align:right; font-size:14px; line-height:1.6; color:#283246; }
.identity b { font-weight:800; } .identity span { display:block; color:#6a7486; font-size:12px; }
.identity .test-name { color:#283246; font-weight:650; }
h1 { margin:30px 0 22px; font-size:44px; line-height:1.05; font-weight:800; letter-spacing:-1.4px; }
h1 span { color:#c8102e; }
.score-box { display:grid; grid-template-columns:1fr 1.08fr; gap:52px; padding:34px 38px 30px; border:1.5px solid #9aa6b8; border-radius:4px; background:#fff; }
.score-box.is-single { grid-template-columns:1fr 1fr; }
h2 { margin:0 0 20px; font-size:28px; line-height:1.15; font-weight:800; letter-spacing:-.5px; }
.label { margin:0 0 4px; font-size:15px; font-weight:800; letter-spacing:.6px; text-transform:uppercase; }
.score-line { display:flex; align-items:flex-end; gap:22px; margin-bottom:24px; }
.score-line strong { font-size:58px; line-height:.95; font-weight:800; letter-spacing:-1.5px; }
.score-line.is-total strong { font-size:84px; letter-spacing:-3px; }
.score-meta { display:flex; flex-direction:column; align-items:flex-start; gap:3px; padding-bottom:6px; }
.score-meta small { color:#5a6475; font-size:13px; }
.pct { display:inline-block; padding:8px 12px; border:1.5px solid #9aa6b8; font-size:19px; font-weight:800; background:#fff; }
.score-line.is-total .pct { font-size:23px; padding:9px 13px; }
.pct.is-empty { color:#8a93a3; font-weight:650; font-size:14px; }
.section-name { margin:6px 0 2px; font-size:22px; font-weight:800; }
.footnote { margin:26px 0 0; color:#4d5768; font-size:13px; line-height:1.6; }
.ks-intro { margin:-8px 0 26px; color:#4d5768; font-size:15px; }
.ks-columns { display:grid; grid-template-columns:1fr 1fr; gap:36px; }
.ks-columns.is-single { grid-template-columns:1fr; }
.ks-columns h3 { margin:0 0 18px; font-size:22px; font-weight:800; }
.domain { margin-bottom:22px; break-inside:avoid; }
.domain strong { display:flex; justify-content:space-between; gap:10px; font-size:16px; font-weight:800; }
.domain strong em { color:#6a7486; font-size:12px; font-style:normal; font-weight:650; white-space:nowrap; }
.domain small { display:block; margin:3px 0 9px; color:#4d5768; font-size:13px; }
.bars { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
.bars i { height:15px; border:1.5px solid #9aa6b8; background:#fff; }
.bars i.on { border-color:#161b26; background:#161b26; }
.bars.is-math i.on { border-color:#161b26; background:#161b26; }
.bars.is-low i.on { border-color:#c8102e; background:#c8102e; }
.page-foot { display:flex; justify-content:space-between; gap:20px; margin-top:22px; color:#6a7486; font-size:11px; }
.page-foot b { color:#283246; }
.details h1 { font-size:34px; margin:26px 0 18px; }
.summary { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:22px; }
.summary div { padding:14px 16px; border:1.5px solid #d3d9e3; border-radius:4px; background:#fff; }
.summary span { display:block; color:#6a7486; font-size:11px; font-weight:700; letter-spacing:.6px; text-transform:uppercase; }
.summary b { display:block; margin-top:4px; font-size:22px; font-weight:800; }
table { width:100%; border-collapse:collapse; background:#fff; }
.module-table { margin-bottom:24px; border:1.5px solid #9aa6b8; }
.module-table th { padding:10px 14px; border-bottom:1.5px solid #9aa6b8; background:#f4f6f9; text-align:left; font-size:11px; letter-spacing:.6px; text-transform:uppercase; }
.module-table td { padding:10px 14px; border-bottom:1px solid #e3e7ee; font-size:13px; }
.module-table td:first-child { font-weight:700; }
.answers { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; }
.answer-module { break-inside:avoid; border:1.5px solid #9aa6b8; border-radius:4px; background:#fff; }
.answer-module h3 { display:flex; justify-content:space-between; margin:0; padding:10px 14px; border-bottom:1.5px solid #9aa6b8; background:#f4f6f9; font-size:14px; }
.answer-module h3 span { color:#6a7486; font-size:12px; font-weight:650; }
.answer-grid { display:grid; grid-template-columns:repeat(3,1fr); padding:8px 10px 10px; gap:2px 12px; }
.answer-grid div { display:grid; grid-template-columns:26px 1fr 1fr 16px; align-items:center; gap:6px; padding:3px 4px; border-bottom:1px solid #eef1f5; font-size:12px; }
.answer-grid div > span:first-child { color:#6a7486; font-weight:700; }
.answer-grid .yours { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.answer-grid .key { color:#0d7a55; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.answer-grid .is-incorrect .yours { color:#c8102e; font-weight:700; }
.answer-grid .is-unanswered .yours { color:#9a6b12; }
.answer-grid .is-correct .yours { color:#0d7a55; font-weight:700; }
.mark { font-weight:900; text-align:center; }
.is-correct .mark { color:#0d7a55; } .is-incorrect .mark, .is-unanswered .mark { color:#c8102e; }
.answer-legend { display:flex; gap:18px; margin:0 0 12px; color:#6a7486; font-size:12px; }
@media print {
  body { background:#fff; }
  .toolbar { display:none; }
  .sheet { width:auto; margin:0; padding:6mm 4mm 0; border:0; border-radius:0; box-shadow:none; background:#fff; }
  .sheet:before { display:none; }
  .sheet + .sheet { break-before:page; }
  h1 { margin:12px 0 12px; font-size:34px; }
  .details h1 { margin:12px 0 12px; font-size:28px; }
  .score-box { gap:34px; padding:20px 26px 18px; }
  h2 { margin:0 0 10px; font-size:22px; }
  .label { font-size:12px; }
  .score-line { gap:16px; margin-bottom:10px; }
  .score-line strong { font-size:44px; }
  .score-line.is-total strong { font-size:64px; }
  .pct { padding:5px 9px; font-size:15px; }
  .score-line.is-total .pct { padding:6px 10px; font-size:18px; }
  .section-name { margin:2px 0 0; font-size:17px; }
  .footnote { margin:12px 0 0; font-size:11px; line-height:1.45; }
  .ks-intro { margin:-4px 0 12px; font-size:12px; }
  .ks-columns { gap:26px; }
  .ks-columns h3 { margin:0 0 10px; font-size:17px; }
  .domain { margin-bottom:11px; }
  .domain strong { font-size:13px; }
  .domain small { margin:1px 0 5px; font-size:11px; }
  .bars i { height:11px; }
  .page-foot { margin-top:10px; }
  .summary { margin-bottom:12px; } .summary div { padding:8px 12px; } .summary b { font-size:17px; }
  .module-table { margin-bottom:12px; } .module-table th, .module-table td { padding:5px 10px; font-size:11px; }
  .answers { gap:10px; } .answer-grid { padding:4px 8px 6px; } .answer-grid div { padding:1px 3px; font-size:10.5px; }
  .answer-module h3 { padding:6px 10px; font-size:12px; }
}
@media screen and (max-width:1220px) { .sheet { width:auto; margin:0 12px 24px; } }
@media screen and (max-width:900px) {
  .toolbar { flex-direction:column; align-items:stretch; margin:16px 12px; }
  .sheet { padding:28px 18px 24px; border-radius:18px; }
  .masthead { flex-direction:column; } .identity { text-align:left; }
  h1, .details h1 { margin:22px 0 16px; font-size:32px; }
  .score-box, .score-box.is-single { grid-template-columns:1fr; gap:30px; padding:22px 18px; }
  .ks-columns { grid-template-columns:1fr; gap:10px; }
  .summary { grid-template-columns:repeat(2,1fr); }
  .answers { grid-template-columns:1fr; }
  .module-table th, .module-table td { padding:8px 6px; font-size:11px; }
  .page-foot { flex-direction:column; gap:4px; }
}
@media screen and (max-width:440px) {
  .brand-lockup { gap:8px; } .report-brand { width:118px; height:42px; } .exam-tag { height:42px; padding:0 12px; font-size:19px; }
  .score-line.is-total strong { font-size:64px; } .score-line strong { font-size:46px; }
  .answer-grid { grid-template-columns:repeat(2,1fr); }
  .module-table th, .module-table td { padding:6px 3px; font-size:10px; letter-spacing:0; }
}
`
