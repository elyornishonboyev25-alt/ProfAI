# ProfAI API Reference

Base URL: `/api/v1`

## Auth

### `POST /auth/register`
Creates a new user account.

Body:
```json
{
  "fullName": "Jane Student",
  "email": "jane@example.com",
  "password": "StrongPass123"
}
```

Response:
```json
{
  "user": {
    "id": "...",
    "email": "jane@example.com",
    "fullName": "Jane Student",
    "role": "USER",
    "xp": 0,
    "level": 1,
    "currentStreak": 0
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### `POST /auth/login`
Signs in user and returns access + refresh tokens.

### `POST /auth/google`
Signs in or auto-registers user via Google ID token.

Body:
```json
{
  "idToken": "google-id-token-from-client"
}
```

Notes:
- Requires `GOOGLE_CLIENT_ID` on backend and `VITE_GOOGLE_CLIENT_ID` on frontend.
- If email does not exist, account is created automatically.

### `GET /auth/google/config`
Returns Google OAuth setup status for frontend bootstrap.

Response:
```json
{
  "enabled": true,
  "clientId": "your-google-client-id.apps.googleusercontent.com"
}
```

### `POST /auth/refresh`
Rotates refresh token and issues a fresh access token.

### `POST /auth/logout`
Revokes current refresh token.

### `GET /auth/me`
Returns authenticated user profile.

---

## Tests

### `GET /tests`
Query test library with filters.

Query params:
- `search`
- `category` (`SAT|IELTS`)
- `difficulty` (`EASY|MEDIUM|HARD`)
- `premium` (`true|false`)
- `page`
- `limit`

### `GET /tests/recommended`
Returns personalized recommendations based on weakest category performance.

### `GET /tests/:id`
Returns test metadata + questions + options for attempt UI.

### `POST /tests/:id/submit`
Submits attempt and computes real scoring + gamification updates.

Body:
```json
{
  "timeSpentSec": 1320,
  "answers": [
    { "questionId": "q1", "optionId": "o2" },
    { "questionId": "q2", "optionId": "o5" }
  ]
}
```

Response includes:
- weighted score
- final score
- time bonus
- XP earned
- level transition
- streak update
- unlocked achievements
- answer review (selected/correct)

### `POST /tests` (Admin)
Creates a test with nested questions/options.

---

## Dashboard

### `GET /dashboard/overview`
Returns:
- Hero metrics (`totalTests`, `averageScore`, `currentRank`, `currentStreak`)
- Weekly progress (7 days)
- Recommended tests
- Recent activity timeline
- Mini leaderboard

---

## Profile

### `GET /profile/overview`
Returns:
- Profile identity and progression stats
- XP level progress payload for circular indicator
- Weekly activity data
- Achievements
- Recent attempts

---

## Leaderboard

### `GET /leaderboard`
Query params:
- `period` (`today|week|month|all`)
- `category` (`SAT|IELTS`) optional

Response:
- sorted rankings
- podium (top 3)
- rank deltas (`up/down/same`)
- current user highlighting support

---

## Daily Planner

### `GET /planner/tasks`
Returns authenticated user's planner tasks sorted by scheduled time.

### `POST /planner/tasks`
Creates a planner task.

Body:
```json
{
  "title": "Reading drill",
  "description": "Cambridge passage 2",
  "scheduledAt": "2026-03-03T16:30:00.000Z"
}
```

### `PATCH /planner/tasks/:taskId`
Updates task completion state.

Body:
```json
{
  "completed": true
}
```

---

## Security and Validation
- JWT Bearer auth for protected endpoints.
- Refresh token persistence with hashed storage.
- Zod-based input validation.
- Rate limiting on auth and API routes.
- RBAC for admin-only endpoints.
