# Full Speaking mocks 1–30

All numbered mocks use the same examiner, recorder and assessment flow. Question content remains in the existing catalog. The catalog validator checks all 40 topic/card sets and question uniqueness.

## Examiner audio

Alex uses the male profile (`cedar` / `Charon`); Maya uses the female profile (`marin` / `Kore`). The server first uses the configured OpenAI provider, then configured Gemini keys. Gemini deployments use `GEMINI_TTS_MODEL` (default `gemini-3.8-flash-tts`). MP3 and WAV responses keep their correct MIME types; raw PCM is wrapped in a playable WAV container.

If server audio is unavailable, playback automatically tries a matching installed English voice and retains that voice for the session. Installed voices can load asynchronously. A missing matching voice or blocked browser playback presents a retry control. An unheard or cancelled prompt never starts recording or advances the test.

Provider access, quotas and the quality of installed browser voices remain deployment/device dependencies. No credentials are included in client code or test fixtures.

## Recording and assessment

Capture requests mono 48 kHz where available, with echo cancellation, noise suppression and automatic gain. The recorder requests 96 kbps audio and preserves the final asynchronous chunk and actual recording format. Safari avoids simultaneous browser recognition and recording.

Transcription prefers `gpt-4o-transcribe`, then the configured `OPENAI_TRANSCRIBE_MODEL`, then configured Gemini audio models. Failure retains the answer in the current session for playback and processing retry. Silence does not become an invented answer.

Statistics use the combined candidate transcript for distinct vocabulary and retain fractional recording durations. Meaningful uses of “like” and “actually” do not count as hesitation. AI criteria and feedback are validated, and the overall score is recomputed from the four criteria. An offline estimate does not mark a full mock complete or award an AI band; the candidate can retry assessment of the same answers without recording again.

Pronunciation remains explicitly labelled a transcript estimate: this assessment does not hear the recordings and is not an official IELTS score. Failed answers and offline assessment retries are retained while the session remains open; this is not recovery after reloading the page.

Part 2 retains its one-minute preparation and two-minute answer limit and provides preparation notes. Recovery controls remain scrollable on small/zoomed desktops and mobile screens.

## Verification

- `npm run test:speaking-ui`: completes all 30 numbered mocks (15 answers each), checks every seeded question and Part 2 follow-up, voice profiles, duplicate taps, Safari formats, provider failure recovery and regrading.
- `npm --prefix backend run build` and `npm --prefix backend run test:speaking-audio`: validates provider fallbacks, male/female profiles, WAV conversion, all recorder MIME types, malformed input and silence.
- `npm run test:speaking-browser`: runs native Audio and MediaRecorder in a hidden Chromium browser with a simulated microphone; checks recovery at 1366×768, 1024×640, 920×500, 768×1024, 390×844 and 320×568. Screenshots go to ignored `tmp/speaking-browser/`.
- `npm run build`: runs the repository's required catalog validators, TypeScript and the production bundle.

Provider tests use stubbed responses and do not invoke paid APIs. Native browser tests use synthesized fixture audio, so these tests do not establish live provider availability or subjective voice quality.

API references: [OpenAI text to speech](https://developers.openai.com/api/docs/guides/text-to-speech), [OpenAI transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [Gemini speech generation](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation), [Gemini audio input](https://ai.google.dev/gemini-api/docs/generate-content/audio).
