# Native Race Village map and audio-driven completion

The Race Village map in Listening Full Test 15 now renders as inline SVG paths.
The path coordinates retain every color run from the original 411 × 315 source,
including its lettering. There is no SVG image element, image request, font
dependency or image decoder. The original raster remains only for recognizing
saved test snapshots and for independent visual regression comparisons.
`RaceVillageDiagram` also handles old public-URL and embedded-image snapshots
through the shared `ListeningDiagram`, including Analyze.

All Listening attempts use the final audio `ended` event followed by 20 seconds
for answer checking. The separate countdown and practice duration selector are
hidden for Listening. Reading retains its countdown; other modules are unchanged.
The last answer state is submitted through the existing grading/results path.
Intermediate playlist tracks, missing audio, load failures and review playback
do not start submission. Manual submission and automatic submission share an
idempotency guard, and leaving the test cancels the pending grace period.
Elapsed time is recorded from the session start for result/eligibility tracking.

Validation:

- `node scripts/test-race-village-svg.mjs`: compares all rendered RGBA values with
  the original source (zero differences), verifies embedded and public-URL saved
  snapshots, blocks all image loads, tests offline remounts and mobile width.
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-audio-completion.tsx`:
  countdown removal, continuous/playlist audio, grace deadline, latest answers,
  single submission, load errors, manual submission, practice, review, cleanup,
  and the unchanged Reading timer.
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test15.tsx`:
  full 40-question grading, controls, persistence, submission and Analyze.
- `npm run build`: repository content validators, TypeScript and production build.

The user's native-drawing and Listening-completion preferences are recorded in
`AGENTS.md` for future work.
