# Listening Full Test 12

## Source and duplicate review

Questions were transcribed from the user's five screenshots. Every answer was
checked against the user-supplied `56658_eng.pdf` (12-page timestamped transcript,
version 56658). The private Telegram reference was inaccessible:
`https://t.me/c/3953980848/55`.

Before adding content, fetched `origin/main` and confirmed it matched local HEAD
`67491e8de5bccf12e6cb1071e5b6a8c0feb2e3ee`. Searched the repository's content and
catalog for Film Club, extrahands, song-writing, Office Design, Bob Lacey and
Pablo. Also checked www.profai.uz's deployed `ieltsTrackCatalog-CBhgIjiV.js` and
`generatedIeltsTests-Xu5PD_-I.js`: Listening Tests 1–11 were registered, Test 12
was unfilled, and none of these source topics occurred in the content bundle.
The existing AGENTS.md already records the user's duplicate-before-add rule for
Listening, Reading, Writing and Speaking.

## Answer verification

| Questions | Answers in order | PDF pages |
| --- | --- | --- |
| 1–10 | age; 21.50; 2; parking; Argentina; singing; piano; 1922; comedy; talk | 2–4 |
| 11–20 | A; A; B; A; B; F; A; D; B; C | 5–7 |
| 21–30 | B; C; C; A; B; G; B; D; H; C | 7–10 |
| 31–40 | typing; desks; screens; share; privacy; security; health; energy; training; noise | 11–12 |

The four linked IELTS Tutor question sets below were also compared with the
screenshots and PDF. Their keys agree on 39 answers. Their Part 3 page lists
**21 A**, which conflicts with the transcript: Lorna finds evaluation simple
but has trouble keeping within the length limit. The PDF places that exchange
at 15:41–15:48, page 7. **21 B** is therefore used, with an explanation in review.
An independent [Track 3 transcript](https://www.scribd.com/document/786386215/B%E1%BA%A3n-sao-c%E1%BB%A7a-Track-3)
and the annotated [Listening Quý 2 transcript](https://www.scribd.com/document/1064955511/Listening-Qu%C3%BD-2)
corroborate this interpretation; the latter explicitly labels Q21 B.

Part 1 was additionally compared with the [Film Club transcript and key](https://ieltsactualtests.com/es/listening/2026-05-6).
That page uses different Parts 2–4 and recreated audio, so its audio was not used.

Each application question includes an original explanation and a PDF page
reference. Q3 accepts both `2` and `two`. The missing preposition in the Q40
screenshot is restored as “in the office”; the one-word answer remains `noise`.
No full transcript or user PDF is added to the repository.

## Audio provenance

The public download links below belong to Vol 3 Test 10, whose four question
sets match the user's screenshots:

1. [Film Club](https://www.tutorlistening.com/blog/film-club-ielts-listening)
   — [MP3](https://uploads.strikinglycdn.com/files/9bb03e92-8632-47cc-b713-85cff59242f7/Track1.mp3).
2. [extrahands.com](https://www.tutorlistening.com/blog/extrahands-com-ielts-listening)
   — [MP3](https://uploads.strikinglycdn.com/files/420d01bb-962a-4298-8aa8-10869ae943c4/Track2.mp3).
3. [Song-writing course for drama students](https://www.tutorlistening.com/blog/song-writing-course-for-drama-students-ielts-listening)
   — [MP3](https://uploads.strikinglycdn.com/files/b5dbfd77-ee3b-4a36-a387-8878af2b29bc/Track3.mp3).
4. [Office Design](https://www.tutorlistening.com/blog/office-design-ielts-listening)
   — [MP3](https://uploads.strikinglycdn.com/files/a5737cc4-6ca0-4b65-b3dd-c92dcef1e8de/Track4%20(mp3cut.net).mp3).

All four are 44.1 kHz stereo MP3. Source durations: 430.602449, 423.862857,
393.116735 and 313.430204 seconds. The first three boundaries align with the
user's transcript within approximately half a second: 7:11, 14:15 and 20:48.
The individual recordings are combined in order using FFmpeg's concat demuxer
and stream copy, preserving speech and speed. This is an assembled full test,
not a download from the inaccessible Telegram post. The paper-test transfer
time at the end of the PDF is not appended to the computer-based recording.

Local URL: `/audio/ielts-listening/listening-full-test-12.mp3`.
Browser duration: 1561.090612 seconds (26:01), within the 30-minute test timer.
Size: 29,784,417 bytes. SHA-256:
`2e1a1b08a2e2b0b2ea34641f28af201096b8e4e92fb51aa3b4971b3f7b64d55b`.

## Integration and validation

Registered in the existing catalog's twelfth slot and shared Listening data.
Uses the existing notes, multiple-choice, matching, continuous audio, timer,
navigation, persistence, submission, scoring and Analyze/review components.
The shared matching input layout now displays its supplied A–G/A–H option bank,
using the same option-list styling as the existing grid layout.

- `npm run build` passed, including the repository content validators and TypeScript.
- ESLint passed for the new data and changed catalog files.
- Test 12 integration suite verified the independently transcribed 40-answer
  key, distractor rejection, visible matching options, answer persistence,
  submission, 40/40, band 9 and all four analysis sections.
- Test 11 integration suite passed, including grading of earlier Listening tests.
- FFmpeg decoded the full assembled MP3 successfully.
- Hidden Edge checked actual playback, seeking across all four parts and near
  the end, desktop rendering and all four parts at 390px width without body
  overflow. No runtime exceptions occurred.
