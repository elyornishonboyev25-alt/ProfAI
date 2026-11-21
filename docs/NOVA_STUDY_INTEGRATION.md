# Nova study integration — 2026-11-21

Nova now connects the existing text/voice tutor to repository questions, account-synced attempts, an in-page study board, original Listening audio, Speaking retries, Writing spans and My Vocab. This delivery is **not a claim that every requested acceptance scenario has been validated against a live model**. Provider credentials and matching human recordings were unavailable locally. Full sentence alignment and acoustic quality validation remain outstanding.

## Using it

Sign in and open **Nova** in the lower-right corner. Choose a skill, then a completed attempt for Analyze or a repository source for separate Practice. A completed Listening/Reading attempt opens the actual `/results/:testId/review` route with that attempt's original result, rather than whichever retake was most recent. SAT Analyze uses `/sat/results/:attemptId`. Practice in Nova's board does not resubmit or overwrite the original result.

Start with the question's meaning and your own answer. Ask Nova to check, request a progressive hint, or explicitly request a full explanation. The evidence button separately retrieves the source key/explanation. Missing transcript/evidence stays missing. Listening plays the original MP3; choose a range, repeat it, move back three seconds, continue, pause or change speed. Existing catalog cues initialize appropriate ranges where available. These cues are labelled by provenance in tool data; they are not newly measured sentence alignment.

Speaking practice presents a real catalog question, records a separate answer, allows transcript correction and uses the existing audio assessment and pronunciation retry workbench. Stored Speaking Analyze reports can reuse their original transcript, audio-store recording metadata and assessment. Missing browser recordings cannot be reconstructed from text. Writing annotations decorate a real overlay matched to the textarea; edits invalidate stale spans while native undo/redo and IME remain available. Clicking a quoted span can focus its actual selection.

Explicit named vocabulary saves execute directly; other proposals use Allow/Dismiss. The checkbox or an explicit automatic-save request grants consent only within the current lesson. New skills/tests reset it. Nova saves the contextual sense, Uzbek explanation, English example and source question through the existing My Vocab store. Repeated saves retain one entry for that sense; a different sense does not overwrite it. A vocabulary review action opens the existing activities.

## Architecture and configuration

- `scripts/build-nova-catalog.mjs` bundles `scripts/lib/novaCatalogSource.ts` from the same IELTS/SAT source modules as the product. The current build yields **706 skill/test entries, 25,408 questions and 120 existing Listening timestamp cues**. The existing source modules expose **no full Listening `audioTranscript` fields**. No new IELTS tests or questions were added.
- The generated catalog is private build output at `backend/dist/data/nova-catalog.json`, never a public answer-key file. `npm --prefix backend run build` creates it. Backend development can create it with `node scripts/build-nova-catalog.mjs`. Build from a checkout that contains the sibling `src` and `scripts` directories; an API-folder-only source archive is insufficient. The builder uses the backend's pinned esbuild dependency and does not require frontend dependencies to be installed.
- Existing PostgreSQL `AccountLearningData` stores supply owned histories and active-state checks. `speaking-sessions`, Reading/Listening history, Writing history and SAT attempt history remain the source of account state. Nova lessons use the existing account-scoped sync store. No database migration is needed for these additions.
- Authenticated endpoints: `GET /api/v1/ai/assistant/study/catalog`, `GET .../attempts`, `POST .../context`, `POST .../tool`. Question access requires completed owned Analyze or explicit separate Practice. Known active timed sessions reject study tools on the server, including requests that falsely label themselves Practice. Live coaching also checks the gate. Examiner mode retains its existing examination policy.
- `novaStudy.ts` defines references, tool envelopes, effects, lesson progress and versioned Writing spans. `novaTools.service.ts` validates every tool's arguments, scopes account reads, returns success/error results, handles cancellation and rejects reuse of a call ID with changed arguments. Read-only calls are bounded; browser effects are proposals until applied. There is no arbitrary URL, shell, SQL or JavaScript tool.
- Text executes at most three rounds of up to four validated tool calls. Gemini Live and OpenAI realtime reuse this through the existing `ask_coach` bridge. Interrupted responses and changed voice context cannot deliver late tool effects. The browser executes validated effects once and protects a dirty Writing draft with confirmation plus an account-scoped recovery copy before leaving.
- `nova:study-session:v1` retains skill/test/attempt/question, hint level, step, exercise answers, collected words and the selected audio range. Reopening does not autoplay. Automatic-save consent is intentionally not restored across reloads. The existing chat history, memory, avatar, lesson formula/graph renderer and push-to-talk paths remain in use.
- `NovaSourceAudio` owns only review audio and has no test-submission/countdown callback. Token-based leases coordinate coach TTS, source recordings, pronunciation examples, candidate recordings and conversation replay. Late releases cannot unmute the microphone beneath a new owner. Native Gemini PCM is suppressed and OpenAI playback muted while another owner plays. Space interruption cancels pending source playback; native editor spaces remain typing input.
- Short Uzbek/English controls (replay, previous/next question, selected audio range, speed, pause/resume/continue) use the current server-validated study reference without a model call. The actual dock supports held Space and pointer capture, including cancellation. Persisted lesson progress and the last browser action receipts accompany text/live context. Receipts describe browser completion, failure or pending consent; they are not server-verified mutations. Source ranges remain labelled unaligned where sentence metadata is missing.
- Separate Speaking practice persists its original recording and duration before transcription. A failed transcription can be retried from the saved audio without recording again.

