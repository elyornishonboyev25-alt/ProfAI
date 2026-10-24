# IELTS workspace checks

The refinements apply to the shared Reading and Listening interface, including practice, full mocks and saved attempts. Existing test content, answer keys, original SVG diagrams, Writing/Speaking timing and account access rules are preserved.

| Request | Implemented behavior |
| --- | --- |
| 1. Start a separate part | A catalog part opens Test Setup; the learner selects Practice/Simulation and applicable timing before starting. Reload resumes the existing attempt. |
| 2. Compact selection menu | Highlight, Note and optional Ask AI appear in a compact toolbar constrained to the viewport. |
| 3. Remove highlights | Clicking a mark exposes Remove highlight; removal preserves text and independently stored notes. |
| 4. Disable Ask AI | Setup and display settings provide an account-scoped preference retained on reload. |
| 5. Matching questions | Compact, keyboard-accessible native selects, consistent question rows and bookmark controls. |
| 6. Completion questions | Numbered rows, labelled inputs, consistent spacing, restrained borders and legible instructions. |
| 7. Divider | A subtle divider supports pointer dragging, arrow keys, bounds and reset. Dragging does not rerender the paper on each pointer event. |
| 8. Scrolling | Independent contained panes, thin scrollbars and debounced viewport persistence. Sticky question headings cover the scrolled content cleanly. |
| 9. Navigation motion | The active question is static; answer-field focus updates the active number. |
| 10. Timer appearance | Compact tabular digits and a small clock control. |
| 11. Hide time | The clock hides/reveals digits while the same mounted timer and original deadline keep running. The mandatory Listening answer-review countdown remains visible. |
| 12. Return to the tab | A valid lease stays visible while verification runs. An expired lease retains the mounted attempt while access is rechecked; answers and audio position are retained. |
| 13. Loading consistency | Plain HTML boot, route/session loaders, IELTS catalog, test loading, billing checks, test launch and score preparation use the same restrained logo/spinner treatment. |
| 14. Account verification | Transient verification failures retry. Shared token refresh has a 10-second timeout, preserves credentials on temporary failure, and permits the next request to recover. Confirmed invalid sessions and device conflicts remain enforced. |
| 15. Responsiveness | The immutable paper is saved once per attempt rather than per keystroke; session writes are batched and flushed on blur, suspension, exit or reload. |
| 16. Catalog coverage | Shared components cover the full Reading/Listening catalogs; audits exercise saved reviews as well as new attempts. |
| 17. Consistent design | Shared surfaces, borders, controls and typography; desktop and phone layouts retain reachable controls and readable panes. |
| 18. Integration and verification | Current remote changes are merged without replacing their branding, result recovery or account sync fixes. Checks below cover the integrated result. |

## Regression checks

- `npm run build`: content validation, translations, TypeScript, production assets and PWA generation.
- `npm run test:account-usage`: cross-tab token handling, refresh timeout/recovery, tab suspension, expired leases, account conflicts, retained input identity and retry.
- `npm run test:ielts-workspace` and `npm run test:ielts-workspace-browser`: setup, timing, preferences, native matching, reload, highlights, typing and 1366/390/320px layouts.
- `npm run test:reading-ui`: 132 passage layouts, 1,683 saved question cards, answer persistence and review.
- `node scripts/test-listening-bank-browser.mjs --skip-audio`: all 30 tests, four parts, desktop/mobile views, anchors, controls, diagrams, field spacing and stored answers. Audio source files are unchanged; playback completion is covered separately.
- `npm run test:full-mocks`: all 30 mock routes, transitions, reload, continuous/playlist audio, final-track-only 120-second review and single submission.
- `npm run test:result-resilience`, `npm run test:active-test-persistence`, `npm run test:billing-ui` and `npm run test:web-server`: storage failures, concurrent sync, saved results, access gates, media delivery and production routing.

Live public web/backend health and auth-configuration requests are checked without using private credentials. Authenticated failure, recovery and account-isolation scenarios use controlled regression fixtures; this does not imply a private live account was signed into. Synthetic UI fixtures are not added to the IELTS catalog.
