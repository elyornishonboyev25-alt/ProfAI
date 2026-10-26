# Original Telegram IELTS papers — first verified batch

Source channel: https://t.me/jasurbekisaev. Imported on 2026-10-26.

This batch adds five Listening, five Academic Reading and five Writing full tests.
It does **not** add a completed four-section Full Mock: the downloaded source
HTML files contain Listening, Reading and Writing, without Speaking question sets.
The existing 30 complete Full Mocks remain available. Ten additional complete
Full Mocks have not yet been delivered.

| ProfAI full-test number | Channel file | Original post |
| --- | --- | --- |
| 31 | FULL CDI MOCK TEST 28.html | https://t.me/jasurbekisaev/16224 |
| 32 | FULL CDI MOCK TEST 29.html | https://t.me/jasurbekisaev/16329 |
| 33 | FULL CDI MOCK TEST 30.html | https://t.me/jasurbekisaev/16354 |
| 34 | FULL CDI MOCK TEST 32.html | https://t.me/jasurbekisaev/16428 |
| 35 | FULL MOCK 33.html | https://t.me/jasurbekisaev/16539 |

## Content and media

The source question and passage HTML is retained, with script-free controls bound
to ProfAI answer IDs. Question wording, original tables, answer choices and source
answer keys are preserved. Images are copied from the original embedded data or
the exact source image URLs, without redrawing, cropping or recompression. Both
test and saved-attempt review use those original assets. Paper snapshots retain
the source layouts and answer IDs.

Each Listening paper uses its own continuous source recording. Tests 31–34 retain
the original Jukehost audio URLs; the embedded recording for Test 35 is included
locally. All five complete recordings were downloaded and their original byte
counts and SHA-256 hashes recorded before import. Remote recordings require the
source host to remain available. The existing final-audio-end plus 120-second
review countdown and persisted deadline are unchanged.

The independent source keys, source-file digests, audio evidence and original
image hashes are in `scripts/fixtures/telegram-ielts-integrity.json`. The source
HTML, temporary downloads, search inventories and desktop automation helpers
remain outside the committed source tree in ignored `tmp/`.

## Duplicate and completeness checks

The repository catalog was compared with the current upstream `main` before
selection. Passage titles/opening text, all objective answer slots, Writing task
prompts and recording hashes were checked against the existing catalog and this
batch. Channel Mock 27 was excluded from this batch because it repeats
"Neanderthal Technology", also found in Channel Mock 29. Channel Mock 31 was
excluded because its Writing Task 2 lacks a task directive in the supplied HTML.
Unretrieved Speaking sets and incomplete sources are not represented as ready
tests or used to increase the complete Full Mock count.

The 15 new skill tests also include vocabulary collections required by the live
catalog. Listening and Reading words use excerpts from their own source parts;
Writing words are labelled as topic vocabulary and do not alter the original tasks.

## Verification

- `node scripts/validate-telegram-ielts.mjs`: original keys score 40/40; 40 numbered
  slots; every source input binds to a known question; source image hashes; live
  catalog resolution; duplicate checks; saved Writing task lookup.
- `npm run validate:reading`, `npm run validate:listening` and
  `npm run validate:writing`: existing and extended catalogs.
- `npm run validate:vocabulary`: catalog coverage, source attribution and translations.
- `node scripts/test-listening-parts-ui.mjs scripts/tests/telegram-source-ui.tsx`:
  source input state, multiple-choice limits, immutable-paper review, navigation
  anchors and HTML sanitization.
- Existing `listening-audio-completion.tsx`: final-track completion, 120-second
  countdown, playlists, audio failures, review playback and Reading timing.
