# Listening Full Test 11

## Source and duplicate check

The user supplied five question screenshots from `53834 copy.pdf`, the target
Listening Full Test 11 card, and the complete 40-answer key. Questions and
answers were transcribed from those images. The supplied Telegram reference
(`https://t.me/c/3953980848/38`) was not publicly accessible.

Before adding the test, fetched `origin/main` (083b331d) and compared the existing
Listening source files and catalog. Also inspected the deployed www.profai.uz
catalog (`ieltsTrackCatalog-BS_u1N5S.js`) and content bundle
(`generatedIeltsTests-Dcxjnfr4.js`). The live catalog had Listening Tests 1–10.
Neither the source files nor deployed content contained Ohope Holiday Park,
Riding for the Disabled, Ravi's outdoor-play discussion, or the heat-pump trial.
Test 11 was available as an unfilled catalog slot.

The duplicate-before-add rule for all four IELTS modules already exists in the
repository's AGENTS.md and remains in effect.

## Audio

Public recordings were located through pages containing the same question sets
and matching answer keys:

1. [Ohope Holiday Park](https://www.ieltsxpress.com/ohope-holiday-park-accommodation-listening-answers/)
   — [MP3](https://www.ieltsxpress.com/wp-content/uploads/2025/06/Ohope-Holiday-Park-Accommodation-audio.mp3)
2. [Joan / Riding for the Disabled](https://www.tutorlistening.com/blog/joan-normally-gets-up-at-ielts-listening)
   — [MP3](https://uploads.strikinglycdn.com/files/78d5e62b-e039-4a3d-8b8b-3ecd59a2c29c/a2.mp3)
3. [Children's outdoor play](https://www.tutorlistening.com/show_iframe_component/22562451?source=live_site)
   — [MP3](https://uploads.strikinglycdn.com/files/33a9d86d-d447-46c3-908f-70c164678908/a3.mp3)
4. [Field trial – heat pump technology](https://www.tutorlistening.com/show_iframe_component/22562655?source=live_site)
   — [MP3](https://uploads.strikinglycdn.com/files/c0f4d888-8914-47c9-b818-0c13b45708ed/a4.mp3)

All four sources are 44.1 kHz stereo MP3, approximately 128 kbit/s. They were
concatenated in question order using FFmpeg's concat demuxer with stream copy,
without changing speed, re-encoding, or synthesizing speech. The original source
durations are approximately 5:25, 6:08, 7:02, and 5:49. The resulting recording
is approximately 24:25, within the shared 30-minute test timer.

The application serves the recording locally at
`/audio/ielts-listening/listening-full-test-11.mp3`, avoiding third-party playback
dependencies. Size: 23,446,300 bytes. SHA-256:
`d14c1bea2d40edff094e7292c2e444ef30b5dd9dd86ea3abfca91272a23f1cd1`.

## Integration and grading

The test uses the existing Listening table, notes, multiple-choice, matching,
paired-choice, navigation, audio player, submission, and analysis components.
Each part contains ten numbered questions. The ambiguous screenshot heading
“Questions 11 and 20” is corrected to “Questions 11 and 12”; obvious grammar
in the activity labels is corrected without changing the questions' meaning.

The answer key's unordered pairs are 19–20 B/E, 21–22 A/E, 23–24 A/D, and
25–26 C/D. Grading consumes each correct choice once per pair, so either order
works, a single correct selection earns one mark, and duplicates cannot earn
two marks. This also corrects partial-credit handling for the existing
Listening paired-choice blocks. Other question types retain their grading.

## Verification

- `npm run build`
- `node scripts/test-listening-parts-ui.mjs`
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test11.tsx`
- ESLint on changed application files.
- FFmpeg decoded the complete output recording without errors.
- A hidden Edge browser decoded and played the local MP3 (1465.364898 seconds),
  sought across all four recordings and near the end, and rendered desktop and
  390px mobile layouts. Tables scroll inside their container on narrow screens.

The new integration suite checks the independent user-provided answer key,
40/40 and band 9, all four analysis sections, reverse-order and partial paired
answers, duplicate rejection, earlier Listening keys, rendering every part,
selection limits, saved answers, submission, and answer review.
