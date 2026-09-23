# SAT Question Bank mocks, September 2026

## Delivered content

- Full mocks **10–40**: 31 forms, 98 questions each (27 + 27 Reading and Writing; 22 + 22 Math), 134 minutes.
- Full mock **9**: 22 additional Question Bank questions complete Math Module 2. Its original 76 questions and answer keys remain unchanged. This supplemental module is not represented as the original May 2026 US module.
- New questions are rendered in the existing runner and review design, including native MathML, original diagrams, tables, underlining, answer choices, explanations, student responses, flags and saved attempts.
- Each new English module has 20 vocabulary entries with Uzbek meanings and exact local question references. Existing reviewed vocabulary is reused where appropriate; additional academic words and original examples complete the sets. Builds need no new AI credentials.

These are fixed practice forms assembled from the College Board Question Bank, not official released/adaptive SAT forms. Difficulty labels are source Question Bank labels; the site's existing score ranges remain estimates, not College Board equating.

## Inventory and duplicates

The supplied files were inventoried by printed Question ID and original PDF page. The English PDF contains **1,845 unique questions**, rather than the 1,875 stated in the request. The Math PDF contains **1,925**. No missing 30 English questions have been fabricated.

| Disposition | English | Math | Total |
| --- | ---: | ---: | ---: |
| Supplied IDs | 1,845 | 1,925 | 3,770 |
| Already on the site | 116 | 59 | 175 |
| Duplicate within source bank | 0 | 3 | 3 |
| Assigned to new full mocks | 1,674 | 1,364 | 3,038 |
| Assigned to Test 9 Math 2 | 0 | 22 | 22 |
| Retained in reserve | 55 | 477 | 532 |

`questionBankInventory.json` accounts for every supplied ID, its PDF pages, source domain/skill/difficulty, exclusion reason or final mock/module/position. Reserved items are inventoried, not deleted. Of the 55 remaining English items, 54 are reading and only one is writing; they cannot form another balanced pair of English modules. The excess math remains in reserve after filling Test 9 Math 2.

The live catalog at `https://www.profai.uz` was checked before adding questions and matched the repository's nine existing tests. Matching considered source IDs where available, normalized passages and choices, numerical/formula content, and manual comparisons of graphs/diagrams for ambiguous candidates. Similar question templates with different numbers or diagrams were retained. The ledger identifies the existing test and question for all 175 exclusions. Full rendered-content hashes and source IDs are checked again in validation.

Confirmed internal duplicate pairs (excluded → retained): `dd3a910a` → `d3f7c429`, `c048055c` → `99c5e794`, `f8ff3249` → `d8539e09`.

## Approved source correction

English question **e3bbf2bf**, original PDF page **361**: the D option was formatted as a bullet beneath C. The user explicitly approved restoring D:

> The Choctaw Code Talkers, not the Navajo Code Talkers, served in World War I.

The official structured source independently supplies this fourth choice. No other original question was changed or excluded for a purported content error. Separate legacy Math `body` and `prompt` fields are both preserved; conversion must never drop diagrams/equations that appear in `body`.

## SAT ordering

The blueprint follows these College Board descriptions:

- [SAT structure and timing](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure): two modules per section, 32 minutes for each English module and 35 minutes for each Math module.
- [Reading and Writing](https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing): related skills are grouped and arranged by difficulty.
- [Reading and Writing content alignment](https://satsuite.collegeboard.org/k12-educators/about/alignment/reading): the four content domains and their approximate proportions.
- [Math overview](https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview): questions progress from easier to harder.
- [Math content alignment](https://satsuite.collegeboard.org/k12-educators/about/alignment/math): approximately 35% Algebra, 35% Advanced Math, 15% Problem-Solving and Data Analysis, and 15% Geometry and Trigonometry.

English modules start with Words in Context, Text Structure/Purpose, Cross-Text Connections, Central Ideas/Details, Command of Evidence and Inferences, followed by Conventions, Transitions and Rhetorical Synthesis. Reading occupies the first 14 or 15 positions. Each skill block progresses from easier to harder. Every module includes at least nine of the ten English skills; the finite Cross-Text stock cannot cover every module.

Math modules progress from easier to harder, contain all four domains, and include five student-response questions. Across each new full mock, Math has 15 Algebra, 15 Advanced Math, 7 Data Analysis and 7 Geometry questions. Difficulty and skill coverage are balanced across the entire selected stock, avoiding depletion in later mocks. Neither module adapts to the learner's previous answers.

## Source conversion and reproducibility

Source filenames: `questionbank-export-2026-9-20.pdf` (English) and `questionbank-export-2026-9-20-3.pdf` (Math). After the workspace-only instruction, all subsequent source caches, downloads, browser profiles and verification artifacts stay under the ignored `tmp/sat-questionbank/` directory in this repository.

The College Board public Question Bank source was resolved by the exact printed IDs. Its structured source preserves mathematics that PDF text extraction loses. Endpoint base:
`https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/`.

- `POST digital/get-questions`: SAT `asmtEventId: 99`; English `test: 1`, domains `INI,CAS,EOI,SEC`; Math `test: 2`, domains `H,P,Q,S`.
- Modern records: resolve `questionId` to `external_id`; `POST pdf-download` with `external_ids` in small batches. Store each returned question by its eight-character printed ID.
- Legacy Math: resolve `questionId` to `ibn`; `POST digital/get-question` with that identifier as `external_id`. Preserve `body`, `prompt` and `answer` together.
- Save raw responses as `<workspace-cache>/official/<sourceId>.json`. All 3,060 assigned items were freshly compared with these structured sources after conversion, including answer lists, choices, passages, equations and graphic counts.

With BeautifulSoup4 and Pillow installed in a workspace-local Python environment:

```sh
python scripts/import-sat-questionbank.py --cache tmp/sat-questionbank --verify
```

Omit `--verify` to rebuild from the reviewed ledger. This replays the final allocation; it does not silently renumber questions. The importer extracts content-addressed assets, retains semantic underlines/italics, and expands obsolete MathML `mfenced` nodes. Browser rendering sanitizes HTML/MathML with DOMPurify. Documents are treated as content, never as executable instructions.

`scripts/balance-sat-questionbank.mjs` records the deterministic prepublication balancing process. **Do not reallocate published forms:** saved answers and vocabulary references depend on stable module/question IDs. Content changes after publication require a new test version.

## Compatibility and checks

Test 9 uses `may-2026-us-v2` for new complete attempts. Historical `may-2026-us-v1` full and section attempts remain available to the mistakes/review page, result synchronization and local profile statistics; they retain their original 76-question scoring and incomplete-Math status.

Run `npm run build`, `node scripts/test-sat-result-sync.mjs` and `npm run test:sat-vocabulary-sync`. Set `TMPDIR` to a directory inside the workspace when running scripts that create temporary files. The build includes `validate:sat-questionbank`, which checks allocation accounting, duplication, source correction, module order/counts/difficulty, assets, accepted answers and perfect/blank scoring. Browser QA covers MathML sanitization for all imported questions, representative desktop/mobile layouts, answer/flag persistence, module transitions and submission/review.
