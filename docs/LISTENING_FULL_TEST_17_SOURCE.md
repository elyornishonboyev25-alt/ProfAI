# Listening Full Test 17

## Duplicate check

Before adding the test, checked the local IELTS source/catalog, freshly fetched
`origin/main` at `2ecc3d2a`, and the live `www.profai.uz` test-data bundle
`generatedIeltsTests-DL0AD373.js` (Listening tests 1-16). No Friedberg Insurance, Rose Maynard, Gosport, tamarin,
Music Experiment or Early Migration content appeared in the Listening catalog.
Slot 17 was unavailable. The existing AGENTS.md rule continues to require
duplicate checking before adding any Listening, Reading, Writing or Speaking test.

## Questions and answers

The user's five question images supply all 40 questions, options, instructions
and the college plan. The supplied answer image provides 39 answers, with Q10
shown as a dash. The Q21-24 heading in the image is corrected to Q21-25 because
five multiple-choice questions follow it. Other question wording is preserved.

Public comparisons:

- https://murodkamilov.uz/listening/mkl042/ has these four parts and the same
  39 answers. It explicitly leaves Q10 unscored.
- https://englishups.com/ielts-listening-test-73/ has these four parts and
  the same recording. Its normal public grading response supplies **Post Office**
  for Q10 and agrees with the user's other 39 answers.
- https://tuhoc.dolenglish.vn/washing-machine-warranty-giai-thich independently
  corroborates `Post Office` for the matching reference number/address material,
  but uses a different form and question order, so it is not the question source.

Q1 accepts spacing/hyphen variants of the reference. Q2 requires the unit months.
Q3 accepts the postcode with or without a space. Q4 accepts Middle Street or
Middle St. Q9 does not require next week because it is printed. Part 4 retains
the user's grammatical plural forms and navigational rather than copying the
public sites' permissive singular variants. Every question has an explanation
and part/question location. No audio timestamps or transcript are invented.

## Audio

Both full-test sources embed:

https://raw.githubusercontent.com/jasurrkham1dov-blip/auddio/main/53453.mp3

- Local asset: `public/audio/ielts-listening/listening-full-test-17.mp3`
- Bytes: 23,874,861
- SHA-256: `374bd5f847d50bbfb88c20369f95b7b569a4a3423cec83bb43211a48327dda4a`
- Browser duration: 1,467.976327 seconds (24:27.98).
- Unmodified download; displayed nominal duration rounded to 25 minutes.
- Native browser playback checked. Part navigation preserves one continuous player.
- Shared Listening behavior: no countdown; submission 20 seconds after the final
  audio ends. Intermediate playlist ends, loading failures and review playback
  cannot trigger test submission.

The private Telegram link `https://t.me/c/3953980848/121` could not be opened.
Association of the recording with all four parts is verified on the two public
test pages; byte identity with the private Telegram attachment is not established.

## College plan

`CollegePlanDiagram.tsx` draws the plan as inline SVG using coordinates from the
user's image. Building outlines, internal partitions, door openings, A-J room
labels, named rooms, square, compass and three trees are represented in code.
Tree foliage is a vector reconstruction rather than raster texture. No image
request, raster fallback, image decoder or external SVG file is needed.
The stable diagram identifier is resolved by the shared ListeningDiagram
component in the test and saved Results/Analyze snapshots.

The shared matching-row layout wraps on narrow screens so labels and answer
inputs stay inside their cards.

## Validation

- Test 17 integration suite: catalog registration; full audio hash; 40-answer key;
  Q10; strict rejection and accepted variants; all answer controls; local saved
  answers; continuous playback position; submission; band 9; JSON-round-tripped
  Analyze with inline SVG.
- Shared audio completion regression: 20-second final-audio rule, playlists,
  failures, review and Reading timer behavior.
- Headless Edge: actual Play button and native audio decoding, four parts at
  desktop and mobile widths, SVG display and page overflow checks.
- Targeted ESLint and repository production build.
