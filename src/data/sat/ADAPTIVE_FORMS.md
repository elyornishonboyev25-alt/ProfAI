# Adaptive practice forms — 2 November 2026

All 40 newly started full mocks and section practices use `adaptive-2026-11-02-v1-*`.
Every form follows the same blueprint, using the existing reviewed College Board
Question Bank source questions without rewriting their text, keys or visuals.

| Module | Easy | Medium | Hard | Questions | Minutes |
| --- | ---: | ---: | ---: | ---: | ---: |
| R&W 1 | 8 | 13 | 6 | 27 | 32 |
| R&W 2 lower | 14 | 10 | 3 | 27 | 32 |
| R&W 2 higher | 3 | 10 | 14 | 27 | 32 |
| Math 1 | 6 | 11 | 5 | 22 | 35 |
| Math 2 lower | 12 | 8 | 2 | 22 | 35 |
| Math 2 higher | 2 | 8 | 12 | 22 | 35 |

Each corresponding module/branch has identical domain and response-format
counts across all mocks; English also has identical skill counts. Every Math
module contains five student-response questions. A delivered full test has 98
questions and 134 working minutes, with the existing ten-minute exam break.

Each form has 147 distinct questions across its routing modules and alternative
branches: there are no duplicates even between the alternatives. With a finite
reviewed bank, questions occur in different forms (at most four times). These
are parallel practice forms, not 40 mutually disjoint released examinations.
`adaptiveForms.v1.json` is the frozen curriculum manifest. The allocator is an
authoring tool, never a build/runtime step. Future reallocations require a new
manifest and test ID, retaining every published version for review/resume.

## Routing and estimates

The second English module takes the higher branch at 18/27 first-module answers
correct; Math uses 14/22, independently of English. Both practice and exam modes
route when a module is finished, including after its timer expires. The chosen
route is stored in the attempt, and the original complete paper snapshot is
retained so a reload neither reselects nor loses a branch.

These are our practice thresholds, not College Board's proprietary routing.
The versioned practice score estimate uses category difficulty values (-1.25,
0, 1.25) in a Rasch estimate, maps ability to a 200–800 scale, returns a ±30
range within scale bounds, and caps the lower route at 650. All questions count;
there are no simulated unscored items. The UI labels scores as estimates.
This balances source categories; it is not empirical item calibration or
official SAT equating. The historical fixed forms keep their original scoring
tables, unchanged.

## Existing attempts and results

All original forms, including both September Question Bank allocations and
both Test 9 versions, remain in `getSATReviewTests()` under their original IDs.
The start page and runner resolve saved active attempts before using the new
catalog; resume links carry `testId` to distinguish simultaneous versions.
Old answers, annotations, timings, history IDs and result synchronization keys
are not migrated or replaced. Old snapshots are used when present; otherwise
the exact historical catalog is available as a fallback. A fresh start uses
the latest form; replacing a draft still requires the existing user action.
Analyze, question-bank mistakes and result sync resolve the delivered branch.
The question bank retains the complete historical source inventory, including
questions not selected for new adaptive forms. Existing vocabulary definitions
and examples are reused with corrected current question references, offline.

Validation: `npm run test:sat-adaptive`, the historical source/answer validators,
resume, section-break, result-sync, catalog and explanation regression suites.
The adaptive blueprint validator also runs in `npm run build`.

Structure reference: https://satsuite.collegeboard.org/sat/whats-on-the-test/structure
Adaptive design reference: https://satsuite.collegeboard.org/scores/what-scores-mean/how-scores-calculated
