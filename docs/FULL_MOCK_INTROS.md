# Full mock section introductions

Each section begins with an original, approximately 24-second 1280×720 video in ProfAI's IELTS design, with four animated interface scenes and a prerecorded English voice. The media files under `public/media/ielts-intros` are intentional product assets. They need no runtime TTS service or third-party embed.

Full Mock **Open** requests fullscreen on the document within the click gesture and opens the first unfinished section directly. Completed mocks open their results overview. Fullscreen persists across routes. The overview and section starts provide another fullscreen entry control when a browser blocks the initial request or the candidate exits. Unsupported browsers retain the immersive page layout.

`FullMockSectionGate` keeps test runners unmounted during instructions. Video completion shows **Start**; **Skip video & start** begins immediately. The candidate can pause, replay, mute, read synchronized captions or expand the complete transcript. Blocked sound autoplay shows **Enable sound**; failed media leaves written instructions and a working start button.

Starting is stored per account, mock and section. Reloading a started section bypasses the intro so existing exam deadlines continue. Legacy active Reading/Listening sessions and Writing sessions also bypass it. Individual practice and saved-attempt review do not show these intros. Stale section routes still redirect to the first unfinished section.

Listening's existing final-recording + two-minute answer-review deadline is unchanged. Intro playback cannot trigger it because the test audio component has not mounted. Reading, Writing and Speaking timing remains unchanged.

## Scoring and official differences

Verified on 2026-10-12 against [IELTS scoring in detail](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail) and [IELTS Academic sample tests](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test). Existing overall scoring already averages all four bands and rounds to the nearest half band, with `.25` and `.75` rounding up. Regression tests include the three official worked examples and boundary scores. Writing continues to weight Task 2 twice as heavily as Task 1.

Public raw-score conversions can vary slightly between IELTS test versions. Writing and Speaking are AI practice estimates, not certified examiner results. The Speaking intro explicitly explains that real IELTS uses a human examiner. These are original ProfAI instructional videos, not official IELTS recordings.

## Maintenance and verification

- Copy and captions: `src/data/fullMockIntros.json`.
- Regenerate media: `node scripts/generate-ielts-intros.mjs` on Windows with an installed English SAPI voice and Microsoft Edge. Override `IELTS_INTRO_BROWSER` for another Chromium executable.
- Flow/session/scoring regression: `npm run test:full-mocks`.
- Native video/audio, caption synchronization, responsive controls and fullscreen: `npm run test:full-mock-intro-browser`.
- Browser screenshots are written to ignored `tmp/full-mock-intro-browser`; they are not committed.

The native browser test verifies audible audio, duration between 23.5 and 24.5 seconds, 720p frames, five viewport sizes, end/start behavior and fullscreen survival from the catalog through the overview into the intro.
