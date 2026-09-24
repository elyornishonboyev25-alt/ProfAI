# Listening Full Test 19

## Duplicate check

Checked local IELTS Listening content and catalog, upstream `main` at
`ef3d184a59ee01800cf2e30746e9173d7e8ec2b8`, and the deployed www.profai.uz
assets `generatedIeltsTests-AhDASyun.js` and `ieltsTrackCatalog-CY657i3P.js`.
Tests 1-18 were available; slot 19 was unavailable. No East Coast Employment
Agency, Desert Holidays, eucalyptus or wombat match was found in that content.
AGENTS.md already requires duplicate checks for all four IELTS skills.

## User-supplied content and 40-question adaptation

The question images contain 49 questions and no map or diagram. The later
answer image supplies the authoritative key. The user explicitly requested
40 selected questions, with answers mapped only to those retained questions.
The adaptation has four parts with ten questions each, following existing
Listening full tests. Question wording and options come from the user's images.

| Website questions | Original questions | Answers in website order |
| --- | --- | --- |
| 1-10 | 1, 2, 3, 4, 5, 8, 9, 10, 12, 13 | 0406774008, Whitby, Summer, 16, families, comments, caravan, cleaning, September, 35.70 |
| 11-20 | 14-23 | A, A, B, B, C, A, B, D, D, A |
| 21-30 | 24, 25, 26, 27, 28, 29, 30, 31, 35, 36 | C, E, B, D, A, D, D, B, I, E |
| 31-40 | 37, 39, 40, 41, 42, 44, 45, 47, 48, 49 | night, illness, vegetation, birds, temperature, forest, fence, sand, fur, water |

Omitted Part 1 and Part 4 blanks are filled as contextual notes. Omitted
tree rows (Coolabah, Stringybark and Yellow Box) are removed; the full A-I
reason bank remains so the retained questions keep their original choices.
All six paired-choice questions are retained. Pairs 21/22, 23/24 and 25/26
score in either order, once per distinct correct letter. All questions have
explanations and locations giving both website and original question numbers.
The user's plural forms are preserved. Phone spacing, sixteen/16 and
35.7/35.70 are accepted formatting equivalents.

The Jobs table remains a native HTML table. Shared table cells preserve line
breaks so the source bullet points stay legible in both test and saved review.
No invented map, raster drawing or transcript was added.

## Audio

- Public matching test: https://murodkamilov.uz/listening/mkl041/
- Recording embedded by that page: https://raw.githubusercontent.com/jasurrkham1dov-blip/audiooo/main/day%2B13%2Bfull%2Blistening.mp3
- Local asset: `public/audio/ielts-listening/listening-full-test-19.mp3`
- Size: 22,560,162 bytes.
- SHA-256: `edf6561004f2106b3bf6cda5a4fc54b5d85b2f8e2f5b75cfe94cb782ddab99d3`.
- Native browser duration: 2433.906939 seconds (40:33.91); catalog: 41 minutes.

The public test contains all four supplied parts and agrees with all 49
supplied answers. The recording is unmodified: all retained answers remain
in their original context. Each part explicitly explains that this is a
40-question adaptation and that spoken question numbers differ from the screen.
The recording still includes material for omitted questions and its original
instructions. It is not represented as a newly narrated 40-question recording.

The private Telegram link https://t.me/c/3953980848/153 was not accessible.
Association with the four parts is verified through the matching public test;
byte identity with the private attachment is not established.

One continuous player is retained across parts. Shared Listening behavior
submits 20 seconds after the final audio ends, without a separate countdown.
Review playback and audio failures do not submit; other IELTS timers are unchanged.

## Validation

`scripts/tests/listening-full-test19.tsx` independently transcribes all 49
answers and checks the retained-number mapping, ten questions per part,
catalog availability, strict grading, pair permutations, duplicate/partial
credit, all answer controls, selection limits, persisted answers, band 9 and
JSON-serialized Results/Analyze across four parts. Shared audio-completion and
Listening layout regressions, browser playback and desktop/mobile rendering,
TypeScript, targeted ESLint and the repository production build are also checked.
