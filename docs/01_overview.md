# 01 — Project Overview

## What Is Orchid AR Campus Explorer?

**Orchid AR Campus Explorer** is a mobile-first, gamified Augmented Reality (AR) navigation platform designed for educational campuses. Built as a hackathon project for OrchiXHack 2026, the platform turns an ordinary campus walkabout into an interactive, story-rich adventure.

Users open the web app, pick a pre-mapped campus route, and are guided in real-time by a live compass arrow. When they physically arrive at a checkpoint, the app uses geofencing to detect their presence, then unlocks location-specific AR media — a video testimonial, a historical image, or a narrative clip — that plays anchored in the real world through the device camera. Users accumulate **AR Points**, earn **milestone badges**, and compete on a community leaderboard, all while learning about the campus.

---

## Problem Statement

> **Existing navigation systems stop at the entrance of heritage sites, leaving visitors without guidance to explore monuments, discover historical significance, or experience Nepal's cultural heritage in a structured and engaging way.**

Nepal welcomed **1.147 million international tourists in 2024**, yet once past the gate of any heritage site or campus, visitors are on their own. Tourism centres are scarce across Nepal ([source](https://andjournal.in/2018/07/13/tourism-importance-prospects-and-challenges-with-special-reference-to-nepal/)), UNESCO explicitly notes that **few World Heritage sites provide accessible digital resources** ([UNESCO Sustainable Tourism Toolkit](https://whc.unesco.org/en/sustainabletourismtoolkit/guide5/)), and UN Tourism identifies digital interpretation as the #1 lever for improving cultural engagement ([UN Tourism & UNESCO Conference, 2018](https://webunwto.s3-eu-west-1.amazonaws.com/imported_images/50679/unwto_unesco_istanbul_conf_concept_note_22.11.2018_en.pdf)).

For campus specifically, orientation events and guided tours are:
- **Passive and forgettable** — a guide speaks, students listen, nothing sticks.
- **Non-scalable** — requires human guides; can't run simultaneously for hundreds of newcomers.
- **Zero data** — no insight into which spots students actually engage with.
- **One-and-done** — no replay value or incentive to revisit.

---

## Solution

Orchid AR Campus Explorer replaces passive tours with a **self-guided, gamified AR experience** that:

1. **Guides users physically** via a real-time compass arrow and GPS distance readout.
2. **Unlocks rich media** (video/image) only when the user is physically at the right spot.
3. **Gamifies exploration** with AR Points (quiz answers, milestone completions, side quests), badge rewards, and a redemption store.
4. **Scales infinitely** — no human guide required; new routes are added via an admin dashboard.
5. **Generates engagement data** — the `visitor_count` field on each place provides organic analytics with zero additional instrumentation.

---

## Core Features

### For Students (Users)
| Feature | Description |
|---------|-------------|
| **AR Pathfinder** | Live compass + GPS waypoint navigation with an A-Frame/AR.js camera overlay |
| **Checkpoint Media** | Images and videos unlocked on physical arrival at each waypoint |
| **Milestone Badges** | Digital badges awarded on completing all milestone stops of a route |
| **Side Quests** | Optional detours requiring a minimum 5-minute on-site stay |
| **AR Points Ledger** | Private virtual currency earned through exploration and quizzes |
| **Reward Redemption** | Points redeemable for tangible campus perks (canteen tea, T-shirts, etc.) |
| **Knowledge Quizzes** | 5-question multiple-choice quizzes unlocked after completing a route |
| **Community Feed** | Public profiles and a People directory to see fellow explorers |
| **Demo Mode** | GPS-free walkthrough for testing the app without going outside |

### For Admins
| Feature | Description |
|---------|-------------|
| **Waypoint Logger** | GUI tool to define and save route coordinates, types, and media |
| **User Management** | List, filter, activate/deactivate all registered users |
| **Admin Dashboard** | Aggregate statistics — total users, places, completion rates |
| **Place CRUD** | Create, update, delete visiting places and all their cascaded route data |
| **Quiz Management** | Seed and manage per-place quizzes |

---

## Technology Choices at a Glance

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript + TailwindCSS v4 |
| State Management | Redux Toolkit (RTK Query for API calls) |
| AR Engine | A-Frame 1.6.0 + AR.js 3.4.7 (location-based) |
| Backend Framework | `express-file-cluster` (EFC) — file-system-routed Express.js |
| Database | MongoDB (via Mongoose) |
| Real-time | WebSocket (`ws` library) with JWT ticket auth |
| Background Jobs | BullMQ (Redis-backed task queue) |
| Auth | HTTP-only cookies, JWT access + refresh tokens, bcrypt |
| Email | Nodemailer (verify email, password reset) |
| Media Hosting | Cloudinary (images and videos) |
| Deployment | Multi-process cluster (2 workers via Node.js `cluster`) |

---

## Product Vision

> *"Every corner of Nepal's heritage — from campus corridors to UNESCO-listed monuments — has a story. Orchid AR makes you the hero of that story."*

The long-term vision is a **platform product** — a white-label heritage and campus exploration engine that any university, museum, or cultural institution can configure with their own routes, media, and reward catalog without touching code. Starting with Orchid College in Kathmandu, the platform proves the complete vertical slice: geo-fenced AR navigation, gamification, and admin tooling, all running on a single deployable binary. The same infrastructure can be pointed at Pashupatinath, Boudhanath, or any of Nepal's 10 UNESCO World Heritage properties.
