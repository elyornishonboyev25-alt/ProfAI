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

The original 18 scenarios in `backend/scripts/fixtures/nova-evaluation.json` cover
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

## V2: evidence, conversation continuity and delivery

The same text generation now returns an optional turn understanding, quoted
learning observations and up to four contiguous delivery segments alongside its
answer. Invalid optional metadata cannot replace or discard the useful answer.
This separates permanent character (`novaPersona.ts`), saved preferences, the
temporary conversation state and this reply's performance. The model is instructed
to change the example/representation on repeated confusion and redirect after a
correction. These are behavioural instructions that still need human evaluation;
the application does not replace replies with keyword-triggered canned text.

`NovaSkillEvidence` records the topic, exact learner quote, independent/assisted
attempt, outcome, misconception, next exercise, timestamp and conservative model
confidence. Quotes must occur in the actual learner utterance, including when a
live tool paraphrases the request. Idempotent turn/topic keys prevent duplicate
attempts. One success or error never implies mastery. Three independent successes
with at least 75% success and a correct latest attempt can show "consistent recent
practice", not certification. Repeated identical mistake descriptions can flag a
topic for practice. Topic labels and correctness assessments remain model output;
the guard verifies provenance, not every subject's academic correctness.

The memory drawer now includes these learning notes and a next-exercise action.
Memory can be read, edited or deleted. Edits use optimistic revisions, show errors
and retain the editor on failure. A delayed model result cannot overwrite a newer
edit, recreate a deleted record from its old snapshot or silently change another
account. Memory extraction is labelled `model` with its source quote/thread;
manual edits are `user`, old unknown provenance is `legacy`. History retains five
previous values. Retrieval chooses the latest canonical preference/goal, excludes
expired/superseded records and omits unrelated facts. Explicit current requests
still override stored preferences. Alias matching supports existing records.

Simple numeric arithmetic in a request is independently evaluated by a bounded
parser and supplied as `verifiedArithmetic` context. It supports parentheses,
unary signs, exponentiation and ordinary operators; it never executes code.
Symbolic equations, units and ambiguous notation are not verified by this parser.

Gemini uses the local `observe_learning` function only for actual exercise
attempts. There is no separate classifier model. Native tool continuations may
still add provider latency and billed generation; `ask_coach` explicitly invokes
the shared text model when detailed checking/research is needed. Cancelling or
interrupting a turn aborts pending coaching work and fences late tool output.

Gemini expression changes now use `AudioContext.currentTime` and response-specific
PCM boundaries instead of wall-clock timers. A suspended audio clock keeps the
queued face unchanged. A response can move from playful to focused delivery;
its persisted timeline records the audio offset and alignment basis. This is
alignment to received audio chunks, not semantic word/phoneme alignment. If no
reliable timing is supplied, OpenAI remains tied to output buffer boundaries;
within-reply changes are approximate. Mouth movement remains amplitude animation.
Standard TTS sends validated per-segment delivery separately from spoken text,
keeps the `marin` identity and changes the face on each actual playback start.
Prefetch reuses the next segment's audio and cancellation releases unused URLs.
Extra meaningful segments can increase TTS requests; most replies use one style.

Coaching VAD silence changes from 650 to 1100 ms with low end-of-speech
sensitivity, allowing more thinking time. This is a 450 ms configuration tradeoff,
not a measured improvement in response latency. Examiner silence stays 1400 ms.
OpenAI semantic VAD eagerness changes from high to medium; examiner remains low.
Provider VAD can still mistake a pause for the end of speech. Test it with an
actual microphone rather than treating prompt instructions as a VAD guarantee.

Completed messages use a per-account persistent outbox. Saves retry at most twice
for transient failures, keep their original locale, and reuse the same message
ID. Reopening an empty server catalog cannot erase pending local turns. Retry
sync is capped at twelve messages per pass; a local unsynced thread remains local
until thread creation succeeds. No reconnect replays old audio. The SVG's constant
body float is removed; blinking, short celebration and quiet listening/thinking
poses remain, with reduced motion respected.

## V2 measurements and honest limits

Before changes, `npm run test:nova` passed at local V1 commit `fd2dac092` in
210205 ms. This measures test-suite runtime only. Raw logs/manifests are generated
under `outputs/nova-v2/`, excluded from Git. The reproducible fixture comparison is:

| Probe | V1 | V2 |
| --- | --- | --- |
| Keep a new user correction in an interrupted provider envelope | fail | pass |
| Keep expression queued while the audio clock is suspended | fail | pass |
| Show expression when playback begins | pass | pass |
| Combined deterministic checks | 1/3 | 3/3 |
| Representative text system-prompt characters | 12394 | 14502 |
| Representative native system-prompt characters | 10533 | 12449 |
| Configured coaching silence | 650 ms | 1100 ms |

Reproduce with `node scripts/measure-nova-regressions.mjs --ref fd2dac092`
and `node scripts/measure-nova-regressions.mjs --assert`. The probes execute the
actual transport/playback logic with virtual audio time; they are not model
quality scores. Prompt size grows about 17–18%. Skill context adds one parallel
database read and at most four idempotent writes per actual observed attempt.
Real provider latency, cost and the benefit of those extra tokens are unmeasured.

