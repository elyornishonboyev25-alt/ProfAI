# Listening Full Test 16

## Duplicate check

Checked local Listening source files and the freshly fetched `origin/main`
catalog at `9280bd03` before adding this test. None contained the travel agency
quotation, Reynolds Electrical, Charlie/Sandra portfolios, or hospital gardens
material. Slot 16 was unavailable. The existing AGENTS.md duplicate-check rule
continues to apply to all four IELTS modules.

## Content and answer verification

- Questions 1–26 and 31–40, instructions and option banks: user screenshots.
- All 40 answers: user's answer-key screenshot.
- Independent comparison: https://murodkamilov.uz/listening/mkl036/
- Additional key and transcript comparison:
  https://www.scribd.com/document/1050067676/Key-Vol-8-Test-7-Lis
- The four piece names for Q27–30, cropped out of the user screenshot, were
  recovered from MKL036 and cross-checked with the Vol 8 Test 7 material.

Both public keys agree with all 40 supplied answers. The transcript supports the
potentially confusing Q22 and Q25 selections. Preserve the supplied spelling
`Thorn`. Q2 accepts `5 days` or `five days`, not a bare number, because the form
does not print the unit. Q8–10 accept the three distinct letters B/E/F in any
order, awarding partial credit without rewarding duplicates. Single-word
answers retain the user's grammatical forms instead of copying permissive
singular/plural variants from a public practice site.

Explanations use the shared Analyze interface. Locations identify the part and
question; no unverified audio timestamps are invented.

## Audio

The public MKL036 page embeds one complete recording for these four parts:

https://raw.githubusercontent.com/jasurrkham1dov-blip/303030/main/july%2B2%2Btest%2B%2B(2).mp3

- Local asset: `public/audio/ielts-listening/listening-full-test-16.mp3`
- Bytes: 21,988,323
- SHA-256: `90d52e39e76842302de3b02da5ca3a6510b7d0e0b538ce92162ec9479699e5d0`
- Browser-decoded duration: 2,226.8 seconds (37:06.8).
- Download preserved without editing or transcoding; test duration is 38 minutes.
- Native browser playback and continuity across the four parts were checked.

The user's private Telegram URL (`https://t.me/c/3953980848/110`) could not be
opened in this environment. The public source associates this recording with
the matching full test; byte-for-byte identity with the private Telegram
attachment has not been established.

## Validation

- `node scripts/test-listening-parts-ui.mjs scripts/tests/listening-full-test16.tsx`
  checks registration, audio checksum, all 40 answers, strict distractor
  rejection, all six B/E/F permutations, duplicate and partial credit, every
  answer control, saved answers, continuous playback position, submission,
  band 9 and reopening all four sections in Analyze.
- Headless Edge: actual Play button, native MP3 playback, four rendered parts
  at 1440px and 390px, no page-level horizontal overflow.
- Targeted ESLint and the repository production build.
