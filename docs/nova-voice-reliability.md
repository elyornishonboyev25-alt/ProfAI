# Nova voice interruption incident — 21 November 2026

The voice overlay opens directly as Nova. The coach/examiner tabs and language/comeback selectors were removed from both voice paths. Existing account preferences, language policy, chat settings and dedicated Speaking exams remain available.

## Evidence and fixes

- Production logs at 15:50 UTC show a Gemini Live provider close with code 1011 after six turns, followed by a failed reconnect (HTTP 502). The provider did not supply a more specific logged cause. This is not proof of a microphone fault or exhausted Live quota.
- The same window contains HTTP 429 responses for voice settlement, profile preferences and account synchronization. Voice heartbeat/settlement previously shared the general API limiter, and context updates shared the chat generation limiter. Lightweight voice controls now have their own bounded, authenticated per-account allowance. New call creation still consumes the generation allowance.
- `Unexpected API error.` was the client's fallback when a failed HTTP response could not be parsed as JSON. That screenshot alone cannot identify the response status or its body. HTML, empty and malformed error responses now retain their HTTP status, receive an actionable message and preserve `Retry-After` when available. Provider error codes/messages remain intact.
- Transcript previews triggered unnecessary context updates. On a restored manually selected language, appending a preview without language metadata could also switch the selection back to automatic and recreate the call. The regression fixture reproduced one unwanted reconnect and three context updates; after the fix it records zero reconnects and zero context updates for the same previews. Actual lesson changes still update context.
- Preference loading now follows account identity rather than changes to its progress/profile object. Temporary transport/gateway failures and reply timeouts use at most two automatic reconnects per minute. Rate limits, authentication and explicit provider quota errors remain visible without automatic retries.

## Verification

Deterministic tests exercise the real React hooks, overlay controls, malformed HTTP failures, retry limits, streaming transcripts and independent server allowances. The browser fixture exercises AudioWorklet PCM playback through the production WebSocket proxy code, cancellation, transcripts and hardware cleanup. It uses a fixture provider and does not establish naturalness or Uzbek recognition quality.

Production startup logs show a successful two-turn native-audio readiness check using `gemini-3.8-live` (v1beta, existing Kore voice configuration). Runtime logs show real audio input/output before the provider disconnect. No live audio was listened to during this incident investigation. A separate Writing assessment quota warning is not evidence of a Live quota failure.

No database migration or new secret/configuration is required. Both frontend and backend changes must be released. External provider interruptions remain possible; saved completed turns survive recovery and old audio is not replayed.

Reproduce with `npm run test:gemini-live` and, after the backend build, `node --test backend/scripts/nova-voice-reliability.test.mjs backend/scripts/speaking-audio.test.mjs`. The new API/session regression fixtures and server limiter test are also wired into CI.
