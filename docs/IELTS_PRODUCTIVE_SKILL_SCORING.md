# Speaking and Writing practice assessment

Verified against IELTS.org on 11 October 2026:

- [Scoring and criterion weights](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [Writing band descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf)
- [Writing key assessment criteria](https://ielts.org/cdn/Guides/ielts-writing-key-assessment-criteria.pdf)
- [Academic Writing format and Task 2 weighting](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing)
- [Speaking band descriptors](https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf)
- [Speaking key assessment criteria](https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf)

Writing assesses Task Achievement (Task 1) or Task Response (Task 2), Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Each task has four equally weighted criteria. Full-test results weight Task 2 twice as heavily as Task 1, retaining the criterion averages before rounding the final practice band to the nearest half band. A missing task retains its zero contribution. Feedback explains each criterion using the original answer. Task 1 evaluation receives the displayed source data, including the daily shop chart.

Speaking assesses Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation equally. Full mocks send every available answer recording, preserving candidate indices; the backend retains the aggregate upload limit. Daily practice receives one assessment of all answers at completion instead of averaging independent answer scores. Short identification answers do not impose a word-count ceiling. Text practice excludes pronunciation from its three-criterion estimate and explicitly identifies the evidence limitation.

The public descriptors are paraphrased in `backend/src/services/ieltsAssessmentPolicy.ts`. They distinguish adjacent performance levels and permit high bands with the occasional errors allowed by those levels. No population-average assumption, fixed pace target, arbitrary Speaking word-count cap, or statistics-based fallback determines a band. Writing retains the descriptors' explicit rule for attempts of 20 words or fewer; longer underlength work is assessed against the demonstrated criteria.

Provider outages and missing recordings produce an unassessed result with a retry, not a substitute performance score. Full mocks remain incomplete until audio assessment succeeds. Saved daily results and Writing analyses retain the feedback for review. Existing saved scores are not silently changed.

These are AI practice estimates aligned to published criteria. Certified IELTS examiners award official examination results; deterministic regression tests verify evidence handling and score arithmetic, not equivalence to an examiner's judgment.

Validation:

```powershell
npm --prefix backend run build
node --test backend/scripts/ielts-assessment.test.mjs backend/scripts/writing-assessment.test.mjs
node --test --test-name-pattern="audio grades" backend/scripts/assistant-coach.test.mjs
node scripts/test-listening-parts-ui.mjs scripts/tests/ielts-assessment-ui.tsx
npm run test:ielts-review
npm run test:speaking-ui
npm run test:ai-coach-ui
```
