# Architecture Overview

## Module Map

```
┌─────────────────────────────────────────────────────────────┐
│                     Yatri AR App                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  index.html  │ explore.html │navigate.html │  quiz.html     │
│  Home / Hero │ Site Catalog │ AR Compass   │  Trivia Quiz   │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┘                │
                       │                              │
          ┌────────────▼────────────┐   ┌─────────────▼──────┐
          │    assets/js/           │   │  assets/js/         │
          │  sites-data.js          │   │  quiz-data.js       │
          │  (8 UNESCO sites DB)    │   │  (20 Q&A dataset)   │
          └──────┬──────────────────┘   └────────────────────┘
                 │
    ┌────────────┴───────────────┐
    │         assets/js/         │
    ├────────────────────────────┤
    │  geo.js      │ ar-engine.js│
    │  Bearing     │ A-Frame     │
    │  Distance    │ GPS entity  │
    │  Haversine   │ 3D marker   │
    │  Smoothing   │ Audio/Haptic│
    └────────────────────────────┘
```

## Data Flow: AR Navigation

```
User taps "Start Navigating"
    │
    ▼
[Gate Screen] ──requests──► iOS DeviceOrientation permission
    │                         GPS geolocation permission
    ▼
[Loading] ── watchPosition ──► GPS fix received
    │
    ▼
[AR Scene Active]
    │
    ├── A-Frame Camera (webcam + GPS overlay)
    │       └── gps-new-camera: tracks user position in 3D space
    │
    ├── Destination Marker (ArEngine.createDestinationMarker)
    │       └── gps-new-entity-place: places 3D pin at site coords
    │
    ├── Waypoint Trail (ArEngine.createWaypointTrail)
    │       └── Interpolated GPS breadcrumbs between user→destination
    │
    └── HUD Compass Arrow (SVG, pure CSS rotation)
            │
            ├── deviceorientationabsolute (Android)
            ├── webkitCompassHeading (iOS)
            │
            └── GeoUtils.calculateBearing(user, dest) - heading
                = relativeAngle → CSS rotate(deg) on SVG arrow
```

## Key Design Decisions

### Why a 2D SVG HUD arrow instead of a 3D A-Frame entity?
GPS entities in AR.js can "stick" to the camera or drift due to sensor noise.
The SVG HUD arrow is deterministic — it always rotates by `bearing - heading` which is a pure math operation unaffected by AR.js rendering issues.

### Why smoothedHeading (k=0.15)?
Raw compass data fluctuates ±5–10° even when stationary. A 15% low-pass filter eliminates jitter while remaining responsive to genuine turning. The formula also handles the 0/360° wraparound correctly.

### Why vanilla JS (no frameworks)?
- Zero build step → deploy instantly to GitHub Pages by drag-and-drop
- Smaller bundle → faster load on mobile data connections in Nepal
- A-Frame is already large (2MB+); adding React/Vue would double that
- All pages are independently loadable — progressive enhancement

### localStorage for Quiz History
Quiz scores are stored in `yatri_quiz_history` key in localStorage.
Max 10 entries are kept (FIFO). No server, no user accounts needed.

## External Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| A-Frame | 1.5.0 | WebXR/WebGL 3D rendering |
| AR.js | latest | GPS-based AR (marker-less) |
| Google Fonts | — | Inter + Tiro Devanagari Sanskrit |

All dependencies loaded from CDN — no npm/build required.
