# Listening Full Test 18

## Duplicate check

Before adding this test, checked local IELTS content/catalog, freshly fetched
`origin/main` at `269e02f9`, and the deployed www.profai.uz bundles
`ieltsTrackCatalog-DnyX1-pu.js` and `generatedIeltsTests-DF_8Ec1i.js`.
Listening tests 1-17 were present; slot 18 was unavailable. No Pearson's Estate
Agency, Pennyfield, JustCoffee or Insects as a food source match was found.
The existing AGENTS.md requirement covers duplicate checking for all four IELTS
skills and remains in effect.

## Questions and answers

The user's five question images supply all 40 questions, options, instructions,
form/notes structure and the riding-centre plan. The separately supplied answer
image provides all 40 answers. That image is the authoritative marking key.

Public cross-check: https://murodkamilov.uz/listening/mkl043/ contains the exact
four parts and agrees with all 40 supplied answers. It embeds the full recording
below. The public page accepts some singular/plural alternatives; this test
retains the user's actual answer forms, including products, computers, vitamins,
rivers, antibiotic, cities and disease. Spacing variants of TY1260S and common
thousands separators for 120000 are accepted. Q1 requires 59 Franklyn, because
Avenue is printed after the blank. Q3 preserves the leading zero.

Questions 21-23 use the shared three-choice block. A, D and F score in any order,
with one mark for each distinct correct choice and no duplicate credit. Every
question includes an explanation and a part/question location. No transcript or
audio timestamps have been invented.

## Audio

- Source: https://raw.githubusercontent.com/jasurrkham1dov-blip/sdferew/main/50207.mp3
- Local file: `public/audio/ielts-listening/listening-full-test-18.mp3`
- Bytes: 25,489,868
- SHA-256: `4c0b9a0439c23e812ae0b4322cdcf359d19834997244320673b853b650b41c1b`
- Native browser duration: 2,347.467755 seconds (39:07.47).
- Original, unmodified full recording. Nominal catalog duration: 40 minutes.
- Part switches retain one continuous audio player and its playback position.
- No separate Listening countdown. The shared player submits 20 seconds after
  the final audio ends; failures, earlier playlist tracks and review do not submit.

The private Telegram URL https://t.me/c/3953980848/133 could not be opened.
The recording's association with all four supplied parts is verified on the
public test page. Byte identity with the private Telegram attachment is not
established.

## Plan

`PennyfieldPlanDiagram.tsx` draws the supplied plan as inline SVG. Coordinates
preserve the outer boundary, building proportions, internal partitions, A-G,
Car park, Storeroom, Shop, Field, Indoor Arena, Stable block and You are here
arrow. No raster, external image request or image decoder is needed.

The stable plan identifier is resolved by the shared ListeningDiagram component,
including JSON-serialized saved attempts reopened in Results/Analyze. The shared
Listening question layout, navigation, scoring, persistence and review UI are
used throughout.

## Validation

- Test 18 integration: catalog placement, audio hash, all 40 supplied answers,
  strict wrong-answer rejection, accepted formatting, three-choice permutations,
  duplicate/partial scoring, all controls, selection limit, saved answers,
  continuous playback position, submission and band 9.
- Saved Results/Analyze JSON round trip: all four parts, disabled answer controls,
  correct multiple selections and inline plan.
- Shared audio-completion regression: final audio plus 20 seconds; playlists,
  errors, review, unmount and unchanged Reading timing.
- Hidden headless Edge: actual Play control, native MP3 playback, all four parts
  at 1440px/390px, inline map and no horizontal page overflow. Screenshots reviewed.
- Targeted ESLint and repository production build.