The existing provider routing is retained: Gemini text defaults to the configured `GEMINI_MODELS` list (`gemini-2.5-flash,gemini-2.5-flash-lite`); OpenAI text uses `OPENAI_MODEL`/`AI_CHAT_MODEL`. Gemini Live defaults to `gemini-3.8-live` with Kore; the OpenAI realtime path defaults to `gpt-realtime-2.1`. Standard voice uses the existing Gemini TTS/OpenAI `gpt-4o-mini-tts` path. Recorded ASR tries `gpt-4o-transcribe`, the configured transcription model, then configured Gemini fallback models. These are configured code paths, **not a claim of verified provider availability**. No credential, model setting, paid service or training job was silently added.

Nova conversation preferences normalize legacy Russian selections to Uzbek. Uzbek/English response guards and transcript clarification remain separate from site-wide i18n, which still supports its existing languages. Short acknowledgments and mixed English study terminology retain the current language. Speaking exam questions remain English.

## Requirement matrix

“Implemented” describes code and deterministic verification. It does not substitute for a live teaching-quality evaluation.

| Request | Implementation | Verification | Remaining limitation |
| --- | --- | --- | --- |
| Existing voice/chat/avatar/history/memory/Space/board | Existing controllers extended, not replaced | Nova persona/v2/v3, voice and lesson suites | Live acoustic quality not measured |
| 1 Teaching cycle | Central methodology and persisted board steps; full-explanation action | Tool flow + board interaction | Pedagogical judgment still needs real-model review |
| 2 Uzbek/English | Legacy preference migration, detection, reply guard, two-language selector | Language and restored-session tests | No human listening evaluation |
| 3 STT recovery | Existing actual recording/transcription, editable practice transcript, clarification; no pronunciation inference from transcript | PCM, language and recording transport fixtures | No human ASR/WER benchmark or measured noise/VAD quality |
| 4 Site agent | Typed catalog/history/navigation/Analyze/Practice/vocabulary effects | Authenticated browser + exact Analyze route | Does not cover every site's filter; ambiguous test IDs require clarification |
| 5 Tool controls | Per-tool Zod schema, authenticated owner, bounded calls, error envelope, cancellation and replay guard | Foreign attempt, malformed URL, cancellation, failed-tool and repeated-save tests | Browser side effects are not distributed transactions |
| 6 Analyze/Practice/exam boundary | Server reads saved active states, matches owned completed attempts, separate read-only Practice | Active exam 409, false Practice request, immutable result tests | Unsynced/offline client exam state cannot be independently proven by this server; full server-owned exam lifecycle remains a product-wide prerequisite |
| 7 Page context | Explicit study reference plus existing selected/visible text; source question retrieved server-side | Matched test/question/attempt tests | General page text is client data, not server-verified visual perception |
| 8 Completed Listening lookup | Actual account history, dates, original answers, exact attempt routing | Tool-round and browser Analyze tests | Missing or not-yet-synced history is reported, not inferred |
| 9 Question understanding | Question, instruction/word limit, original answer and first learner step | Source context and board browser checks | Model-specific interpretation remains unmeasured |
| 10 Original segment loop | Original audio ranges, replay, pause/resume and student attempt | Browser plays repository MP3 and interrupts it with Space | Not universal sentence-by-sentence alignment |
| 11 Transcript/alignment | Existing catalog timestamp cues, adjustable range and honest missing-transcript state | Cue provenance + missing-transcript browser checks | Full transcript acquisition/forced alignment not performed |
| 12 Listening methodology/timer | Central question-type guidance; independent review player | Existing final-track + 120-second completion regression suite | No new per-question acoustic annotation dataset |
| 13 Reading methodology | Real passage, progressive hints, source keys and available evidence quotes | Source/Practice/tool tests | Some catalog questions lack exact quoted evidence; it is never invented |
| 14 Speaking bank/history | Real bank prompts, actual synced recorded history | Speaking bank + browser source question | Empty history is not treated as never attempted |
| 15 Speaking Practice/Analyze | Separate recorder/retry, existing audio assessment and stored review workbench | Existing assessment suites; browser question-bank/retry surface | New recorder not evaluated with a live human/model pair |
| 16 Pronunciation | Existing audio-only assessment and pronunciation workbench; original local audio replay | Existing audio assessment validation tests | No new real-word pronunciation quality score measured |
| 17 My Vocab | Actual store, contextual senses, Uzbek meaning/example/provenance, consent | Real browser save; sense/consent/account UI suite | Cross-device visibility follows existing sync; local-only recordings are not uploaded |
| 18 Recall/repetition | Current lesson word list + existing review activity navigation, methodology | Vocabulary persistence/activity route checks | Real-model teaching variation not evaluated |
| 19 Writing authorship | Actual draft/version in context; coaching/annotation only, no silent edits | Draft backup + unchanged text tests | Longitudinal writing improvement not measured |
| 20 Writing annotations | Matched textarea overlay, exact quote/version/UTF-16 span, category-specific decoration and focus | Browser Unicode/edit/undo/redo; anchor unit tests | IME kept native but not tested with a physical IME session |
| 21 SAT Math | Source question/options/visual/explanation; existing safe formula/polynomial graph board and arithmetic checker | SAT validators, source tool tests, formula/graph browser test | Live model's independent mathematical reasoning not scored |
| 22 SAT Reading/Writing | Source passage, choices, explanation and central domain/distractor guidance | SAT content validation and context tests | Live distractor-explanation quality not measured |
| 23 Character/banter | Existing consent/preferences plus requested phrase choices; immediate serious/stop boundary | Persona/banter regressions | Voice/emotion quality needs human listening |
| 24 Glass workspace | Desktop side board with reserved space, mobile sheet, compact Nova avatar, native source diagrams | Desktop/mobile screenshots and no-overflow browser assertions | No separate design acceptance from user yet |
| 25 Structured visual/audio sync | Existing validated lesson blocks, optional source refs, safe KaTeX/graphs, block-level playback highlights | Native formula/graph/step/Space tests | No fabricated word-level audio timing |
| 26 Audio priority/Space | Token leases across review audio, TTS, recordings, replay and pronunciation; direct dock held-Space/pointer controls | Late-owner-release unit check; original MP3 interruption; actual dock Space press/release and real tool question/replay controls | Real speaker-to-mic echo/VAD not acoustically measured |
| 27 Restoration/late events | Account-scoped saved lesson and answers; no autoplay; interruption/context-version fencing | Reopen, account, voice stability and audio cancellation suites | Some navigation still follows existing product-level route/session rules |
| 28 Methodology/training | Central source-linked policy; actual source retrieval distinct from memory/instructions | Source review and deterministic tests | No evidence justified fine-tuning; no training or paid job performed |
| 29 Playwright | Real Edge browser, real study API and source files | New browser integration + existing lesson browser | Auth/account rows use fixtures; live model/microphone quality not tested |
| 30 Meaningful coverage | Ownership, mode, source replay, tool failures, consent, draft protection, Unicode, formula/graph, language and cancellation | Backend and frontend suites listed below | Not every requested acoustic/teaching-quality scenario has a live recording |
| 31 Acceptance A–F | Deterministic paths for Analyze/Practice, bank, editor, board, Space and language | Tool rounds, API/browser/UI regressions | A/B end-to-end spoken teaching not accepted against a real provider |
| 32 Delivery | Source code, build integration, CI test, report; existing persistence reused | Frontend/API builds, targeted regressions and browser | Production deployment/credentials and live acceptance are outside the verified local result |

