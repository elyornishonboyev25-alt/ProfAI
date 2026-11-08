# Interface localization audit

The interface uses English source phrases with reviewed Uzbek and Russian translations. This pass connects hardcoded UI and configuration labels to the existing `interface` namespace, including navigation, authentication, profiles, university search, classes, IELTS/SAT workspaces, results, vocabulary, audio controls and confirmation dialogs.

## Translation boundaries

- IELTS, SAT, Listening, Reading, Writing, Speaking, Math and their section names remain recognisable exam terms.
- Original test passages, questions, answer choices, examiner prompts, model answers, diagrams, charts and source-paper instructions remain in their original language. Translating the interface must not change an assessment.
- Learner names, messages, notes, essays, recorded-answer transcripts and other user content are rendered verbatim.
- Numbers and names inside interface sentences are interpolated. Translations preserve the full parameter set; values are not translated as independent user content.
- Existing feature-specific English/Uzbek/Russian copy remains supported. This audit does not claim that every server-generated message, external article or university description has been translated.

## Implementation

`src/i18n/interface-completion.json` holds the reviewed additions. `useCopy` subscribes components to language changes, and `UiText` handles marked labels while preserving rich headings and numeric content. Literal punctuation, including colons and periods, is part of a translation key. Shared dialogs translate their interface labels and retain their existing actions. The legacy translation namespace also preserves exam section names.

The automatic check covers literal translation calls, aliases, conditional labels and `UiText`. It validates nonempty translations, encoding and matching interpolation parameters. Runtime tests verify immediate switching between all three languages, shared dialogs, placeholders, cached interface labels, unchanged learner input, source instruction integrity, language storage and locale selection.

## Validation

```text
npm run check:i18n
npm run test:i18n
npm run build
```

Browser checks use the real shared controls and academic-skills/class pages at desktop and mobile widths. Production deployment and a live production crawl are separate from these local checks.

The existing `test:exam-flow` suite stops at an unrelated SAT URL expectation: it expects `/sat/mock/3/run`, while the adaptive runner includes `?testId=…`. The same failure was reproduced using the pre-task source snapshot. The SAT resume and Listening audio-completion suites pass when run directly; the latter covers the final-audio 120-second review deadline, playlists, playback failures, repeated end events, review and Reading timing.
