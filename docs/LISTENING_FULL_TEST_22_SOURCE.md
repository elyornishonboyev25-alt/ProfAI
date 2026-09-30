# Listening Full Test 22 — source and verification

The existing Listening catalog and source files contain none of the four parts in this combination: A1 Furniture Removals, Museum Tour, Research Analysis Methods and Employment Survey on Graduates. The source is [MKL031](https://murodkamilov.uz/listening/mkl031/). Its page provides the four question parts, the 40-answer key and one continuous recording. This source has no map or diagram.

The recording is stored unchanged at `public/audio/ielts-listening/listening-full-test-22.mp3`. Source URL: `https://raw.githubusercontent.com/jasurrkham1dov-blip/audio-test-9/main/audio.mp3`. The local file is 19,727,982 bytes, 30 minutes 19 seconds, SHA-256 `9fe36ef61ea84479919218cc9c05943a3bf979b18294a962c562f67de2cc9995`.

| Questions | Primary answers in order |
| --- | --- |
| 1–10 | piano; coffee; mirror; glass; Harrivale; 232.50; insurance; morning; side; garage |
| 11–20 | A; B; A; C; A; C; C; B; E; D |
| 21–30 | C; D; E; A; G; B; B; C; C; A |
| 31–40 | business management; phone interview; qualification; public; salary; team; problem solving; presentation; essay writing; job |

`scripts/validate-listening-full-test22.mjs` checks all 40 numbered controls and source answers against the scoring code, accepted variants, audio checksum and catalog registration. The shared Listening runner handles submission 20 seconds after the final audio ends.
