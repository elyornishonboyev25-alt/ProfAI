# Reading review source evidence

Reading Answer Sheet cards open the original question and passage in the shared
review interface. This also applies to full-mock review and saved attempts.
Showing/hiding correct answers also shows/hides evidence. The last selected
question is retained for that review route on reload.

Exact source quotes are stored by stable question ID in
`src/data/readingAnswerEvidence.ts`; a question can also supply `answerEvidence`
with a paragraph label and an individual answer index for grouped blanks.
Quotes must match the passage. Matching uses original character offsets and
never inserts an answer or explanation into the passage. Existing paragraph
locations provide explicitly labelled contextual evidence for paraphrases and
headings. NOT GIVEN and unmentioned options have no invented answer sentence.

Test 28 passage 1 is restored from the full text supplied by the user on
2026-10-11. The body contains 10 paragraphs and 904 words. Only line endings
and outer whitespace were normalized; the wording and punctuation are retained.
Its SHA-256 is `a206bba0b1ff1b31340501626b2de5c6d512eb43ac85267ee0612b420f8405e0`.
Questions 4-9 now have exact evidence in the restored paragraphs. Question 12
also has evidence and is FALSE: chickens and goats are not part of the standard
diet. Its earlier NOT GIVEN key relied on the incomplete source.

The user authorized correcting the source conflicts. Results now recomputes
analysis from the current catalog and the original submitted answers, including
saved attempts and full mocks. When the correct-answer total changes, the
displayed and locally saved band and totals are updated as well. Saved full-mock
Reading scores and overall bands also use the corrected keys. Completed
backend attempts and an active test's saved paper are not rewritten.

| Question | Obsolete key | Corrected key | Source evidence |
| --- | --- | --- | --- |
| Test 25, Q39 | D | A | A story told in an unintelligible language is neither shocking nor obscene; it would not even be a story. |
| Test 25, Q40 | C | D | The dollar bill's meaning depends on a collective agreement; without that agreement it becomes scrap paper. |
| Test 28, Q4 | garden | series of ridges | Verified against the complete external source and its answer list. |
| Test 28, Q5 | homesteads / the homestead | houses | Verified against the complete external source and its answer list. |
| Test 28, Q6 | B | A | The source describes fishing as more profitable than growing crops. |
| Test 28, Q12 | NOT GIVEN | FALSE | The supplied passage explicitly excludes chickens and goats from the standard diet. |
| Test 28, Q19 | B | F | Paragraph F describes the different rising/falling crying contours of French and German babies. |

External verification for Test 28 Q4-6:
[Traditional Farming in Zambia's Luapula Province, complete passage and answers](https://www.ieltsreading.info/blog/traditional-farming-in-zambia-s-luapula-province-answers-with-location).
The missing text is restored from the user's attachment rather than composed
from answer keys or explanations. The historic key-conflict guard remains for
callers passing obsolete snapshots directly; corrected catalog questions no
longer show conflict notices.

Coverage of the 30 full Reading tests (1,155 question objects, including grouped
questions): 492 use exact source words, 573 use the existing source paragraph as
context, 88 are NOT GIVEN and two ask about information that is not mentioned.
There are no unavailable evidence locations or known key conflicts in this
catalog. Paragraph-context highlighting is explicitly labelled; it does not
claim that a single sentence has been manually verified for every question.

Checks:

```
node scripts/test-listening-parts-ui.mjs scripts/tests/reading-evidence-ui.tsx
node scripts/test-reading-evidence-browser.mjs
node scripts/test-reading-ui.mjs
node scripts/validate-reading-bank.mjs
```

The evidence suite checks every catalog question, every curated quotation,
normalization offsets, grouped numbers, wrong submitted answers, hidden answers,
saved/reloaded reviews and full-mock review. It also verifies all seven corrected
keys earn marks, obsolete keys do not, and saved Answer Sheets and bands refresh
from stale snapshots. Restored Q4-9 and Q12 are exercised in full-mock review,
including numbered highlights and preservation of the entire supplied passage.
Browser checks use the actual
styles at desktop and two phone widths. Screenshots are written under ignored
`tmp/reading-evidence-browser` and must not be committed.