Authenticated `GET /api/v1/ai/voice/diagnostics` returns each user's latest forty
client/server snapshots. Sessions collect connection and first-audio timing,
transcript-to-playback reply proxies, local interruption-to-stop time, coaching
tool wait, error/reconnect counts and observed model/tool turns. Server and client
records stay separate and contain no transcripts. At most 256 samples are kept
per snapshot. p50 includes sample count/source; p95 is null below twenty samples.
Browser timing is not acoustic speaker timing. Gemini native counts are observed
output/tool turns, not internal provider inference requests; text HTTP attempts
and OpenAI response-created events are counted separately. Standard TTS continues
to use the existing usage records rather than pretending to share a native session.

Cost stays null without known provider usage and explicitly configured effective
rates in `NOVA_MODEL_PRICING_JSON`. Format: a model-name map whose values contain
`inputPerMillion`, `outputPerMillion`, `currency: "USD"` and `source`. No guessed
rates ship. A configured estimate covers reported tokens only, not an invoice or
an unreported secondary model. Audio/cached-token differences must be reflected
in the configured effective rates. Client-reported token counts are discarded.

The V2 suite contains **60 new text scenarios and 6 native/browser protocols**
in `backend/scripts/fixtures/nova-quality-v2.json`, independent of the persona's
illustrations and old suite. A separate nine-dimension human rubric covers
usefulness, Uzbek, delivery, teaching, identity, audiovisual consistency, control,
speed and recovery. The runner captures actual answers, request counts and measured
latency; regex notes do not become quality grades. Human grades stay null until
independent review. No self-scored model grade is accepted as proof.

```powershell
npm.cmd run test:nova
npm.cmd run test:nova:v2
node backend/scripts/evaluate-nova.mjs --list
npm.cmd run eval:nova
npm.cmd run eval:nova:audio
# After build, optionally capture real recorded speech (PCM16, 16 kHz, mono):
node backend/scripts/evaluate-nova-native.mjs --case native-pause --pcm sample.pcm
```

The native capture runner writes WAV audio, transcript and received-audio expression
boundaries for listening. Text-to-native audio does not test STT or VAD. Run the
microphone barge-in, pause and reconnection protocols separately, listening on an
actual speaker/device. This environment had no configured Gemini, OpenAI or HF
credentials: both evaluation runners generated **NOT RUN** manifests. Uzbek
intelligibility, natural prosody, actual semantic tone, live VAD, acoustic stop
delay and live p50/p95/cost remain unverified. No naturalness claim is made.

## V2 rollout and changed files

Apply both Nova migrations before serving this code:

```powershell
npm.cmd --prefix backend run prisma:deploy
npm.cmd --prefix backend run build
```

`20261121140000_nova_learning_and_memory` adds provenance/revision fields and
`NovaSkillEvidence`/`NovaSessionDiagnostics`; existing messages/memories remain
readable. Prisma schema generation/build is checked locally. The migration is
not applied to a production database by the test runners. Existing backend
startup applies pending migrations. Deploy a configured provider to enable live
quality capture; pricing configuration is optional and otherwise cost is unknown.

| Area | V2 task files |
| --- | --- |
| Data | `backend/prisma/schema.prisma`, `migrations/20261121140000_nova_learning_and_memory/migration.sql` |
| Learning/memory | `backend/src/services/novaLearning.ts`, `novaLearning.service.ts`, `novaMemory.service.ts`, `novaArithmetic.ts`, `assistant.service.ts`, `assistantPolicy.ts`; `backend/src/routes/aiWorkspace.routes.ts` |
| Voice/metrics | `backend/src/services/novaDiagnostics.ts`, `novaDiagnostics.service.ts`, `geminiLive.service.ts`, `realtimeCoach.service.ts`, `voiceInstructions.ts`, `aiProvider.service.ts`; `backend/src/routes/realtimeCoach.routes.ts`, `backend/src/config/env.ts` |
| UI/state | `src/components/ai/NovaMemoryCard.tsx`, `NovaLearningNotes.tsx`, `AIChatWindow.tsx`, `useAiTutor.ts`, `useRealtimeCoach.ts`, `CoachMascot.tsx`, `TalkOverlay.tsx`, `coach-studio.css`; `src/store/aiAssistantStore.ts` |
| Transport/history | `src/lib/novaLearning.ts`, `novaPlayback.ts`, `geminiRealtimeCoach.ts`, `realtimeCoach.ts`, `coachAudio.ts`; `src/services/aiWorkspacePersistence.ts`, `geminiAI.ts` |
| Tests/evaluation | `backend/scripts/nova-v2.test.mjs`, `assistant-coach.test.mjs`, `gemini-live.test.mjs`, `nova-persona.test.mjs`, `evaluate-nova.mjs`, `evaluate-nova-native.mjs`, `fixtures/nova-quality-v2.json`, `fixtures/nova-quality-rubric.json`; `scripts/measure-nova-regressions.mjs`, `test-gemini-live-browser.mjs`, `test-nova-memory-browser.mjs`, `tests/nova-v2-ui.tsx`, `tests/nova-tts-segments.tsx`; `package.json`; this document |
