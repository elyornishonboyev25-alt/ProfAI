# Nova: integration and verification

Reviewed 26 November 2026. Nova is the assistant; Ivygoo is the platform.

This release hardens the existing tutor integration. It does not establish that
every requirement has passed a real model, human microphone and production-account
acceptance test. The distinction between working application flows, simulated
provider transport and unavailable acoustic evidence is deliberate.

## Changes in this release

- Replayed tool calls recheck active exams and current account ownership. Cached
  answer evidence cannot bypass a newly started timed attempt or removed history.
- SAT analysis accepts an explicit skill and preserves the current matching skill.
  An ambiguous shared attempt ID asks for Math or Reading and Writing.
- Shared vocabulary consent parsing makes Uzbek/English refusals override saves,
  including automatic-save permission. Dismissals produce cancellation receipts.
- Study effects are fenced by account and lesson revision, and cannot apply during
  an active exam. Missing local Analyze history reports failure rather than success.
- Listening replay validates finite ranges, rejects a start beyond the source,
  stops at the selected boundary, and releases audio ownership at EOF after resume.
  These are recording ranges, not newly verified sentence alignments.
- Speaking cleanup keeps an older recording's completion from releasing a newer
  capture. Changing account/question clears old audio and transcript presentation.
- Saved IELTS per-question outcomes reach the agent and provide quick links to
  incorrect/skipped questions. Missing outcomes stay unknown. Answer evidence still
  comes from the catalog, never from a client-supplied answer key.
- English grammar terms inside an Uzbek teaching request keep Uzbek feedback.
  Lesson-generation instructions advertise only Uzbek and English.
- Test/source selectors collapse after loading a question, leaving more room for
  the lesson on mobile. Skill names and automatic-save controls are clearer.

## How to use

Open Nova from a supported signed-in page. Choose a completed attempt under
Analyze, or choose separate Practice under **Test va yo‘nalish**. The selectors can
be expanded again to change source. The assistant also has typed navigation and
history lookup tools, so a connected model can retrieve the last synced attempt.

Read the source question, enter an attempt, ask for a hint or explicitly request
the evidence/full explanation. Listening uses the original recording with editable
start/end and speed; Space interrupts playback for a held voice turn outside text
inputs. Incorrect/skipped question links appear when saved outcomes are available.
My Vocab saves require explicit permission or current-lesson auto-save consent.
Speaking offers a separate recorded retry; Writing preserves the learner's text and
decorates exact versioned spans. Reopening a lesson never starts audio by itself.

## Requirement coverage

Numbers correspond to the supplied brief. “Policy” means instructions implemented
in the shared tutor, not measured model quality or fine-tuning.

| Requirement | Implemented area | Verification | Remaining limit |
| --- | --- | --- | --- |
| 1. Teaching cycle | Methodology, study steps, hints, retries, evidence | Study API and browser flow | Instructional quality needs model/human review |
| 2. Uzbek/English | Shared language guard and legacy migration | Study + V3 language tests | Recognition is fallible; no speech accuracy guarantee |
| 3. Recognition/recovery | Nova ASR prompt, PCM capture, held-turn gate, transcript correction | PCM + voice transport/recovery fixtures | No provider credentials or matching human recordings locally |
| 4. Site agent | Allowlisted routes, history, analysis, Practice, words | Real router/API with fixture accounts | No production account walkthrough |
| 5. Typed tools | Zod schemas, ownership, cancellation, replay-ID guard, receipts | Study tools and account-isolation tests | Browser actions remain proposals until receipt |
| 6. Analyze/Practice/exam | Server and browser exam guards; separate practice | Active-exam, owned attempt, unchanged-result tests | Sync records are account-owned, not independent exam attestation |
| 7. Relevant context | Exact source IDs, selected text, draft version, bounded context | Foreign/mismatched question tests | Arbitrary screen selection has no guaranteed source mapping |
| 8. Completed Listening | Synced attempt lookup, original answers, recorded outcomes | Authenticated Analyze browser route | Unsynced device history is unavailable to server lookup |
| 9. Question comprehension | Understand/attempt steps and method policy | Browser/source context | Real teaching dialogue unverified |
| 10. Original replay | Source player, replay, voice interruption | Real repository MP3 in Edge; synthetic boundary tests | Manual ranges/catalog cues are not sentence alignment |
| 11. Alignment/transcript | Existing cue provenance, range/speed controls, available transcript | Catalog cue + source boundary tests | No new forced-alignment pipeline; missing transcripts stay missing |
| 12. Listening methods | Central method policy and source evidence | Evidence/replay and timer regression tests | Academic review of every question type still required |
| 13. Reading methods | Real passage evidence and progressive hints | Source/Analyze guards | Model distractor reasoning needs academic evaluation |
| 14. Speaking bank | Repository questions and synced history tools | Bank/source and browser Practice checks | Empty synced history cannot establish “never attempted” |
| 15. Speaking Practice/Analyze | Actual recording retry and existing assessment workbench | Provider fixtures and question bank flow | No human microphone assessment in this run |
| 16. Pronunciation | Audio-based assessment path; transcript-only caution | Audio assessment evidence tests | No real learner audio; word-level acoustic correction unproven |
| 17. My Vocab | Contextual meaning, Uzbek definition, example, provenance, dedup | Actual local store writes; refusal/consent/replay tests | Cloud sync depends on existing account sync |
| 18. Word review | Lesson words and existing flashcard review route; recall policy | Study word tracking and dedup tests | Model-led contextual recall unverified |
| 19. Writing tutor | Draft context, authorship policy, planning/revision | Draft/annotation fixtures | No real-model writing coaching evaluation |
| 20. Writing annotations | Version/quote/UTF-16 anchors and textarea decoration layer | Unicode/edit/undo/redo browser flow | Real IME hardware composition not separately exercised |
| 21. SAT Math | Real source/explanation, safe formulas and polynomial graphs | Source catalog, SAT skill selection, board tests | Independent model solution quality unverified |
| 22. SAT Reading/Writing | Exact section context and method policy | Shared-attempt section tests | Real distractor coaching unverified |
| 23. Character | Existing bounded expression/delivery and optional banter policy | Persona, age-setting and boundary fixtures | Audible emotion and naturalness need human review |
| 24. Glass board | Existing responsive dock; compact collapsible source controls | Desktop/mobile Edge screenshots and overflow checks | Screenshots use a fixture host, not full production styling |
| 25. Structured visuals | Validated lesson blocks, source refs, safe KaTeX/graphs/SVG | V3 schema/rendering/step tests | Evidence/words use dedicated study UI, not separate lesson block variants |
| 26. Audio/Space | Shared audio ownership, typed-input exclusion, held-turn tail | Browser MP3 interruption, V3 keyboard and PCM fixtures | Physical echo, noisy mic and mobile hold need devices |
| 27. Recovery | Account-scoped progress, saved answers/segment, revision fencing | Browser reload without autoplay; stale-effect tests | Automatic-save consent resets on account reload |
| 28. Method/data/training | Central policies, official source references, evaluation runners | Official guidance reviewed; deterministic policy tests | No fine-tuning or training dataset pipeline was added; benefit not established |
| 29. Browser checks | Real Edge + actual components/API/source recordings | Study browser suite | Auth/account rows are fixtures; provider response is not live |
| 30. Meaningful tests | Tool, mode, source, consent, editor, SAT, language/audio suites | Commands below | Acoustic and academic quality remain separate |
| 31. Acceptance A–F | Component/API flows and deterministic checks cover parts | Analyze/Practice/words/writing/Space/mixed-language fixtures | Complete voice-led A–F with real model still pending |
| 32. Delivery | Source, reproducible tests, this coverage report | Build/type checks and scoped Git commit | This is not a claim of full production acceptance |

