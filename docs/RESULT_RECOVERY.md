# IELTS result recovery

Submission retains the original answers before navigating to Results or clearing the active test session. A compact account backup is stored for each attempt; the latest result can be reopened without router state. Session snapshots and account backups are independent, and restoration selects the newer attempt. Downloads contain the submitted result and answers, without authentication credentials.

Account storage falls back to a separate session store when local storage is full or inaccessible. If both browser stores are unavailable, the current tab retains its answers and upload queue in memory. Successful server acknowledgements clear only the exact mutation sent; newer edits and offline mutations remain pending. Account changes, deletion and request cancellation do not expose or write another account's data.

Account synchronization isolates rejected or oversized records, retains them locally, and continues with independent uploads and downloads. Rejected payloads are backed off; editing a payload allows an immediate retry. Completed answer backups upload first. Sustained test autosaves do not keep postponing the upload deadline. Unmount aborts in-flight requests.

The server treats completed result backups as whole snapshots and retains the newer submission when two devices upload different attempts. Answers from separate submissions are never combined into a synthetic attempt. Other account histories retain their existing concurrent merge behavior.

Rich result and review screens have a separate recovery boundary. If analysis or rendering fails, it shows the submitted score and answers directly, with a JSON download. Normal Results also provides a download. Analysis history avoids repeating question feedback inside both the history row and its nested result.

## Validation

`npm run test:result-resilience` covers quota failures partway through a write, reload, blocked storage, both stores unavailable, account separation/deletion, rejected and oversized uploads, retry, stale responses, continued downloads, continuous autosaves, cancellation, result reopening, old Listening 3 papers, original answer downloads and rich rendering failures. CI runs this suite before the production build. Existing Reading, active-test persistence, full-mock and Listening audio completion suites cover integration and timing.

Browser-wide storage blocking or eviction, closing a tab before any durable write succeeds, and a permanently unavailable backend cannot be guaranteed against. The live tab retains its in-memory result and allows a download even when browser persistence fails. No migration, leaderboard/XP backfill or test timing change is required.
