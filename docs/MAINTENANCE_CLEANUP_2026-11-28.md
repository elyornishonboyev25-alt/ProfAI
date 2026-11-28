# Ivygoo maintenance audit — 2026-11-28

The audit covered the live Railway project, production configuration and recent
resource metrics, application startup, frontend imports, the working directory,
registered Git worktrees and the current GitHub main branch. Deletions were
limited to resources with evidence that the live application does not need them.

## Railway findings

Project: Prof AI. Production has three necessary services, each with one replica:

| Service | Purpose | Seven-day average RAM | Seven-day average CPU |
| --- | --- | ---: | ---: |
| valiant-communication | ivygoo.com web server, static content and API proxy | 0.091 GB | 0.00040 vCPU |
| Smart-Test-Pro | API, authentication, saved results, voice and background jobs | 0.346 GB | 0.00365 vCPU |
| Postgres | Persistent account and learning data | 0.136 GB | 0.00076 vCPU |

There were no extra replicas, service cron schedules, buckets or unattached
volumes in this environment. The single 500 MB database volume is mounted on
Postgres; observed disk usage was approximately 0.146 GB. All three services were
online. Older failed API deployments were historical, not extra running replicas.
The web deployment already excludes build dependencies from its runtime image;
the API has a separate runtime allowlist. No production service was deleted or
scaled down.

An automatic Gemini startup probe opened a real provider connection, sent silent
PCM input and requested two generated speech turns on every API startup. Its
only result was a diagnostic log: it did not gate readiness or serve a user
request. This probe and its startup invocation were removed. Authenticated Nova
voice sessions, allowance checks, signaling and the Writing/Telegram workers
remain. Tests still exercise the audio protocol against a local fixture.

Other Railway projects named Tushum-AI, carnavo and daily-system are outside
Ivygoo and were preserved. Actual invoices, backup contents/schedules and the
database warning details could not be audited with this account's available
tools: Railway reported that database tools and Automations were not enabled.
Metric observations are not a billing statement or a guarantee of zero charges.

## Repository cleanup

- Removed the unused `server/` Firebase/Eduverse implementation. Neither the
  active package scripts, deployment configurations nor application imports used
  it. Its local JSON database contained no users, attempts or refresh tokens.
- Removed the unrelated, standalone `daily-planner/` HTML application.
- Removed ten disconnected frontend modules: the old Home, Mock and Tests pages,
  FullReadingTests, CatalogHero, the old AuthContext/ThemeContext, useTheme,
  useLocalStorage and the legacy `services/backend.ts` helper.
- Removed local tracked reference bundles, old TypeScript diagnostic reports and
  the standalone answer-sheet tool. These were already absent from GitHub main.
- Added root ignore rules for QA output, browser captures, temporary worktrees,
  cache files and machine-specific editor/agent settings.

The frontend import audit reconstructed the deleted modules from the original
Git HEAD and resolved static imports, re-exports and literal dynamic imports with
TypeScript. The active entrypoint reached exactly the same 664 modules before
and after removal. None of the ten removed modules was reachable. References
between retired modules were internal to the removed group. Remaining source,
test and documentation searches found no references to their module paths.

The local main history had diverged from GitHub. An isolated branch based on
the latest origin/main was used for the upstream cleanup so unrelated local
commits and unfinished changes were not included.

## Local disk cleanup

The recorded successful removal plan contains 1,570 targets and 120,496 files,
totaling 25,152,012,486 bytes. It includes 28 old generated build directories,
browser caches, QA snapshots, logs and the retired standalone projects.

Ten additional clean worktrees were removed with `git worktree remove` after
checking that their commits were ancestors of origin/main and that they had no
unique ignored files. The removed worktrees were writing-reliability-release,
achievement-push-20261008, ielts-best-band-push, premium-integration,
speaking-zone-push-b9aadf7e8, nova-push-fd2dac092, push-merge-8cf92e94,
unified-exam-flow, durable-streak and railway-deploy-fix.

Nine old interrupted Git temporary files, identified as garbage by Git, released
another 315,376,083 bytes. Git's valid packs, refs and history were retained;
`git count-objects -vH` subsequently reported zero garbage.

Together with the individually measured removed worktrees, these removals
account for at least 35 GB in decimal file sizes. Filesystem allocation savings
can differ. Main development dependencies and the current verified build remain.

Worktrees with uncommitted changes or unique ignored files were preserved.
Recovery exports, original photos/documents, authored assets and environment
files were preserved. Browser cleanup removed cache directories while keeping
Local Storage, IndexedDB, cookies and other persistent profile data. The full
local deletion manifest is in ignored `tmp/cleanup-result.json`.

## Validation

- Full frontend build and IELTS/SAT/article/vocabulary validators passed.
- After retiring the ten modules, TypeScript, translation checks and actual
  retired/active route regression tests passed.
- Web server, release validation and isolated runtime tests passed.
- Backend TypeScript compilation and 17 Gemini/reliability/allowance tests passed.
- A startup behavior test passed against both local and release entrypoints:
  required health checks, voice handlers, Writing and Telegram started, with zero
  synthetic provider audio requests. No real AI provider was called by this test.
- Live `/healthz` and `/api/v1/health` returned HTTP 200 during the audit.
