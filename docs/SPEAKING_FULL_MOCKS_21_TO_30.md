# Speaking Full Mocks 21–30

The ten replacement mocks use the user's supplied topic sheets in this order: Animals, Art, Apps, Books, Buildings, Challenges, Clothes, Confidence, Education, Food. Their content lives in `src/data/ieltsSpeakingBankMocks21to30.ts`; the existing catalog places these sets at indices 30–39, so the public IDs `speaking-full-21` through `speaking-full-30`, saved attempts, and site layout continue to work.

## Selection and duplicate audit

Before replacing the sets, the live bank and catalog were checked. Full Mocks 1–20 each use four Part 1 questions, one Part 2 cue card with four speaking points and one follow-up question, and four Part 3 questions. Mocks 21–30 now use the same counts. The supplied sheets contain more questions and, for several topics, more than one possible cue card; each mock uses one coherent selection from its sheet. Some broad topics already appear in earlier tests, but the selected prompts are distinct. The repository validator checks normalized wording across all Day and Full Mock content and requires a sample answer for each item.

| Mock | Topic | Selected Part 2 card |
| --- | --- | --- |
| 21 | Animals | An interesting animal |
| 22 | Art | A work of art you like |
| 23 | Apps | A useful app |
| 24 | Books | A childhood story you enjoyed |
| 25 | Buildings | A historical building in your country |
| 26 | Challenges | Someone who is adventurous |
| 27 | Clothes | A useful bag you own |
| 28 | Confidence | A person you know who is confident |
| 29 | Education | A subject you enjoyed at school |
| 30 | Food | A foreign food you would like to try |

The [official IELTS Speaking format](https://www.ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking) specifies time and task structure rather than a fixed number of questions: Part 1 is 4–5 minutes, Part 2 includes one minute of preparation and up to two minutes of speaking, and Part 3 is 4–5 minutes. The examiner may ask one or two brief follow-up questions after Part 2. These are practice mocks based on the supplied topic sheets, not claims of past official papers.

Run `npm run validate:speaking` to verify the complete bank before release.
