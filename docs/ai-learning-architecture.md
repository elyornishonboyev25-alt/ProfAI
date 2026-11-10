# Evidence-based assessment and tutor studio

## Product and implementation plan

1. Keep authenticated server endpoints, billing checks, account-owned attempts and audio storage. Preserve the existing exam engine and Listening deadlines.
2. Route Writing and Speaking scoring to a configurable Gemini Pro assessment model. Use high reasoning, bounded requests, strict output validation and actual model provenance. Never silently replace an audio assessment with text scoring or a weaker provider.
3. Assess Writing originals against four equally weighted criteria. Produce minimal, grounded corrections and a meaning-preserving corrected text. Independently assess that exact corrected text using the same task and visual context. If no validated edit changes the response, reuse its original assessment and say so. Never calculate the potential band by adding points or assuming every correction raises a score. Keep original rewards/leaderboards separate from the hypothetical corrected score.
4. Present Writing in a reusable compact workbench: original/corrected score comparison, inline red deletions and green insertions, criterion explanations, corrected text and stronger rewrite. Preserve new fields in saved reviews. Existing attempts without new fields remain readable.
5. Assess Speaking using recordings plus transcript. Ground pronunciation targets in supplied answer recordings and words; allow uncertainty instead of fabricating errors. Provide answer-by-answer language corrections and a separate pronunciation arena with model audio, microphone retry and a clearly labelled AI practice percentage.
6. Preserve examiner audio as well as candidate audio. Replay the conversation in order from account-owned recordings; identify device-voice reconstructions and missing old recordings. Offer a combined WAV download when all recorded clips can be decoded, without silently omitting missing audio.
7. Keep exam delivery neutral. Preserve one-minute Part 2 preparation and the two-minute long turn. Recognise multilingual names; a non-English substantive response triggers an English reminder rather than a fabricated fixed band penalty.
8. Adapt the tutor automatically across text and voice from each learner request, actual work, conversation and verified memories. No personality, lesson-mode or banter settings panel is shown. Natural requests such as explain simply, challenge me, be strict or use affectionate language guide the next response; newer requests override older ones. Legacy stored settings do not lock the tutor. Never invent a learner's past mistakes. Structured replies select an illustrative avatar expression; voice/legacy replies use a modest transcript fallback. Examination mode overrides conversational adaptation.
9. Use silver glass surfaces, graphite typography and crimson actions. Keep results inside bounded tabs with accessible controls, mobile stacking, visible focus and reduced-motion support.
10. Validate contracts, score arithmetic, injected/unmatched evidence, audio provenance, microphone cleanup, reload recovery and responsive rendering. Commit task files only and push the existing upstream.

## Research and limits

Reviewed 2026-11-10. This configures an existing pretrained model; it is not custom ML training. Training a new scorer requires licensed examiner-labelled responses, consented audio, held-out calibration data and an ongoing evaluation programme. AI scores and retry percentages are estimates; no zero-error or certified-examiner claim is made. Deep reasoning targets a useful response around 35–50 seconds but network/provider latency is variable; no artificial delay or fake completed stages are used.

- IELTS scoring and criterion weighting: https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail
- Writing descriptors: https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf
- Speaking descriptors: https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf
- Speaking structure: https://ielts.org/take-a-test/test-types/ielts-academic-test
- Gemini Pro API model: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview
- Gemini thinking configuration: https://ai.google.dev/gemini-api/docs/thinking
- Gemini audio understanding: https://ai.google.dev/gemini-api/docs/audio
- British Council speaking practice: https://learnenglish.britishcouncil.org/free-resources/speaking
- BBC shadow speaking: https://downloads.bbc.co.uk/learningenglish/features/themed_weeks/5_days_to_improve_speaking_day3.pdf

Server configuration: `GEMINI_API_KEY` and model access are required. `GEMINI_ASSESSMENT_MODEL` defaults to `gemini-3.1-pro-preview` and may be updated independently of conversational models. Paid-provider integration needs a real credential smoke test in deployment; fixture tests do not establish provider availability or scoring validity.

Run `npm run test:assessment-studio` for the server contracts, compact-review regression tests and real-browser checks. The browser suite uses installed Playwright, or an isolated toolchain selected with `ASSESSMENT_PLAYWRIGHT_PACKAGE`; its API responses and audio are fixtures. Screenshots and fixture WAV exports go to ignored `artifacts/assessment-studio/`.
