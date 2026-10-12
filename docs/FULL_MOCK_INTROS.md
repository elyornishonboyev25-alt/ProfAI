# Full mock section introductions

Each section begins with an original 1280×720 instructional video in the ProfAI IELTS design. Listening and Reading record the actual `IELTSReadingInterface`, using the live catalog and its native controls. British English neural narration runs at its original speed, with sentence pauses and a short gap between chapters. Duration follows the spoken instructions; there is no 24/25-second limit. `fullMockIntroMedia.json` records the actual audio-derived duration and chapter boundaries, so captions, chapter links and the player clock follow the prerecorded speech.

Listening briefly explains all four recording contexts; Academic Reading explains all three passages without claiming that particular question types belong to a fixed passage. The focus is recorded cursor demonstrations of selecting text, adding/deleting highlights, changing text size and contrast, attaching notes, opening separate scratch notes, navigating parts/questions, flagging questions, reviewing answers, watching the timer, and Submit → Cancel / Submit test → the next skill. Every demonstration has corresponding English narration. The recording fixture uses existing tests in an isolated browser profile; it never adds catalog content or writes user attempts. Frame capture requests run on unthrottled intervals, including background recording tabs, so chapters contain motion rather than still images.

The introduction has a candidate header, section tabs, information panel, headphones/audio check, navigable video chapters, playback controls, synchronized written captions, full transcript, **Skip video & start**, and **Start Test**. Video completion does not start the timed runner. The start button remains available before completion. Autoplay restrictions expose **Enable sound**; failed video retains written instructions and Start Test. Browser cache versioning prevents the earlier accelerated videos from being reused.

Full Mock **Open** requests fullscreen on the document in the click gesture and opens the first unfinished section directly. Completed mocks open their results overview. Fullscreen persists across routes; entry controls remain available when the browser blocks it or the candidate exits. Unsupported browsers retain the immersive layout.

`FullMockSectionGate` keeps runners unmounted during instructions: no test audio, timer or microphone starts. Starting is stored per account, mock and section. Reloading a started section bypasses the intro to preserve existing deadlines, including legacy active Reading/Listening and Writing sessions. Individual practice and saved-attempt review bypass introductions. Stale routes still redirect to the first unfinished section.

Listening's existing countdown starts only after the final test recording, lasts two minutes, persists its original deadline on reload and automatically submits at expiry. Earlier tracks, instruction videos and review playback do not start it. Reading, Writing and Speaking timing is unchanged.

Completed catalog cards show **Retake** beside **Review** without changing their dimensions. Retake archives the previous four-section result in account storage, resets only the chosen mock's progress, intro gates, objective sessions and Writing draft/deadline, then opens Listening instructions. Other mocks, accounts and standalone practice sessions remain intact. The results page retains the overall score above four keyboard-accessible section cards; selecting a card shows its band, objective correct answers/accuracy, or Writing/Speaking responses and feedback.

## Official references and scope

Checked on 2026-10-12 against the [official IDP computer-test startup guidance](https://ielts.idp.com/turkey/prepare/article-how-computer-delivered-ielts-works/en-gb), the [IDP familiarisation tests](https://ielts.idp.com/about/ielts-familiarisation-tests), and the live [official Academic Reading demo](https://demo-ielts.inspera.com/player/?assessmentRunId=131013388&context=exam#/section/128121930/question/128121896/scorableItem/1). The latter uses a flat header, part instructions, passage/questions side by side and bottom part/question navigation. Our tutorial demonstrates the controls available in `IELTSReadingInterface.tsx`, including the **Highlight**, **Note**, **Delete highlight**, **Display settings**, **Text size**, **Contrast**, **Notes**, **Review**, and flag controls.

Part descriptions follow [IELTS Academic Listening](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening) and [IELTS Academic Reading](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading). Real Speaking uses a human examiner; the video explicitly identifies ProfAI's AI practice examiner. These are original ProfAI instructional videos, not official IELTS media or a certified replica of every test-centre implementation.

Existing overall scoring averages the four bands and rounds to the nearest half band, with .25/.75 rounding upwards; Writing weights Task 2 twice as heavily. Regression checks retain official worked examples. Raw-score conversion can vary slightly by test version. AI Writing/Speaking bands remain practice estimates rather than certified examiner scores.

## Narration and regeneration

Narration uses the portable [Piper 2023.11.14-2 Windows release](https://github.com/rhasspy/piper/releases/tag/2023.11.14-2) and [en_GB-cori-high](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/cori/high), a UK English female neural voice trained from public-domain LibriVox recordings ([model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/cori/high/MODEL_CARD)). This is synthetic narration, disclosed in the instruction panel. It needs no runtime API key or external video embed.

1. Extract the official Windows engine into ignored `tmp/intro-voice/piper`. Download the model and `.onnx.json` configuration into `tmp/intro-voice`. If needed, supply the Microsoft Visual C++ runtime required by the engine. No engine/model binaries belong in the Git commit.
2. Run `node scripts/capture-ielts-intro-screens.mjs` with Microsoft Edge installed to capture native screens and cursor actions into ignored `tmp/ielts-intro-screens`. Then run `node scripts/generate-ielts-intros.mjs`. Override `IELTS_INTRO_PIPER`, `IELTS_INTRO_VOICE`, `IELTS_INTRO_SCREEN_DIR`, or `IELTS_INTRO_BROWSER` for other local paths. The voice generator uses length scale 1.10, sentence silence 0.55 seconds, reduced stochastic noise and a single neural session. Audio is scheduled with playback rate **1**.
3. The generator records each section in a separate Chromium page, writes the four intentional product videos under `public/media/ielts-intros`, and writes source timing metadata. `IELTS_INTRO_VOICE_DIR` can resume an interrupted working directory with unchanged copy; omit it for a clean regeneration after editing narration.

## Verification

- `npm run test:full-mocks`: intro isolation, chapter selection, skip/start, reload, autoplay recovery, per-account storage, all full-mock flows, saved sessions, scoring and Listening completion.
- `npm run test:full-mock-intro-browser`: actual prerecorded duration versus chapter metadata, natural speaking rate, audible audio, 720p frames, native selection/highlight/removal animation frames, synchronized captions, five viewport sizes, native ended/start and fullscreen across routes.
- `npx tsc --noEmit` and the production Vite build.

Browser screenshots and voice-tool working files stay in ignored temporary directories.
