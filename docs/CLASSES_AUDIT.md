# Classes functional and visual audit

Completed 2026-10-04. The portal and all seven class sections share the silver glass material, red actions, readable secondary text, consistent controls and responsive cards.

## Coverage

| Area | Verification |
| --- | --- |
| Portal | Search/reset, create validation, trimmed names, photo upload/zoom/crop, loading/error/retry, guest sign-in return path |
| Invitations | Explicit acceptance, expiry, recipient email, role protection, single-use claiming, share link, clipboard success/fallback |
| Overview | Metrics, activity, period selection, intervention navigation, empty states |
| Students | Search, exam/status/group filters, URL filters, detail scope, student invitations |
| Student details | Scores, skills, history, assignment start/retry, staff preview, coaching note save, analysis refresh, student permissions |
| Groups | Creation, required name, teacher validation, group-to-students navigation, teaching scope |
| Assignments | Creation, audience, destination and deadline validation, Writing/Speaking track consistency, progress, overdue/completed filtering, practice completion |
| Members | Search, owner-only role controls, administrator limit, private email visibility, role/group cleanup |
| Leaderboard | SAT/IELTS and growth/best-score filters, comparable skills and scales, highest result |
| Settings | Owner-only access, trimmed name, save feedback, delete confirmation/cancel and deletion |
| Test integration | Assignment query survives catalogs and runners; staff previews preserve learner submissions; Reading/Listening completion uses the existing attempt sync endpoint; review waits for pending sync |
| Analytics | Two/three attempts show growth; mixed skills/scales do not create false declines; percentage practice is separate from native scores; SAT sections use 800 points; speaking session/assessment duplicates use the original XP event identity |
| Accessibility and layout | One page h1, labeled filters, modal focus trap/Escape/restore, reduced motion, active mobile tab visibility, 320/390/768/1440 px overflow checks |

## Reproduce

```powershell
npx tsc -p backend/tsconfig.json
node --test backend/scripts/learning-centers.test.mjs
node scripts/test-learning-center-ui.mjs
npm run build
```

The backend suite runs real Express routes, JWT middleware and validation with isolated Prisma fixtures. The browser suite runs real React components and CSS in Chromium with API fixtures. It exercises owner, administrator, teacher and student flows and saves screenshots under `output/playwright/classes-audit`.

Playwright also checked the running app with its full shell at desktop/mobile sizes, all seven sections, reduced motion and modal focus. TypeScript, targeted ESLint, the production build and the repository's IELTS/SAT/vocabulary content validators passed.

## Verification limits

These checks do not mutate live user accounts or verify a production PostgreSQL connection, production migrations, external AI availability or deployment health. SQL transaction/claim behavior is implemented in the routes; actual database concurrency requires a database integration environment. AI analysis retains a validated, data-based fallback. Browser regression fixtures are separate from live API data.
