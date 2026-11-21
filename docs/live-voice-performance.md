# Live voice performance

Nova uses Gemini native audio over server-owned WebSockets when Gemini keys are
available in `auto` mode. The configured default is `gemini-3.8-live`, API
`v1beta`, voice `Kore`. OpenAI Realtime (`gpt-realtime-2.1`, `marin`, WebRTC) is
the alternate native path. `AI_VOICE_PROVIDER` can pin either provider. Standard
STT → shared tutor → TTS remains an explicit fallback; a failed capability probe
does not silently switch a live call.

## Character and delivery

`backend/src/services/novaPersona.ts` is the pure shared contract imported by
both server and browser. It owns Nova's identity, character, examples, expression
validation, delivery instructions and TTS profile. Ivygoo is the platform; Nova
is its AI tutor. `assistantPolicy.ts` and `voiceInstructions.ts` consume this
contract. Preferences and account memories are supplied separately as data.
Latest explicit requests and boundaries override older preferences. Examiner
mode overrides playful/affectionate delivery at the server as well as in prompts.

Text responses return `performance` and its matching `expression`. Invalid
optional model performance falls back to a modest warm expression without
discarding a useful answer. The history API strictly validates stored metadata.
Native models call the local `set_expression` function; this does not make a
second text-model request. The function's JSON Schema is our product protocol,
not a Gemini audio generation parameter. If the model omits it, the avatar uses
neutral/warm presentation rather than guessing the learner's emotion from words.

Gemini content and expression events share a response ID. The browser keeps each
response's audio, transcript and delivery separate, applies expressions at
playback start, cancels scheduled cues on interruption and ignores late events
for finished responses. OpenAI delivery passes through its function output and
waits for the output-audio-buffer start event. A pending transcript never changes
the face for another queued answer. The ephemeral playback presentation is
scoped to both account and conversation, follows a draft's new server ID and is
excluded from local persistence.

Nova's SVG has 12 delivery expressions, brows, eyes, mouth shapes, head tilt and
small gestures. Mouth opening uses measured amplitude for native audio and
standard TTS; this is not phoneme-level lip synchronization. Reduced motion
disables ambient animation, nods and pointer tracking.

Ordinary Nova TTS supplies `purpose: nova` and validated delivery metadata to
the existing speech endpoint. Cache keys include account, purpose and delivery.
IELTS callers retain their examiner profile, including English. Voice selection
does not change between emotions within a provider. Voices across providers are
different, so fallback remains explicit.

## Provider capability checks

Checked against the official documentation on 2026-11-21:

