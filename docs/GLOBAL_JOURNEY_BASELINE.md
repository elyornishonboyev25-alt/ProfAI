# Global University Journey baseline

Verified against the repository on 2026-08-27. This document is the Phase 0
reference point for the staged ProfAI Global University Journey rollout.

## Product surfaces today

- The guest entry point is the English marketing landing at `/`.
- Authenticated learners are routed through a six-step onboarding flow and then
  into the dashboard.
- IELTS and SAT have dedicated catalog, runner, results, review and analytics
  surfaces.
- Academic-skill surfaces include articles, podcasts, vocabulary, shadowing,
  writing, speaking and live community practice.
- Admission surfaces include lessons, a university catalog, university detail
  pages and a browser-persisted shortlist.
- Premium UI exists, but entitlement and payment are not yet backed by a real
  subscription model.

## Frontend and API boundaries

- Frontend: React 18, TypeScript, Vite, React Router, Zustand and Tailwind.
- API: Express, TypeScript, PostgreSQL, Prisma and JWT access/refresh sessions.
- API routers currently cover health, auth, tests, dashboard, profile,
  leaderboard, planner, shadowing, podcasts, reviews, shared results and AI
  workspaces.
- The frontend calls `/api/v1` by default. Express can serve the built frontend
  in production and falls back to `index.html` for non-API routes.

## Data baseline

- The checked-in admission catalog contains 54 university records. Fifty are
  validated as the QS World University Rankings 2027 top 50.
- University data is currently compiled into the frontend. It has no backend
  University or Program persistence model yet.
- The current university type supports institution-level admission rules and
  sources, but not program-level requirements, intakes, scholarships or
  deadlines.
- User profiles already store useful journey inputs such as target exam,
  countries, degree level, field of study, budget and a target university slug.
- At the Phase 0 baseline, the backend test schema still contained `SCHOOL`
  and `OLYMPIAD` categories; Phase 2 removes them.

## Delivery baseline

- Frontend production build: `npm.cmd run build` on Windows or `npm run build`
  elsewhere.
- Backend production build: `npm.cmd --prefix backend run build` on Windows or
  `npm --prefix backend run build` elsewhere.
- GitHub Actions builds frontend and backend on pushes to `main`, `develop` and
  `codex/**`, and on pull requests.
- `vercel.json` defines a Vite frontend and Express backend service. The backend
  documentation also supports Railway or Render with PostgreSQL.
- Database migrations are deployed by the backend start command before the API
  process starts.

## Staged release contract

All Global University Journey flags default to `false`. A child flag is active
only when both that flag and the `GLOBAL_JOURNEY` master flag are enabled.

| Capability | Frontend variable | Backend variable |
| --- | --- | --- |
| Master journey release | `VITE_GLOBAL_JOURNEY_ENABLED` | `GLOBAL_JOURNEY_ENABLED` |
| Guest diagnostic | `VITE_GUEST_DIAGNOSTIC_ENABLED` | `GUEST_DIAGNOSTIC_ENABLED` |
| University data platform | `VITE_UNIVERSITY_DATA_PLATFORM_ENABLED` | `UNIVERSITY_DATA_PLATFORM_ENABLED` |
| Application workspace | `VITE_APPLICATION_WORKSPACE_ENABLED` | `APPLICATION_WORKSPACE_ENABLED` |
| Automated billing | `VITE_AUTOMATED_BILLING_ENABLED` | `AUTOMATED_BILLING_ENABLED` |
| Public growth release | `VITE_GROWTH_RELEASE_ENABLED` | `GROWTH_RELEASE_ENABLED` |

Upcoming frontend routes must check `publicFeatureFlags`. Upcoming backend
routes must mount `requireFeature(...)`. Production flags stay off until the
corresponding phase passes build, automated tests, desktop/mobile QA and the
explicit user checkpoint.

## Known gaps assigned to later phases

- Browser-side Gemini credentials and calls are removed in Phase 1.
- The tracked backend environment file and exposed historical credentials are
  remediated in Phase 1; account owners must rotate the actual secrets.
- School/Olympiad data and behavior are removed through the backup-gated Phase 2
  migration.
- Funnel events, attribution and PostHog are introduced in Phase 4.
- University and program data move to PostgreSQL in Phase 9.
- Subscription entitlements and automated payment remain disabled until Phases
  14 and 15 are complete.

## Change-safety rules

- Preserve unrelated working-tree changes, local settings, secrets and generated
  artifacts.
- Back up and verify the production database before every destructive migration.
- Commit only the files belonging to the current approved phase.
- Keep production flags off when merging incomplete future phases.