## Verification record

Passed locally on Windows:

- `npm run build`: all repository content/branding/i18n/vocabulary validators, TypeScript, Vite and PWA output. Existing large-chunk/Browserslist warnings remain.
- `npm --prefix backend run build`: Prisma generation, API TypeScript and catalog generation.
- `npm ci --prefix backend --dry-run --ignore-scripts --offline`: package/lock consistency; local Node 24 produces the existing engine warning for a Node 22 target.
- Backend Nova persona/v2/v3, study tools, assistant, Gemini Live, voice reliability, Speaking audio and PCM suites: **57 passing tests** in the combined final run, including bounded multi-round tool orchestration and failure handling with a fixture provider.
- New `scripts/tests/nova-study-ui.tsx`: actual My Vocab writes, same/different sense behavior, consent/dismiss, source provenance, lesson-scoped automatic-save consent and account fencing.
- Frontend Nova v2/v3, voice controls/recovery/stability, realtime streaming, Listening completion, exam workspace and assessment studio suites.
- `scripts/test-nova-study-browser.mjs`: real authenticated study routes with fixture accounts/history; source MP3 transport and Space interruption; exact owned Analyze routing; separate Practice/Speaking catalog; delayed evidence/missing transcript; actual vocabulary writes; dirty-draft confirmation/backup; Unicode span invalidation and native undo/redo; mobile fit; server exam rejection. Screenshots are local generated artifacts under `output/playwright/nova-study/` and are not committed.
- Existing `scripts/test-nova-lesson-browser.mjs`: formula/graph rendering, progressive steps, student exercise, no autoplay, Space cancellation and a 360px layout. Narration audio here is synthetic fixture data.

