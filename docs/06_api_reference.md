# 06 — API Reference

All REST endpoints are prefixed with the server base URL. Authentication uses HTTP-only cookies (no `Authorization` header).

**Base URL:** `http://localhost:3000` (development) / configured via `VITE_API_URL`

---

## Authentication

### `POST /api/auth/register`
Register a new user account.

**Body:**
```json
{ "name": "Aarav Sharma", "email": "aarav@example.com", "password": "secret123" }
```
**Response (201):**
```json
{ "message": "User registered successfully", "user": { "id": "...", "email": "aarav@example.com" } }
```

---

### `POST /api/auth/login`
Log in with email + password. Sets `access_token` and `refresh_token` HTTP-only cookies.

**Body:**
```json
{ "email": "aarav@example.com", "password": "secret123" }
```
**Response (200):**
```json
{ "message": "Login successful", "user": { "id": "...", "role": "user" } }
```

---

### `POST /api/auth/logout`
Clears auth cookies and invalidates the refresh token.

**Response (200):**
```json
{ "message": "Logged out" }
```

---

### `GET /api/auth/me`
Returns the authenticated user's identity.  
**Auth:** Required (user or admin)

**Response (200):**
```json
{ "user": { "id": "...", "name": "Aarav", "email": "...", "role": "user" } }
```

---

### `POST /api/auth/refresh`
Issues a new access token using the refresh cookie.

**Response (200):**
```json
{ "message": "Token refreshed" }
```

---

### `POST /api/auth/verify-email`
Verifies an email address using the token sent by email.

**Body:** `{ "token": "<verifyToken>" }`

---

### `POST /api/auth/forgot-password`
Sends a password reset email.

**Body:** `{ "email": "aarav@example.com" }`

---

### `POST /api/auth/reset-password`
Resets password using the token from email.

**Body:** `{ "token": "<resetToken>", "password": "newSecret" }`

---

### `POST /api/auth/change-password`
Changes password for an authenticated user.  
**Auth:** Required

**Body:** `{ "currentPassword": "old", "newPassword": "new" }`

---

### `POST /api/auth/ws-ticket`
Issues a short-lived JWT ticket for WebSocket authentication.  
**Auth:** Required

**Response (200):**
```json
{ "ticket": "<short-lived-JWT>" }
```

---

## Visiting Places

### `GET /api/visiting-places`
List all visiting places.  
**Auth:** Required (user or admin)

**Response (200):**
```json
{
  "places": [
    {
      "id": "...",
      "name": "Orchid College",
      "description": "A guided walk...",
      "lat": "27.702247",
      "long": "85.346473",
      "badge": "https://...",
      "visit_threshold_meters": 10,
      "visitor_count": 42
    }
  ]
}
```

---

### `POST /api/visiting-places`
Create a new visiting place.  
**Auth:** Admin only

**Body:**
```json
{
  "name": "Krishna Mandir",
  "description": "A Newari temple",
  "lat": "27.7110",
  "long": "85.3243",
  "badge": "https://example.com/badge.png",
  "visit_threshold_meters": 15
}
```
**Response (201):** `{ "message": "Place created", "place": { ... } }`

---

### `GET /api/visiting-places/:id`
Fetch a single visiting place.  
**Auth:** Admin only

---

### `PUT /api/visiting-places/:id`
Update a visiting place.  
**Auth:** Admin only

---

### `DELETE /api/visiting-places/:id`
Delete a visiting place, all its route points, and all user progress records.  
**Auth:** Admin only

---

## Visiting Routes

### `GET /api/visiting-routes?visiting_place_id=<id>`
List all route waypoints for a place (sorted by index).  
**Auth:** Required

### `POST /api/visiting-routes`
Create a new waypoint.  
**Auth:** Admin only

**Body:**
```json
{
  "visiting_place_id": "...",
  "name": "Right Turn",
  "description": "Turn right here",
  "type": "node",
  "coordinates": { "lat": "27.702294", "long": "85.347675" },
  "media": "https://res.cloudinary.com/.../image.png",
  "index": 1
}
```

### `GET /api/visiting-routes/:id`
Fetch a single route point. **Auth:** Admin

### `PUT /api/visiting-routes/:id`
Update a route point. **Auth:** Admin

### `DELETE /api/visiting-routes/:id`
Delete a route point. **Auth:** Admin

---

## User Progress

### `GET /api/user-progress?visiting_place_id=<id>`
Fetch the authenticated user's progress for a visiting place.  
**Auth:** Required

**Response (200):**
```json
{
  "progress": {
    "id": "...",
    "user_id": "...",
    "visiting_place_id": "...",
    "route_progress": [
      { "route_id": "...", "route_index": 0, "visited": true },
      { "route_id": "...", "route_index": 1, "visited": false }
    ]
  }
}
```

---

