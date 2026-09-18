# Digital SAT Practice Test 8 — June 2026 US, Version 1

Imported and reviewed on 2026-09-17 from the two user-supplied PDFs and
the four-column answer-key screenshot. This is a practice reconstruction;
the source's date and version are its labels, not independently authenticated
College Board provenance.

## Sources

| File | SHA-256 |
| --- | --- |
| June 2026 US v.1 (English No Answers).pdf | `0f156606dc85dd3693a496759dc1696ce469a4c804c00c21d837adb78adffb18` |
| June 2026 US v.1 (Math No Answers).pdf | `7f4d25ba582a2523f155a074a32333e9992f98df43c375a7b48657968168552a` |
| Screenshot 2026-09-17 at 20.59.10.png | `e61bdc0949a30fd7d933183caacd5b88ca87e62331f42a2f8559a30e860c3eb1` |

`june2026UsQuestions.json` contains the reviewed text, choices, explanations,
per-question difficulty/domain/skill, source-page mapping, and answer key.
The original-paper assets preserve the source pages, including their defects;
the default text view contains the corrections below. The PDFs, temporary OCR
files, and answer screenshot are not bundled with the site.

## Duplicate review

Compared with all 708 source-bank questions across Tests 1–7 and checked the
live site's catalog. Related passages include R&W 2 Q1 versus Test 4 R&W 2 Q3,
R&W 2 Q15 versus Test 7 R&W 1 Q11, and R&W 1 Q24–25 versus earlier synthesis
questions. They differ in details, task, or answer choices. The user explicitly
approved proceeding with these similarities on 2026-09-17. Earlier tests were
not edited.

## Source repairs

- **R&W 1 Q26–27:** PDF page 28 is numbered 27 (Turing Award); page 29 is
  numbered 26 (refrigerants). Restored question-number order. Q26 = A; Q27 = C.
- **Math 1 Q2:** Combined pages 5–6, which split choices A/B and C/D.
- **Math 1 Q19:** Combined the scatterplot on page 23 with the question and
  choices on page 24. Five of nine points lie above the line; answer C.
- **Math 1 Q18:** The PDF has the dot plots and statements but no choices.
  Editorially reconstructed the four exhaustive alternatives: A = I and II,
  B = I only, C = II only, D = neither. Both medians are 7; B is more dispersed.
  This preserves the supplied key B; the omitted original choice order cannot
  be recovered from the PDF.
- **R&W 2 Q27:** The PDF ends with choices A–C; D is absent. Added an editorial
  distractor that lists facts without explaining the navigational advantage.
  Original A–C and the supplied correct answer C are preserved. Marked the
  feet conversion and latitude correspondence as approximate.
- **Math 2 Q12:** Restored the introductory context defining data set A as the
  plotted puppy age/weight measurements. The PDF begins with “weighed again”
  without introducing those variables. The graph and key A are unchanged.
- Restored the three underlined spans (R&W 1 Q4/Q9 and R&W 2 Q6), blanks,
  paragraph/poem breaks, and math notation. Corrected transcription spelling
  and diacritics, including *cryptanalysis*, Pūnana, Pötzelsberger, and Quiñones.
- **R&W 1 Q4:** Corrected the distractor's “forest likely merged” to “forest
  likely emerged.” It remains incorrect because the passage offers no
  competing accounts of the forest's emergence.
- **R&W 1 Q7:** Changed a time-sensitive “currently works” description to past
  tense, preserving the point about women's contributions to cryptology.
- **R&W 2 Q7:** Corrected the author initials from T. L. to T. E. Hulme and
  joined “mid night” as “midnight.” See the poem attribution in
  [Above the Dock](https://poemanalysis.com/thomas-ernest-hulme/above-the-dock/).
- **R&W 2 Q19:** Replaced the inaccurate claim that the EU formed in 1992
  with the signing of the Maastricht Treaty in 1992 and the proposed EU.
  The treaty entered into force in 1993; see the
  [Council of the EU chronology](https://www.consilium.europa.eu/media/37046/20181120-maastricht-treaty-exhibit_forapproval-bib.pdf).
  The tested sentence structure and answer D are unchanged.

## Answer and difficulty review

All 98 answers match the supplied screenshot after ordering by printed question
number. Each question has a content-specific rationale: English answers were
checked against the passage/grammar task, and math answers were worked through
algebraically or against their graph/table. No supplied correct answer needed
changing. Reconstructed distractors are identified above rather than presented
as recovered source text.

Difficulty is an editorial estimate of reasoning demand, not a statistically
calibrated SAT item parameter. It is assigned to each question individually:

| Module | Foundation | Medium | Advanced |
| --- | ---: | ---: | ---: |
| R&W 1 | 17 | 8 | 2 |
| R&W 2 | 7 | 9 | 11 |
| Math 1 | 11 | 11 | 0 |
| Math 2 | 9 | 8 | 5 |
| Total | 44 | 36 | 18 |

Overall label: **Medium**. R&W 2 has dense scientific inferences and complex
sentence boundaries; Math 2 adds quadratic modeling, completing the square,
parallel-line angle algebra, a circle tangent, and a discriminant condition.
The remainder is predominantly direct or moderately layered work. Standard
module lengths are 27/27/22/22 questions and 32/32/35/35 minutes.

Run `npm run validate:sat-test8` for source-key, numbering, content-shape,
visual-reference, and numeric-solution checks. `npm run validate:sat-assets`
checks image existence and file signatures. Both run in the production build.
