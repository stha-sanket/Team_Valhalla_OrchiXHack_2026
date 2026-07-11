# 03 — Design Thinking

## Overview

The design of Orchid AR Campus Explorer was driven by a rigorous application of the **Stanford d.school Design Thinking** framework: Empathise → Define → Ideate → Prototype → Test. This document traces how each phase shaped the final product.

---

## Phase 1: Empathise

### Methods Used
- Informal interviews with 8 first-year students at Orchid College.
- Observation of the standard campus orientation day.
- Analysis of the campus WhatsApp group chats for recurring lost/confused messages.
- Desk research: Nepal Tourism Statistics 2024, UNESCO Sustainable Tourism Toolkit, UN Tourism & UNESCO Conference 2018 concept note, arXiv:1402.1243 (Destination Information Management Systems).

### Key Findings

| Insight | Source |
|---------|--------|
| "I still don't know where the parking area is after 3 months" | Student interview |
| "The orientation tour was too fast — I couldn't remember where the canteen was" | Observation |
| "I wish there was something to do on campus during free periods" | Student interview |
| Admins spend 3+ hours on orientation day managing tour logistics | Admin interview |
| The campus has significant history but no accessible way to discover it | Research |
| Nepal has only scattered, limited tourism centres — tourists are frequently misled or lost at heritage sites | [Academic source (AND Journal, 2018)](https://andjournal.in/2018/07/13/tourism-importance-prospects-and-challenges-with-special-reference-to-nepal/) |
| UNESCO: Surprisingly few World Heritage sites provide accessible digital visitor resources | [UNESCO Sustainable Tourism Toolkit](https://whc.unesco.org/en/sustainabletourismtoolkit/guide5/) |
| 1.147 million tourists visited Nepal in 2024 — a large addressable audience with no digital navigation inside heritage gates | [Nepal Tourism Statistics 2024](https://tourism.gov.np/content/83/nepal-tourism-statistics-2024/) |

---

## Phase 2: Define

### Problem Statement (HMW)

> **How might we** create a heritage and campus exploration experience that is self-directed, GPS-guided, and story-rich — so that visitors (students, tourists, and prospective enrollees) feel oriented and deeply engaged, while institutions gain digital visibility and zero-hardware navigation infrastructure?

This HMW is grounded in:
- UNESCO's call for centralised visitor information at World Heritage sites
- Nepal's documented shortage of physical tourism centres
- UN Tourism's identification of digital interpretation as the key lever for cultural engagement
- Academic evidence that integrated navigation + information systems significantly improve tourist outcomes

### User Personas

---

**Persona 1: Aarav — The New Freshman**

- **Age:** 18
- **Background:** From outside Kathmandu; first time on campus; doesn't know anyone.
- **Goals:** Find his way around fast; feel like he belongs; share achievements with new friends.
- **Frustrations:** Printed maps are confusing; orientation day was chaotic; GPS apps show nothing campus-specific.
- **Tech comfort:** High — uses smartphone daily; familiar with mobile games and social apps.

---

**Persona 2: Sunita — The Orientation Coordinator**

- **Age:** 34
- **Background:** Administrative staff member responsible for running 3 orientation cohorts per year.
- **Goals:** Reduce manual effort; ensure every student visits key campus facilities; get feedback data.
- **Frustrations:** Volunteer guides are unreliable; students don't follow the tour; no data on what they actually saw.
- **Tech comfort:** Moderate — uses Google Docs, Forms; not a developer.

---

**Persona 3: Rohan — The Achiever**

- **Age:** 20, second-year student.
- **Background:** Competitive; loves mobile games (BGMI, Clash of Clans).
- **Goals:** Earn all badges; max out AR points; see his name at the top of the people list.
- **Frustrations:** Campus apps are boring; nothing to do between classes.
- **Tech comfort:** Very high.

---

### User Journey Map — Aarav's First Day

```
Awareness      → Onboarding    → Exploration   → Achievement   → Retention
─────────────────────────────────────────────────────────────────────────────
Hears about    → Registers     → Opens         → Reaches       → Returns for
the app from   → in 2 min      → Explore tab;  → first         → quiz after
orientation    → (name,        → picks         → milestone;    → class; earns
day flyer      → email,        → Orchid        → video plays   → AR points;
               → password)     → College       → in AR;        → redeems
               →               → route         → badge unlocks → canteen tea
```

---

## Phase 3: Ideate

### Brainstorming (Selected Ideas)

| Idea | Feasibility | Impact | Selected? |
|------|-------------|--------|-----------|
| AR overlays at GPS coordinates | High | High | ✅ Core feature |
| Real-time multiplayer race mode | Low | Medium | ❌ Post-MVP |
| QR code check-ins (no GPS) | High | Low | ❌ No AR value |
| Story-driven video at milestones | High | Very High | ✅ Core feature |
| Physical reward redemption at canteen | High | Very High | ✅ Core feature |
| AR creature encounters (Pokémon-style) | Low | Medium | ❌ Scope risk |
| Social feed of friend activities | Medium | Medium | ✅ People page |
| Knowledge quiz after completion | High | High | ✅ Core feature |
| Optional side quests | High | High | ✅ Core feature |
| Admin waypoint logger GUI | High | Very High | ✅ Admin feature |

### Why Web (PWA) Instead of Native App?

The decision to build as a Progressive Web App (PWA) using React + Vite was deliberate:

1. **No install friction** — students scan a QR code and are in the experience immediately.
2. **Cross-platform** — works on Android Chrome and iOS Safari with the same codebase.
3. **AR.js runs in browser** — location-based AR is mature in web context.
4. **Easier admin distribution** — admins access the same URL; role-based routing handles separation.

---

## Phase 4: Prototype — Design Decisions

### Information Architecture

```
/ (root)
├── /login                  Public
├── /register               Public
└── /dashboard              Authenticated users
    ├── /explore            AR Pathfinder
    ├── /quiz/:placeId      Post-completion quiz
    ├── /redeem             AR Points store
    ├── /people             Community directory
    ├── /people/:id         Public profiles
    ├── /profile            Own profile
    ├── /settings           Preferences
    └── /admin              Admin panel (role-gated)
        ├── /admin/users
        └── /admin/waypoint-logger
```

### Visual Design Language

**Color Palette:**
- **Crimson** (`#E8506D` family) — primary brand accent; used for CTAs, progress bars, AR points badge.
- **Navy** (`#1B2A4A` family) — secondary; used for earned badges, milestone indicators.
- **Stone** (warm grays) — neutral background palette; `#17140F` for dark mode base.
- **Glassmorphism** — cards use `backdrop-blur-2xl` with translucent white/black backgrounds for depth.

**Typography:**
- System font stack with Tailwind's `font-sans`.
- Bold headings with tight tracking; muted uppercase labels for section headers.
- Tabular numerals for AR points counter.

**Motion:**
- `transition-transform` with `active:scale-95` on all interactive elements.
- Progress bars use `duration-700` width transitions.
- Skeleton loading states (pulse animation) on Dashboard while data loads.
- Compass arrow rotation is updated imperatively at 60Hz (no React re-renders).

### Accessibility Decisions

- All icon-only buttons have `aria-label` attributes.
- Dark/light mode toggle respects system preference.
- Toast notifications auto-dismiss after 3.5 seconds (configurable).
- AR error states degrade gracefully to compass-only mode with a visible banner.

### Mobile-First Decisions

- `h-dvh` (dynamic viewport height) used for the AR view to prevent Chrome toolbar overlap.
- Bottom-anchored modal sheets use `pb-[calc(env(safe-area-inset-bottom)+1.5rem)]` for iPhone notch safety.
- `enableHighAccuracy: true` on geolocation for maximum GPS precision outdoors.
- Compass smoothing (`0.15` lerp factor) prevents jitter from raw `DeviceOrientationEvent` data.

---

## Phase 5: Test — Key Validation Points

| Test Scenario | Result | Design Response |
|--------------|--------|-----------------|
| GPS arrival detection too tight (5 m threshold) | Users frustrated — couldn't trigger arrival on their first try | Raised default to 10 m; made it admin-configurable per place |
| AR video autoplay blocked on iOS | Black screen on first load | Added `videoNeedsTap` fallback state with a tap-to-play overlay |
| Compass not working on first launch (iOS) | No arrow movement | Added `DeviceOrientationEvent.requestPermission()` gate before starting |
| Quiz felt like a chore after a long walk | Low quiz completion | Capped at 5 questions; added "View quiz answers" mode after first attempt |
| Users couldn't find the Redeem page | Low redemption rate | Added AR points display to Dashboard header as a prominent CTA |
| Demo mode (no GPS) essential for indoor testing | Confirmed | Implemented full demo mode with simulated arrival buttons |