- [Gemini Live capabilities](https://aistudio.google.com/docs/live-api/capabilities):
  system instructions, `Kore` selection, native audio/transcripts, VAD and
  incremental client content. Affective-dialog is removed in Gemini 3.8; no
  affective-dialog, proactive-disable or thinking-level flags are sent.
- [Gemini WebSocket reference](https://aistudio.google.com/api-reference/live):
  `v1beta`, immutable setup, function responses/cancellation and history config.
  Gemini 3.8/3.1 seed initial history using `initialHistoryInClientContent`, finish
  that seed, then send the greeting as realtime input. Older model configurations
  keep their existing client-content startup. Context updates append data with
  `turnComplete: false`; they do not replace system instructions.
- [OpenAI Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations):
  function outputs, audio buffer events and interruption handling.

Provider API support is distinct from evaluated conversational quality. Natural
Uzbek, expressive delivery and consent interpretation still require listening
and human review with real credentials; mocked transport tests cannot prove them.

## Storage and rollout

Deploy `20261121000000_nova_message_performance` before serving the updated API:

```powershell
npm.cmd --prefix backend run prisma:deploy
```

The migration only adds nullable JSONB `AiConversationMessage.metadata`. Old
messages remain readable; new records preserve expression, performance, delivery
and interruption status across reloads. Legacy interruption text markers remain
readable. Long-term preferences/goals use the existing user-scoped `AiMemory`
table. Temporary expression/mood updates are excluded from memory extraction.
The existing backend startup runs migrations automatically.

Connection preparation runs the allowance reservation and authenticated learner
record reads concurrently. SDP negotiation starts only after both succeed.
Failed preparation releases its reservation without opening a provider call.
Record loading also checks chat ownership alongside profile and memory reads.

The browser starts connecting alongside the capability probe. It sends context
with SDP once, coalesces rapid page changes and skips identical updates. Context
requests are serialized; server version checks discard older pending updates.
The original chat stays attached to the call, including a newly saved draft.

## Microphone lifetime

Closing voice or floating chat, leaving the page, entering an exam, changing the
account or unmounting the owner ends its microphone capture. Minimizing voice
keeps the visible docked conversation active. Standard voice aborts recognition
immediately on exit; normal answer completion still waits for final words.
Late permission grants and superseded starts release their tracks without
restarting recognition. WebRTC releases microphone tracks before chat callbacks
or other teardown, and also closes on `pagehide`.

## Inspect a real call

Use a deployed backend with its selected provider key and a supported browser.
Open voice, wait for the greeting, then speak several short questions. For OpenAI, in browser
DevTools, inspect these User Timing measures:

```js
performance.getEntriesByType('measure')
  .filter(entry => entry.name.startsWith('ivygoo.voice.'))
  .map(({ name, duration }) => ({ name, milliseconds: Math.round(duration) }))
```

- `microphone`: opening voice to the microphone grant, including permission UI.
- `negotiation`: the backend connect request, including its provider setup.
- `connection`: opening voice to the WebRTC data channel becoming ready.
- `first_audio`: requesting the greeting to the first output buffer start event.
- `reply`: detected speech end to the next output buffer start event, including
  tool work when needed. Interrupted turns do not complete a reply measurement.

Output buffer events indicate playback starting at the provider; these measures
do not prove when sound physically reaches a speaker. Semantic turn detection
also contributes delay before the speech-end event. Use a recording when measuring
the full audible gap after the learner's last syllable.

The connect response includes a `Server-Timing` header and `timings` with
`preparationMs`, `providerMs`, `controlMs`, and `totalMs`. The backend also logs
`voice.performance` with stage `setup`. Control setup includes storing the call
and opening the server-side WebSocket required for coaching tools. Timings contain
no transcript, chat content or account ID.

Compare repeated calls on the same browser, region and network. Separate greeting
latency from conversational replies and tool-assisted replies; report median and
slow-tail results instead of promising a fixed response time. Automated mocked
tests verify concurrency, deduplication, cleanup and timing emission; they do not
measure live provider latency. Gemini reports microphone/connection/first-audio
and reply timing through its performance callback; first audio indicates browser
scheduling of the first PCM buffer, not an acoustic speaker measurement. Gemini
reply latency starts at the observed final input transcript, a proxy rather than
the physical end of the learner's speech.

## Verification

```powershell
npm.cmd run test:nova
npm.cmd run test:ai-coach-ui
npx.cmd tsc --noEmit
npm.cmd --prefix backend run build
node --test backend/scripts/assistant-coach.test.mjs
```

`test:nova` covers schema bounds and recovery, examiner precedence, private
history storage, shared TTS delivery, native transport, queued expressions,
interruption/late events, account switching, draft synchronization, voice
recovery, vector rendering and reduced motion. Browser audio is synthetic fixture
audio. The avatar screenshot is generated under `outputs/` and is not committed.

For real text-model evidence after configuring credentials:

```powershell
npm.cmd run eval:nova
# A single case after backend build:
node backend/scripts/evaluate-nova.mjs serious-boundary
```

The 18 varied scenarios in `backend/scripts/fixtures/nova-evaluation.json` cover
praise/sarcasm, distress, consensual roast, withdrawn consent, affection, actual
progress/errors, mathematics, language switching, informal Uzbek, saved
preferences, reopened chat and examiner mode. The runner captures actual model
output for human review, writes only synthetic results under `outputs/`, and
does not access learner accounts or write usage records. It does not turn regex
matches into a conversational-quality score. Without credentials it explicitly
reports NOT RUN. Test live unclear speech, barge-in, reconnection and first
audible response separately, listen to the output and record provider/model,
browser/network, intelligibility, teaching correctness and delivery consistency.

## Files in this integration

| Area | Files |
| --- | --- |
| Shared character/contract | `backend/src/services/novaPersona.ts`, `assistantPolicy.ts`, `voiceInstructions.ts`; `src/lib/novaPersona.ts` |
| Native voice server | `backend/src/services/geminiLive.service.ts`, `geminiLiveTransport.ts`, `realtimeCoach.service.ts` |
| Text/TTS server | `backend/src/services/assistant.service.ts`, `speakingAudio.service.ts`; `backend/src/routes/speakingAudio.routes.ts` |
| History | `backend/src/routes/aiWorkspace.routes.ts`; `backend/prisma/schema.prisma`; `backend/prisma/migrations/20261121000000_nova_message_performance/migration.sql`; `src/services/aiWorkspacePersistence.ts`, `geminiAI.ts`; `src/store/aiAssistantStore.ts` |
| UI | `src/components/ai/CoachMascot.tsx`, `FloatingAIAssistant.tsx`, `coach-studio.css`, `useAiTutor.ts`, `useCoachExpression.ts`, `useRealtimeCoach.ts` |
| Playback | `src/lib/novaPlayback.ts`, `geminiRealtimeCoach.ts`, `realtimeCoach.ts`, `coachAudio.ts`, `examinerPlayback.ts`, `speakingAudio.ts` |
| Verification | `backend/scripts/nova-persona.test.mjs`, `assistant-coach.test.mjs`, `gemini-live.test.mjs`, `evaluate-nova.mjs`, `fixtures/nova-evaluation.json`; `scripts/test-gemini-live-browser.mjs`, `test-nova-avatar-browser.mjs`, `tests/nova-performance-ui.tsx`, `tests/realtime-coach.tsx`; `package.json`; this document |
