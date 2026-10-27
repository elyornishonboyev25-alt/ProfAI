# IELTS stability and map answers

The route error boundary retains a healthy workspace across account sync and exam-mode changes. Its key depends only on account and navigation; a changed sync revision can retry an already failed boundary without remounting a running test. Writing and Speaking runner URLs now select the focused test shell directly, including full mock URLs restored without history state.

Eleven map layouts use answers on the map, without a second answer form underneath. Location maps accept question numbers or selection of a question followed by its location. Question keys retain bookmarks and navigation anchors. Word/letter completion maps retain their own numbered fields. The existing Old Water Mill and Education House inline diagrams remain interactive. The same layouts handle saved papers and Analyze, including hidden correct answers.

British Library and Community Centre are native SVG paths copied from the supplied originals. Geometry, lettering, people and compass retain the source coordinates; only the Library's duplicated instruction in the top 30 pixels is omitted. The trace authoring script reads the local source once. Display uses neither raster requests nor an image decoder. Drawings load separately and are memoized. The browser comparison requires zero PNG channel difference outside the omitted strip, and less than one mean channel level for the JPEG (decoder rounding). Other map drawings are unchanged, with answer controls positioned around their labels.

The compact text toolbar retains its dimensions. Ask AI has explicit contrasting hover/focus colors, and icons cannot shrink. Resume cards have a separate small remove button and a translated confirmation dialog. Cancel preserves the attempt. Confirm removes only its session, Writing draft, paper, annotations, launch preference and recordings, retaining other accounts and completed results. Finished Speaking days no longer appear as unfinished.

Older Speaking examiner checkpoints without the optional `sourceQuestionsOnly` field migrate to the stable test key. This repairs the full mock completion/review route after assessment outages.

## Checks

- `npm run build`, `npx tsc --noEmit`, and the final `npm run build:bundle`: content integrity, translations, types and production/PWA assets.
- `npm run test:ielts-stability`: healthy boundary updates, deletion/cancel, account isolation, audio cleanup, all nine additional map integrations, plus all 35 imported source sections, original map controls, bookmarks, focus, persistence and review.
- `node scripts/test-telegram-ielts-browser.mjs`: 35 source sections at 1366/390/320px, pixel comparisons, bounded map controls, real typing, reload and hidden-answer review.
- `npm run test:ielts-workspace-browser`: Ask AI hover contrast and icon visibility, compact tools, setup, rapid input, annotations, independent panes, browser Back/refresh and 1366/390/320px layouts.
- `npm run test:reading-ui`: 147 passage layouts and 1,882 saved question cards, source controls, practice/simulation persistence and review.
- `node scripts/test-listening-bank-browser.mjs --skip-audio`: 240 review views for the first 30 papers at desktop/mobile sizes, plus typing, anchors, stored answers and map screenshots. The five newer papers are covered by the source browser suite. Layout-only fixtures omit media downloads; audio completion has separate regressions.
- `npm run test:speaking-ui`: all 35 Speaking mocks, source questions, recorder formats, interrupted playback and recovery.
- Full mock flow/session/results/audio suites: all 35 four-skill routes, retakes and restored deadlines. `npm run test:full-mock-completion` also passes the repaired legacy checkpoint/outage case.
- `npm run test:ielts-resilience`, `npm run test:active-test-persistence`, and `npm run test:ielts-review`: exits, account-scoped drafts, original papers/deadlines, annotations and saved assessments.

Tests use local fixtures and deterministic provider/recording responses. They do not represent a private production login or a physical microphone test. Listening's final-track-only 120-second review/submission rule and the other skills' timing remain unchanged. No IELTS tests or answer keys were added or replaced.
