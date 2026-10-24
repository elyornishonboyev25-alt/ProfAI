# IELTS attempt recovery and exit protection

Running Reading/Listening, single/full Writing, daily Speaking and examiner sessions retain account-scoped recovery entries. IELTS Arena and the test library expose Resume links. Full mock URLs include their mock ID so a restored tab does not depend on browser history state.

Leaving an active IELTS runner, or an unfinished full mock overview/instruction page, requires an IELTS confirmation dialog. Cancel retains the mounted workspace and running audio/timer. Confirm preserves the session. Refresh and tab closure use the browser's native confirmation. The history interceptor is installed before BrowserRouter because a late listener can run after the router unmounts the test. Submission and legitimate section transitions bypass exit confirmation.

Writing saves answers and timing in one session record, reads older split drafts, and retains recovery until evaluated results have been saved. Immutable papers are serialized separately from typing. A saved Writing paper remains usable if the current catalog removes its entry. Failed task images offer retry without changing essays or timers.

Speaking retains its selected launch mode and uses a stable test session key, migrating earlier keys. Recorder checkpoints use a captured answer index; writes are ordered so an earlier storage open cannot overwrite the final recording. Suspension/page exit requests a recorder flush. Transient examiner voice requests retry once and retain matching device-voice fallback. Daily assessments are saved in Speaking history; earlier completed daily sessions are recovered before retaking or opening Mistake Lab.

Completed skill cards show green Completed and Retake, including zero-score attempts; partial objective attempts mark their own practiced parts. Completed full mock cards show 4/4 completed and Retake. Mistake Lab lists completed/current and archived full mock results. Retaking preserves the previous four-section report. Reading/Listening and Writing histories no longer discard attempts after 30 entries; the Speaking mirror no longer truncates at 200.

Objective reviews retain the paper version used by the attempt. Paper snapshots are stored once per content version and referenced by compact result/history records. Question feedback is recalculated from that paper and submitted answers. Badge and Speaking mirrors tolerate browser quota errors; account data already retains its independent overflow/sync queue.

## Verification

- `npm run test:ielts-resilience`: confirmed/canceled exits for Reading, Listening, single/full Writing and daily Speaking; native unload protection; atomic drafts; catalog removal; stable examiner session/mode recovery; mock URLs without history state; 35 retained objective attempts; original paper review; zero-score Completed/Retake; archived full mock reports; image retry; delayed audio writes.
- `npm run test:active-test-persistence`: deployment guards, original papers/deadlines, answers, bookmarks, annotations and Writing tasks.
- `npm run test:full-mocks`: all 30 real four-skill routes, intro gates, retakes, failure/retry, session reload, stored reports and Speaking reassessment. Listening starts its visible 120-second countdown only after the final track; reload preserves the original deadline and submits once.
- `npm run test:speaking-ui`: all 30 Speaking mocks, matching examiner voices, interrupted playback, saved recording retry, final chunks, StrictMode resume and browser recording formats.
- `npm run test:result-resilience`, `npm run test:ielts-review`, `npm run test:ielts-workspace`, `npm run test:account-usage`: storage faults, account isolation/sync, legacy Listening papers, result export/recovery and workspace behavior.
- `npm run test:ielts-workspace-browser`: headless Edge at 1366, 390 and 320px; real browser Back, confirmation/cancel, canceled native refresh, accepted reload and resumed answers. `-- --guard-only` runs the exit/refresh scenario alone.
- `npm run build`: translations, content integrity, TypeScript and production/PWA assets. The latest upstream included 14 untranslated referral/Telegram strings; Russian and Uzbek entries were added to unblock this required check.

Browser tests use controlled local fixtures. Microphone, audio-provider and network failure checks use deterministic mocks; they do not claim an authenticated production session or physical-device microphone test. No IELTS catalog content was added or replaced.
