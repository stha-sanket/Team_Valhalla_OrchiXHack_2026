# 07 — Folder Architecture

## Monorepo Overview

```
Orchid/                             ← Monorepo root
├── client/                         ← Frontend (React + Vite + TailwindCSS)
├── server/                         ← Backend (express-file-cluster + MongoDB)
├── docs/                           ← This documentation
├── extra/                          ← Assets, scratch files, research notes
├── index.html                      ← Standalone AR demo HTML (pre-app prototype)
├── orchid.txt                      ← Raw route data used to seed the Orchid College route
├── prompt_efc.md                   ← Developer notes on the express-file-cluster framework
└── .gitignore
```

---

## Client (`/client`)

```
client/
├── .env                            ← VITE_API_URL, VITE_WS_URL
├── index.html                      ← HTML entry point (single div#root)
├── vite.config.ts                  ← Vite config: React plugin, TailwindCSS
├── tsconfig.json                   ← TypeScript project config
├── tsconfig.app.json               ← App-specific TS settings (strict, ESNext)
├── tsconfig.node.json              ← Node-context TS settings (for vite.config.ts)
├── eslint.config.js                ← ESLint flat config (React hooks + refresh rules)
├── package.json
│
├── public/
│   └── vendor/                     ← Local copies of AR.js + A-Frame bundles
│       ├── aframe.min.js           ← A-Frame 1.6.0 (WebGL/WebXR renderer)
│       ├── ar-threex-location-only.js  ← AR.js GPS location layer (THREE.js)
│       └── aframe-ar.js            ← A-Frame ↔ AR.js bridge component
│
└── src/
    ├── main.tsx                    ← App bootstrap: Redux Provider + RouterProvider
    ├── App.tsx                     ← Route table (createBrowserRouter)
    ├── App.css                     ← Global app-level styles (mostly resets)
    ├── index.css                   ← TailwindCSS base + custom color tokens
    │
    ├── components/                 ← Reusable UI components
    │   ├── AppLayout.tsx           ← Shell: bottom navigation dock, content area
    │   ├── Dock.tsx                ← Bottom tab bar (Dashboard, Explore, People, Profile)
    │   ├── LoginComponent.tsx      ← Shared login/register form UI
    │   ├── ProtectedRoute.tsx      ← Role-gated route wrapper
    │   ├── ThemeToggle.tsx         ← Dark/light mode button
    │   └── icons.tsx               ← Inline SVG icon components
    │
    ├── pages/                      ← One file per screen/route
    │   ├── LoginPage.tsx           ← /login
    │   ├── RegisterPage.tsx        ← /register
    │   ├── DashboardPage.tsx       ← /dashboard — trip progress, milestones, badges
    │   ├── PathfinderPage.tsx      ← /explore — AR navigation (largest file, ~1000 lines)
    │   ├── QuizPage.tsx            ← /quiz/:placeId — knowledge quiz
    │   ├── RedeemPage.tsx          ← /redeem — AR points store
    │   ├── PeoplePage.tsx          ← /people — community directory
    │   ├── PublicProfilePage.tsx   ← /people/:id — other user's profile
    │   ├── ProfilePage.tsx         ← /profile — own profile, avatar, milestones
    │   ├── SettingsPage.tsx        ← /settings — preferences, logout
    │   ├── PrivacyPolicyPage.tsx   ← /privacy-policy
    │   └── admin/
    │       ├── AdminDashboardPage.tsx  ← /admin — platform stats
    │       ├── AdminUsersPage.tsx      ← /admin/users — user management
    │       └── WaypointLoggerPage.tsx  ← /admin/waypoint-logger — route builder GUI
    │
    ├── store/                      ← Redux Toolkit global state
    │   ├── store.ts                ← configureStore: all API slices + auth slice
    │   ├── hooks.ts                ← useAppDispatch + useAppSelector typed hooks
    │   └── api/
    │       ├── baseQuery.ts        ← RTK fetchBaseQuery with credentials: "include"
    │       ├── authApi.ts          ← /api/auth/** endpoints
    │       ├── userApi.ts          ← /api/users/** endpoints
    │       ├── visitingPlaceApi.ts ← /api/visiting-places/** endpoints
    │       ├── visitingRoutesApi.ts← /api/visiting-routes/** endpoints
    │       ├── userProgressApi.ts  ← /api/user-progress/** endpoints + WS ticket
    │       ├── arApi.ts            ← /api/ar/** (points, quiz, redeem)
    │       └── adminApi.ts         ← /api/admin/** endpoints
    │
    ├── hooks/                      ← Custom React hooks (empty in current build)
    ├── lib/
    │   └── loadScript.ts           ← Dynamic <script> loader for AR.js (returns Promise)
    └── types/                      ← Shared TypeScript type definitions
```

### Key File Notes

**`PathfinderPage.tsx`** (~1,000 lines) is the most complex file. It manages:
- Phase state machine: `gate` → `loading` → `active`
- WebSocket lifecycle (connect/disconnect/reconnect)
- `navigator.geolocation.watchPosition` subscription
- `DeviceOrientationEvent` smoothing (compass heading lerp)
- A-Frame scene injection into `document.body` (outside React tree)
- AR video entity spawning with THREE.js world-space positioning
- Demo mode with simulated GPS arrival

**`vendor/`** in `public/` is intentional — AR.js and A-Frame are served locally to bypass ad-blocker CDN blocking that silently breaks AR initialisation.

