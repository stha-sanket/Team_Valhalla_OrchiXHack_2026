# 09 — Gamification Engine

## Overview

The gamification layer converts physical campus exploration into a tracked, rewarding game loop. It is built around four interlocking systems:

1. **AR Points** — private virtual currency earned through actions
2. **Milestones** — named narrative checkpoints within routes
3. **Badges** — place-level achievement awards
4. **Quizzes** — knowledge challenges unlocked after route completion

All systems are **persistent** (survive progress resets) and **idempotent** (re-confirming a checkpoint cannot farm duplicate rewards).

---

## 1. AR Points Ledger

### Point Constants

| Action | Points | Source Type |
|--------|--------|------------|
| Visiting a milestone waypoint | **10** | `milestone` |
| Completing a side quest (5 min dwell) | **25** | `side_quest` |
| Completing all checkpoints of a place | **20** | `place_complete` |
| Quiz: 0/5 correct | **0** | `quiz` |
| Quiz: 1/5 correct | **10** | `quiz` |
| Quiz: 2/5 correct | **20** | `quiz` |
| Quiz: 3/5 correct | **25** | `quiz` |
| Quiz: 4/5 correct | **30** | `quiz` |
| Quiz: 5/5 correct | **35** | `quiz` |

### Maximum Points for Orchid College Route

| Source | Calculations | Total |
|--------|-------------|-------|
| 2 milestones × 10 | milestone award | 20 |
| 1 side quest × 25 | side_quest award | 25 |
| Place completion | once per place | 20 |
| Perfect quiz | 5/5 correct | 35 |
| **Grand Total** | | **100 AR Points** |

### Ledger Architecture

The `ArPoints` document is a **ledger** (append-only log), not a mutable balance. Every transaction (award or spend) appends an entry. The `total` field is kept in sync as a running balance for O(1) balance reads.

**Idempotency:** The `awardPoints()` function checks whether a `(source, ref_id)` pair already exists in `entries` before writing. This means:
- Re-confirming a waypoint (after a GPS glitch) never double-awards points.
- Progress resets don't affect the ledger — points are permanent even if `UserProgress` is cleared.

```typescript
// Idempotency check in arPoints.ts
const alreadyAwarded = ledger.entries.some(
  (e) => e.source === entry.source && e.ref_id === entry.ref_id
);
if (alreadyAwarded) return null;
```

### Privacy

AR points are **completely private**. The total is visible only on the user's own Dashboard and Profile pages. It is never included in public profile responses, People directory listings, or leaderboard data.

---

## 2. Rewards Catalog

Points are redeemable for tangible campus perks. The catalog is defined server-side in `arPoints.ts` and returned via the AR points API.

| Reward ID | Name | Cost | Description |
|-----------|------|------|-------------|
| `canteen-tea` | Canteen tea voucher | **30 pts** | A free cup of tea at the campus canteen |
| `sticker-pack` | Orchid sticker pack | **60 pts** | Limited-edition Orchid campus stickers |
| `table-tennis` | Table tennis session | **90 pts** | 30 minutes at the table tennis table |
| `orchid-tee` | Orchid T-shirt | **250 pts** | An official Orchid College tee |

### Redemption Flow

1. User visits `/redeem` page.
2. Client calls `GET /api/ar/points` → displays current balance and available rewards.
3. User taps "Redeem" on a reward.
4. Client calls `POST /api/ar/redeem { reward_id: "canteen-tea" }`.
5. Server calls `spendPoints(userId, reward)`:
   - Checks `ledger.total >= reward.cost`.
   - Appends a negative-points entry: `{ source: "redeem", points: -30, label: "Redeemed Canteen tea voucher" }`.
   - Updates `total -= reward.cost`.
6. Server returns `{ ok: true, total: <new balance> }`.
7. Fulfilment is manual — the student shows the app to canteen staff.

**Note:** Unlike awards (which are idempotent by `ref_id`), redemptions can repeat. Each redemption gets a unique `ref_id` (`reward_id:entries.length`) so the ledger retains every transaction.

---

## 3. Milestones

### What Is a Milestone?

A milestone is a `VisitingRoutes` entry with `type: "milestone"`. It represents a significant narrative stop on the route — typically paired with a video that tells the story of that location.

### Milestone Lifecycle

```
User arrives within threshold
        │
        ▼
Video autoplay triggered (via mediaOverlay state)
        │
        ▼
User watches video to completion (videoEnded = true)
        │
        ▼
"I got the history" button appears
        │
        ▼
User taps → confirm_visit WS message sent
        │
        ▼
Server: confirmVisit()
  ├── Marks route_progress[i].visited = true
  ├── awardPoints(MILESTONE_POINTS) → idempotent
  └── User.milestones.push({ name: route.name, earned_at: ISO })
```

### Milestone Persistence

