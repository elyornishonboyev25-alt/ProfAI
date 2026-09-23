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
`src/assets/ielts/listening-test14-education-house.jpg` (860 × 680, 59,310 bytes).
SHA-256: `b8c6e7afb349e77fcd0c8bbae82a406f4071a7dee221fcb1c794a96692042e89`.

Visually compared with the user's fourth screenshot: the original building,
trees, arrows, labels and Q21–26 numbered spaces match. No redraw, AI image,
watermark removal or image editing was used. The A–I option bank is rendered
above the original image with the shared Listening styling; six answer inputs
follow it. This keeps the original figure intact on desktop and mobile.

Initially, the image was imported with `?inline`, following the existing profile-avatar
asset pattern. Vite includes its unchanged JPEG bytes in the test bundle, so
rendering no longer depends on a separate public-image request or a previously
cached response for that URL. The integration check verifies the embedded
image's SHA-256 against the original above.
The original public URL is retained for already-open sessions using the previous
bundle. Browser validation also passed with the public-image endpoint absent.

### Previous image recovery (superseded)

`ListeningDiagram` recognises both the embedded JPEG and the original public
URL retained in old Results/Analyze route snapshots. It first uses the embedded
image and automatically switches to a versioned same-origin copy on a decoding
or loading error. Both sources contain identical original bytes. Explicit image
dimensions preserve the figure's layout while it loads. Recovery state survives
ordinary timer rerenders and resets when a different source is rendered.

If both sources fail, a visible retry control reloads only the diagram and
bypasses a cached failed response; it never resets answers or reloads the test.
Attempts are bounded to avoid error loops. This closes two observed code gaps:
old review snapshots bypass current catalog assets, and the former bare image
element had no loading-error recovery. The user's particular browser failure
could not be reproduced from the live response alone, which returned a valid
original JPEG and an intact embedded image.

`node scripts/test-listening-diagram-browser.mjs` verifies in a real browser:
old public-URL snapshots, eight offline remounts, corrupt-image recovery,
rerenders after fallback, CSP-blocked data images, simultaneous source failures,
bounded retries and recovery after service restoration. The Listening 14
integration suite additionally reopens an old snapshot in Analyze and verifies
its diagram recovery alongside the original answers and grading.

### Native diagram and on-diagram answers (23 September 2026)

The user still encountered the failure screen after the embedded JPEG and public
fallback were added. The exact browser-specific cause was not established. Test
14 now uses native inline SVG paths, with no `img`, SVG `image`, image URL,
asynchronous image decoding, or retry state. The background is memoized so audio
ticks and typing do not rebuild the drawing. Test 15 retains its image recovery.

`src/assets/ielts/education-house-paths.json` is the diagram's source artwork.
It preserves every RGB pixel of the original 860 x 680 JPEG: horizontal runs of
identical pixels were merged vertically and grouped by color into filled paths.
No resampling, tracing approximation, label replacement or creative redraw was
used. The original JPEG was decoded with Windows System.Drawing into a 24-bit
BMP before conversion. Reconstructing all 584,800 pixels from these paths yields
SHA-256 `88e1e091fced059b6056b80193fd10689f52ff582e8bfe9b2221de5f2560e143`.
Run `node scripts/test-education-house-paths.mjs` to verify this integrity check.

Questions 21–26 are positioned over the six original dotted answer spaces. The
printed numbers, arrows, labels, trees and building remain in the background.
Controls use the shared answer state, navigation IDs, flags and review colors.
The diagram scrolls horizontally within its own frame on narrow screens, keeping
the answer fields usable. No duplicate answer rows are rendered underneath.
Old Analyze snapshots are upgraded only at rendering time; saved questions,
answer keys and submitted answers are preserved.

The six answer fields now have a uniform width and right-centered flags. The two
left-side fields sit immediately below their original numbered spaces to keep
the arrows clear; the original artwork is unchanged. Clicking an already-filled
field selects its letter so another letter replaces it directly. The SVG has a
separate composited paint layer and does not participate in pointer hit testing,
avoiding repeated work on its 61,078 pixel rectangles during focus/caret updates.

`node scripts/test-listening-diagram-browser.mjs` checks old URLs, offline
reopening, rerenders and `img-src 'none'` in real Edge. `--test15` retains the
other map's fallback regression checks. The full Test 14 integration suite checks
all 40 answers, six on-diagram controls, flags, scoring and old Analyze snapshots.

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
