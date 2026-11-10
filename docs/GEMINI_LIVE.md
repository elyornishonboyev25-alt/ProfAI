# Gemini 3.8 Live voice

The Nova voice screen uses `gemini-3.8-live`, not the TTS endpoint. TTS creates an audio file from text; it does not connect a live conversation. Gemini-only deployments previously advertised natural voice as unavailable because the capability check and transport only supported OpenAI.

Backend configuration:

```text
GEMINI_API_KEY=<existing server secret>
AI_VOICE_PROVIDER=gemini
GEMINI_LIVE_MODEL=gemini-3.8-live
```

`auto` also chooses Gemini when a Gemini credential exists. Explicit `gemini` never silently falls back to another provider. OpenAI remains available through explicit configuration. No provider secret is shipped in the frontend.

The authenticated connect endpoint checks account/thread ownership, reserves the existing voice allowance, and opens the Google WebSocket. It returns a short-lived, one-use ticket only after Google acknowledges model setup. The browser sends that ticket in its first WebSocket frame, never in a URL. The server owns the original expiry, disconnect, quota settlement, and checked `ask_coach` tools. Unclaimed tickets are closed and refunded after 25 seconds. Provider failures return the unused reservation. The current Railway backend has one replica; multiple replicas require a shared ticket/session router or sticky routing before scaling this in-memory connection registry.

The browser captures real microphone samples through AudioWorklet, resamples to mono PCM16 at 16 kHz, and streams 100 ms frames. Gemini returns 24 kHz PCM, input/output transcripts, and interruption events. Playback queues are bounded. Both local interruption and provider interruption clear playback. Final assistant history follows playback completion; interrupted transcripts omit text not yet heard. Mute, account/language changes, navigation cleanup, network failure, expiry and page exit release hardware.

Partner Speaking and Nova have separate upgrade handlers on `/ws/speaking` and `/ws/ai-coach`. Both use the existing web proxy and local Vite `/ws` proxy. A deployment smoke check logs `voice.gemini.readiness` with model and a real setup acknowledgement, without logging credentials, audio, or conversation text. A successful setup validates credential/model access, not the quality of a complete user conversation.

Validation: `npm run test:gemini-live` runs backend/provider/allowance tests and a browser test with the actual microphone, AudioWorklet, WebSocket, PCM playback and cleanup. The provider in automated tests is a local fixture, not Google. Production provider readiness must also be checked in deployment logs.

Official protocol references:

- [Gemini Live overview](https://ai.google.dev/gemini-api/docs/live-api)
- [Gemini 3.8 Live setup and protocol](https://ai.google.dev/gemini-api/docs/live-api/thinking)
- [Live WebSocket API](https://ai.google.dev/api/live)
