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

The 30-test catalog has six questions whose source paragraphs are missing in
the repository's existing passage and its local source `tmp/reading84.html`:
Test 28, passage 1, questions 4–9. These remain visibly unavailable until the
original complete passage is supplied. Do not fabricate the missing prose.

Three existing answer keys conflict with the source. Grading was preserved;
automatic approval review rejected changing these keys within the review task.
These questions show a source conflict instead of an unsupported highlight:

| Question | Existing key | Proposed key | Existing source evidence |
| --- | --- | --- | --- |
| Test 25, Q39 | D | A | A story told in an unintelligible language is neither shocking nor obscene; it would not even be a story. |
| Test 25, Q40 | C | D | The dollar bill's meaning depends on a collective agreement; without that agreement it becomes scrap paper. |
| Test 28, Q19 | B | F | Paragraph F describes the different rising/falling crying contours of French and German babies. |

Checks:

```
node scripts/test-listening-parts-ui.mjs scripts/tests/reading-evidence-ui.tsx
node scripts/test-reading-evidence-browser.mjs
node scripts/test-reading-ui.mjs
```

The evidence suite checks every catalog question, every curated quotation,
normalization offsets, grouped numbers, wrong submitted answers, hidden answers,
saved/reloaded reviews and full-mock review. Browser checks use the actual
styles at desktop and two phone widths. Screenshots are written under ignored
`tmp/reading-evidence-browser` and must not be committed.
