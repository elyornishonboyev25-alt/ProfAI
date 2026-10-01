# Reading prompt and function audit — 1 October 2026

All catalogued Reading papers, 30 day sets, 12 roadmap full tests and 20 generated full-test aliases are covered by `npm run validate:reading`: 85 resolved tests, 90 distinct passage IDs and 2,682 answer slots, including reused passages. The validator runs during production builds.

67 prompts in papers 23–30 were reduced to the sentence or clause associated with their own answer number. Summary and note completion across the Reading library use separate numbered cards and one inline input per question. Matching summaries also retain separate numbered rows. Repeated instructions, inactive `[...]` placeholders and copied flow-chart steps are removed from individual prompts. Paper 29 questions 33–36 now provide the missing A–F sentence endings as selectable options. Paper 23 question 11 follows its TRUE/FALSE/NOT GIVEN instruction group consistently.

Choice labels are removed only when an actual label is present. Unlabelled choices retain their first letter, and numeric answers in review retain their first word. Space-separated A–D sentence-ending labels also store only their option letter. Papers 23–30 resolve through the shared review catalog. Saved Reading review uses current catalog prompts with the original answer IDs and re-evaluates the answers.

Roadmap full tests now number answer slots consecutively across passages and update question ranges in instructions. The original passage/day tests remain unchanged. Roadmap full test 10 deliberately retains all 41 questions from its three source practice passages, as already advertised by the catalog; no source question was deleted to force a 40-question count. Mock aliases now count multi-slot questions correctly.

Reading completion grading compares complete normalized answers, accepts the listed alternatives, and enforces inherited word limits. A shared first word does not make two different answers equivalent. Multi-selection Reading questions award one mark for each correct choice without subtracting a mark for another incorrect choice. Existing Listening grading behavior is retained.

Paper 25 Q8/Q11/Q24/Q25 and paper 26 Q7 had source answer alternatives that exceeded the word limit or repeated a supplied article. Paper 26 Q12 additionally accepted the misspelling `gound`. Original source keys remain in the integrity fixture; documented `acceptedAnswerCorrections` records the valid alternatives separately. Day 30's silicon-cell summary now supplies “multi-crystalline” before the blank, allowing “silicon cell” within its three-word limit.

Verification:

- `npm run validate:reading`: passage presence and encoding; every prompt, answer ID and numbered slot; available choices; exactly one blank per completion; every accepted answer alternative; full-key and unanswered scoring; review resolution; partial-answer rejection and word limits.
- `npm run test:reading-ui`: 132 distinct passage layouts including generated numbering and cloned questions; 1,683 saved question cards; full passage and choice text; one inline answer bound to each completion; practice/simulation persistence and saved-attempt review; sentence-ending selection.
- `node scripts/validate-ielts-full-mocks-23-30.mjs`: recorded source keys and all eight three-passage papers, with documented answer corrections; existing Listening source/audio checks also pass.
- `npm run build`: application validators, TypeScript and production bundle.

This audit verifies the repository's content, recorded source keys and application behavior. It does not assert independent linguistic/source certification of every passage: the referenced external practice pages could not be opened through the web reader during this audit.
