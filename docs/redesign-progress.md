# ProfAI glass redesign

## Accepted direction
English default; Russian optional and persistent. Four primary destinations: Home,
Preparation, University Applications, My Results. Photoreal study illustrations,
crimson accents, translucent navigation and controls, readable content surfaces.
Preserve all tests, user data, access controls, and supported learning workflows.

## References
- https://developer.apple.com/design/human-interface-guidelines/materials
- https://developer.apple.com/videos/play/wwdc2025/219/
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter

Apple's native material is a reference, not a browser API. Use a progressively
enhanced web material with opaque fallback, reduced motion, and clear contrast.

## Implemented
- Shared material, typography, responsive layout, keyboard focus, reduced effects,
  reduced motion and opaque glass fallback.
- Four primary desktop/mobile destinations; secondary tools in a disclosure menu.
- English default and persistent Russian selection, including Google sign-in locale.
  Shared navigation, primary flows and static interface labels have Russian translations,
  alongside the nested legacy translation catalog.
- New landing, authentication presentation, two-step onboarding and editable focus.
  Detailed study setup remains available at `/study-profile`. Nickname selection is
  contextual to the community rather than blocking initial setup.
- Dashboard prioritizes the next practice, actual weekly activity and recent results.
- IELTS/SAT hubs use photographic study objects, working skill destinations and
  existing mock-test catalogs. Empty score states replace decorative sample scores.
- University discovery has search, filters, saved universities, pagination, campus
  photo attribution and graceful image fallback. The existing matcher is retained.
- Additional practice groups vocabulary, articles, podcasts, shadowing, writing
  and speaking. No test banks or learning material were removed.
- IELTS/SAT catalogs and the article library have searchable, responsive cards.
  SAT section catalogs show 12 tests at a time. Planned IELTS tests are opt-in.
- University profiles separate requirements, costs, sources and optional statistics;
  ranking bands/ties, missing data and campus-photo failures are handled explicitly.
- Account loading failures block editing the unloaded profile and offer retry.
  Cross-device goal editing loads saved targets before allowing changes. Advanced
  setup catches plan-generation failures and saves locally only after the server succeeds.
- Contextual nickname selection uses a keyboard-accessible native dialog with
  cancellable availability checks, network retry and a session-level defer option.
- Integrated upstream main through `5c8e92111`, retaining Listening diagram/audio
  fixes, SAT historical reviews, profile name editing and the 40-test SAT catalog.
- Results prioritize practice history; detailed analytics and achievements expand
  on request. Legacy readers, exam tools, community and Learning Center retain their
  specialized layouts with shared material styling and translated static UI labels.

## Verification — 2026-09-23
- `npm run build`: passed, including TypeScript, content validators, Vite and PWA.
- `npm run lint`: passed across the repository.
- `git diff --check`: passed.
- Production browser checks passed: university search, shortlist add/remove, language
  switching and persistence, reduced effects, failed onboarding save, successful
  retry, SAT request payload, editing focus, dashboard goal and analytics disclosure.
  No runtime exceptions were recorded in that scenario.
- Additional browser checks passed: cross-device goal loading failure/retry,
  preserving a saved SAT target of 1250, account failure/retry protection, SAT
  pagination/search/reset/destination, university statistics disclosure and article
  search; nickname availability, failed-save retry and Escape dismissal.
  No runtime exceptions were recorded, including missing profile scores.
- Reviewed desktop landing/dashboard and phone layouts for landing, IELTS, SAT,
  results, university discovery, login and additional practice. Checked widths of
  320, 390 and 1440 pixels; no horizontal overflow or broken images on sampled pages.
- Production Russian Google button confirmed. Authentication itself was not exercised.

## Boundaries
- Home date regression fixed after a production screenshot exposed it: the API
  sends full ISO timestamps, while the redesigned week labels appended a second
  time component. `node scripts/test-dashboard-dates.mjs` covers server timestamps,
  date-only fallbacks, Russian, four time zones and invalid values. Browser QA now
  includes a successful dashboard response, not only failed-request fallback data.
- Account writes in browser QA were intercepted against an isolated test session;
  no real learner account was modified. Live OAuth, email delivery, payments, voice
  calls and every individual exam were not end-to-end tested by this UI change.
- Exam content, university names, user content and server-generated messages retain
  their original language. Unmapped legacy dynamic labels fall back to English.
- Language/effect preferences and Applications/Explore focus are saved on the device.
  Exam targets use the existing account API. Shortlists keep their existing device storage.
- JavaScript lint parsing now supports the existing top-level-await scripts.
  Build still warns about large content chunks (the expanded SAT catalog is about
  16.5 MB before compression) and stale Browserslist data. Cold-network performance
  of the entire SAT bank has not been optimized by this redesign.
- Local settings, QA files, intermediate images, build output and unrelated SAT
  import work are excluded from the redesign commit. The final transparent study
  sprite is an intentional production source asset.

## Acceptance
No decorative statistics, fabricated admission probabilities, copied sample prices,
or promises of guaranteed outcomes. Source content remains in its original language.
Each completed page must retain working actions and be usable at phone widths.
Document actual validation and remaining limitations; do not imply unperformed checks.
