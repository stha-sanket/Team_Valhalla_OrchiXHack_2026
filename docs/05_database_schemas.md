# 05 — Database Schemas & Relationships

## Database

**Engine:** MongoDB  
**ODM:** Mongoose (accessed through `express-file-cluster`'s `defineModel` wrapper)  
**Connection:** Single connection string via `DATABASE_URL` environment variable  

All models use MongoDB's `_id` (ObjectId) as the primary key, exposed as `id` (string) by the EFC normaliser. References between collections are stored as plain strings (denormalised IDs), not Mongoose ObjectId references — this is an intentional choice to keep the framework's type layer simple and avoid `populate()` overhead.

---

## Entity–Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────┐     1      ┌──────────────────┐     1      ┌──────────┐  │
│  │     User     │──────────▶│   UserProgress   │◀──────────│Visiting  │  │
│  │              │           │                  │           │ Place    │  │
│  │ id (PK)      │  1..N     │ id (PK)          │  1..N     │          │  │
│  │ name         │──────────▶│ user_id (FK)     │──────────▶│ id (PK)  │  │
│  │ email        │           │ visiting_place_id│           │ name     │  │
│  │ password     │           │ route_progress[] │           │ lat      │  │
│  │ role         │           └──────────────────┘           │ long     │  │
│  │ milestones[] │                    │                      │ badge    │  │
│  │ avatar       │                    │ (route_id refs)      │ threshold│  │
│  │ isVerified   │                    ▼                      │ visitor_c│  │
│  │ isActive     │           ┌──────────────────┐           └────┬─────┘  │
│  │ tokens       │           │  VisitingRoutes  │◀──────────────┘         │
│  └──────┬───────┘           │                  │  1..N                   │
│         │                   │ id (PK)          │                         │
│         │ 1                 │ visiting_place_id│                         │
│         │                   │ name             │                         │
│         ▼                   │ type (enum)      │                         │
│  ┌──────────────┐           │ coordinates {}   │                         │
│  │   ArPoints   │           │ description      │                         │
│  │              │           │ media (URL)      │                         │
│  │ id (PK)      │           │ index            │                         │
│  │ user_id (FK) │           └──────────────────┘                         │
│  │ total        │                                                         │
│  │ entries[]    │           ┌──────────────────┐                         │
│  └──────┬───────┘           │      Quiz        │                         │
│         │                   │                  │                         │
│         │                   │ id (PK)          │  1                      │
│         │                   │ visiting_place_id│──────────────────────▶  │
│         │                   │ questions[]      │    (one quiz per place)  │
│         │                   └──────────────────┘                         │
│         │                            │                                   │
│         │                            │ 1                                  │
│         │                            ▼                                   │
│         │                   ┌──────────────────┐                         │
│         │ 1                 │  QuizAttempt     │                         │
│         └──────────────────▶│                  │                         │
│                             │ id (PK)          │                         │
│                             │ user_id (FK)     │                         │
│                             │ quiz_id (FK)     │                         │
│                             │ answers[]        │                         │
│                             │ correct_count    │                         │
│                             │ points           │                         │
│                             └──────────────────┘                         │
│                                                                           │
│  ┌──────────────┐           ┌──────────────────┐                         │
│  │    Admin     │           │     Session      │                         │
│  │              │           │                  │                         │
│  │ id (PK)      │           │ id (PK)          │                         │
│  │ name         │           │ userId (FK→User) │                         │
│  │ email        │           │ token            │                         │
│  │ password     │           │ ip               │                         │
│  │ role         │           │ userAgent        │                         │
│  │ permissions[]│           │ expiresAt        │                         │
│  │ isActive     │           │ isActive         │                         │
│  └──────────────┘           └──────────────────┘                         │
│                                                                           │
│  ┌──────────────┐                                                         │
│  │     Role     │                                                         │
│  │              │                                                         │
│  │ id (PK)      │                                                         │
│  │ name         │                                                         │
│  │ description  │                                                         │
│  │ permissions[]│                                                         │
│  └──────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Schema Reference

### `User`

Represents a registered student/explorer.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string (ObjectId) | Auto | — | Primary key |
| `name` | string | ✅ | — | Display name |
| `email` | string | ✅ | — | Unique; used for login and email verification |
| `password` | string | ✅ | — | bcrypt hash (cost 12) |
| `role` | string | ✅ | `"user"` | `"user"` or `"admin"` |
| `milestones` | `MilestoneEntry[]` | — | `[]` | Permanent milestone log; survives progress resets |
| `milestones[].name` | string | ✅ | — | Milestone route name |
| `milestones[].earned_at` | string (ISO 8601) | ✅ | — | Timestamp of first completion |
| `avatar` | string | — | — | URL to avatar image (Cloudinary or external) |
| `isVerified` | boolean | — | `false` | Whether email has been verified |
| `isActive` | boolean | — | `true` | Account active flag (soft disable) |
| `verifyToken` | string | — | — | Single-use email verification token |
| `resetToken` | string | — | — | Password reset token |
| `resetTokenExpiry` | Date | — | — | Expiry for reset token |
| `refreshToken` | string | — | — | Current refresh JWT |
| `refreshTokenExpiry` | Date | — | — | Expiry for refresh token |

**Indexes:** `email` (unique)

---

### `Admin`

Separate collection for platform administrators. Stored independently from `User` so that role escalation bugs cannot grant a user admin access.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `name` | string | ✅ | — | Admin display name |
| `email` | string | ✅ | — | Unique login email |
| `password` | string | ✅ | — | bcrypt hash |
| `role` | string | ✅ | `"admin"` | Always `"admin"` |
| `permissions` | string[] | — | `[]` | Fine-grained permission strings |
| `isActive` | boolean | — | `true` | Account active flag |
| `resetToken` | string | — | — | Password reset token |
| `resetTokenExpiry` | Date | — | — | Reset token expiry |
| `refreshToken` | string | — | — | Current refresh JWT |
| `refreshTokenExpiry` | Date | — | — | Refresh token expiry |

---

### `Session`

Tracks active user sessions for multi-device management.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `userId` | string | ✅ | — | FK → User.id |
| `token` | string | ✅ | — | Unique session token (JWT) |
| `ip` | string | ✅ | — | Client IP at login time |
| `userAgent` | string | ✅ | — | Browser/device string |
| `expiresAt` | Date | ✅ | — | Session expiry |
| `isActive` | boolean | — | `true` | Whether session is still valid |

**Indexes:** `token` (unique)

---

### `VisitingPlace`

A campus location that can have a full route built on top of it.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `name` | string | ✅ | — | Human-readable name (e.g. "Orchid College") |
| `description` | string | ✅ | — | Short description shown on the Explore card |
| `lat` | string | ✅ | — | Latitude of the place's central coordinate |
| `long` | string | ✅ | — | Longitude of the place's central coordinate |
| `badge` | string | — | — | URL of the badge image awarded on completion |
| `visit_threshold_meters` | number | ✅ | `10` | Geofence radius in metres; arrival triggered when user is within this distance of each waypoint |
| `visitor_count` | number | — | `0` | Denormalised count of unique users who completed this place (O(1) read; bumped once per first completion) |

---

### `VisitingRoutes`

An ordered sequence of waypoints (route points) belonging to a `VisitingPlace`. Each point has a type that determines the user experience on arrival.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `visiting_place_id` | string | ✅ | — | FK → VisitingPlace.id |
| `name` | string | ✅ | — | Waypoint name shown in the HUD |
| `description` | string | ✅ | — | Context text shown on arrival card |
| `type` | enum | ✅ | — | One of: `start`, `node`, `milestone`, `side_quest`, `end` |
| `coordinates.lat` | string | ✅ | — | GPS latitude |
| `coordinates.long` | string | ✅ | — | GPS longitude |
| `media` | string | — | — | URL to an image or video (Cloudinary); video URLs contain `/video/upload` |
| `index` | number | ✅ | — | Sequential ordering index (0-based); routes are sorted by index |

**Waypoint Type Semantics:**

| Type | Behaviour |
|------|-----------|
| `start` | First waypoint; shows image on "I am here" tap |
| `node` | Navigation turn point; shows directional image on tap |
| `milestone` | Plays video on arrival; earns 10 AR points + milestone badge progress |
| `side_quest` | Plays video on arrival; user accepts/skips; minimum 5-minute dwell required; earns 25 AR points |
| `end` | Final waypoint; shows completion image |

---

### `UserProgress`

Tracks one user's progress through one visiting place route. Created idempotently (seeded on first WebSocket connection or explicit `POST /api/user-progress`). Can be reset for revisits — badges and points are permanent.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `user_id` | string | ✅ | — | FK → User.id |
| `visiting_place_id` | string | ✅ | — | FK → VisitingPlace.id |
| `route_progress` | array | — | `[]` | One entry per route waypoint |
| `route_progress[].route_id` | string | ✅ | — | FK → VisitingRoutes.id |
| `route_progress[].route_index` | number | ✅ | — | Mirrors VisitingRoutes.index for ordered traversal |
| `route_progress[].visited` | boolean | ✅ | — | Whether this waypoint has been confirmed visited |

**Uniqueness:** One record per `(user_id, visiting_place_id)` pair.

---

### `ArPoints`

Private virtual currency ledger per user. The full entry log is kept for audit and review. Never exposed on public profiles.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `user_id` | string | ✅ | — | FK → User.id (unique) |
| `total` | number | ✅ | `0` | Running balance (can go negative in theory, guarded by `spendPoints`) |
| `entries` | `ArPointsEntry[]` | — | `[]` | Immutable transaction log |
| `entries[].source` | string (enum) | ✅ | — | `quiz`, `side_quest`, `milestone`, `place_complete`, `redeem` |
| `entries[].ref_id` | string | ✅ | — | Unique reference (quiz ID, route ID, or place ID); idempotency key |
| `entries[].label` | string | ✅ | — | Human-readable description |
| `entries[].points` | number | ✅ | — | Positive for awards; negative for redemptions |
| `entries[].earned_at` | string (ISO 8601) | ✅ | — | Timestamp |

**Indexes:** `user_id` (unique)  
**Idempotency:** `awardPoints()` checks `(source, ref_id)` uniqueness before writing. Re-confirming a checkpoint cannot farm duplicate points.

---

### `Quiz`

One optional quiz per visiting place. Always contains exactly 5 questions (by convention). The `correct_index` field is never returned to non-admin API clients.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `visiting_place_id` | string | ✅ | — | FK → VisitingPlace.id (unique) |
| `questions` | `QuizQuestion[]` | — | `[]` | Ordered list of questions |
| `questions[].question` | string | ✅ | — | Question text |
| `questions[].options` | string[] | ✅ | — | Array of option strings (4 options per question) |
| `questions[].correct_index` | number | ✅ | — | Index into `options` of the correct answer |

**Indexes:** `visiting_place_id` (unique)

---

### `QuizAttempt`

Stores one permanent attempt per `(user_id, quiz_id)`. After submitting, users can review their answers vs. the correct answers, but cannot re-attempt.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `user_id` | string | ✅ | — | FK → User.id |
| `quiz_id` | string | ✅ | — | FK → Quiz.id |
| `answers` | number[] | — | `[]` | Selected option index per question |
| `correct_count` | number | ✅ | — | How many answers were correct (0–5) |
| `points` | number | ✅ | — | Points awarded (from `QUIZ_POINTS_BY_CORRECT` table) |

---

### `Role`

Defines named permission sets for fine-grained access control (used by Admin accounts).

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Auto | — | Primary key |
| `name` | string | ✅ | — | Role name (unique), e.g. `"super_admin"` |
| `description` | string | ✅ | — | Human-readable description |
| `permissions` | string[] | — | `[]` | List of permission strings |

---

## Collection Relationships Summary

| Relationship | Type | FK Location |
|-------------|------|------------|
| User → ArPoints | 1:1 | `ArPoints.user_id` |
| User → UserProgress | 1:N | `UserProgress.user_id` |
| User → QuizAttempt | 1:N | `QuizAttempt.user_id` |
| User → Session | 1:N | `Session.userId` |
| VisitingPlace → VisitingRoutes | 1:N | `VisitingRoutes.visiting_place_id` |
| VisitingPlace → UserProgress | 1:N | `UserProgress.visiting_place_id` |
| VisitingPlace → Quiz | 1:1 | `Quiz.visiting_place_id` |
| Quiz → QuizAttempt | 1:N | `QuizAttempt.quiz_id` |
| VisitingRoutes → UserProgress entries | M:N (embedded) | `route_progress[].route_id` |

---

## Design Rationale

### Why separate `User` and `Admin` collections?

If both roles live in the same collection, a bug in role-checking logic could accidentally grant a regular user admin privileges. By separating them, `requireAuth('admin')` queries a completely different collection — the attack surface for privilege escalation is eliminated at the data layer.

### Why string IDs instead of Mongoose ObjectIds for foreign keys?

`express-file-cluster`'s `defineModel` normalises all `_id` fields to plain strings. This keeps the entire application free of Mongoose-specific types in business logic, making the service layer (proximity.ts, arPoints.ts) portable and testable without mocking the ODM.

### Why denormalise `visitor_count` on `VisitingPlace`?

Computing the number of unique completers would require scanning `UserProgress` (an O(N) query). By bumping a counter exactly once per user's first completion, leaderboard and place-card reads stay O(1) regardless of how many users register.

### Why embed `milestones` on `User` instead of querying `UserProgress`?

`UserProgress` can be reset when a user revisits a place. Embedding earned milestones directly on the `User` document makes badge awards permanent and resilient to progress resets — a user who earned a milestone on their first visit retains it even after clearing progress for a second walk.
