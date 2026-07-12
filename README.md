<div align="center">

# ARadhana

**Gamified AR heritage pathfinding — walk to a real landmark, watch it come alive.**

Built for **OrchiXHack 2026** by **Team Valhalla**

[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express File Cluster](https://img.shields.io/badge/express--file--cluster-v0.3-000000)](https://www.npmjs.com/package/express-file-cluster)
[![MongoDB](https://img.shields.io/badge/MongoDB-mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![BullMQ](https://img.shields.io/badge/queue-BullMQ%20%2B%20Redis-DC382D?logo=redis&logoColor=white)](https://docs.bullmq.io/)
[![WebSocket](https://img.shields.io/badge/realtime-WebSocket-4353FF)](https://github.com/websockets/ws)
[![License](https://img.shields.io/badge/license-Hackathon%20Submission-lightgrey)](#license)

</div>

---

## What it solves

Heritage sites and campuses are full of history that visitors walk straight past — no signage budget, no tour guide, no way to know a plaque is 30 meters away. **ARadhana** turns a phone's GPS and camera into a self-guided AR tour:

- **Real-world pathfinding** — a route is a sequence of GPS waypoints (start → turn → milestone → side quest → end). The app tracks the user's live location and tells them where to walk next.
- **AR reveals on arrival** — reaching a checkpoint's geofence unlocks an AR overlay (image or video) rendered directly in the camera view — a historical fact, a testimonial, a directional cue.
- **Side quests & milestones** — some checkpoints are optional detours worth bonus points; others are mandatory route milestones.
- **Points, quizzes & leaderboard** — finishing a place, completing a side quest, or passing a 5-question quiz earns AR points, which show up on a public leaderboard and can be redeemed against a rewards catalog.
- **Admin tooling** — routes, waypoints, quizzes, and users are managed through an admin dashboard, with a dedicated waypoint logger for plotting new checkpoints by walking them.

Two heritage routes are seeded out of the box: **Orchid International College** and **Pashupatinath Temple**.

## Architecture

```
┌──────────────────────────────┐        HTTPS (REST)         ┌───────────────────────────────┐
│            client/           │ ───────────────────────────▶│            server/            │
│  React 19 + Vite + Redux RTK │ ◀───────────────────────────│   express-file-cluster (EFC)  │
│  Query · Tailwind CSS 4      │                              │                                │
│                              │        WSS (live pos.)      │  ┌──────────────────────────┐  │
│  AR camera view (index.html  │ ───────────────────────────▶│  │ /ws/pathfinder (ws + jose)│ │
│  + A-Frame / AR.js)          │ ◀───────────────────────────│  │ proximity + confirm-visit  │ │
└──────────────────────────────┘                              │  └──────────────────────────┘  │
                                                                │                                │
                                                                │  ┌──────────┐   ┌────────────┐ │
                                                                │  │ MongoDB  │   │ Redis+BullMQ│ │
                                                                │  │ (mongoose)│  │ (email tasks│ │
                                                                │  └──────────┘   │  via nodemailer)│
                                                                │                  └────────────┘ │
                                                                └───────────────────────────────┘
```

**Server** (`server/`) — built on [`express-file-cluster`](#acknowledgements): every file under `src/api/**` is a route (`src/api/visiting-places/[id].ts` → `GET/PATCH/DELETE /visiting-places/:id`), `ignite()` clusters the process across CPU cores, and background work (transactional email) runs as a BullMQ task instead of blocking the request. Auth is HTTP-only cookie + JWT (`jose`), with optional TOTP 2FA and role-based access (`user` / `admin`) enforced per route.

Key domains:

- **Auth** — register/login/refresh/logout, forgot/reset password, email verification, 2FA setup/verify/disable.
- **Visiting places & routes** — CRUD for heritage sites and their ordered waypoint sequences (`VisitingPlace`, `VisitingRoutes`).
- **Pathfinder** — a WebSocket channel (`server/src/ws/pathfinder.ts`) authenticated by a short-lived ticket (`/api/ws/ticket`), streaming proximity evaluation (`lib/proximity.ts`, haversine distance against each place's geofence) and confirming visits in real time.
- **Progress & points** — `UserProgress`, `ArPoints`, quiz attempts, and a points-reconciliation script (`scripts/fixPoints.ts`) to recompute totals from source events.
- **Admin** — dashboards, analytics, user/role management, all gated by `requireAuth('admin')`.

**Client** (`client/`) — a React SPA (`react-router-dom` + Redux Toolkit Query for all API/WS state) covering login/register, dashboard, quiz, redeem, public profiles, leaderboard ("People"), and an admin console (dashboard, users, waypoint logger). The actual AR camera experience is a standalone A-Frame/AR.js scene (root `index.html`, mirrored under `extra/heritage-ar-pathfinder.html`) embedded into the pathfinder flow, since AR.js needs a raw `<a-scene>` outside the React render tree.

## Project structure

```
.
├── client/     React + Vite frontend (dashboard, admin console, AR pathfinder UI)
├── server/     express-file-cluster backend (API, WebSocket, models, tasks)
└── extra/      Standalone AR scene + waypoint logger reference pages
```

## Setup

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (for the BullMQ email task queue)
- An SMTP account for transactional email (Gmail app password works fine for dev)

### Server

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, REDIS_URL, SMTP_*, etc.
npm install
npm run dev             # efc start dev — hot-reload, single process
```

Seed sample data as needed:

```bash
npm run seed:admin       # create an admin user
npm run seed:orchid      # Orchid College route + waypoints
npm run seed:pashupati   # Pashupatinath route + waypoints
npm run seed:quiz        # sample quiz
npm run seed:badge       # sample badge/reward data
```

Production build/start:

```bash
efc build prod
efc start prod
```

### Client

```bash
cd client
npm install
```

Create `client/.env` pointing at your running server:

```bash
VITE_API_URL=http://localhost:3000/v1/api
VITE_WS_URL=ws://localhost:3000
```

```bash
npm run dev
```

The client expects the server's REST API at `VITE_API_URL` (e.g. `http://localhost:3000/v1/api`) and the WebSocket pathfinder at `VITE_WS_URL`.

## Contributing

1. Fork/branch off `main`, keep changes scoped to one feature or fix per branch.
2. Follow the existing route/model conventions in `server/src/api` and `server/src/model` — a new endpoint is a new file, not an addition to a router.
3. Run `npm run build` (server) and `npm run lint` (client) before opening a PR.
4. Describe _why_ a change is needed in the PR description, not just what changed.

## Packages

Core dependencies this project stands on:

| Package                                                                                                               | Role                                                           |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`express-file-cluster`](https://efc.prashantadhikari7.com.np)                                                        | Backend framework — file-based routing, clustering, task queue |
| [`mongoose`](https://www.npmjs.com/package/mongoose)                                                                  | MongoDB models                                                 |
| [`bullmq`](https://www.npmjs.com/package/bullmq)                                                                      | Redis-backed background task queue (email)                     |
| [`jose`](https://www.npmjs.com/package/jose)                                                                          | JWT signing/verification (auth + WS tickets)                   |
| [`ws`](https://www.npmjs.com/package/ws)                                                                              | WebSocket server for live pathfinding                          |
| [`nodemailer`](https://www.npmjs.com/package/nodemailer)                                                              | Transactional email                                            |
| [`react`](https://www.npmjs.com/package/react) / [`react-router-dom`](https://www.npmjs.com/package/react-router-dom) | Client SPA + routing                                           |
| [`@reduxjs/toolkit`](https://www.npmjs.com/package/@reduxjs/toolkit)                                                  | Redux Toolkit Query for API/WS state                           |
| [`tailwindcss`](https://www.npmjs.com/package/tailwindcss)                                                            | Styling                                                        |
| [A-Frame](https://aframe.io/) / [AR.js](https://github.com/AR-js-org/AR.js)                                           | WebXR AR camera scene                                          |

## Acknowledgements

This project's entire backend runs on **[express-file-cluster (EFC)](https://www.npmjs.com/package/express-file-cluster)** — an opinionated Express framework where the file tree _is_ the route tree, clustering across CPU cores and a BullMQ task subsystem come from a single `ignite()` call. EFC's routing, auth (`requireAuth`, HTTP-only cookie/JWT strategies), and `defineModel` schema layer are what let this hackathon's backend get built as fast as it did. Thanks to the EFC maintainers for the framework and its documentation.

## Team — Team Valhalla

| Contributor                                       |
| ------------------------------------------------- |
| [Prashant Adhikari](https://github.com/pr4shxnt)  |
| [Sanket Shrestha](https://github.com/stha-sanket) |
| [Rishu Prajapati](https://github.com/ree-suuu)    |

## License

Hackathon submission for OrchiXHack 2026 — no open-source license granted at this time. All rights reserved by Team Valhalla.