Milestones are embedded directly on the `User` document, not derived from `UserProgress`. This means:
- Even if the user resets progress for a revisit, their milestones are retained.
- The `tripSummaries.ts` badge computation checks both current `UserProgress` AND `User.milestones` to correctly show "Badge earned" after a reset.

---

## 4. Badge System

### Badge Awarding Logic

A badge is awarded when a user completes all milestone checkpoints of a visiting place's route. The computation happens in `buildTripSummaries()`:

```typescript
const badgeEarned =
  milestones.length > 0
    // Place has milestones: badge earned if all are visited NOW or earned ever (on user.milestones)
    ? milestones.every((m) => m.visited) || milestones.every((m) => earnedMilestoneNames.has(m.name))
    // Place has no milestones: badge earned if all stops are visited or place_complete ledger entry exists
    : (totalPoints > 0 && visitedPoints === totalPoints) || completedEver.has(record.visiting_place_id);
```

This dual check (`visited NOW` OR `earned on profile`) makes the badge survive progress resets.

### Badge Display

Badges appear on:
- **Dashboard** → "Earned badges" section (grid of badge images)
- **Explore** → place card shows "Badge earned" pill for completed places
- **Profile** → full milestone and badge summary
- **Public Profile** → visible to other users

Badges are defined by the `VisitingPlace.badge` field (a URL to an image). The Orchid College badge is the OIC logo: `https://www.oic.edu.np/wp-content/uploads/2020/05/logo.png`.

---

## 5. Side Quest System

### What Is a Side Quest?

A side quest is a `VisitingRoutes` entry with `type: "side_quest"`. It is an optional detour from the main route that:
1. Plays a narrative video on arrival.
2. Presents the user with "Accept side quest" or "Skip side quest" choices.
3. If accepted, starts a **5-minute countdown** — the user must remain at the location for the full duration.
4. On countdown completion, the checkpoint is auto-confirmed and AR points are awarded.

### Side Quest Flow

```
Arrival detected (distance ≤ threshold)
        │
        ▼
Video plays automatically (autoPlayedIdRef check prevents replay)
        │
        ▼
Video ends → "Accept / Skip" overlay shown
        │
        ├── Skip → sets mediaOverlay = null; continues route
        │
        └── Accept → startSideQuest(waypoint)
                        │
                        ▼
                   setInterval runs (1 second tick)
                   sideQuestSecondsLeft counts down from 300
                        │
                        ▼ (300 seconds elapsed)
                   sendConfirm(waypoint.id)
                   showToast("Side quest complete!")
                   awardPoints(SIDE_QUEST_POINTS = 25)
```

### Why 5 Minutes?

The 5-minute minimum dwell time ensures the user actually spends time at the side quest location, not just taps to claim points and walks away. It mirrors real-world museum exhibit dwell patterns — meaningful engagement with a location takes at least this long.

---

## 6. Quiz System

### Rules

- One quiz per visiting place (enforced by `unique: true` on `Quiz.visiting_place_id`).
- Always exactly 5 questions.
- Unlocked only after completing all checkpoints of the route.
- One attempt per user, ever (enforced by `QuizAttempt`). After the first attempt, the button switches to "View quiz answers".
- Correct answers are stripped from API responses to regular users — only `admin` gets `correct_index`.

### Scoring

```
QUIZ_POINTS_BY_CORRECT = [0, 10, 20, 25, 30, 35]
```
Index into this array with `correct_count` (0–5) to get points. E.g. 3/5 correct → 25 points.

### Quiz UX Flow

1. After completing a place, the Dashboard shows: "Take the quiz · earn AR points".
2. Tapping navigates to `/quiz/:placeId`.
3. `QuizPage` loads questions (with answers stripped by server).
4. User selects one answer per question and submits.
5. Server scores, records `QuizAttempt`, awards `ArPoints`.
6. User sees a results screen showing which answers were correct, their score, and points earned.
7. On future visits, `/quiz/:placeId` shows the review screen (read-only).

---

## Game Loop Summary

```
New User
    │
    ▼
Register → Verify email
    │
    ▼
Dashboard shows "No trips yet" → CTA to Explore
    │
    ▼
Explore page → pick Orchid College route
    │
    ▼
AR Pathfinder activates (GPS + compass + camera)
    │
    ▼
Walk to next waypoint (compass arrow guides)
    │
    ├── Arrive at NODE → "I am here" → directional image shown
    ├── Arrive at MILESTONE → video plays → "I got the history" → +10 pts, milestone recorded
    ├── Arrive at SIDE_QUEST → video plays → Accept → 5 min timer → +25 pts
    └── Arrive at END → route complete → +20 pts (place_complete)
    │
    ▼
Dashboard: progress bar fills, milestones check off, badge unlocks
    │
    ▼
Quiz unlocked → answer 5 questions → up to +35 pts
    │
    ▼
Total: up to 100 AR pts → Redeem at /redeem
    │
    ▼
Revisit: reset progress → fresh walk → earn from unexplored angles
    │
    ▼
People page: see other explorers, compare milestones
```