---

## Server (`/server`)

```
server/
├── .env                            ← DATABASE_URL, JWT_SECRET, REDIS_URL, SMTP_*
├── .env.example                    ← Template for environment variables
├── efc.config.ts                   ← express-file-cluster structural config
├── package.json
├── tsconfig.json
│
└── src/
    ├── index.ts                    ← Server entry: ignite() → attachWebSocket → gracefulShutdown
    │
    ├── api/                        ← File-system-routed REST endpoints
    │   ├── health.ts               ← GET /api/health
    │   │
    │   ├── auth/                   ← /api/auth/**
    │   │   ├── register.ts         ← POST /api/auth/register
    │   │   ├── login.ts            ← POST /api/auth/login
    │   │   ├── logout.ts           ← POST /api/auth/logout
    │   │   ├── me.ts               ← GET /api/auth/me
    │   │   ├── refresh.ts          ← POST /api/auth/refresh
    │   │   ├── verify-email.ts     ← POST /api/auth/verify-email
    │   │   ├── forgot-password.ts  ← POST /api/auth/forgot-password
    │   │   ├── reset-password.ts   ← POST /api/auth/reset-password
    │   │   ├── change-password.ts  ← POST /api/auth/change-password
    │   │   ├── 2fa/                ← Two-factor auth (future)
    │   │   └── sessions/           ← Session management endpoints
    │   │
    │   ├── user/                   ← /api/user/** (own user profile mutations)
    │   ├── users/                  ← /api/users/** (public user listings)
    │   │
    │   ├── visiting-places/
    │   │   ├── index.ts            ← GET (list), POST (create)
    │   │   └── [id].ts             ← GET, PUT, DELETE by ID (dynamic route segment)
    │   │
    │   ├── visiting-routes/        ← CRUD for route waypoints
    │   │
    │   ├── user-progress/
    │   │   ├── index.ts            ← GET (fetch), POST (seed/start)
    │   │   ├── summary.ts          ← GET /api/user-progress/summary
    │   │   └── reset.ts            ← POST /api/user-progress/reset
    │   │
    │   ├── ws/                     ← REST endpoint for WS ticket minting
    │   │
    │   └── admin/
    │       ├── dashboard.ts        ← GET /api/admin/dashboard
    │       ├── admins/             ← Admin self-management
    │       ├── roles/              ← Role management
    │       ├── analytics/          ← Engagement analytics
    │       └── users/              ← Full user management
    │
    ├── model/                      ← Mongoose schema definitions
    │   ├── User.ts
    │   ├── Admin.ts
    │   ├── Session.ts
    │   ├── Role.ts
    │   ├── VisitingPlace.ts
    │   ├── VisitingRoutes.ts
    │   ├── UserProgress.ts
    │   ├── ArPoints.ts
    │   ├── Quiz.ts
    │   └── QuizAttempt.ts
    │
    ├── lib/                        ← Stateless business logic (no Express imports)
    │   ├── proximity.ts            ← Haversine distance, bearing, arrival detection, confirmVisit
    │   ├── arPoints.ts             ← Point award/spend logic, rewards catalog, idempotency
    │   └── tripSummaries.ts        ← Aggregated trip + badge + milestone summaries
    │
    ├── ws/
    │   └── pathfinder.ts           ← WebSocket server (attached to HTTP server after ignite())
    │
    ├── tasks/                      ← BullMQ task definitions (email sending, etc.)
    │
    └── scripts/                    ← One-off data seeding scripts (run with tsx)
        ├── seedAdmin.ts            ← Creates initial admin account
        ├── seedBadge.ts            ← Seeds badge URLs for visiting places
        ├── seedOrchid.ts           ← Seeds Orchid College route (8 waypoints)
        └── seedQuiz.ts             ← Seeds 5-question quiz for Orchid College
```

### File-System Routing Convention

`express-file-cluster` maps the `src/api/` directory tree directly to URL paths:

| File | Route |
|------|-------|
| `src/api/health.ts` | `GET /api/health` |
| `src/api/auth/login.ts` | `POST /api/auth/login` |
| `src/api/visiting-places/index.ts` | `GET/POST /api/visiting-places` |
| `src/api/visiting-places/[id].ts` | `GET/PUT/DELETE /api/visiting-places/:id` |
| `src/api/user-progress/summary.ts` | `GET /api/user-progress/summary` |

Each route file exports:
- `meta` — documentation/OpenAPI metadata
- `middlewares` — array of Express middleware (e.g. `[requireAuth('user')]`)
- HTTP verb handlers as named exports: `GET`, `POST`, `PUT`, `DELETE`

---

## Architecture Decision: Why `/vendor/` Bundles?

The AR.js and A-Frame libraries are loaded from CDN in most tutorials. In practice:

1. **Ad blockers** (uBlock Origin, Brave Shield) silently block CDN requests from `cdnjs.cloudflare.com`, causing the AR camera to never initialise.
2. **Version mismatch** — the correct combination for location-based AR is A-Frame 1.6.0 + AR.js 3.4.7. CDN URLs for this specific pair are fragile.
3. **CORS issues** — loading from CDN in a dev tunnel environment can fail due to mixed-content policies.

Serving from `public/vendor/` eliminates all three problems with negligible bundle size impact (the files are loaded dynamically only when AR mode is activated).
