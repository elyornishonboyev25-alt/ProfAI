# Listening Full Test 21 — source and verification

## Duplicate check

The four-part combination in the user's scans — Information about School Registration, Brightwater Adventure Park, Changing course, and Translating ancient Mayan — was absent from the live repository Listening catalog and the existing test source files before this addition. The separate private Telegram post could not be opened publicly.

## Questions and answers

The four user-provided scans supply the questions, Brightwater map and instructions. The user's answer image supplies the 40-answer key. All 40 entries match the key embedded on [MKL034](https://murodkamilov.uz/listening/mkl034/), which contains the same four sections and the matching full recording. The key in `src/data/listeningFullTest21.ts` keeps the supplied primary answers. Equivalent written date and time forms for Questions 9 and 10 are accepted.

| Questions | Answers in order |
| --- | --- |
| 1–10 | Monterey; library; dentist; transportation; parents; youth; mail; teacher; August 19; 2.05 |
| 11–20 | F; B; I; D; A; A; C; A; B; C |
| 21–30 | A; C; A; B; A; F; A; B; E; C |
| 31–40 | threat; astronomy; cities; sound; culture; wars; style; blog; speed; ceremony |

## Audio and map

The MKL034 page embeds the four-part `20232110.mp3` recording at `https://raw.githubusercontent.com/jasurrkham1dov-blip/203255/main/20232110.mp3`. It is stored unchanged as `public/audio/ielts-listening/listening-full-test-21.mp3` (23,698,969 bytes; SHA-256 `d109b72573454a0a706bc9efaca812b41a4e211f52a4fc8714237720196806ca`). The test uses the existing continuous Listening player. Its shared end-of-audio logic submits 20 seconds after the final track, with no separate countdown.

The supplied Brightwater map is redrawn in `BrightwaterAdventureParkDiagram.tsx` as an inline SVG. It preserves the park boundary, railway, station, pool, Young Fun, lake, Mega Adventure, Crazy Golf, entrance, compass, paths and A–I locations. The diagram renderer recognizes a stable map identifier in both the live test and saved Analyze data; displaying it does not fetch an image.

## Verification

`scripts/tests/listening-full-test21.tsx` checks catalog slot 21, all 40 answers, marking, audio checksum, continuous playback across parts, all question controls, saved scoring, and the inline map in saved review.
