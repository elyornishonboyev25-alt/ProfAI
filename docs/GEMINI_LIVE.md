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

The browser captures real microphone samples through AudioWorklet, resamples to mono PCM16 at 16 kHz, and streams 100 ms frames. Gemini returns 24 kHz PCM, input/output transcripts, and interruption events. Playback queues are bounded. Both local interruption and provider interruption clear playback. Final assistant history follows playback completion; interrupted transcripts omit text not yet heard. Mute, account changes, network failure, expiry and page exit release hardware. Spoken language is automatic in coaching mode and English in examiner mode; there are no language or playback-speed controls in the voice screen.

Each tab carries a stable client identity. Closing and reopening across Gemini, OpenAI and standard voice is serialized. The database reservation stores that identity and a renewable lease: 90 seconds during setup, then 45 seconds refreshed every 10 seconds. A same-tab retry atomically settles and replaces its old reservation, while another tab cannot steal a healthy call. Legacy orphan rows and expired leases are reclaimed automatically, with usage capped at the last lease deadline. Old callbacks release only their own session ID. Provider admission checks the reservation again after negotiation, so a superseded connection cannot become live. Session release and heartbeat are authenticated control operations independent of the AI generation rate limit.

Partner Speaking and Nova have separate upgrade handlers on `/ws/speaking` and `/ws/ai-coach`. Both use the existing web proxy and local Vite `/ws` proxy. Upgraded proxy sockets disable HTTP idle timeouts. A deployment smoke check now requires two real generated PCM audio turns while sending microphone-format silence, rather than accepting a setup acknowledgement alone. It logs `voice.gemini.readiness` with model, turn/audio counts and timing; no credentials, audio or conversation text are logged. This checks streaming and generation, not subjective teaching quality.

Microphone frames include their audio-clock capture time. The browser discards buffers older than 350 ms after a busy main thread resumes instead of flooding the connection with stale speech. The gateway uses bounded token buckets so short delivery bursts do not trigger a one-second rate cutoff. Runtime diagnostics distinguish browser disconnect, heartbeat timeout, malformed frames and provider close codes, with frame/turn counts only. Transient transport/provider failures get at most two automatic reconnects per minute, preserving the chat; explicit protocol/quota rejections remain visible, and closing the voice screen cancels pending recovery.

Validation: `npm run test:gemini-live` runs backend/provider/allowance tests and a browser test with the actual microphone, AudioWorklet, WebSocket, PCM playback and cleanup. The provider in automated tests is a local fixture, not Google. Production provider readiness must also be checked in deployment logs.

Official protocol references:

- [Gemini Live overview](https://ai.google.dev/gemini-api/docs/live-api)
- [Gemini 3.8 Live setup and protocol](https://ai.google.dev/gemini-api/docs/live-api/thinking)
- [Live WebSocket API](https://ai.google.dev/api/live)
