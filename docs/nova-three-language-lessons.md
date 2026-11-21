# Nova: three languages, held speech and lesson board

## Evidence and causes

The V2 code sent `language: auto` for every native coaching session regardless of
the selected microphone language. Standard server ASR described speech as
"primarily English"; the standard Nova UI mainly used browser recognition and
did not pass a Nova language/vocabulary context to recorded ASR. One global
`voiceLang` also mixed microphone preference with conversational state. Neither
text streaming nor native output had a content language guard. Voice instructions
still included a 1–3 sentence instruction even for a full lesson.

These are verified code-path problems, not measured causes of every transcription
error. No live audio credentials were available locally. Before/after Uzbek WER,
language accuracy, audible emotion and acoustic interruption delay are unmeasured.

## Language policy and recovery

`backend/src/services/novaLanguage.ts` is shared with the browser. Only `uz`, `en`
and `ru` are response languages; selection adds `auto`, and internal observations
may be `unknown`. UI locale, selection, last reliable language, current observation
and final response metadata are separate. State is scoped by account and stable
conversation ID, persisted locally, and restored from server message metadata.
Opening a microphone does not change it. Explicit requests to switch to one of
the supported languages can update selection. A manual selection restarts the
native connection with matching immutable recognition hints and retained history.

The detector combines lexical evidence, Uzbek Cyrillic/apostrophe handling,
protected code/formula/quote segments and franc profiles on longer text. Short
acknowledgements, terms, names and the requested roast openings do not trigger a
switch. Profile distances are not displayed as confidence. Ambiguous short speech
keeps the current language. Strong unsupported-language evidence asks for a repeat
without translating/guessing it. This detector is conservative and fallible;
unknown short words cannot independently establish acoustic intelligibility.
Uzbek Cyrillic is transliterated only after Uzbek language evidence; Arabic text
is never "fixed" by changing its language label.

Text generation is buffered before visible SSE reply events. The actual prose is
checked, with at most one same-provider-contract repair generation. Invalid optional
language metadata does not discard useful text; valid content receives the expected
response language. Invalid lessons fall back to the useful plain reply. Nova TTS
also checks text before synthesis. A normal response still uses one generation;
a detected violation can use two. Buffering adds time before visible text compared
with unchecked token streaming; real latency impact is not measured.

Native audio retains streaming. Output transcript in the same envelope is checked
before scheduling its PCM; a later violation cancels remaining playback, cues and
the provider response, then requests one clarification in the allowed language.
Native transcription can arrive after audio. **Previously played audio cannot be
verified retroactively or taken back.** This is not an all-audio-before-playback
guarantee. Input transcripts with strong unsupported-language evidence are excluded
from application history and durable learning evidence. OpenAI removes the rejected
input item from its conversation. No classifier model is called per audio phrase.

## Provider configuration

The main path stays Gemini native audio, configured `gemini-3.8-live`, `v1beta`,
`Kore`; OpenAI Realtime (`gpt-realtime-2.1`, `marin`) remains the alternate.
Standard recording → shared tutor → TTS remains separate and explicit.

Checked official documentation:

