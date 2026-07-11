# 04 — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│   React 19 + Vite + TailwindCSS + RTK Query + A-Frame/AR.js        │
│                                                                     │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Pages   │  │ RTK Query  │  │   Redux      │  │  A-Frame    │  │
│  │ (Router) │  │  API slices│  │   Store      │  │  AR Scene   │  │
│  └──────────┘  └─────┬──────┘  └──────────────┘  └─────────────┘  │
│                      │ HTTP/REST                WebSocket          │
└──────────────────────┼───────────────────────────────┬────────────┘
                       │                               │
              ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │─ ─ ─ ─ ─ ─
                        │                               │
┌──────────────────────▼───────────────────────────────▼────────────┐
│                  SERVER (express-file-cluster)                      │
│            Node.js cluster — 2 workers + 1 primary                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    REST API Layer                           │   │
│  │  /api/auth/**  /api/visiting-places/**  /api/users/**       │   │
│  │  /api/user-progress/**  /api/visiting-routes/**             │   │
│  │  /api/admin/**  /api/health                                 │   │
│  └──────────────────────────────┬──────────────────────────────┘   │
│                                 │                                   │
│  ┌──────────────────────────────▼──────────────────────────────┐   │
│  │               WebSocket Layer  /ws/pathfinder               │   │
│  │  JWT ticket auth → location updates → proximity evaluation  │   │
│  │  → confirmVisit → AR points award → milestone update        │   │
│  └──────────────────────────────┬──────────────────────────────┘   │
│                                 │                                   │
│  ┌──────────────────────────────▼──────────────────────────────┐   │
│  │               Business Logic / Service Layer                │   │
│  │   proximity.ts   arPoints.ts   tripSummaries.ts             │   │
│  └──────────────────────────────┬──────────────────────────────┘   │
│                                 │                                   │
│  ┌──────────────────────────────▼──────────────────────────────┐   │
│  │                  BullMQ Task Queue                          │   │
│  │    Email sending (verify, reset, notifications)             │   │
│  └──────────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
              ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                     Data Layer                                      │
│                                                                     │
│   ┌─────────────────────┐      ┌─────────────────────────────────┐ │
│   │      MongoDB        │      │            Redis                │ │
│   │  (via Mongoose)     │      │  (BullMQ job persistence)       │ │
│   │                     │      │                                 │ │
│   │  User               │      └─────────────────────────────────┘ │
│   │  Admin              │                                          │
│   │  Session            │      ┌─────────────────────────────────┐ │
│   │  Role               │      │          Cloudinary             │ │
│   │  VisitingPlace      │      │  (Image + Video CDN hosting)    │ │
│   │  VisitingRoutes     │      └─────────────────────────────────┘ │
│   │  UserProgress       │                                          │
│   │  ArPoints           │                                          │
│   │  Quiz               │                                          │
│   │  QuizAttempt        │                                          │
│   └─────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Descriptions

### Client

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **React Router v7** | `react-router-dom` | Client-side SPA routing; role-based route protection via `ProtectedRoute` |
| **RTK Query** | `@reduxjs/toolkit` | Declarative data fetching; auto-caching; mutation invalidation |
| **Redux Store** | `react-redux` | Global auth state; theme preferences |
| **A-Frame** | `aframe.min.js` (local `/vendor/`) | WebGL-powered 3D/AR scene renderer |
| **AR.js** | `aframe-ar.js` (local `/vendor/`) | Location-based AR; GPS entity positioning; webcam feed |
| **WebSocket client** | Native browser `WebSocket` | Real-time bidirectional GPS ↔ proximity data stream |
| **TailwindCSS v4** | `@tailwindcss/vite` | Utility-first styling with custom `crimson` and `navy` color tokens |

### Server

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **express-file-cluster** | Custom framework | File-system-based route auto-discovery; cluster management; model ORM |
| **Mongoose** | `mongoose` | MongoDB schema definition; query abstraction |
| **WebSocket Server** | `ws` | Raw WebSocket server attached to the HTTP server (no polling overhead) |
| **JWT Auth** | `jose` | Stateless token generation; WS ticket minting and verification |
| **Password Hashing** | `bcrypt` | Secure password storage at cost factor 12 |
| **BullMQ** | `bullmq` | Redis-backed job queue for async email delivery |
| **Nodemailer** | `nodemailer` | SMTP email delivery for account verification and password reset |

---

## Request Lifecycle — REST API

```
Browser
  │  HTTP Request (Cookie: access_token=<JWT>)
  ▼
Express Middleware Stack
  │  CORS check → Cookie parser → Body parser
  ▼
express-file-cluster Router
  │  Maps URL path to src/api/**/*.ts via filesystem
  ▼