No actual model-generated teaching response or live microphone recording was evaluated: local Gemini/OpenAI credentials were absent. Browser fixtures demonstrate integration behavior, not speech recognition accuracy, pronunciation assessment quality or a measured IELTS band.

## Main changed files

- Server: `novaStudy.ts`, `novaStudy.service.ts`, `novaTools.service.ts`, `novaMethodology.ts`, `assistantPolicy.ts`, `assistant.service.ts`, `assistant.routes.ts`, `novaLanguage.ts`, `novaLesson.ts`, `novaBanter.ts`, Gemini/OpenAI voice services/instructions, Speaking audio policy and shared error handling.
- Browser: `NovaStudyDock.tsx`, `NovaSpeakingPractice.tsx`, `NovaAnnotatedEditor.tsx`, `NovaWritingAnnotations.tsx`, `nova-study.css`, `novaStudySession.ts`, `novaSourceAudio.ts`, shared study types, tutor/live hooks, existing Writing workspace, vocabulary store and chat/voice request types.
- Build/tests: catalog builder/source adapter, backend package/lock, root test command, CI study-tools step, new study suites and updated language expectations/fixture account readers in existing Nova tests.

## Public methodology references

Reviewed on 2026-11-21: [IELTS assessment resources](https://takeielts.britishcouncil.org/teach-ielts/test-information/assessment), [IELTS Speaking descriptors](https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf), [Digital SAT assessment framework](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf), and [College Board calculator policy](https://satsuite.collegeboard.org/in-school-assessments/calculator-policy). Policy prose and retrieval do not constitute model training.