- [Gemini Live capabilities](https://aistudio.google.com/docs/live-api/capabilities)
  and [WebSocket reference](https://aistudio.google.com/api-reference/live): native
  output does not accept an explicit output language code. Gemini 3.8 transcription
  supports `languageCodes` hints and `customVocabulary`; these are hints, not a
  language firewall. They are gated to the verified 3.8 family in setup. No
  affective-dialog flag is added. Manual activity is supported with server VAD off.
- [OpenAI realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations):
  temporarily disabling turn detection, committing input audio and explicitly
  creating a response supports held speech. Transcription accepts language/prompt
  guidance. Browser/media/control timing still needs a real-device test.
- [franc](https://github.com/wooorm/franc) warns that short samples are unreliable;
  the product therefore keeps contextual state rather than treating a ranking as
  a reliable probability.

Gemini recognition receives the allowed language hints and a small real vocabulary
(Nova/Ivygoo, Uzbek names/places, IELTS/SAT and grammar terms). OpenAI transcription
gets explicit language when selected and a mixed Uzbek/English/Russian prompt.
Standard Nova ASR uses the same language context, rather than the IELTS candidate
prompt. Existing IELTS transcription/examiner TTS callers keep their old defaults.
Recorded Nova speech can use server ASR while browser captions remain a preview;
if server ASR fails, a real browser transcript may be retained, never invented.

## Held Space and mobile speech

The live application requests `inputControl: hybrid`. Gemini then disables server
VAD and uses a bounded local PCM gate with a 300 ms prefix, energy threshold and
1100 ms silence (1400 for examiner). This retains automatic conversation, while
manual `activityStart`/`activityEnd` allows a held turn across thinking pauses.
Holding Space immediately stops local playback/cues and interrupts the provider.
Only real detected speech opens a new activity; empty presses do not commit a turn.
Release retains a short audio tail, then ends the activity. This is local energy
detection, not a claim of semantic pause recognition. It needs real noise/device
tuning. Legacy direct clients without hybrid keep existing server VAD.

OpenAI temporarily sets turn detection to null, clears old input, preserves a short
tail on release, commits non-empty locally detected speech, creates one response
and restores semantic VAD. Its transcript may only arrive after commit. Blank
presses clear the buffer. Repeat keydown cannot start another session or scroll
the page. Inputs, textareas, editable content, selects, buttons and other keyboard
controls retain normal Space behaviour. Dialog focus initially supports the global
shortcut. Blur/hidden tab/close cancels held state and mutes/releases capture;
pointer cancellation has equivalent mobile behaviour. A mobile hold button remains
alongside the original automatic/mute controls. Track/timer cleanup is fenced by
session and account. Physical stop delay and all browser/device edge cases still
need the supplied microphone protocol.

## Character and requested comebacks

Settings are off for a new account. Optional light mock anger or sharp roast can
be selected without choosing a different personality. `novaBanter.ts` supplies:

- `E, sen ahmoq…`
- `E, sen tvar…`
- `E, sen Chumo…`
- `E, sen dalbayop, nima deyapsan?`

An opted-in **playful_angry text turn** includes a permitted opening even if the
model omitted it; it does not replace the useful explanation. Light/unknown-age
settings use only the mild first phrase. Strong variants require sharp roast and
the user's explicit adult confirmation; this is self-declaration, not verified age.
Native `set_expression` returns a `speechOpening` to be spoken with the matching
delivery. Native output still depends on model/tool compliance and provider rules;
no promise is made that every native model always says a specific word. A refusal
is not retried with pressure. The voice is not switched between emotions.

Boundaries turn off the persisted local banter setting immediately; text delivery
becomes focused and known roast prefixes are removed. Real struggle, examiner
mode and serious requests suppress the forced opening. A Russian-origin word does
not change an Uzbek conversation to Russian. Native expression instructions now
specify proportionate visible intensity and the corresponding vocal delivery;
actual audible emotion is not proven by mocked metadata tests.

## Lesson contract and playback

`novaLesson.ts` defines strict versioned lesson/progress schemas. Blocks are
explanation, formula, worked example, graph, diagram, comparison, exercise and
summary. Each has an ID/title and optional plain narration. Identifiers, counts,
coordinates, content lengths and language are bounded. No model HTML or JavaScript
is executed. KaTeX uses `trust: false`, bounded expansion and safe error rendering.
Polynomials use bounded coefficient arrays; 81 displayed samples are computed
locally without eval, and marked points must match. Axes, ranges, units and labels
are explicit. Diagrams use only typed SVG lines, circles and labels. A whole invalid
board is ignored while the useful chat text survives.

In teaching mode a returned board moves the avatar to a small upper-left position.
Chat, microphone and voice controls stay available. Worked examples reveal steps;
exercises retain the learner's answer and can send it to Nova for checking. Model
assessments still require academic review; a draft answer is not an official score.

Board audio uses the existing Nova TTS path on demand, one section/step at a time.
Highlights activate at actual playback start, and worked-example steps activate at
their clip boundary. This is reliable section/step alignment, not phoneme or word
timing. Native audio still handles ordinary conversation; board narration is an
explicit TTS interaction, not a replacement of the native conversation route.
Space freezes the board at its current location. The native `control_lesson` tool
and text `lessonControl` metadata support continue/restart/pause without rebuilding
the board. The current section and draft attempt are supplied as bounded context.
Reopening never auto-replays audio. Echo is avoided by muting the native microphone
during on-demand board narration and restoring its prior state afterwards.

## Storage, tests and rollout

Lessons, graphs, response-language metadata, revealed steps and exercise drafts
reuse `AiConversationMessage.metadata`; no new database migration is needed for
this increment. The existing V1/V2 migrations must already be deployed. Progress
updates verify account/thread/message ownership. Failed saves keep local pending
state for bounded retry. Banter/held/microphone runtime state is never extracted
as permanent memory. Language preferences accept only supported codes.

Install the updated root/backend lockfiles with `npm ci` and `npm ci --prefix backend`.
New dependencies are franc (shared detection) and KaTeX/types (formula rendering).
No new provider key names or unsupported API parameters are required.

```powershell
npm.cmd run test:nova
npm.cmd run test:nova:v3
npx.cmd tsc --noEmit
npm.cmd run build:bundle
npm.cmd run check:branding
npm.cmd run check:i18n
npm.cmd run eval:nova:language
# After backend build, use a matching HUMAN recording for one fixture sentence:
node backend/scripts/evaluate-nova-language.mjs --case uz-names --audio uz-names.wav
```

The 26-case audio set covers Uzbek names/places, mixed terminology, informal
speech, short replies, switches, true unsupported input, noise/silence, thinking
pauses, barge-in and a physical phone. Without keys/recordings the runner writes
NOT RUN manifests with null WER/listening/VAD results. With a matching recording
it retains the actual transcript, measured ASR request duration and tokenized WER;
native VAD, prosody and acoustic stop remain separate listening checks. Never use
these fixtures or mock sine/silent audio as proof of natural Uzbek speech.

`nova-v3.test.mjs` exercises language transitions, invalid-language recovery before
visible output, one repair, grounded hints, schema rejection and consent/openings.
`nova-v3-ui.tsx` covers held/repeat/typing/blur/disable, empty speech, account isolation,
safe formulas, step reveal, saved drafts and frozen board state. Browser fixtures
exercise native envelope rejection, real PCM playback/cleanup and 360 px lesson
layout with synthetic audio. Existing Nova and exam regressions remain in the
test command; CI adds the new deterministic checks. Generated screenshots/logs
stay under `outputs/`, outside commits.

Changed areas: shared `novaLanguage.ts`, `novaLesson.ts`, `novaBanter.ts`; assistant
policy/service, native and standard speech services/routes; `useNovaLanguage`,
`usePushToTalk`, `novaTurnGate`; `NovaConversationControls`, `NovaLessonBoard`,
`NovaLessonMessage`, TalkOverlay/chat hooks; history/store and lesson progress;
test/evaluation scripts, CI and dependency lockfiles. Existing unrelated UI edits
are deliberately excluded from the commit.
