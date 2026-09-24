# Listening Full Test 20 — version 55124

## Duplicate check and authorization

Checked the local Listening sources/catalog, refreshed `origin/main` (same as
HEAD, `8e752e8f`), and read the deployed www.profai.uz bundles
`ieltsTrackCatalog-m7tHQh11.js` and `generatedIeltsTests-BvnipSvq.js` before adding
the test. Parts 1–3 and this complete test were absent. Part 4, After Action
Review Process, already exists in Full Test 10. The user was told and explicitly
approved adding the full test despite that repeated part. This is a test-specific
exception; the repository's duplicate-check rule remains in force.

## Questions and answer evidence

The user's four question scans provide the wording, answer limits, map and
three-box seminar flow chart. Their timestamped transcript identifies the
recording as IELTS Listening version 55124. All 40 answers were checked against
that transcript. Each question includes a timestamp and an explanation for
Analyze. Timestamps refer to the supplied transcript; broad cues containing
several answers retain their original interval.

Public comparisons:

- https://murodkamilov.uz/listening/mkl038/ — all four matching parts, embedded
  version 55124 recording and full answer key.
- https://www.scribd.com/document/729916669/LISTENING-4 — matching question paper
  and key, with an incorrect answer for Q23 (see below).
- https://helik.net/listening/68ef06caeacf5105877afd16/answers — independent
  Rivermead transcript and map key C, E, G, H, F, B. Its multiple-choice table
  uses zero-based indices 1, 0, 2, 0, corresponding to B, A, C, A.

Q23 is **B**, not A. At 15:50–16:06 the supplied transcript says the DDT treatment
was later found harmful to humans. Treatment for military use does not establish
that a soldier invented it. The MKL038 key agrees with B; the Scribd key's A was
not adopted. This distinction is also covered in the automated grading test.

Plural answers follow the transcript and sentence grammar: photographs/photos,
reasons and leaders. The public page additionally accepts singular variants;
those were not copied because they do not match the supplied recording/notes.
Numeric identifiers retain every digit, including the initial phone-number zero.

Verified key:

| Questions | Answers in order |
| --- | --- |
| 1–10 | TCJ700785; Ocean; 0718849923; computer; carpet; suitcase; camping; roof; window; photographs (photos) |
| 11–20 | B; A; C; A; C; E; G; H; F; B |
| 21–30 | A; C; B; C; A; G; D; B; A; F |
| 31–40 | army; safety; learning; reasons; trust; writing; open; leaders; training; time |

## Audio

Source: https://raw.githubusercontent.com/jasurrkham1dov-blip/0000/main/55124.mp3

Stored unchanged at `public/audio/ielts-listening/listening-full-test-20.mp3`:

- 25,008,632 bytes.
- SHA-256: `d54104a204a288728b822c297c6f0e97dbab4d23899df34e9f7f41de2465007b`.
- Browser-decoded duration: 2257.95483 seconds (37:37.95).
- The original recording includes its paper-test answer-transfer interval.
  No audio was cut or synthesized. There is no additional on-screen countdown;
  the shared Listening behavior submits 20 seconds after the recording ends.
- The private Telegram reference could not be opened publicly.

## Rendering and verification

Slot 20 uses the same catalog, test interface, answer persistence, grading and
Analyze renderer as the other Listening tests. The campus is a native inline SVG
traced using the supplied map's coordinates, with roads, forks, roundabout,
entrance, car parks, classroom block, trees, compass and A–J locations. Its stable
identifier survives JSON-saved attempts without external image requests.

The flow chart uses the existing flow renderer with preserved line breaks so its
three boxes retain headings and bullets.

Validation:

- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test20.tsx`
  checks the catalog slot, audio checksum, all 40 controls, strict marking and
  distractors, continuous playback across parts, saved answers, band 9 for a
  perfect attempt, and all four parts in saved Analyze including the SVG.
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-audio-completion.tsx`
  checks the 20-second delay, earlier playlist tracks, failures, review playback,
  unmounting and unchanged Reading timing.
- Hidden Chromium check confirmed MP3 decoding, map rendering with all images
  blocked, repeated offline reopening and mobile-width fit.
- Test 19 and shared Listening parts regression suites passed. `npm run build`
  completed validation, TypeScript, Vite and PWA generation; Vite reported its
  existing large-bundle warning (PowerShell's redirected stderr surfaced it as
  a NativeCommandError, although the build log confirms successful generation).
