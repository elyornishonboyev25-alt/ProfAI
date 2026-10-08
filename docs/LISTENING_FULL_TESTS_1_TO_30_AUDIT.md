# Full Listening 1–30 audit — 2026-10-04

## Scope and fixes

All 30 catalog entries, 120 sections and 1,200 numbered question slots were
checked. Existing question IDs are retained so saved answers can be reviewed.

- Inline completion inputs now reserve their actual width and vertical focus
  clearance. Neighbouring fields do not overlap while typing. Colours, borders,
  typography and the existing page design remain in use. Correct-answer hints
  wrap within the field width. Inputs have accessible question labels.
- Matching inputs no longer create duplicate DOM IDs. Both numbered slots of a
  paired-choice question have navigation anchors. Review highlights both correct
  choices; partial reviews retain their original Part and question numbers.
- Listening completion grading compares the complete answer. Alternative strings
  in an array represent one blank, not several selections. Curly apostrophes are
  handled consistently. Reading's answer matching behavior remains unchanged
  except equivalent apostrophe punctuation and original part numbering.
- Results, saved review and Analyze use current Listening content and recompute
  scores from saved answers. Analyze identifies these attempts as Listening and
  opens the Listening route. Legacy empty section-ID lists mean all sections.
- Test 1's placeholder content and four repeated full recordings were replaced
  with the existing paper corresponding to its audio. It uses one continuous
  recording. Its original public test, section and question IDs are retained.
- Test 3 Q5: corrected 103 to 1,013. Added supported answer variants in Tests
  3/4, and restored the rabbit table's destination. Test 1 receives the same fix.
- Test 6 Q9: restored the distractor “repaired”. Test 7 Q18: restored the old-house
  distractor; Q23: corrected A to C. Its matching tasks now have the matching type.
- Test 8 Q38: corrected salty to rain; accepted fertilizer/fertiliser, grey/gray
  and hot house/hothouse.
- Test 10 Q13 and Q20: corrected to C (evening conversation and equal lengths).
  Removed misplaced trailing words from the Q16 roundhouse prompt.
- Test 28: restored omitted matching choices H (wild flowers) and I (hills), and
  corrected Q11–12 task types. Tests 23–30 matching questions carry their choice
  lists for grading/review.

## Answer evidence

