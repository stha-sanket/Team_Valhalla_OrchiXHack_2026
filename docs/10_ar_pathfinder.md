# 10 — AR Pathfinder: Technical Deep Dive

## Overview

The AR Pathfinder is the centrepiece of the application. It combines four real-time data streams — GPS coordinates, device compass heading, WebSocket proximity messages, and A-Frame/AR.js camera rendering — into a cohesive navigation experience.

This document explains the technical choices and implementation details of each subsystem.

---

## 1. GPS Geofencing & Proximity Detection

### Haversine Distance Formula

All proximity calculations use the **Haversine formula** — the standard great-circle distance calculation for GPS coordinates. It accounts for Earth's curvature and returns the shortest surface distance in metres.

```typescript
// server/src/lib/proximity.ts
function haversineDistanceMeters(lat1, long1, lat2, long2): number {
  const R = 6371000; // Earth radius in metres
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(long2 - long1);
  const a = Math.sin(dPhi/2)**2 + Math.cos(phi1)*Math.cos(phi2)*Math.sin(dLambda/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

For the distances involved (< 500 m in a campus route), Haversine accuracy is within 1 cm — more than sufficient given that consumer GPS accuracy is 3–5 m outdoors.

### Geofence Threshold

The `visit_threshold_meters` field on `VisitingPlace` defines the radius within which the user is considered "arrived" at a waypoint. The default is **10 metres**.

This is a per-place configurable value rather than a global constant, because:
- Dense urban environments may require a smaller threshold to prevent false arrivals at adjacent buildings.
- Large open spaces (a parking area) may need a larger threshold to account for GPS drift.
- Admins can tune this without a code deployment.

### Two-Phase Arrival

Arrival is a **two-step process**:
1. **Detection** — `evaluateProximity()` returns `arrived: true` when `distance <= threshold`. The client shows an arrival prompt but does NOT mark the waypoint visited yet.
2. **Confirmation** — User taps "I am here" (or the video ends). Client sends `confirm_visit`. Server re-runs the distance check (using the last reported location) before marking `visited: true`.

This prevents GPS glitches from accidentally completing waypoints without the user physically being there. The last known location is stored in the WebSocket connection's closure (`lastLocation`), not re-reported by the client on confirmation.

---

## 2. Bearing Calculation

The bearing (compass direction from user to next waypoint) is used to rotate the HUD arrow.

```typescript
function bearingDegrees(lat1, long1, lat2, long2): number {
  const dLng = toRad(long2 - long1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const x = Math.sin(dLng) * Math.cos(phi2);
  const y = Math.cos(phi1)*Math.sin(phi2) - Math.sin(phi1)*Math.cos(phi2)*Math.cos(dLng);
  return ((Math.atan2(x, y) * 180/Math.PI) + 360) % 360;
}
```

The result is a true north bearing (0°=North, 90°=East, 180°=South, 270°=West).

The client subtracts the device's compass heading from this bearing to get the **relative bearing** — how many degrees the waypoint is from the direction the user is currently facing. This relative angle drives the HUD arrow rotation.

---

## 3. Device Compass (Device Orientation API)

### API Choice

The `DeviceOrientationEvent` provides heading data. Two variants are handled:

| Property | Platform | Absolute? |
|----------|----------|-----------|
| `e.webkitCompassHeading` | iOS (Safari) | ✅ Absolute (magnetic north) |
| `e.alpha` with `e.absolute = true` | Android Chrome | ✅ Absolute |
| `e.alpha` without absolute | Other/Desktop | ⚠️ Relative to arbitrary start |

When `absolute = false`, the app shows a `calibrating` banner, informing the user the compass may be unreliable.

### iOS Permission Gate

iOS 13+ requires explicit user gesture to request `DeviceOrientationEvent` permission:

```typescript
const DOE = window.DeviceOrientationEvent as { requestPermission?: () => Promise<string> };
if (typeof DOE?.requestPermission === 'function') {
  const result = await DOE.requestPermission();
  if (result !== 'granted') { /* show error, abort */ }
}
```

This is why the `start()` function must be called from a button click (user gesture), not programmatically.

### Heading Smoothing

Raw compass readings are noisy — they jump ±5° every frame, causing the arrow to jitter visibly. A **low-pass filter** (exponential moving average) smooths the heading:

```typescript
let diff = rawHeading - prev;
diff = (((diff + 180) % 360) + 360) % 360 - 180; // Shortest angular path
smoothedHeading = (prev + 0.15 * diff + 360) % 360;
```

The factor `0.15` (15% weight to new reading, 85% to history) was tuned empirically — it eliminates jitter while still responding to directional changes within ~2 seconds.

### Imperative Arrow Updates (No Re-renders)

The compass heading arrives at up to 60 Hz (`deviceorientation` fires on every frame). If each heading update triggered a React state update (`setState`), the component would re-render 60 times per second — causing severe jank.

Instead, the arrow SVG is updated **imperatively** via a `ref`:

```typescript
const arrowSvgRef = useRef<SVGSVGElement>(null);
const smoothedHeadingRef = useRef<number>(null); // Not state

const updateArrow = () => {
  const rel = msg.bearingDegrees - smoothedHeadingRef.current;
  arrowSvgRef.current.style.transform = `rotate(${rel}deg)`;
  distTextRef.current.textContent = `${distance} m`;
};
```

Only `headingDisplay` (the numeric readout) goes through React state — it updates at ~2 Hz via the smoothed heading value, acceptable for a display label.

---

## 4. AR Camera (A-Frame + AR.js)

### Scene Architecture

The A-Frame `<a-scene>` is injected **outside the React component tree** — directly as a child of `<body>`:

```typescript
useEffect(() => {
  let root = document.getElementById('ar-scene-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ar-scene-root';
    root.innerHTML = AR_SCENE_HTML;
    document.body.appendChild(root);
  }
  return () => {
    // Cleanup: stop webcam tracks, remove scene
    root.querySelectorAll('video').forEach(v => {
      const stream = v.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    });
    root.remove();
    document.getElementById('arjs-video')?.remove();
    document.documentElement.classList.remove('a-fullscreen');
  };
}, [arReady]);
```

This is required by A-Frame's architecture: the `<a-scene>` must be a direct child of `<body>` (not embedded in a div) so its fixed fullscreen canvas sizes correctly relative to the viewport. Embedding it in a React container breaks the `videoTexture` webcam feed sizing (manifests as a black screen).

### AR.js Configuration

```html
<a-scene
  vr-mode-ui="enabled: false"
  arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false"
  renderer="antialias: true; alpha: true"
  loading-screen="enabled: false">
  <a-camera
    id="camera"
    gps-new-camera="gpsMinDistance: 3"
    arjs-device-orientation-controls="smoothingFactor: 0.8"
    look-controls-enabled="false">
  </a-camera>
</a-scene>
```

| Attribute | Value | Reason |
|-----------|-------|--------|
| `sourceType: webcam` | webcam | Use device rear camera |
| `videoTexture: true` | true | Render camera feed as WebGL texture (better performance than CSS overlay) |
| `debugUIEnabled: false` | false | Hides AR.js debug information in production |
| `alpha: true` | true | Transparent renderer background (webcam shows through) |
| `gpsMinDistance: 3` | 3 metres | Minimum GPS movement to trigger camera entity repositioning (prevents jitter on stationary phone) |
| `smoothingFactor: 0.8` | 0.8 | AR.js device orientation smoothing |
| `look-controls-enabled: false` | false | Prevents mouse/touch dragging the camera — we use GPS-only orientation |

### AR Video Entities (THREE.js World Space)

When a milestone or side quest video needs to play in AR, an `<a-video>` entity is created and positioned in 3D space:

```typescript
// Get camera's world position
const camPos = new THREE.Vector3();
camObj.getWorldPosition(camPos);

// Project forward direction (flatten to horizontal plane)
const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
dir.y = 0; dir.normalize();

// Place video 4 metres in front of camera
const pos = camPos.clone().add(dir.multiplyScalar(4));

const entity = document.createElement('a-video');
entity.setAttribute('src', `#ar-video-src-${waypoint.id}`);
entity.setAttribute('width', '3.55');
entity.setAttribute('height', '2');
entity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
```

### The GPS Jitter Problem

The `gps-new-camera` component teleports the A-Frame camera's `position` on GPS updates. If the video entity were anchored by GPS coordinates, it would jitter or jump as the phone's GPS satellite lock changes. 

**Solution:** The video entity is anchored relative to the camera's world position at spawn time (offset `4m forward`), then **re-glued every animation frame** using `requestAnimationFrame`:

```typescript
const follow = () => {
  camObj.getWorldPosition(camPos);
  obj.position.set(
    camPos.x + offset.x,
    camPos.y + offset.y,
    camPos.z + offset.z
  );
  rafId = requestAnimationFrame(follow);
};
```

The video's **rotation** is set once (looking at the camera at spawn time) and never changed — so the video feels "placed in the world" (looking around pans away from it) but follows the camera's translation to stay 4m away. This is the correct AR anchoring model for indoor/close-range content.

---

## 5. WebSocket Connection Management

### Connection Lifecycle

```
start(placeId)
  │
  ├── Seed progress: POST /api/user-progress
  ├── Get ticket: POST /api/auth/ws-ticket
  └── Connect: new WebSocket(`${WS_URL}/ws/pathfinder?ticket=...&visiting_place_id=...`)
          │
          ws.onopen
            ├── navigator.geolocation.watchPosition(...)  ← starts GPS stream
            └── setPhase('active')  ← shows AR view
          │
          ws.onmessage
            ├── type: "progress" → setProgressMsg(msg)
            └── type: "visit_result" → showToast
          │
stopNavigation()
  ├── ws.close()
  ├── navigator.geolocation.clearWatch(watchId)
  ├── clearTimeout(toastTimer)
  ├── clearInterval(sideQuestInterval)
  └── removeEventListener(deviceorientation, handler)
```

The WebSocket is closed and all native subscriptions are cleaned up on:
- User tapping the back button (exitNavigation).
- React effect cleanup on component unmount.

### Demo Mode

Demo mode bypasses the WebSocket entirely. Instead of sending real GPS coordinates, it uses a hardcoded array of `DEMO_WAYPOINTS` that mirrors the real Orchid College route. The user taps "Simulate Arrival" to manually trigger the arrival state for each waypoint, advancing through the full flow (compass, media overlays, confirm dialogs) without physical GPS.

This is essential for:
- Indoor testing (no GPS signal).
- Hackathon demos (run on stage reliably regardless of GPS lock).
- QA of the full AR flow without walking the actual route.

---

## 6. Script Loading Strategy

A-Frame and AR.js are loaded dynamically via `loadScript()` only when AR mode is activated:

```typescript
await loadScript('/vendor/aframe.min.js');
await loadScript('/vendor/ar-threex-location-only.js');
await loadScript('/vendor/aframe-ar.js');
```

Each call injects a `<script>` tag and resolves when `onload` fires. Scripts are loaded sequentially (not parallel) because AR.js depends on A-Frame's global `THREE` object being available.

Loading from `/vendor/` (local files) rather than CDN:
1. Eliminates ad-blocker failures.
2. Guarantees version pinning (A-Frame 1.6.0 + AR.js 3.4.7).
3. Works offline on LAN development tunnels.

---

## 7. Graceful Degradation

The AR system degrades gracefully at every failure point:

| Failure | Fallback |
|---------|---------|
| Non-HTTPS context | AR camera skipped; compass HUD still active; error banner shown |
| Script load failure | `arError` state shown; compass HUD still active |
| iOS compass permission denied | Gate error shown; navigation aborted |
| Geolocation not supported | Gate error shown; navigation aborted |
| WebSocket connection failure | Gate error shown; returns to place selection |
| GPS unavailable after 20s | `timeout: 20000` on `watchPosition`; no crash |
| Video autoplay blocked (iOS) | `videoNeedsTap` state → tap-to-play overlay |

The design principle is: **the compass arrow is always the fallback**. Even without AR.js and without GPS lock, a user can orient themselves using the device's compass alone.

---

## 8. The Orchid College Route (Production Data)

The only route currently seeded in the database is the Orchid College route, derived from `orchid.txt`.

| Index | Name | Type | Coordinates | Media |
|-------|------|------|------------|-------|
| 0 | Orchid College of Management | `start` | 27.702018, 85.348198 | Image (campus entrance) |
| 1 | Right Turn | `node` | 27.702294, 85.347675 | Image (turn arrow) |
| 2 | Orchid Parking Area | `milestone` | 27.701960, 85.347353 | Video (parking area story) |
| 3 | Left Turn | `node` | 27.701961, 85.347259 | Image (turn arrow) |
| 4 | Bishwajit Medical Hall | `side_quest` | 27.702062, 85.347112 | Video (medical hall story) |
| 5 | Left Turn | `node` | 27.702437, 85.346749 | Image (turn arrow) |
| 6 | Orchid International College | `milestone` | 27.702317, 85.346659 | Video (student testimonial) |
| 7 | Orchid International College | `end` | 27.702247, 85.346473 | Image (arrival) |

**Total route distance:** ~400 metres (walking ~5–7 minutes).  
**Geofence threshold:** 10 metres per waypoint.  
**Badge:** OIC logo (`https://www.oic.edu.np/wp-content/uploads/2020/05/logo.png`).
