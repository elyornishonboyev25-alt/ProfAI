# Listening Full Test 14 — version 57262

## Duplicate check

Before adding this test, fetched origin/main and confirmed both HEAD and the
remote were `04e35a76fd592b578183439375e2c3c511814bff`. Searched existing
source content for Getting a job with an airline, Rock Hotel, Education House
and Textiles with Business Studies. No matching test existed.

Also inspected www.profai.uz's live `ieltsTrackCatalog-kY8HvwgD.js` and
`generatedIeltsTests-DPfhZfYp.js`: Listening 1–13 were registered, slot 14 was
unfilled, and none of the four topics appeared in the deployed content.
AGENTS.md already preserves the duplicate-before-add rule for all IELTS modules.

## Questions and verified answers

Questions were transcribed from the six user screenshots. The user subsequently
provided the timed transcript identifying IELTS Listening version 57262 and
instructed us to use the answers supported by it. All 40 answers and their
explanations were checked against that transcript. Every question includes a
timestamp reference to the supplied transcript (not a promise of exact timing
in the assembled recording).

Public comparison sources, each also linking its original recording:

- https://www.tutorlistening.com/blog/getting-a-job-with-an-airline-ielts-listening
- https://www.tutorlistening.com/blog/which-two-kinds-of-people-are-the-scholarships-intended-for-ielts-listening
- https://www.tutorlistening.com/blog/education-house-ielts-listening
- https://www.tutorlistening.com/blog/textiles-with-business-studies-ielts-listening
- Part 1 independently agrees with https://ib8english.com/part-1-job-advice/

The private Telegram reference https://t.me/c/3953980848/85 was inaccessible.
The integration does not rely on access to that message.

| Questions | Answers in order |
| --- | --- |
| 1–10 | money; 168; maths; language; swim; illness; cultures; Eurontas; team; uniform |
| 11–20 | D; E; C; D; B; B; A; C; C; A |
| 21–30 | F; G; B; H; E; C; B; A; **B**; A |
| 31–40 | engineering; printed; global market; documentation; traditional; tutorials; reflective; business plan; journalism; interview |

Q11–12 accept D/E in either order; Q13–14 accept C/D in either order. Repeating
one correct letter earns only one mark. Q3 also accepts math and mathematics.
Case is ignored by the shared grading implementation.

### Correcting the public Q29 key

The public Education House page lists A for Q29, but its question options are
the same as the user's screenshot. The supplied transcript at 20:07–20:29
expresses surprise that management allowed the social space and explicitly
says staff must love it. Therefore **B, It is a surprising part of the design**,
is correct. A (unpopular with staff) contradicts the transcript; C incorrectly
limits the area to managers. The user was informed and instructed us to use
the answer supported by the transcript. The integration regression explicitly
rejects A for Q29.

## Original diagram

The unwatermarked diagram is publicly linked from https://testpoint.uz/exams/54:
https://testpoint.uz/media/exams/education_house_diagram.jpg

Downloaded without modification to
`public/images/ielts-listening-test14-education-house.jpg` (860 × 680, 59,310 bytes).
SHA-256: `b8c6e7afb349e77fcd0c8bbae82a406f4071a7dee221fcb1c794a96692042e89`.

Visually compared with the user's fourth screenshot: the original building,
trees, arrows, labels and Q21–26 numbered spaces match. No redraw, AI image,
watermark removal or image editing was used. The A–I option bank is rendered
above the original image with the shared Listening styling; six answer inputs
follow it. This keeps the original figure intact on desktop and mobile.

## Audio

The four original recordings come from the four matching public source pages:

1. https://uploads.strikinglycdn.com/files/c276c6fa-cc74-4f4d-8887-e90c09e265d9/01(1).MP3
2. https://uploads.strikinglycdn.com/files/b32239da-aa8b-4633-a5fc-1bf17d20f159/02.MP3?t=1717578297
3. https://uploads.strikinglycdn.com/files/c120d00f-9b2a-4639-a363-6d627ad614e2/03.MP3?t=1717579536
4. https://uploads.strikinglycdn.com/files/9c8682d1-5c09-4633-b577-f0eefcef5057/04%20(mp3cut.net).mp3?t=1717581004

Source SHA-256 checksums, in order:

```
77fb2faedd55951888015487ca54efa8da573e9a5290cf0c9858241b175907e2
78e05df1d6c752448380ffa1be93ac74d0fba27d7f6f5534089c17ff4d782d2a
0e84e2ef06b2217f8bd1672ca41970cf3ef0b9d8c3718a636396be7c7f426f0b
415334b27167c73ada308cd584c80e30882b0268284aae99c429271fa82284fa
```

Concatenated in question order with FFmpeg and encoded as 128 kbps stereo MP3
to reduce download size. No speed changes, synthetic speech or speech edits.
The fourth source already omits the long paper-answer-sheet transfer period.
The full recording fits the existing 30-minute computer-test timer.
Local asset: `public/audio/ielts-listening/listening-full-test-14.mp3`.
Final duration: 1657.535760 seconds (27:37), size: 26,521,644 bytes.
SHA-256: `1477a38c2688f98884f47d04f756f16708eddcfcaf822fae9ffbb1852e94c572`.

## Integration and validation

Registered in the existing fourteenth Listening catalog slot and source array.
Uses the shared audio player, notes, paired multiple choice, single choice,
matching inputs, navigation, flags, persistence, submission, band scoring and
Analyze/review components. No separate test interface or grading code was added.

The integration suite covers all 40 controls, source-key scoring, swapped pairs,
duplicate-choice rejection, the Q29 correction, saved answers, submission,
40/40 and band 9, and review of the original diagram and answer fields.
Previous Listening integration suites now check slot 15 as the next unavailable
test. Run with `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test14.tsx`.

Validation completed:

- Production build and all required content validators passed.
- Changed application files passed ESLint.
- Listening 14 integration and Listening 13 regression passed.
- FFmpeg decoded the entire assembled recording without errors.
- Hidden Edge verified playback, seeking across all four sections, the original
  diagram loading, desktop rendering and all parts at 390px without horizontal
  body overflow; no runtime exceptions occurred.
