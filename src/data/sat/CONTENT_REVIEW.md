# SAT presentation review — 24 October 2026

All 40 current mocks (3,942 questions) were checked in Chromium at desktop and
phone widths. The browser suite decodes every displayed image and checks answer
alignment, equation systems, and horizontal overflow. Asset validation also
checks the original question images kept for reference.

- Shared answer rendering keeps standalone formulas, prose, source MathML,
  tables, and diagrams aligned beside the answer letter in tests and review.
- SVGs that only define a viewBox now have a definite containing width, avoiding
  a zero-sized image inside nested fit-content containers.
- Test 1 Math 2 question 8 and Test 3 Math 1 question 12 use actual value tables.
- Test 3 Math 1 question 10 no longer refers to an absent, unnecessary figure;
  its text already specifies the corresponding angles and all required values.
- Test 6 equation systems render as MathML tables with a brace.
- Test 7's 44 math stems and 108 choices were transcribed against the existing
  `june-2026-intl/visuals/*-prompt.webp` and `*-choice-*.webp` files. The original
  images remain available as reference assets; they are no longer displayed
  alongside corrupted OCR duplicates. No question IDs or answer keys changed.
- Test 7 Reading and Writing 1 questions 10 and 12, and Math 2 question 15 have
  restored semantic tables transcribed from their original question images.
- Test 7 Math 1 question 15 also accepts the exact fraction 40/9, and Math 2
  question 8 accepts 292/3, alongside their existing decimal keys.
- Test 7 Math 2 question 21's source prints two equivalent correct choices:
  35π/3 and 70π/6. Choice C now uses 7π/6 (the angle without the radius factor)
  so B remains the single correct answer.
- Test 4 Reading and Writing 1 question 16 had identical C and D distractors.
  D now uses `hands between the two antenna's,`, testing the apostrophe in
  `antennas`; the correct plural-only choice B is unchanged.

Run `SAT_TEST_BROWSER=/path/to/chromium npm run test:sat-content-browser` for the
catalog and saved-review checks.
