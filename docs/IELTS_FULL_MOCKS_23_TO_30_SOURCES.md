# IELTS Full Mocks 23–30: source and integrity record

Each new Listening paper retains its source's four parts, 40 numbered questions, answer key and four paired recordings. Each new Academic Reading paper retains three passages and 40 answer slots. The existing Writing papers 23–30 and the Speaking sets 23–30 complete the four-section mocks. Full Mock 21 uses the previously existing Listening 21 and Reading 21; Full Mock 22 uses the previously existing Reading 22 and [Listening 22](LISTENING_FULL_TEST_22_SOURCE.md).

| Full Mock | Listening source | Reading source |
| --- | --- | --- |
| 23 | [MKL003, Riverdale Pre-school](https://murodkamilov.uz/listening/mkl003/) | [Practice 78, Discovering Purple](https://murodkamilov.uz/reading/practice78/) |
| 24 | [MKL005, New Guinea](https://murodkamilov.uz/listening/mkl005/) | [Practice 79, Tunnelling under the Thames](https://murodkamilov.uz/reading/practice79/) |
| 25 | [MKL007, Rented Property](https://murodkamilov.uz/listening/mkl007/) | [Practice 81, Radiocarbon Dating](https://murodkamilov.uz/reading/practice81/) |
| 26 | [MKL008, Washing Machine Warranty](https://murodkamilov.uz/listening/mkl008/) | [Practice 82, Walking With Dinosaurs](https://murodkamilov.uz/reading/practice82/) |
| 27 | [MKL009, Sports Photography Course](https://murodkamilov.uz/listening/mkl009/) | [Practice 83, The history of the bar code](https://murodkamilov.uz/reading/practice83/) |
| 28 | [MKL010, Fridge Repair](https://murodkamilov.uz/listening/mkl010/) | [Practice 84, Traditional Farming in Zambia's Luapula Province](https://murodkamilov.uz/reading/practice84/) |
| 29 | [MKL011, Medical Consultation](https://murodkamilov.uz/listening/mkl011/) | [Practice 85, Antarctic Exploration](https://murodkamilov.uz/reading/practice85/) |
| 30 | [MKL012, Travel Insurance](https://murodkamilov.uz/listening/mkl012/) | [Practice 86, The development of the bicycle](https://murodkamilov.uz/reading/practice86/) |

Before import, the four-part Listening titles and the Reading passage titles and opening text were compared with the live repository catalog and source files. These 16 source tests were not present. None of the eight Listening source papers contains a map, diagram or other image question. There is therefore no image asset to reproduce for these papers. The source questions are third-party practice papers; their status as actual administered IELTS questions is not independently established. Their four-part Listening, three-passage Academic Reading and 40-question structures follow the [official IELTS Academic format](https://www.ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test).

The independent source answer keys and SHA-256 digests for the 32 audio files are recorded in [`scripts/fixtures/ielts-full-mocks-23-30-integrity.json`](../scripts/fixtures/ielts-full-mocks-23-30-integrity.json). Run `node scripts/validate-ielts-full-mocks-23-30.mjs` to check every key, all 40 visible question controls per Listening paper, the application's 40/40 scoring, every audio checksum and the Reading passage/choice structure. The final MKL003 track had about eight minutes of transfer silence after the questions; that silent tail was removed so the Listening runner's existing 20-second final-track submission begins after the actual recording ends. No spoken question audio was removed.

Practice 78 has one source-page control that says “YES/NO/NOT GIVEN” inside a TRUE/FALSE/NOT GIVEN instruction group. That item is displayed consistently with the instruction as TRUE/FALSE/NOT GIVEN; its answer is NOT GIVEN in both forms. Other source question wording and answer keys are retained.
