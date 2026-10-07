# Listening Full Test 3 - January 2026 Practice Test 1

## Duplicate check

On 2026-10-07, refreshed `origin/main` at `4fbf188b` and searched the repository's complete Listening sources and catalog for Winsham Farm, Sherborne, stocktaking, study syndicates and health on the night shift. None were present. Also inspected the deployed https://www.profai.uz catalog and source bundles `ieltsTrackCatalog-CZbEpoYX.js` and `generatedIeltsTests-BTuwI6Wt.js`; they listed 30 Listening tests and contained none of these parts. The user explicitly requested replacement of Full Listening Test 3.

## Questions and answers

The user's six question screenshots supply the complete 40-question paper. Their subsequent answer screenshot supplies the key. Both match [IELTS Mock Test 2026 January - Listening Practice Test 1](https://ieltsonlinetests.com/ielts-mock-test-2026-january-listening-practice-test-1) and its [original solution](https://ieltsonlinetests.com/ielts-mock-test-2026-january-listening-practice-test-1/solution).

The four parts are Winsham Farm, Vacation Jobs, Study Syndicates and Health on the Night Shift. Choice order, numbered blanks, note nesting, table cells and answer limits follow the user's questions. Obvious source spelling/label errors (cycling rout, daytir and Part 1 inside Part 4) are corrected without changing the answers. No map or diagram is present.

| Questions | Source answers in order |
| --- | --- |
| 1-10 | C; A; B; B; B; C; C; A; COTEHELE; SH12 1LQ |
| 11-20 | travelling; get good shoes; wearing formal clothes; large office; good pay; live nearby; B; C; B; A |
| 21-30 | share ideas; deeper research; Mountain building; 17th May; 29th May; 30-40 minutes; question(s) / discussion; articles (from journal); internet; photocopy |
| 31-40 | a huge increase; internal clock; light dark; unsocial hours; stomach; depression; mental ability; performance; family life; peer group / friends |

Q27 accepts question, questions, discussion, and questions and discussion. Q28 treats the journal qualifier as optional, as shown in the source key. Q33 accepts light dark and light and dark; both components are required. Q40 accepts either peer group or friends. Completion grading requires the complete answer, with case/punctuation normalization and explicitly listed variants; isolated first words are rejected. Every question includes a contextual explanation and part/question location for Analyze. No unverified timestamps or transcript are supplied.

## Original audio

The original source page embeds this continuous MP3:

https://ieltsonlinetests.oss-ap-southeast-1.aliyuncs.com/Audio/Mock%20Test%202026/01/Test%201/Jan%202026%20-%20Practice%20Test%201.mp3

It is stored unchanged at `public/audio/ielts-listening/listening-full-test-3.mp3`: 10,606,015 bytes; decoded duration approximately 1,799.6 seconds (29:59.6); SHA-256 `95f1c226a60f064a8982036a90d83be8bd11e0f2aa1718a1759bbc1910944979`. It is one continuous recording, so changing parts keeps the same playback position. The shared runner submits 20 seconds after the final recording ends and displays no separate Listening countdown.

## Catalog and saved attempts

The replacement keeps public slot/route `ielts-listening-3` and uses new `lt3-jan2026-*` question and section IDs. The old paper is removed from that live slot. Test 1 previously referenced Test 3's data; it now independently retains its original paper and already-existing identical recording at `test1-part1.mp3`. A review-only archived Test 3 is selected for saved results containing the old question or section IDs, preserving their questions, answers and audio without exposing another catalog entry.

Test 3's vocabulary uses 20 words from the replacement questions with the existing English definitions and Uzbek/Russian translation support.

## Verification

- `npm run build`: all catalog validators, vocabulary/translation checks, TypeScript and production bundle.
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test3.tsx`: all 40 screenshot answers, accepted/rejected variants, original audio checksum, slot registration, answer persistence, submission, band 9, persisted Analyze, and archived-paper resolution.
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-audio-completion.tsx`: final-track plus 20-second submission, earlier playlist tracks, loading errors, manual submission, review playback, leaving the test and unchanged Reading timing.
- Hidden Edge QA: all four saved-review parts at 1440px and 390px, unique question controls, saved values, disabled review inputs, no field overlap or page overflow, and full non-silent MP3 decoding. Ignored screenshots and layout results are in `tmp/listening-bank-audit/`.
- Real browser playback: the original MP3's native final `ended` event submitted once after 20 seconds; no submission occurred at 19 seconds. Browser media duration was 1,799.65 seconds.