### `POST /api/user-progress`
Start or resume progress for a visiting place (idempotent seed).  
**Auth:** Required

**Body:** `{ "visiting_place_id": "..." }`

---

### `GET /api/user-progress/summary`
Aggregated trip summaries including milestones, badge status, and points.  
**Auth:** Required

**Response (200):**
```json
{
  "user": { "id": "...", "name": "Aarav", "avatar": null },
  "trips": [
    {
      "progress_id": "...",
      "place": { "id": "...", "name": "Orchid College", "description": "...", "badge": "..." },
      "total_points": 8,
      "visited_points": 5,
      "milestones": [
        { "id": "...", "name": "Orchid Parking Area", "visited": true, "index": 2 }
      ],
      "badge_earned": false
    }
  ]
}
```

---

### `POST /api/user-progress/reset`
Reset route progress for a place (allows revisit). Badges and AR points are permanent.  
**Auth:** Required

**Body:** `{ "visiting_place_id": "..." }`

---

## AR Points

### `GET /api/ar/points`
Get the authenticated user's AR points balance and ledger.  
**Auth:** Required

**Response (200):**
```json
{
  "total": 85,
  "entries": [
    { "source": "milestone", "ref_id": "...", "label": "Orchid Parking Area", "points": 10, "earned_at": "2026-07-11T..." }
  ]
}
```

---

### `POST /api/ar/redeem`
Redeem AR points for a reward.  
**Auth:** Required

**Body:** `{ "reward_id": "canteen-tea" }`

**Response (200):** `{ "message": "Redeemed successfully", "total": 55 }`

---

### `GET /api/ar/quiz/:placeId`
Get quiz for a place. `correct_index` is stripped for non-admin users. Returns `attempted: true` if the user already has a `QuizAttempt`.  
**Auth:** Required

---

### `POST /api/ar/quiz/:placeId/submit`
Submit quiz answers. Creates a permanent `QuizAttempt`.  
**Auth:** Required

**Body:** `{ "answers": [0, 2, 1, 3, 0] }`

**Response (200):**
```json
{
  "correct_count": 4,
  "points": 30,
  "results": [
    { "question": "...", "your_answer": 0, "correct_answer": 0, "correct": true }
  ]
}
```

---

## Users (Public)

### `GET /api/users`
List all users (public profiles).  
**Auth:** Required

### `GET /api/users/:id`
Get a user's public profile.  
**Auth:** Required

---

## Admin API

### `GET /api/admin/dashboard`
Platform-wide statistics.  
**Auth:** Admin only

**Response (200):**
```json
{ "total_users": 120, "total_places": 3, "total_completions": 45 }
```

### `GET /api/admin/users`
List all users with full details.  
**Auth:** Admin only

### `GET /api/admin/analytics`
Engagement analytics per place.  
**Auth:** Admin only

---

## Health

### `GET /api/health`
Server liveness check. No auth required.

**Response (200):** `{ "status": "ok", "timestamp": "2026-07-11T..." }`

---

## WebSocket: `/ws/pathfinder`

### Connection

```
ws://[host]/ws/pathfinder?ticket=<JWT>&visiting_place_id=<id>
```

The `ticket` is a short-lived JWT obtained from `POST /api/auth/ws-ticket`. Connection is rejected with `401` if the ticket is invalid or expired, or `404` if `visiting_place_id` doesn't exist.

---

### Client → Server Messages

#### Location Update
Sent every time `navigator.geolocation.watchPosition` fires (typically every 1–3 seconds outdoors).
```json
{ "type": "location", "lat": 27.702100, "long": 85.347800 }
```

#### Confirm Visit
Sent when the user taps "I am here" or the video ends at a milestone/side_quest.
```json
{ "type": "confirm_visit", "route_id": "<VisitingRoutes.id>" }
```

---

### Server → Client Messages

#### Progress Update
Sent in response to every `location` message.
```json
{
  "type": "progress",
  "nextWaypoint": {
    "id": "...",
    "name": "Orchid Parking Area",
    "description": "Watch the story...",
    "type": "milestone",
    "media": "https://res.cloudinary.com/.../video.mp4",
    "index": 2,
    "coordinates": { "lat": "27.701960", "long": "85.347353" }
  },
  "distanceMeters": 42,
  "bearingDegrees": 215,
  "thresholdMeters": 10,
  "arrived": false,
  "allVisited": false
}
```

When `allVisited: true`, `nextWaypoint` is `null` and distances are `null`.

#### Visit Result
Sent in response to `confirm_visit`.
```json
{ "type": "visit_result", "confirmed": true, "route_id": "..." }
```
Or on failure:
```json
{ "type": "visit_result", "confirmed": false, "reason": "You're still 23 m away from this checkpoint.", "route_id": "..." }
```

#### Error
```json
{ "type": "error", "message": "invalid JSON" }
```
