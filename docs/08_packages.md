# 08 — Packages & Dependencies

## Client Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.7 | UI component library; concurrent rendering; React Server Components-ready |
| `react-dom` | ^19.2.7 | DOM renderer for React |
| `react-router-dom` | ^7.18.1 | Client-side routing; `createBrowserRouter`; `RouterProvider`; typed route params |
| `@reduxjs/toolkit` | ^2.12.0 | Redux state management; `createSlice`; **RTK Query** for data fetching; `configureStore` |
| `react-redux` | ^9.3.0 | React bindings for Redux; `Provider`; `useSelector`; `useDispatch` |
| `lucide-react` | ^1.24.0 | Icon library; tree-shakeable SVG icons used throughout the UI |
| `cartoon-avatar` | ^1.0.2 | Generates deterministic cartoon avatars from a user ID string for default profile pictures |

### Dev / Build

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^8.1.1 | Build tool and dev server; HMR; ES module bundling |
| `@vitejs/plugin-react` | ^6.0.3 | Vite plugin for React (Babel transform + Fast Refresh) |
| `tailwindcss` | ^4.3.2 | Utility-first CSS framework (v4 — CSS-native config, no `tailwind.config.js`) |
| `@tailwindcss/vite` | ^4.3.2 | Vite plugin for TailwindCSS v4 integration |
| `typescript` | ~6.0.2 | TypeScript compiler (strict mode enabled) |
| `@types/react` | ^19.2.17 | TypeScript type definitions for React 19 |
| `@types/react-dom` | ^19.2.3 | TypeScript type definitions for React DOM |
| `@types/node` | ^24.13.2 | TypeScript types for Node.js globals (used in Vite config) |
| `eslint` | ^10.6.0 | JavaScript/TypeScript linter |
| `typescript-eslint` | ^8.62.0 | TypeScript-aware ESLint rules |
| `eslint-plugin-react-hooks` | ^7.1.1 | Enforces Rules of Hooks and exhaustive deps |
| `eslint-plugin-react-refresh` | ^0.5.3 | Prevents Fast Refresh issues with non-component exports |
| `@eslint/js` | ^10.6.0 | ESLint's recommended JS ruleset |
| `globals` | ^17.7.0 | Global variable definitions for browser/Node environments |

### Bundled AR Libraries (not npm — local `/vendor/`)

| Library | Version | Source |
|---------|---------|--------|
| A-Frame | 1.6.0 | `public/vendor/aframe.min.js` |
| AR.js (threex location-only) | 3.4.7 | `public/vendor/ar-threex-location-only.js` |
| A-Frame AR.js bridge | 3.4.7 | `public/vendor/aframe-ar.js` |

These are loaded via `loadScript()` at runtime only when AR mode is activated, keeping the initial page load fast.

---

## Server Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `express-file-cluster` | ^0.3.0 | Core framework: file-system routing, model ORM, cluster management, JWT auth, task queue integration. The custom backbone of the entire server. |
| `mongoose` | ^8.0.0 | MongoDB ODM; schema definition; query builder. Used by EFC's `defineModel` under the hood and directly in seed scripts. |
| `ws` | ^8.21.0 | Raw WebSocket server library. Attached to the HTTP server for the `/ws/pathfinder` endpoint. Chosen over `socket.io` for minimal overhead — no polling, no namespaces, no rooms. |
| `jose` | ^6.2.3 | Modern JWT library (IETF-standard); used for signing/verifying JWTs including WS tickets. Supports the `EdDSA`, `RS256`, `HS256` algorithms. |
| `bcrypt` | ^5.1.0 | Password hashing using the bcrypt algorithm (cost factor 12). Industry standard for slow, salted password storage. |
| `bullmq` | ^5.0.0 | Redis-backed job queue. Used for async email delivery (email verification, password reset) to avoid blocking the request/response cycle. |
| `nodemailer` | ^6.9.0 | SMTP email client. Used by BullMQ task workers to send transactional emails. |

### Dev

| Package | Version | Purpose |
|---------|---------|---------|
| `tsx` | ^4.0.0 | TypeScript execution for Node.js (no compile step). Used to run seed scripts directly: `tsx src/scripts/seedOrchid.ts`. |
| `tsup` | ^8.2.0 | TypeScript bundler; used by `efc build prod` to compile the server to `dist/`. |
| `typescript` | ^5.5.0 | TypeScript compiler. |
| `@types/bcrypt` | ^5.0.0 | Types for bcrypt |
| `@types/express` | ^4.17.21 | Types for Express.js (used in route handlers) |
| `@types/node` | ^22.0.0 | Types for Node.js builtins |
| `@types/nodemailer` | ^6.4.0 | Types for Nodemailer |
| `@types/ws` | ^8.18.1 | Types for `ws` WebSocket library |
| `vitest` | ^4.1.9 | Unit test runner (Vite-native; compatible with EFC's test task runner) |

---

## Library Choice Rationale

### Why `express-file-cluster` instead of vanilla Express?

`express-file-cluster` (EFC) was chosen to eliminate the boilerplate of manual route registration, cluster setup, and model wiring. Key benefits:
- **File-system routing** — adding a new endpoint requires creating one file, not editing an `index.ts` barrel.
- **Built-in clustering** — `cluster: true, workers: 2` in config handles fork/restart automatically.
- **Integrated ORM** — `defineModel` wraps Mongoose to produce typed models with consistent `id` normalisation.
- **Auth strategy** — `authStrategy: "http-only"` configures cookie-based JWT auth without writing the middleware.

### Why `ws` instead of `socket.io`?

1. **Zero overhead** — `socket.io` adds polling fallback, namespaces, and rooms. None of these are needed for the Pathfinder's one-way GPS stream.
2. **Simpler auth** — The ticket pattern (short-lived JWT in URL query param, verified on `upgrade`) is straightforward with raw `ws` and avoids `socket.io`'s custom auth hooks.
3. **Smaller bundle** — `ws` is ~45 KB; `socket.io` is ~200 KB.

### Why RTK Query instead of React Query?

RTK Query is already included with `@reduxjs/toolkit` (zero extra dependency). It co-locates API definition with the Redux store, making cache invalidation (e.g. "after confirming a visit, refetch the progress summary") declarative and type-safe.

### Why `jose` instead of `jsonwebtoken`?

`jsonwebtoken` is CommonJS-only and has not been updated to support the `jose` IETF standard APIs. `jose` is ESM-native, actively maintained, and supports all JWT algorithms including EdDSA. Since the server is fully `"type": "module"`, `jose` is the natural choice.

### Why `bcrypt` over `argon2`?

`bcrypt` has wider runtime support (no native compilation issues in Docker/Linux). For a hackathon scope, bcrypt at cost 12 is sufficiently secure. `argon2` would be the preference for a production system under active attack.

### Why BullMQ for email?

Email sending via SMTP can take 200–2000ms. Blocking the login or registration response on email delivery creates poor UX and timeout risk. BullMQ pushes the email job to a Redis queue; the response returns immediately with "check your email", and a background worker delivers the message asynchronously.

### Why TailwindCSS v4?

TailwindCSS v4 uses a CSS-native approach — no `tailwind.config.js` required. Custom color tokens (`crimson`, `navy`) are defined directly in `index.css` using CSS custom properties, making the design system portable to any CSS context. The Vite plugin (`@tailwindcss/vite`) replaces the PostCSS pipeline for faster builds.
