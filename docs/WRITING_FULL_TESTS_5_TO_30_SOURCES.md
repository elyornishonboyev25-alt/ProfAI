# Writing Full Tests 5–30: Task 1 visuals

Full Tests 5–17 use the 13 Task 1 visuals supplied by the user, in order. The image files in `public/images/ielts-writing/full-writing-test-*-source.*` are unchanged copies from the source pages below. `WritingTaskImage.tsx` trims repeated question headings and covers the red IELTS Liz logo in the displayed view only, including review views; chart data and labels stay visible. The prompt and AI evaluation context for each visual are in `src/data/writingFullTestSourceVisuals.ts`. Task 2 replacements and their official sources are documented in [WRITING_TASK_2_OFFICIAL_SOURCES.md](./WRITING_TASK_2_OFFICIAL_SOURCES.md).

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

On 2026-10-06, Full Tests 18–20 received native inline SVG drawings of the three supplied screenshots. Their geometry, labels, units, legends, bar heights and process branches follow the source chart areas; question headings use the existing site typography. The drawings do not load or decode raster images. Metadata and evaluation context are in `src/data/writingSuppliedTaskVisuals.ts`; drawings are in `src/components/writing/SuppliedWritingTaskDiagrams.tsx`. Approximate chart values in the evaluation context allow reasonable estimates because the originals do not print values on the bars.

The fourth supplied screenshot (further education in Britain) already exists in Full Test 3. Full Test 21 retains its current Task 1 pending a different question, as required by the duplicate rule in AGENTS.md.

Full Tests 21–30 retain original IELTS-style practice SVG images authored for this project. Their numbers and place names are illustrative. Their prompts and evaluation context are in `src/data/writingFullTestPracticeVisuals.ts`; run `node scripts/generate-writing-practice-images.mjs` to regenerate these 10 SVGs. The replaced practice definitions and assets for 18–20 have been removed.

| Test | Image type | Topic |
| --- | --- | --- |
| 18 | Grouped bar chart (supplied native SVG) | Adults participating in major sports, 1997 and 2017 |
| 19 | Grouped bar chart (supplied native SVG) | Children's school travel, 1990 and 2010 |
| 20 | Process (supplied native SVG) | Brick Manufacturing |
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

`npm run validate:writing` checks native diagram assignments, the remaining 23 Task 1 image paths, source image signatures, practice SVG specifications, all 30 Task 2 prompts for duplicates, and the 21 official Task 2 source records. New saved Writing attempts include the task snapshot so Analyze/review retains their question and diagram after future catalog changes. Older entries without snapshots fall back to the catalog. The [IELTS Academic Writing format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing) requires a report of at least 150 words. AI band scores are estimates, not official IELTS results.
