# Listening Full Test 13

## Sources and duplicate check

Questions and the 40-answer key were transcribed from the user's screenshots.
The private Telegram reference, https://t.me/c/3953980848/73, could not be read.

Before adding the test, fetched origin/main and confirmed both it and HEAD were
`ed18894f543aac20be277c2d3ae6880a1303f809`. Searched the repository content for
Campervans, Bexter, Varroa and natural building materials: no existing test matched.
Also inspected www.profai.uz's live `ieltsTrackCatalog-pXX7ScQj.js` and
`generatedIeltsTests-HVoUZomo.js`. Only Listening 1–12 were registered; none of
the four topics appeared, and slot 13 was unfilled. AGENTS.md already preserves
the user's duplicate-before-add rule for all four IELTS modules.

The complete question set and answer key also match these public source pages:

- https://ieltsmaterial.netlify.app/mocks/listening-mock-1
- https://murodkamilov.uz/listening/mkl026/index.html

## Answer key

| Questions | Answers in order |
| --- | --- |
| 1–10 | 0491570156; post; bed; 39; kitchen; heater; microwave; airport; 49; Australia |
| 11–20 | A; B; B; C; A; A; D; B; F; A |
| 21–30 | B; C; D; A; G; E; C; F; B; D |
| 31–40 | foundation; sand; clay; convenient; training; labour; roof; insects; strength; fire |

Q21–25 require letters, as instructed in the source: the answer-key labels
flower, hive, honey, blood and virus identify B, C, D, A and G respectively.
Q36 also accepts the American spelling `labor`. The leading zero in Q1 is
required. Explanations are based on the supplied questions and answer key;
they are not claimed to be a word-for-word transcript.

## Audio

Both complete source pages link the same original recording:
https://raw.githubusercontent.com/jasurrkham1dov-blip/mock-test-2/main/57474.mp3

Original: 22,311,511 bytes, 2255.934694 seconds, 44.1 kHz stereo MP3.
Original SHA-256:
`8e12d567cab2f5a56019f59c93f5cf380b9d23dbe7f18536b9569de51af5f60f`.

The recording contains a final paper-answer-sheet transfer period. Silence
detection locates the last section's checking pause at 1605.897891–1636.227891
seconds, followed by the transfer instruction and silence at
1644.522268–2125.370113, with the remaining timed reminders at the end.
The web version retains the first 1636.1 seconds using FFmpeg stream copy:
all four question sections and their checking pauses are kept, without
re-encoding, changing playback speed or synthesizing speech. Only the final
paper transfer period and its instruction/reminders are omitted.

Local asset: `/audio/ielts-listening/listening-full-test-13.mp3`.
Final duration: 1636.114286 seconds (27:16), within the 30-minute timer.
Size: 16,217,134 bytes. SHA-256:
`7abdbbcc18080d9f6a7846d2f92b808c111ec2310fe1c8065c6f5b25d4e76255`.

## Integration and validation

Registered in the existing thirteenth Listening catalog slot. Uses the shared
notes, multiple-choice, matching option banks, flow-chart, continuous audio,
navigation, persistence, submission, scoring and Analyze/review implementation.
The flow-chart is interactive, with every step retained from the screenshot.

- Production build and repository content validators passed.
- Listening 13 integration suite checks the independent screenshot answer key,
  wrong-answer rejection, case/spelling handling, all 40 controls, option banks,
  saved answers, submission, 40/40, band 9 and review of all four parts.
- Previous test suites' next-unavailable-slot assertions now point to slot 14.
- Listening 11 and 12 regression suites passed.
- Changed application files passed ESLint; FFmpeg decoded the final audio
  completely without errors.
- Hidden Edge verified real MP3 playback, seeking across the four sections,
  desktop rendering and all four parts at 390px width without body overflow.
  No runtime exceptions occurred.
