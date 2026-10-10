# Owner account activity

The owner dashboard opens on account activity. Account rows show all observed browser profiles, current online profiles and the last heartbeat. Expand a row to inspect each device. History records successful password, email-code, Google and registration sign-ins. Search, date filters and pagination are available; data refreshes every 30 seconds while the page is visible.

## Deployment

Deploy frontend and backend together. Apply `20261010120000_owner_account_activity` using the existing `prisma migrate deploy` startup workflow before serving the new backend. No historical data is backfilled: refresh tokens cannot reliably identify past devices or distinguish sign-ins from token rotations.

## Counting rules

- A device is a browser profile identified by a UUID in local storage, shared across tabs and retained after sign-out. It is a counting hint, never an authentication credential. Browser changes, private mode, cleared storage and clients without stable identifiers can affect counts. It cannot determine how many people share an account.
- Counts are per account and cover all tracked history. Global tracked devices count account/profile pairs. A browser used for two accounts appears once under each account.
- Online means a non-ended, non-expired session with a heartbeat within two minutes. Heartbeats run every 30 seconds while a signed-in page is visible. Closed or hidden pages age out automatically. Logout ends the relevant session; password reset ends all sessions.
- Refresh-token rotation reuses its existing session. It never adds a sign-in event. Sessions created for already signed-in users are marked `RESTORED`; their timestamp is when tracking began, not their original sign-in, and they are excluded from sign-in metrics.
- History and device details require both authentication and the existing owner email allowlist on the server. Responses use `Cache-Control: no-store`. Tokens, token hashes and raw user agents are never returned. Account deletion cascades through activity records.
- Activity times are displayed in Asia/Tashkent (UTC+5). History periods use rolling 24-hour windows; account counts remain all-time.

## Verification

Run the backend build, then `node --test backend/scripts/auth-email.test.mjs backend/scripts/auth-activity.test.mjs`. These use isolated database doubles to exercise owner authorization, filtering, safe query parameters, legacy adoption, successful login tracking, rotation, failed logins, heartbeat, logout and password reset. Run `node scripts/test-auth-session.mjs` for multi-tab refresh and device identity regressions, and `node scripts/test-listening-parts-ui.mjs scripts/tests/owner-activity-ui.tsx` for asynchronous tab transitions and device expansion. Also run the frontend build and desktop/mobile browser checks.
