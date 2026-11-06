# Live voice performance

The live coach uses WebRTC speech-to-speech. Standard voice remains an explicit
fallback. A failed capability probe does not downgrade or close a live call.

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

Use a deployed backend with a configured OpenAI key and a supported browser.
Open voice, wait for the greeting, then speak several short questions. In browser
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
measure live OpenAI latency.

## Verification

```powershell
npm.cmd run test:ai-coach-ui
npx.cmd tsc --noEmit
npm.cmd --prefix backend run build
node --test backend/scripts/assistant-coach.test.mjs
```
