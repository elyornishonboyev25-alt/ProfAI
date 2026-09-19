# ProfAI

Global university-preparation platform combining exam preparation, academic skills,
university research and application planning.

## What This Platform Delivers

ProfAI supports:
- SAT preparation
- IELTS Academic and General Training preparation
- Academic English and application-readiness practice
- University research and admissions planning

Core capabilities implemented with real backend logic:
- Real weighted scoring and percentage calculation
- Time bonus scoring
- XP engine (difficulty + performance + time + streak multipliers)
- Level progression with threshold config and level-up notifications
- Daily streak and longest streak tracking
- Leaderboard with ranking formula and rank movement indicators
- Weekly activity analytics (7-day bars)
- Achievements + notifications
- Persistent attempt storage in PostgreSQL

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Zustand
- React Hook Form + Zod
- Framer Motion
- Recharts
- Lucide Icons

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- Prisma ORM
- JWT access + refresh token authentication
- bcrypt password hashing
- Zod input validation
- Rate limiting + Helmet security

### DevOps
- GitHub Actions CI (`.github/workflows/ci.yml`)
- Frontend deployment target: Vercel
- Backend deployment target: Railway or Render

## Project Structure

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── docs/
│   │   └── API.md
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── common/
│   │   └── layout/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── store/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
└── .github/workflows/ci.yml
```

## Local Setup

## 1. Frontend

1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env
```

3. Start frontend:
```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## 2. Backend

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create env file:
```bash
cp .env.example .env
```

3. Set PostgreSQL URL in `backend/.env`.

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations:
```bash
npm run prisma:migrate
```

6. Seed initial data:
```bash
npm run db:seed
```

7. Start backend:
```bash
npm run dev
```

Backend URL: `http://localhost:5001`

## 3. Run Both Together

From root:
```bash
npm run dev:all
```

## Environment Variables

### Frontend (`.env`)
- `VITE_API_URL=http://localhost:5001/api/v1`
- `VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id`

### Backend (`backend/.env`)
- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`

## API Documentation

Detailed endpoint reference:
- `backend/docs/API.md`

## Deployment Guide

### Frontend (Vercel)
1. Import repository into Vercel.
2. Set `VITE_API_URL` to deployed backend API URL (`https://your-api-domain/api/v1`).
3. Build command:
```bash
npm run build
```
4. Output directory: `dist`

### Backend (Railway / Render)
1. Create new service from `backend` directory.
2. Provision PostgreSQL and set `DATABASE_URL`.
3. Set all backend environment variables from `backend/.env.example`.
4. Build command:
```bash
npm install && npm run prisma:generate && npm run build
```
5. Start command:
```bash
npm run start
```
6. Run migration deploy after release:
```bash
npm run prisma:deploy
```

## Security Features

- Password hashing with bcrypt
- Access + refresh token strategy with token rotation
- Refresh token hashing at rest
- Role-based access control (`ADMIN`, `USER`)
- Auth and API rate limiting
- Zod request validation
- Helmet hardening middleware
- Protected routes on frontend and backend

## Performance and UX Features

- Route-level code splitting with `React.lazy`
- Animated page transitions
- Skeleton loaders
- Toast notifications
- Optimistic, modular API client with token refresh handling
- Animated charts and progress bars
- Keyboard-accessible forms and controls
- WCAG-conscious contrast and semantic labels

## Demo Seed Credentials

After running `npm run db:seed` in backend:
- Admin: `admin@profai.app` / `Admin@12345`
- Student: `student@profai.app` / `Student@12345`

## Notes

- This codebase now includes both legacy modules and the new production stack.
- The new backend API and new dashboard/test flow are in active use through the updated routes/pages.


### Automatic SAT vocabulary

Register a new full mock in `src/features/sat/catalog.ts` with its Reading & Writing
modules (`rw1` and `rw2`). Vocabulary Studio automatically gets a matching
`SAT Full Mock N` pack with 20 challenging words per English module. No separate
vocabulary catalog edit is needed. Existing reviewed packs in
`src/data/satVocabulary.ts` retain their content, IDs, and learning progress.

`npm run build` prepares and validates the vocabulary before TypeScript/Vite run.
The Vite plugin also prepares it on startup and watches SAT source edits during
`npm run dev:web`. Run `npm run sync:sat-vocabulary` to prepare it explicitly
(for example, before invoking `tsc` directly).

Only new or changed, uncurated modules need AI. Set `GEMINI_API_KEY` or
`OPENAI_API_KEY` in the **frontend build environment**; local development also
reads the existing `backend/.env` configuration. Optional model settings follow
the backend's `GEMINI_MODELS`, `OPENAI_MODEL`, and `OPENAI_API_BASE` settings.
CI and hosting services must expose these keys as frontend build-time
environment variables; backend-only deployment variables are not automatically
available to the frontend builder. Keys are
never emitted into the browser bundle. Current reviewed packs and cached
modules build without AI credentials.

Validated modules are cached by source-content hash in `.cache/sat-vocabulary/`.
Configure the builder to persist the same directory to avoid repeat generation. `src/data/satVocabulary.generated.json` is the assembled
build input. Both are ignored artifacts and must not be committed. The generator
rejects missing translations, duplicate words/meanings, wrong counts, and words
absent from their cited module. Generation or validation failures stop the build
rather than publishing a partial pack. Edited curated source references must be
reviewed explicitly if they no longer match the test.

Run `npm run test:sat-vocabulary-sync` for synthetic new-mock, cache, failure, and
provider tests; it makes no external AI requests. `npm run validate:vocabulary`
checks the complete live catalog, saved-word compatibility, and XP rules.
