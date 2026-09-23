# Listening Full Test 15 — version 54768

## Duplicate check

Before adding content, fetched origin/main. Both HEAD and origin/main were
`c56dbd01e06be746cf7e9290e21c77f93bcfe37a`. Searched the source catalog for
Holiday rental, Aster/Periwinkle Cottage, Bridge to Brisbane Fun Run, farmers'
attitudes and Aboriginal Textile Design. No matching test existed.

Also fetched www.profai.uz and inspected its current deployed bundles:
`ieltsTrackCatalog-CcAPZcnl.js` and `generatedIeltsTests-D2tDIQIO.js`. Neither
contained these topics or `ielts-listening-15`; slot 15 was still unavailable.
AGENTS.md already records the user's duplicate-before-add rule for every IELTS
module, including Listening, Reading, Writing and Speaking.

## Questions and answer evidence

All four sections and 40 questions come from the user's six screenshots.
Obvious spelling errors in the paper were corrected without changing tasks,
options or meaning. Each answer and explanation was checked against the user's
subsequently supplied timed transcript, which identifies version **54768**.
Locations refer to that transcript's timestamps, not exact player seek points.

| Questions | Answers in order |
| --- | --- |
| 1–10 | 14 September; 835; school; deck; river; towels; garage; Chinese; 200; July |
| 11–20 | A; B; A; B; F; A; B; H; G; I |
| 21–30 | A; C; B; A; B; B; G; E; D; B |
| 31–40 | wool; bird; rain; desert; prison; clothing; family; rainbow; snake; carpet |

Comparison sources:

- https://murodkamilov.uz/listening/mkl023/ — all four matching question sets,
  public answer key, original map and complete original audio.
- https://www.tutorlistening.com/blog/holiday-rental-ielts-listening — matching
  Part 1 questions, audio and answer key; its singular Q6 differs from the script.
- https://www.tutorlistening.com/blog/bridge-to-brisbane-fun-run-ielts-listening
- https://mini-ielts.com/1470/view-solution/listening/bridge-to-brisbane-fun-run

The private Telegram message https://t.me/c/3953980848/96 could not be opened.
The integration uses the supplied questions/transcript and the matching public
recording, rather than assuming access to that message.

### Differences resolved using the supplied script

- **Q1:** Aster Cottage is available September 14, not September 21. The user's
  question does not print the month beside the blank, so the complete date is
  required. Accepts 14 September, September 14, 14th September and September 14th.
  The MKL page's bare-day answers apply to its differently worded prompt.
- **Q6:** the recording says **towels**, plural. Do not inherit the singular
  `towel` from the Tutor Listening key.
- **Q18:** the building immediately below the finish line is **H**. One public
  comparison page (Gradding) incorrectly gives G; G is the prize draw box, Q19.
- **Q32:** **bird** modifies "images"; do not accept "birds images".

The existing permissive grading helper can equate phrases sharing their first
word. This test opts into `strictAnswerMatch`: compare complete normalized
answers, allowing case/punctuation differences and explicitly listed date
variants. This rejects partial dates, wrong dates with the same day/month and
extra words. Existing tests retain their prior grading behavior. Both submission
and Analyze use the same shared evaluator.

## Original map

The public MKL023 page embeds the matching unwatermarked PNG as a data URL.
Decoded its original bytes directly, without cropping, redrawing, resampling,
watermark removal or AI generation. Visually compared against the supplied
map: A–I buildings, roads, exits, two paths, finish line, shade tents, catering
and entry all match. The original available image is 411 × 315 pixels.

- `src/assets/ielts/listening-test15-race-village.png` — embedded with `?inline`.
- `public/images/ielts-listening-test15-race-village.png` — identical fallback.
- SHA-256 of both: `09c1b757957715253de91c61032e2e6ac282dd378d33a463906f02c97b2f0627`.

The shared ListeningDiagram component displays the image proportionally with
the same styling and bounded retry behavior as Test 14. Six separate answer
inputs follow it. Test and Analyze both use this component.

## Complete original audio

Source linked by the matching MKL023 page:
https://raw.githubusercontent.com/jasurrkham1dov-blip/listening/main/5476888888888.mp3

Copied directly to `public/audio/ielts-listening/listening-full-test-15.mp3`.
No cuts, concatenation, speed changes, re-encoding or synthetic speech.

- MP3, 44,100 Hz, stereo.
- Duration: 1909.289796 seconds (31:49).
- Size: 24,170,681 bytes.
- SHA-256: `193246b9925c7970a539efb5e1a851bbdf06b432ac161854957e6406734d5b12`.
- FFmpeg successfully decoded the entire recording without errors.

The source retains its original paper-test transfer announcements. The test
and its catalog card use **32 minutes** to allow the entire unchanged track
to finish. Playback remains continuous while switching sections; review uses
the existing play/pause/seek controls.

## Validation

- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test15.tsx`
  checks the independent script-derived key, date variants, distractor rejection,
  all 40 controls, saved answers, submission, band 9, four analysis sections,
  original map checksum, image fallback and read-only answer review.
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test14.tsx`
  checks the prior test after extending the shared diagram and scoring helpers.
- `node scripts/test-listening-diagram-browser.mjs --test15` checks actual mobile
  browser decoding, offline remounts, fallback, CSP failures and bounded retries.
  Running without the flag also checks the original Test 14 image.
- `npm run build` runs repository content validators, TypeScript and Vite.
- Build, TypeScript and targeted ESLint completed successfully. A temporary
  browser fixture also rendered the full shared test at 1440 × 1000 and
  390 × 844, clicked Play, confirmed advancing playback and the exact MP3
  duration, switched to Part 2 and visually checked the original map.

Only the existing fifteenth catalog slot is activated. Shared navigation,
flags, answer persistence, scoring, results and Analyze remain the integration
path; no separate test interface is introduced.
