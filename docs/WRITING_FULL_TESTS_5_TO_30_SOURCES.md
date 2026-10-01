# Writing Full Tests 5–30: Task 1 visuals

Full Tests 5–17 use the 13 Task 1 visuals supplied by the user, in order. The image files in `public/images/ielts-writing/full-writing-test-*-source.*` are unchanged copies from the source pages below. `WritingTaskImage.tsx` trims repeated question headings and covers the red IELTS Liz logo in the displayed view only, including review views; chart data and labels stay visible. The prompt and AI evaluation context for each visual are in `src/data/writingFullTestSourceVisuals.ts`. Task 2 prompts were not changed.

| Test | Task 1 visual | Source page |
| --- | --- | --- |
| 5 | Fish imports to the US: table and three pie charts | [IELTS Liz](https://ieltsliz.com/ielts-table-three-pie-charts-model/) |
| 6 | Rainwater collection and treatment | [IELTS Liz](https://ieltsliz.com/ielts-diagram/) |
| 7 | Nelson in 2000 and today | [9IELTS](https://9ielts.com/changes-in-the-city-of-nelson-in-recent-times) |
| 8 | UK radio and television audiences | [IELTS Liz](https://ieltsliz.com/ielts-line-graph-sample-answer/) |
| 9 | Adults' and children's spending in the UK | [IELTS Liz](https://ieltsliz.com/ielts-table-spending-on-items/) |
| 10 | Ladybird life cycle and anatomy | [IELTS Liz](https://ieltsliz.com/ielts-writing-task-1-life-cycle-diagram/) |
| 11 | Wind energy in four countries | [IELTS Liz](https://ieltsliz.com/ielts-bar-chart-model-answer-2023/) |
| 12 | Meadowside village and Fonton | [IELTS Unlocked](https://ieltsunlocked.wordpress.com/2018/11/22/ielts-task-one-basic-to-band-9-maps-fonton-and-meadowside/) |
| 13 | Arrests by gender and reason | [IELTS Liz](https://ieltsliz.com/ielts-charts-writing-task-1/) |
| 14 | Australian water supply systems | [IELTS Liz](https://ieltsliz.com/ielts-water-supply-diagram-2015/) |
| 15 | Frog life cycle | [IELTS Liz](https://ieltsliz.com/ielts-diagram-introduction-overview-paragraphs/) |
| 16 | Computer ownership by education level | [IELTS Liz](https://ieltsliz.com/ielts-writing-task-1-introduction/) |
| 17 | Boys and girls playing sport | [IELTS Liz](https://ieltsliz.com/bar-chart-sample-answer/) |

The radio and television topic in Full Test 8 also appears in Full Test 4. The user explicitly requested the supplied image in Full Test 8.

Full Tests 18–30 retain the original IELTS-style practice SVG images authored for this project. Their numbers and place names are illustrative. Their prompts and evaluation context are in `src/data/writingFullTestPracticeVisuals.ts`; run `node scripts/generate-writing-practice-images.mjs` to regenerate these 13 SVGs.

| Test | Image type | Topic |
| --- | --- | --- |
| 18 | Process | Recycling used paper |
| 19 | Two pie charts | Village land use |
| 20 | Grouped bar chart | Recycling rates for four materials |
| 21 | Line graph | Rainfall in two cities |
| 22 | Two maps | Changes to a seaside village |
| 23 | Process | Making olive oil |
| 24 | Stacked bar chart | Employment by sector |
| 25 | Line graph | Cinema ticket sales by genre |
| 26 | Two pie charts | Journeys to work |
| 27 | Grouped bar chart | Library books borrowed |
| 28 | Two maps | Changes to a public park |
| 29 | Line graph | Time spent on household chores |
| 30 | Two pie charts | University funding |

`npm run validate:writing` checks all 26 Task 1 image paths, source image signatures and practice SVG specifications. The [IELTS Academic Writing format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing) requires a report of at least 150 words. AI band scores are estimates, not official IELTS results.