`scripts/fixtures/listening-audit-source-keys.json` records independent keys and
source URLs for Tests 1–10 (Test 1 uses Test 3's paper). Sources were compared with
the existing question/options, not copied blindly:

- [Cycling holiday in Austria](https://ielts.completesuccess.in/index.php/2020/06/04/cycling-holiday-in-austria-ielts-listening-with-answers/)
  and [its transcript](https://helik.net/listening/66fb6f69fed20f64c82e8d39/answers).
- [Car rental inquiry](https://www.ieltsbykamal.com/2022/10/car-rental-inquiry-ielts-listening-test.html),
  [Prime Recruitment](https://ielts.completesuccess.in/index.php/2020/06/04/prime-recruitment-employee-record-ielts-listening-with-answers/),
  and [Trainer 1 Test 6](https://ieltsvault.com/resources/listening/tests/ielts-trainer-1-listening-test-6).
- [Volume 8 Test 8](https://www.scribd.com/document/1052966408/Vol-8-Listening)
  matches Test 6. Source Q7 A maps to the existing local option B (broken lock).
- [Family presents / work experience transcript](https://www.scribd.com/document/814834429/Test3-tapescript)
  matches Test 7. Source Q22 C maps to local A (setting goals). The conflicting
  mkl025 key was rejected where contradicted by the transcript. Existing option
  ordering is retained to preserve the meaning of saved letter answers.
- [Test 8's full paper](https://murodkamilov.uz/listening/mkl004/) and an independent
  [mangrove transcript](https://helik.net/listening/694b602d99c688595176bf81/answers)
  agree on rain water. [Test 9's paper](https://murodkamilov.uz/listening/mkl037/)
  matches all 40 existing answers.
- [Timestamped Volume 9 audio script](https://www.scribd.com/document/1077055343/VOL-9-Listening-Parts-1-2-Audio-Scripts)
  verifies Test 10 Parts 1–2, including both corrected letters. Its debate part
  matches [the debate transcript](https://www.scribd.com/document/1069959307/Vol-9-Test-2-Listening-Transcript).
  Part 4 is After Action Review, also documented in `LISTENING_FULL_TEST_20_SOURCE.md`;
  it is not the office-design part found in some Volume 9 compilations.
- Tests 11–21 use the independently transcribed answer sheets in their existing
  `scripts/tests/listening-full-test*.tsx` regression suites. Test 22 uses its
  existing standalone validator. Tests 23–30 use the existing source/integrity
  fixture, including documented accepted-answer corrections.
- [Test 28's source option bank](https://murodkamilov.uz/listening/mkl010/) confirms
  the missing H/I choices.

The unified validator requires a source key for every test and checks that each
scores 40/40, including unordered pairs. It also rejects former incorrect keys
and incomplete/extra-word completion answers.

## Audio

All 56 distinct referenced MP3 paths were fully decoded in Chromium, checked for
non-silent samples and plausible duration. A separate full FFmpeg decode exposed
invalid metadata embedded inside Tests 7 and 10. These were repaired by removing
non-audio tag blocks and remuxing MP3 frames with codec copy, without re-encoding.

Compressed audio frames, excluding Xing/Info seek metadata, are byte-identical
before and after repair:

| Test | Frames | SHA-256 of compressed audio frames |
| --- | ---: | --- |
| 7 | 58,381 | c95a4de83f528587bf1996dd6e8be25141317585e780e2add997bfb9068fc26e |
| 10 | 67,072 | fc4f1642631b6f67a2600cb2552676f2129aff2858ad24db06e636628d40a285 |

Both repaired files pass full FFmpeg `-xerror` decoding. The catalog validator
pins their repaired file hashes. No speech was generated, replaced or edited.

Listening still has no separate countdown timer. Existing completion regression
checks verify submission 20 seconds after the final audio ends, not after earlier
playlist tracks, audio errors or review playback. Reading timing is unchanged.

## Verification

- `npm run build` (includes `validate:listening`)
- `npx tsc --noEmit` and ESLint on changed application files
- `node scripts/test-listening-bank-browser.mjs`: 240 saved-review views
  (30 tests × 4 parts × desktop/mobile), unique anchors, no overlapping inputs,
  no page/pane overflow, read-only saved answers, valid diagrams, actual keyboard
  typing and localStorage persistence in Prime Recruitment, focus clearance,
  partial Part 4 review, and full MP3 decoding.
- `node scripts/test-listening-parts-ui.mjs`
- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-audio-completion.tsx`
- `node scripts/validate-listening-full-test22.mjs`
- `node scripts/validate-ielts-full-mocks-23-30.mjs`

Browser logs and screenshots are generated under ignored `tmp/listening-bank-audit`.
The browser script uses a local hidden Edge instance; another Chromium executable
can be supplied through `LISTENING_TEST_BROWSER`.

## Existing content limitations

At the time of this audit, Tests 1 and 3 shared the same paper. On 2026-10-07, Test 3 was replaced with the user-supplied January 2026 Practice Test 1; Test 1 retains the original Cycling Holiday paper. See LISTENING_FULL_TEST_3_SOURCE.md for the replacement source and verification.

Test 19 is the previously user-authorized selection of 40 questions from a
49-question recording. Original spoken numbers therefore differ from website
numbers. Its existing instructions/explanations document that mapping. No
recording was cut or renumbered in this audit.

Automated decoding verifies file integrity, not every spoken word. Answer-source
comparisons and UI tests provide substantial coverage, but do not establish an
absolute guarantee that all third-party source material is error-free.