## Models, configuration and data

Existing defaults remain: Gemini Live `gemini-3.8-live` with Kore; an alternative
OpenAI realtime route; configured text-provider selection; OpenAI
`gpt-4o-transcribe` with configured fallback, or Gemini recorded ASR; existing
OpenAI/Gemini TTS for explicit board narration. No browser SpeechSynthesis
replacement is presented as native Live audio. Runtime provider selection depends
on deployment configuration and available credentials, not these defaults alone.

The local catalog builder produced 706 skill/test entries from repository sources;
this is not a count of unique full papers. No IELTS content was added. This release
needs no database migration or new service. Existing migrations and generated
catalog remain prerequisites. Deploy frontend and backend together because both
now recognize `cancelled` action receipts. Do not commit generated catalog/build
files, audio evidence, local configuration or secrets.

## Changed files

Backend: `novaConsent.ts`, `novaTools.service.ts`, `novaStudy.service.ts`,
`novaStudy.ts`, `novaLanguage.ts`, `novaLesson.ts`, `novaMethodology.ts`,
`assistantPolicy.ts`, and `backend/scripts/nova-study.test.mjs`.
Frontend: `NovaStudyDock.tsx`, `NovaSpeakingPractice.tsx`, `nova-study.css`,
`useAiTutor.ts`, `novaStudySession.ts`, `novaSourceAudio.ts`, `realtimeCoach.ts`,
and `geminiAI.ts`. Verification: `package.json`, `test-nova-study-browser.mjs`,
`nova-study-ui.tsx`, `nova-source-audio.tsx`, and this report. Unrelated pre-existing
design, deployment and local configuration changes are outside this commit.

## Verification

The reproducible study command now includes backend, session, audio-boundary and
browser checks:

```powershell
npm.cmd run test:nova:study
node --test backend/scripts/nova-voice-reliability.test.mjs backend/scripts/nova-persona.test.mjs backend/scripts/nova-v2.test.mjs backend/scripts/nova-v3.test.mjs backend/scripts/assistant-coach.test.mjs backend/scripts/gemini-live.test.mjs backend/scripts/speaking-audio.test.mjs scripts/tests/nova-pcm-capture.test.mjs
node scripts/test-listening-parts-ui.mjs scripts/tests/nova-v3-ui.tsx
node scripts/test-listening-parts-ui.mjs scripts/tests/listening-audio-completion.tsx
node node_modules/typescript/bin/tsc --noEmit
npm.cmd run build:bundle
```

The existing Listening regression covers final-track completion, 120-second review,
playlist tracks, audio errors, repeated end, unmount, review replay and unchanged
Reading timing. Source replay has no runner completion callback.

Real text (`do-not-reveal`), Gemini native (`native-mid-delivery`) and the 26-case
ASR evaluation runners were attempted. They reported **NOT RUN** because no local
provider credentials were available. No human recording was supplied. Their
generated manifests are under ignored/uncommitted `outputs/`; scores, acoustic
latency and WER remain unmeasured. Fixtures prove application transport and guards,
not natural speech understanding, accent quality or IELTS band validity.

## Guidance checked

The tutor's four Speaking criteria agree with the public
[IELTS Speaking descriptors](https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf).
Writing criteria are referenced through the
[British Council assessment guidance](https://takeielts.britishcouncil.org/teach-ielts/test-information/assessment).
The central SAT domains are consistent with the
[Digital SAT framework](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf).
Calculator guidance follows the
[College Board policy](https://satsuite.collegeboard.org/in-school-assessments/calculator-policy).
Gemini transport assumptions were checked against the
[Live capabilities guide](https://aistudio.google.com/docs/live-api/capabilities).
These references are methodology/context, not evidence that the model was trained.
