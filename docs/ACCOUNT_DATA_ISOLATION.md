# Account learning data

Learning history and progress use an account namespace in browser storage and an authenticated `/api/v1/account-data` API. The API derives the owner from the access token, rejects owner fields in the request body, and uses a `(userId, key)` database primary key. Deleting the user cascades to these records. These records are private client learning state; they do not authorize XP or public scores.

The frontend restores the current account before mounting its routes. Local edits are uploaded after a short debounce; reconnect, focus, and periodic refresh retry pending edits. Pending changes survive browser restarts and stay with their original account. Server updates merge changes against the device's previous value, retaining independent history additions and explicit deletions from other devices. A database transaction locks the user row while merging.

Switching accounts remounts the workspace, discards foreign browser-history payloads, and rejects responses and delayed mutations belonging to the previous account. Account dashboards do not include guest histories. Review session caches also include the owner.

Existing records that already contain an explicit owner migrate automatically. Shared legacy SAT slots, full-mock results, vocabulary, notes, and other records without ownership remain in browser storage but are excluded from logged-in accounts. They cannot be assigned safely to a particular user. Existing server records previously uploaded to an incorrect account are not automatically reassigned or deleted.

Deploy frontend and backend together. The backend start script runs `prisma migrate deploy`, which creates `AccountLearningData` using the migration included in this change.

Regression checks:

```sh
node scripts/test-account-data.mjs
node backend/scripts/account-data.test.mjs
node scripts/test-listening-parts-ui.mjs scripts/tests/account-sync-ui.tsx
npm run test:auth-session
node scripts/test-sat-result-sync.mjs
npm run build
npm --prefix backend run build
```