Route Middleware (requireAuth)
  │  Verifies JWT → attaches req.user = { id, role, email }
  ▼
Route Handler (GET / POST / PUT / DELETE)
  │  Calls Mongoose model methods
  ▼
MongoDB
  │  Returns document(s)
  ▼
JSON Response
```

---

## Request Lifecycle — WebSocket (Pathfinder)

```
Browser (PathfinderPage)
  │
  ├─── 1. POST /api/user-progress (seed progress record)
  ├─── 2. POST /api/auth/ws-ticket (get short-lived JWT ticket)
  └─── 3. WS connect: ws://server/ws/pathfinder?ticket=<JWT>&visiting_place_id=<id>
               │
               ▼ Server: pathfinder.ts
               │  jwtVerify(ticket) → extract userId, role
               │  VisitingPlace.findById(visiting_place_id) → validate place exists
               │  wss.handleUpgrade → emit 'connection'
               │
               ├─── Client sends: { type: "location", lat, long }
               │       → evaluateProximity(userId, placeId, lat, long)
               │          → seedUserProgress (idempotent)
               │          → find next unvisited route
               │          → haversineDistanceMeters(user, waypoint)
               │          → bearingDegrees(user, waypoint)
               │       → send: { type: "progress", nextWaypoint, distanceMeters, bearingDegrees, arrived, allVisited }
               │
               └─── Client sends: { type: "confirm_visit", route_id }
                       → confirmVisit(userId, placeId, routeId, lat, long)
                          → validate: correct route? within threshold?
                          → UserProgress.update(route_progress[i].visited = true)
                          → if all visited: awardPoints(PLACE_COMPLETE_POINTS)
                                           VisitingPlace.visitor_count++
                          → if milestone: awardPoints(MILESTONE_POINTS)
                                          User.milestones.push({ name, earned_at })
                          → if side_quest: awardPoints(SIDE_QUEST_POINTS)
                       → send: { type: "visit_result", confirmed, reason? }
                       → send: { type: "progress", ... }
```

---

## Multi-Process Cluster Architecture

The server runs as a Node.js cluster with:
- **1 Primary process** — spawns workers; does not handle HTTP traffic.
- **2 Worker processes** — each runs a full Express + WebSocket server, sharing the same port via OS load balancing.
- **Graceful shutdown** — `gracefulShutdown()` drains in-flight requests before SIGTERM kills workers.

```
Primary (PID: N)
├── Worker 1 (PID: N+1) → HTTP + WS server on port 3000
└── Worker 2 (PID: N+2) → HTTP + WS server on port 3000
```

This provides horizontal scalability within a single machine. The cluster mode is toggled via `efc.config.ts`: `cluster: true, workers: 2`.

---

## Authentication Architecture

```
Registration → bcrypt.hash(password, 12) → store in User.password
Login       → bcrypt.compare → sign accessToken (15 min) + refreshToken (7 days)
            → set HttpOnly cookies (inaccessible to JS; CSRF-safe)

Protected Request
  → Cookie: access_token=<JWT>
  → requireAuth middleware: jwtVerify(token, JWT_SECRET)
  → attach req.user = decoded payload

Token Refresh
  → POST /api/auth/refresh
  → read refreshToken cookie → verify → issue new accessToken

WebSocket Auth (Ticket Pattern)
  → POST /api/auth/ws-ticket → issue short-lived JWT { purpose: "ws-ticket" }
  → WS URL includes ?ticket=<JWT>
  → Server verifies ticket on upgrade (before WebSocket handshake)
  → Prevents credential exposure in WS URL log entries
```

---

## Environment Variables

### Server (`.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | HTTP listen port (default: 3000) |
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | HMAC secret for all JWT signing |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `REDIS_URL` | Redis connection string (for BullMQ) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_USER` | SMTP credentials |
| `SMTP_PASS` | SMTP password |

### Client (`.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for REST API calls |
| `VITE_WS_URL` | WebSocket base URL (e.g. `wss://api.example.com`) |
