import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetVisitingPlacesQuery } from '../store/api/visitingPlaceApi';
import { useStartUserProgressMutation, useGetWsTicketMutation, useGetProgressSummaryQuery, useResetUserProgressMutation } from '../store/api/userProgressApi';
import { useGetPlaceQuizQuery } from '../store/api/arApi';
import { useLazyGetVisitingRoutesQuery } from '../store/api/visitingRoutesApi';
import { Gamepad2, MapPin, Medal, Users } from 'lucide-react';
import { loadScript } from '../lib/loadScript';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';

interface NextWaypoint {
  id: string;
  name: string;
  description: string;
  type: string;
  media?: string;
  video?: string;
  /** Interactive 3D model URL (.glb) — only used by node points. */
  model3d?: string;
  index: number;
  coordinates: { lat: string; long: string };
}

interface ProgressMessage {
  type: 'progress';
  nextWaypoint: NextWaypoint | null;
  distanceMeters: number | null;
  bearingDegrees: number | null;
  arrived: boolean;
  allVisited: boolean;
}

interface VisitResultMessage {
  type: 'visit_result';
  confirmed: boolean;
  reason?: string;
  route_id?: string;
}

interface MediaOverlay {
  kind: 'image' | 'video' | 'model3d';
  waypoint: NextWaypoint;
}

const isVideoUrl = (url?: string) =>
  !!url && (/\.(mp4|webm|mov)(\?|#|$)/i.test(url) || url.includes('/video/upload'));

// Videos live in the dedicated `video` field; older records kept them in `media`.
const waypointVideo = (wp: NextWaypoint) => wp.video ?? (isVideoUrl(wp.media) ? wp.media : undefined);

const SIDE_QUEST_SECONDS = 5 * 60;

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

type Phase = 'gate' | 'loading' | 'active';

// Mirrors the official AR.js location-based example (docs: location-based-aframe):
// the scene must be a non-embedded, direct child of <body> — `embedded` mode breaks
// the videoTexture webcam feed sizing, which shows up as a black screen / no camera.
const AR_SCENE_HTML = `
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
`;

// Quiz action on a completed destination card. Label depends on whether the
// one allowed attempt is already spent; hides itself if the place has no quiz.
const QuizButton = ({ placeId, onOpen }: { placeId: string; onOpen: () => void }) => {
  const { data, isError } = useGetPlaceQuizQuery(placeId);
  if (isError) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform"
    >
      {data?.attempted ? 'View quiz answers' : 'Give quiz'}
    </button>
  );
};

const PathfinderPage = () => {
  const navigate = useNavigate();
  const { data: placesData } = useGetVisitingPlacesQuery();
  const { data: summaryData } = useGetProgressSummaryQuery(undefined, { refetchOnMountOrArgChange: true });
  const [startProgress] = useStartUserProgressMutation();
  const [resetProgress] = useResetUserProgressMutation();
  const [getTicket] = useGetWsTicketMutation();

  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [phase, setPhase] = useState<Phase>('gate');
  const [gateError, setGateError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<ProgressMessage | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [headingDisplay, setHeadingDisplay] = useState<number | null>(null);
  const [arReady, setArReady] = useState(false);
  const [arError, setArError] = useState<string | null>(null);
  const [dismissedWaypointId, setDismissedWaypointId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mediaOverlay, setMediaOverlay] = useState<MediaOverlay | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoNeedsTap, setVideoNeedsTap] = useState(false);
  const [sideQuestSecondsLeft, setSideQuestSecondsLeft] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoPickerOpen, setDemoPickerOpen] = useState(false);
  const [demoWaypoints, setDemoWaypoints] = useState<NextWaypoint[]>([]);
  const [demoPlaceName, setDemoPlaceName] = useState('');
  const [demoLoadingPlaceId, setDemoLoadingPlaceId] = useState<string | null>(null);
  const [fetchRoutes] = useLazyGetVisitingRoutesQuery();

  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const smoothedHeadingRef = useRef<number | null>(null);
  const arrowSvgRef = useRef<SVGSVGElement | null>(null);
  const distTextRef = useRef<HTMLDivElement | null>(null);
  const progressMsgRef = useRef<ProgressMessage | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The handler identity changes every render — keep the reference that was
  // actually registered so removeEventListener detaches the right one.
  const orientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arVideoEntityRef = useRef<HTMLElement | null>(null);
  // Interactive 3D model viewer — a self-contained a-frame scene, independent
  // of the location-based AR camera (the model is hand-held, not world-anchored).
  const model3dContainerRef = useRef<HTMLDivElement | null>(null);
  const sideQuestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Waypoints whose video already auto-started — arrival messages keep coming
  // while standing in range, and the video must not restart on each one.
  const autoPlayedIdRef = useRef<string | null>(null);

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    progressMsgRef.current = progressMsg;
  }, [progressMsg]);

  const places = placesData?.places ?? [];

  // ------------------------------------------------------------------
  // HUD ARROW — imperative on purpose. bearingDegrees comes from the
  // low-frequency WS progress message; smoothedHeading comes from
  // high-frequency deviceorientation events. Rerunning this directly
  // instead of routing everything through React state avoids a 30-60Hz
  // re-render storm from the compass alone.
  // ------------------------------------------------------------------
  const updateArrow = () => {
    const msg = progressMsgRef.current;
    const heading = smoothedHeadingRef.current;
    if (!arrowSvgRef.current || !distTextRef.current) return;

    if (!msg || msg.allVisited || msg.distanceMeters == null || msg.bearingDegrees == null || heading == null) {
      if (msg?.allVisited) {
        distTextRef.current.textContent = "You've arrived";
        distTextRef.current.style.color = '#E8506D';
      }
      return;
    }

    let rel = msg.bearingDegrees - heading;
    rel = (((rel + 180) % 360) + 360) % 360 - 180;
    arrowSvgRef.current.style.transform = `rotate(${rel}deg)`;
    distTextRef.current.style.color = '';
    distTextRef.current.textContent = msg.distanceMeters < 1000 ? `${msg.distanceMeters} m` : `${(msg.distanceMeters / 1000).toFixed(2)} km`;
  };

  useEffect(() => {
    updateArrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressMsg]);

  // Milestones and side quests carry a video: it starts playing on arrival, and
  // the confirm actions only appear once the video has finished.
  useEffect(() => {
    const wp = progressMsg?.nextWaypoint;
    if (!progressMsg?.arrived || !wp) return;
    if ((wp.type === 'milestone' || wp.type === 'side_quest') && waypointVideo(wp) && autoPlayedIdRef.current !== wp.id) {
      autoPlayedIdRef.current = wp.id;
      setVideoEnded(false);
      setMediaOverlay({ kind: 'video', waypoint: wp });
    }
  }, [progressMsg]);

  // Mobile browsers may refuse autoplay with sound — fall back to a tap-to-play button.
  useEffect(() => {
    if (mediaOverlay?.kind !== 'video') return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play()
      .then(() => setVideoNeedsTap(false))
      .catch(() => setVideoNeedsTap(true));
  }, [mediaOverlay]);

  // Anchor the video in AR space, immune to GPS: its ROTATION is fixed in world
  // space (looking around pans off it, like a real anchored object), but its
  // POSITION is re-glued to a constant offset from the camera every frame. The
  // gps-new-camera component teleports the camera on GPS updates — following
  // its translation keeps the plane exactly 4 m from the user's initial POV
  // instead of drifting with satellite jitter.
  useEffect(() => {
    if (mediaOverlay?.kind !== 'video' || !arReady) return;
    const scene = document.querySelector('a-scene') as (HTMLElement & { hasLoaded?: boolean }) | null;
    const cameraEl = document.getElementById('camera') as (HTMLElement & { object3D?: any }) | null;
    if (!scene || !cameraEl) return;

    let rafId: number | null = null;

    const spawn = () => {
      const THREE = (window as any).THREE;
      const camObj = cameraEl.object3D;
      if (!THREE || !camObj) return;

      const camPos = new THREE.Vector3();
      camObj.getWorldPosition(camPos);
      const quat = new THREE.Quaternion();
      camObj.getWorldQuaternion(quat);
      // Project the view direction onto the horizontal plane so the video sits
      // upright at eye height even if the phone is tilted at spawn time.
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
      dir.y = 0;
      if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1);
      dir.normalize();
      const offset = dir.multiplyScalar(4); // constant camera→video offset
      const pos = camPos.clone().add(offset);

      const entity = document.createElement('a-video') as HTMLElement & { object3D?: any };
      // Unique per waypoint: A-Frame caches video textures by selector string,
      // so reusing one id would replay the PREVIOUS video's frozen texture.
      entity.setAttribute('src', `#ar-video-src-${mediaOverlay.waypoint.id}`);
      // Match the plane to the video's own aspect ratio (no forced landscape):
      // fit inside a 3.55 m × 2.6 m box, so portrait videos stay tall and
      // narrow instead of being stretched onto a 16:9 plane.
      const sizeToVideo = () => {
        const vw = videoRef.current?.videoWidth;
        const vh = videoRef.current?.videoHeight;
        let w = 3.55;
        let h = 2;
        if (vw && vh) {
          const aspect = vw / vh;
          w = 3.55;
          h = w / aspect;
          if (h > 2.6) {
            h = 2.6;
            w = h * aspect;
          }
        }
        entity.setAttribute('width', String(w));
        entity.setAttribute('height', String(h));
      };
      if (videoRef.current && videoRef.current.readyState >= HTMLMediaElement.HAVE_METADATA) {
        sizeToVideo();
      } else {
        sizeToVideo(); // provisional 16:9 until the metadata arrives
        videoRef.current?.addEventListener('loadedmetadata', sizeToVideo, { once: true });
      }
      entity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
      entity.addEventListener('loaded', () => {
        entity.object3D?.lookAt(camPos); // orientation set once, then frozen
      });
      scene.appendChild(entity);
      arVideoEntityRef.current = entity;

      const follow = () => {
        const obj = entity.object3D;
        if (obj) {
          camObj.getWorldPosition(camPos);
          obj.position.set(camPos.x + offset.x, camPos.y + offset.y, camPos.z + offset.z);
        }
        rafId = requestAnimationFrame(follow);
      };
      rafId = requestAnimationFrame(follow);
    };

    if (scene.hasLoaded) spawn();
    else scene.addEventListener('loaded', spawn, { once: true });

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      arVideoEntityRef.current?.remove();
      arVideoEntityRef.current = null;
    };
  }, [mediaOverlay, arReady]);

  // Nodes may carry an interactive 3D model — shown once on arrival, alongside
  // its description. Independent of the video flow above and of the location-AR
  // camera: the model isn't anchored in world space, it's a hand-held object.
  useEffect(() => {
    const wp = progressMsg?.nextWaypoint;
    if (!progressMsg?.arrived || !wp) return;
    if (wp.type === 'node' && wp.model3d && autoPlayedIdRef.current !== wp.id) {
      autoPlayedIdRef.current = wp.id;
      setMediaOverlay({ kind: 'model3d', waypoint: wp });
    }
  }, [progressMsg]);

  // Mount a small self-contained a-frame scene (not the location-AR one) to view
  // the model, with manual drag-to-rotate and pinch/wheel-to-zoom — deliberately
  // NOT pinned at a fixed distance from the camera like the AR video plane, so it
  // behaves like a handheld object instead of being stuck 3 m out in the world.
  useEffect(() => {
    if (mediaOverlay?.kind !== 'model3d') return;
    const AFRAME = (window as any).AFRAME;
    const container = model3dContainerRef.current;
    if (!AFRAME || !container) return;

    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('loading-screen', 'enabled: false');
    scene.setAttribute('renderer', 'alpha: true');
    scene.style.width = '100%';
    scene.style.height = '100%';

    const entity = document.createElement('a-entity') as HTMLElement & { object3D?: any };
    entity.setAttribute('gltf-model', `url(${mediaOverlay.waypoint.model3d})`);
    scene.appendChild(entity);

    // Plain a-entity (no look-controls/wasd-controls) — the camera stays fixed;
    // all interaction below rotates/zooms the model itself instead.
    const camera = document.createElement('a-entity');
    camera.setAttribute('camera', '');
    camera.setAttribute('position', '0 0 0');
    scene.appendChild(camera);

    container.appendChild(scene);

    let rotX = 0;
    let rotY = 0;
    let distance = 3;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let pinchStartDist: number | null = null;
    let pinchStartDistance = distance;

    const applyTransform = () => {
      const obj = entity.object3D;
      if (!obj) return;
      obj.rotation.set(rotX, rotY, 0);
      obj.position.set(0, 0, -distance);
    };
    entity.addEventListener('model-loaded', applyTransform);
    applyTransform();

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      rotY += dx * 0.01;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.01));
      applyTransform();
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.max(1.2, Math.min(8, distance + e.deltaY * 0.005));
      applyTransform();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchStartDist == null) {
        pinchStartDist = dist;
        pinchStartDistance = distance;
      } else {
        distance = Math.max(1.2, Math.min(8, pinchStartDistance * (pinchStartDist / dist)));
        applyTransform();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDist = null;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      scene.remove();
    };
  }, [mediaOverlay]);

  const applyHeading = (rawHeading: number) => {
    if (rawHeading == null || Number.isNaN(rawHeading)) return;
    const prev = smoothedHeadingRef.current;
    if (prev == null) {
      smoothedHeadingRef.current = rawHeading;
    } else {
      let diff = rawHeading - prev;
      diff = (((diff + 180) % 360) + 360) % 360 - 180;
      smoothedHeadingRef.current = (prev + 0.15 * diff + 360) % 360;
    }
    setHeadingDisplay(Math.round(smoothedHeadingRef.current));
    updateArrow();
  };

  const onOrientation = (e: DeviceOrientationEvent) => {
    const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof webkitHeading === 'number') {
      applyHeading(webkitHeading);
      setCalibrating(false);
    } else if ((e as unknown as { absolute?: boolean }).absolute && e.alpha != null) {
      applyHeading((360 - e.alpha) % 360);
      setCalibrating(false);
    } else if (e.alpha != null) {
      applyHeading((360 - e.alpha) % 360);
      setCalibrating(true);
    }
  };

  const connectWebSocket = async (visitingPlaceId: string) => {
    await startProgress({ visiting_place_id: visitingPlaceId }).unwrap();
    const { ticket } = await getTicket().unwrap();

    const ws = new WebSocket(`${WS_URL}/ws/pathfinder?ticket=${ticket}&visiting_place_id=${visitingPlaceId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ProgressMessage | VisitResultMessage;
        if (msg.type === 'progress') {
          setProgressMsg(msg);
          // Once we walk out of range, allow the prompt to reappear on the next arrival.
          if (!msg.arrived) setDismissedWaypointId(null);
        } else if (msg.type === 'visit_result') {
          setConfirming(false);
          if (msg.confirmed) {
            showToast('Checkpoint reached!');
          } else if (msg.reason) {
            showToast(msg.reason);
          }
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onopen = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'location', lat: pos.coords.latitude, long: pos.coords.longitude, accuracy: pos.coords.accuracy }));
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
      );
      setPhase('active');
      // AppLayout hides the dock while this param is present.
      navigate('/explore?ar=1', { replace: true });
    };
  };

  const start = async (placeId: string) => {
    setGateError(null);
    setSelectedPlaceId(placeId);

    try {
      const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DOE?.requestPermission === 'function') {
        const result = await DOE.requestPermission();
        if (result !== 'granted') {
          setGateError("Compass permission was denied — the guide arrow needs it to know which way you're facing.");
          return;
        }
      }
    } catch (e) {
      setGateError(`Could not request compass permission: ${e instanceof Error ? e.message : 'unknown error'}`);
      return;
    }

    if (!('geolocation' in navigator)) {
      setGateError('This browser does not support geolocation.');
      return;
    }

    setPhase('loading');
    orientationHandlerRef.current = onOrientation;
    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);

    if (!window.isSecureContext) {
      // getUserMedia only exists on secure origins — over plain http on a LAN IP the
      // camera can never start, so skip AR entirely and say why.
      setArError('Camera needs HTTPS (or localhost) — HUD compass still active.');
    } else {
      try {
        // We load the correct versions (A-Frame 1.6.0, AR.js 3.4.7) from local /vendor/
        // to completely bypass adblocker restrictions and prevent silent failures.
        await loadScript('/vendor/aframe.min.js');
        await loadScript('/vendor/ar-threex-location-only.js');
        await loadScript('/vendor/aframe-ar.js');
        setArReady(true);
      } catch (e) {
        console.error('AR.js failed to load:', e);
        setArError('AR camera overlay failed to load — HUD compass still active.');
      }
    }

    connectWebSocket(placeId).catch((e) => {
      setGateError(e instanceof Error ? e.message : 'Failed to start navigation.');
      setPhase('gate');
    });
  };

  useEffect(() => {
    if (!arReady) return;
    // Same shape as the docs example: the scene lives directly under <body>, outside
    // the React tree. A-Frame then manages its own fixed fullscreen canvas, and the
    // webcam texture sizes itself off the window instead of a container.
    let root = document.getElementById('ar-scene-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'ar-scene-root';
      root.innerHTML = AR_SCENE_HTML;
      document.body.appendChild(root);
    }
    return () => {
      root.querySelectorAll('video').forEach((v) => {
        const stream = v.srcObject as MediaStream | null;
        stream?.getTracks().forEach((t) => t.stop());
      });
      root.remove();
      document.getElementById('arjs-video')?.remove();
      document.documentElement.classList.remove('a-fullscreen');
    };
  }, [arReady]);

  const stopNavigation = () => {
    wsRef.current?.close();
    wsRef.current = null;
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (sideQuestIntervalRef.current) {
      clearInterval(sideQuestIntervalRef.current);
      sideQuestIntervalRef.current = null;
    }
    if (orientationHandlerRef.current) {
      window.removeEventListener('deviceorientationabsolute', orientationHandlerRef.current, true);
      window.removeEventListener('deviceorientation', orientationHandlerRef.current, true);
      orientationHandlerRef.current = null;
    }
  };

  const exitNavigation = () => {
    stopNavigation();
    smoothedHeadingRef.current = null;
    setHeadingDisplay(null);
    setCalibrating(false);
    setArReady(false); // unmounts the a-scene via the arReady effect cleanup
    setArError(null);
    setProgressMsg(null);
    setDismissedWaypointId(null);
    setConfirming(false);
    setToast(null);
    setMediaOverlay(null);
    setVideoEnded(false);
    setVideoNeedsTap(false);
    setSideQuestSecondsLeft(null);
    autoPlayedIdRef.current = null;
    setIsDemoMode(false);
    setDemoIdx(0);
    setPhase('gate');
    navigate('/explore', { replace: true });
  };

  useEffect(() => {
    return stopNavigation;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendConfirm = (routeId: string) => {
    if (isDemoMode) {
      setConfirming(false);
      setDemoIdx((prev) => {
        const next = prev + 1;
        if (next >= demoWaypoints.length) {
          setProgressMsg({ type: 'progress', nextWaypoint: null, distanceMeters: null, bearingDegrees: null, arrived: false, allVisited: true });
        } else {
          setProgressMsg({ type: 'progress', nextWaypoint: demoWaypoints[next], distanceMeters: 120, bearingDegrees: 45, arrived: false, allVisited: false });
        }
        return next;
      });
      return;
    }
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setConfirming(true);
    ws.send(JSON.stringify({ type: 'confirm_visit', route_id: routeId }));
  };

  // "I am here" — confirm the checkpoint and reveal its image (e.g. turn directions).
  const confirmArrival = () => {
    const wp = progressMsgRef.current?.nextWaypoint;
    if (!wp) return;
    sendConfirm(wp.id);
    if (wp.media && !isVideoUrl(wp.media)) {
      setMediaOverlay({ kind: 'image', waypoint: wp });
    }
  };

  const replayVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => setVideoNeedsTap(true));
    setVideoEnded(false);
  };

  // Accepting the side quest starts a minimum-stay countdown; the checkpoint is
  // only confirmed once the full time has been spent there.
  const startSideQuest = (wp: NextWaypoint) => {
    setMediaOverlay(null);
    setSideQuestSecondsLeft(SIDE_QUEST_SECONDS);
    if (sideQuestIntervalRef.current) clearInterval(sideQuestIntervalRef.current);
    sideQuestIntervalRef.current = setInterval(() => {
      setSideQuestSecondsLeft((prev) => {
        if (prev == null) return null;
        if (prev <= 1) {
          if (sideQuestIntervalRef.current) clearInterval(sideQuestIntervalRef.current);
          sideQuestIntervalRef.current = null;
          sendConfirm(wp.id);
          showToast('Side quest complete!');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Revisit a completed place: wipe the route progress (badges, milestones and
  // AR points are permanent server-side) and start a fresh walk.
  const revisit = async (placeId: string) => {
    setGateError(null);
    try {
      await resetProgress({ visiting_place_id: placeId }).unwrap();
    } catch {
      setGateError('Could not reset your progress for a revisit — try again.');
      return;
    }
    await start(placeId);
  };

  const startDemo = async (waypoints: NextWaypoint[], placeName: string) => {
    setDemoPickerOpen(false);
    setDemoWaypoints(waypoints);
    setDemoPlaceName(placeName);
    setIsDemoMode(true);
    setSelectedPlaceId('demo');
    setDemoIdx(0);

    // Request iOS compass permission if needed
    try {
      const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DOE?.requestPermission === 'function') {
        const result = await DOE.requestPermission();
        if (result !== 'granted') {
          setGateError("Compass permission was denied.");
          setIsDemoMode(false);
          return;
        }
      }
    } catch { /* non-iOS */ }

    setPhase('loading');
    orientationHandlerRef.current = onOrientation;
    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);

    // Load AR camera — same as real mode
    if (!window.isSecureContext) {
      setArError('Camera needs HTTPS — HUD compass still active.');
    } else {
      try {
        await loadScript('/vendor/aframe.min.js');
        await loadScript('/vendor/ar-threex-location-only.js');
        await loadScript('/vendor/aframe-ar.js');
        setArReady(true);
      } catch (e) {
        console.error('AR.js failed to load:', e);
        setArError('AR camera failed to load — HUD compass still active.');
      }
    }

    setPhase('active');
    navigate('/explore?ar=1', { replace: true });
    setProgressMsg({ type: 'progress', nextWaypoint: waypoints[0], distanceMeters: 120, bearingDegrees: 45, arrived: false, allVisited: false });
  };

  // Demo a real destination: pull its route points and walk them without GPS.
  const startDemoForPlace = async (place: { id: string; name: string }) => {
    setGateError(null);
    setDemoLoadingPlaceId(place.id);
    try {
      const { routes } = await fetchRoutes({ visitingPlaceId: place.id }).unwrap();
      if (routes.length === 0) {
        setDemoPickerOpen(false);
        setGateError(`${place.name} has no route points yet — nothing to demo.`);
        return;
      }
      const waypoints: NextWaypoint[] = routes.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        media: r.media,
        video: r.video,
        model3d: r.model3d,
        index: r.index,
        coordinates: r.coordinates,
      }));
      await startDemo(waypoints, `${place.name} (Demo)`);
    } catch {
      setDemoPickerOpen(false);
      setGateError('Could not load the route for the demo — try again.');
    } finally {
      setDemoLoadingPlaceId(null);
    }
  };

  const simulateArrival = () => {
    const wp = demoWaypoints[demoIdx];
    if (!wp) return;
    setProgressMsg({ type: 'progress', nextWaypoint: wp, distanceMeters: 5, bearingDegrees: 45, arrived: true, allVisited: false });
  };

  const selectedPlace = isDemoMode
    ? { id: 'demo', name: demoPlaceName }
    : places.find((p) => p.id === selectedPlaceId);

  const nextWaypoint = progressMsg?.nextWaypoint ?? null;
  // Video waypoints (milestones, side quests) run their own arrival flow.
  const isVideoWaypoint =
    !!nextWaypoint && (nextWaypoint.type === 'milestone' || nextWaypoint.type === 'side_quest') && !!waypointVideo(nextWaypoint);
  // Nodes with a 3D model run their own arrival flow too — the interactive viewer.
  const isModelWaypoint = !!nextWaypoint && nextWaypoint.type === 'node' && !!nextWaypoint.model3d;
  const showArrivalPrompt =
    !!progressMsg?.arrived &&
    !!nextWaypoint &&
    !progressMsg.allVisited &&
    dismissedWaypointId !== nextWaypoint.id &&
    !isVideoWaypoint &&
    !isModelWaypoint &&
    !mediaOverlay &&
    sideQuestSecondsLeft == null;

  if (phase === 'gate') {
    const trips = summaryData?.trips ?? [];
    const tripByPlaceId = new Map(trips.map((t) => [t.place.id, t]));

    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#17140F]">
      <div className="max-w-md mx-auto px-5 pt-10 pb-32">
        <header className="mb-8">
          <p className="text-crimson-500 dark:text-crimson-400 text-xs font-bold tracking-widest uppercase mb-2">Kathmandu Valley</p>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">Explore</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Pick a heritage site and follow the live compass arrow. Needs your location and compass — best used outdoors.
          </p>
        </header>

        {gateError && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-crimson-50 dark:bg-crimson-500/10 border border-crimson-200 dark:border-crimson-500/30 text-sm text-crimson-600 dark:text-crimson-300">
            {gateError}
          </div>
        )}

        {/* Demo mode entry — opens the destination picker modal */}
        <button
          type="button"
          id="demo-mode-btn"
          onClick={() => setDemoPickerOpen(true)}
          className="w-full text-left bg-gradient-to-br from-navy-500/10 to-crimson-500/10 dark:from-navy-500/20 dark:to-crimson-500/20 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-crimson-300/30 dark:border-crimson-500/25 p-5 mb-5 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 w-10 h-10 rounded-full bg-crimson-500/15 text-crimson-500 dark:text-crimson-400 flex items-center justify-center"><Gamepad2 className="w-5 h-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Demo Mode</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Walk through a route — no GPS needed. Tap to simulate each stop.</p>
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-navy-500/15 text-navy-500 dark:text-navy-200 text-[10px] font-bold uppercase tracking-wide">Developer Tools</div>
          </div>
        </button>

        {/* Demo destination picker modal */}
        {demoPickerOpen && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDemoPickerOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-4" />
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">Demo Mode</h3>
                <span className="px-2 py-0.5 rounded-full bg-navy-500/15 text-navy-500 dark:text-navy-200 text-[10px] font-bold uppercase tracking-wide">Developer Tools</span>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Pick a destination to walk through without GPS.</p>
              <div className="space-y-2 max-h-[50dvh] overflow-y-auto">
                {places.length === 0 && (
                  <p className="text-sm text-stone-500 dark:text-stone-400">No destinations available yet.</p>
                )}
                {places.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => startDemoForPlace(p)}
                    disabled={demoLoadingPlaceId != null}
                    className="w-full text-left px-4 py-3 rounded-xl bg-stone-100 dark:bg-black/40 border border-stone-200 dark:border-white/10 text-sm font-semibold text-stone-800 dark:text-stone-200 active:scale-[0.98] transition-transform disabled:opacity-60"
                  >
                    {demoLoadingPlaceId === p.id ? 'Loading route…' : p.name}
                    <span className="block text-xs font-normal text-stone-500 dark:text-stone-400 line-clamp-1">{p.description}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDemoPickerOpen(false)}
                className="w-full mt-4 py-2.5 rounded-full border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 text-sm font-semibold active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">Destinations</h2>

        {places.length === 0 ? (
          <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-white/10 p-6 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">No destinations yet — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {places.map((p) => {
              const trip = tripByPlaceId.get(p.id);
              const percent = trip && trip.total_points > 0 ? Math.round((trip.visited_points / trip.total_points) * 100) : null;
              const completed = !!trip && trip.total_points > 0 && trip.visited_points === trip.total_points;

              const progressBlock = trip && percent != null && (
                <div className="mt-4">
                  <div className="relative h-2 rounded-full bg-stone-200 dark:bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {trip.visited_points} of {trip.total_points} stops · {percent === 100 ? 'completed' : percent === 0 ? 'not started' : 'continue trip'}
                    </p>
                    {trip.badge_earned && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200">
                        Badge earned
                      </span>
                    )}
                  </div>
                </div>
              );

              const cardClass =
                'w-full text-left bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 p-5';

              const visitorCount = p.visitor_count ?? 0;
              const visitedBy = (
                <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-2">
                  <Users className="w-3.5 h-3.5" />
                  {visitorCount === 0
                    ? 'Be the first to visit'
                    : `Visited by ${visitorCount} explorer${visitorCount === 1 ? '' : 's'}`}
                </p>
              );

              // Completed places aren't a tap-to-start card anymore — they offer
              // a fresh walk (Revisit) or the unlocked quiz.
              if (completed) {
                return (
                  <div key={p.id} className={cardClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-stone-900 dark:text-white truncate">{p.name}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">{p.description}</p>
                      </div>
                      <div className="shrink-0 w-9 h-9 rounded-full bg-navy-50 dark:bg-navy-500/25 text-navy-500 dark:text-navy-200 flex items-center justify-center">
                        <Medal className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    {visitedBy}
                    {progressBlock}
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => revisit(p.id)}
                        className="flex-1 py-2.5 rounded-full border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 text-sm font-semibold active:scale-95 transition-transform"
                      >
                        Revisit
                      </button>
                      <QuizButton placeId={p.id} onOpen={() => navigate(`/quiz/${p.id}`)} />
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => start(p.id)}
                  className={`${cardClass} active:scale-[0.98] transition-transform`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-stone-900 dark:text-white truncate">{p.name}</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">{p.description}</p>
                    </div>
                    <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-crimson-500 to-crimson-700 text-white flex items-center justify-center shadow-lg shadow-crimson-500/30">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  {visitedBy}
                  {progressBlock}
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#17140F] flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 rounded-full border-3 border-crimson-500/20 border-t-crimson-500 animate-spin" />
        <p className="text-stone-500 dark:text-stone-400 text-sm">Getting your position...</p>
      </div>
    );
  }

  return (
    // h-dvh (not min-h-screen): 100vh overflows behind mobile browser toolbars,
    // which cut off the bottom-anchored sheets. dvh tracks the visible viewport.
    <div className={`relative h-dvh overflow-hidden ${arReady ? '' : 'bg-black'}`}>
      {/*
        The <a-scene> is mounted directly under <body> (see the arReady effect), after
        this wrapper in DOM order, so its fixed fullscreen canvas paints over the page
        background. HUD elements below carry z-20 to stay above the canvas.
      */}

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 p-3 bg-gradient-to-b from-black/65 to-transparent">
        <button
          type="button"
          onClick={exitNavigation}
          aria-label="End navigation"
          className="shrink-0 w-10 h-10 rounded-full bg-black/70 border border-white/15 text-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="flex-1 px-3 py-2.5 rounded-md bg-black/70 border border-white/15 text-white text-sm truncate">
          {selectedPlace?.name}
        </span>
      </div>

      {/* Demo mode: simulate arrival button */}
      {isDemoMode && !mediaOverlay && !progressMsg?.arrived && !progressMsg?.allVisited && (
        <div className="absolute top-16 left-0 right-0 z-20 flex justify-center pt-2">
          <button
            id="simulate-arrival-btn"
            type="button"
            onClick={simulateArrival}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-navy-500 to-crimson-600 text-white text-sm font-bold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Simulate Arrival at <span className="italic">{demoWaypoints[demoIdx]?.name ?? 'next stop'}</span>
          </button>
        </div>
      )}

      {arError && (
        <div className="absolute top-20 left-3 right-3 z-20 bg-red-500/15 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-md text-center">
          {arError}
        </div>
      )}
      {calibrating && (
        <div className="absolute top-20 left-3 right-3 z-20 bg-crimson-500/15 border border-crimson-500/40 text-crimson-300 text-xs px-3 py-2 rounded-md text-center">
          ↺ Wave your phone in a figure-8 to calibrate the compass
        </div>
      )}
      {isDemoMode && (
        <div className="absolute top-20 right-3 z-20 bg-crimson-500/20 border border-crimson-400/40 text-crimson-300 text-xs font-bold px-2.5 py-1.5 rounded-md">
          DEMO
        </div>
      )}
      {sideQuestSecondsLeft != null && (
        <div className="absolute top-20 left-3 right-3 z-20 bg-navy-500/25 border border-navy-300/40 text-navy-100 text-xs font-medium px-3 py-2 rounded-md text-center">
          Side quest in progress — {formatSeconds(sideQuestSecondsLeft)} left. Stick around!
        </div>
      )}
      {toast && (
        <div className="absolute top-32 left-4 right-4 z-30 flex justify-center">
          <div className="bg-white/85 dark:bg-black/75 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-stone-900 dark:text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
            {toast}
          </div>
        </div>
      )}
      {headingDisplay != null && (
        <div className="absolute top-20 right-3 z-20 bg-black/70 border border-white/15 text-stone-300 text-xs px-2.5 py-1.5 rounded-md">
          hdg {headingDisplay}°
        </div>
      )}

      <div className={`absolute left-0 right-0 bottom-10 z-20 flex flex-col items-center px-4 pointer-events-none ${showArrivalPrompt || mediaOverlay ? 'invisible' : ''}`}>
        <div className="relative mb-2">
          <div className="w-36 h-36 rounded-full flex items-center justify-center border border-crimson-500/35" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(220,20,60,0.14), rgba(0,0,0,0.35))' }}>
            <svg ref={arrowSvgRef} viewBox="0 0 100 100" className="w-20 h-20 transition-transform duration-150" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>
              <defs>
                <linearGradient id="arrowGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#003893" />
                  <stop offset="100%" stopColor="#DC143C" />
                </linearGradient>
              </defs>
              <polygon points="50,6 78,62 50,48 22,62" fill="url(#arrowGrad)" stroke="#17140F" strokeWidth={2} strokeLinejoin="round" />
              <circle cx="50" cy="70" r="9" fill="#17140F" opacity={0.55} />
            </svg>
          </div>
          {/* Preview of the next location (route media) — tap to see it full size */}
          {nextWaypoint && !progressMsg?.allVisited && nextWaypoint.media && !isVideoUrl(nextWaypoint.media) && (
            <button
              type="button"
              onClick={() => setMediaOverlay({ kind: 'image', waypoint: nextWaypoint })}
              aria-label={`Preview photo of ${nextWaypoint.name}`}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-16 h-16 rounded-xl overflow-hidden border border-white/30 bg-black/60 shadow-lg pointer-events-auto active:scale-95 transition-transform"
            >
              <img src={nextWaypoint.media} alt={nextWaypoint.name} className="w-full h-full object-cover" />
            </button>
          )}
        </div>
        <div ref={distTextRef} className="text-xl font-bold text-white">— m</div>
        {nextWaypoint && !progressMsg?.allVisited && (
          <div className="text-xs text-crimson-400 uppercase tracking-widest mt-0.5">{nextWaypoint.name}</div>
        )}
        <div className="text-[11px] text-stone-300 mt-2 max-w-xs text-center">Point the top of your phone forward and follow the arrow</div>
      </div>

      {/* Checkpoint confirmation — shown when within the visit threshold; the
          checkpoint only counts once the user says they have reached it. */}
      {showArrivalPrompt && nextWaypoint && (
        <div className="absolute left-4 right-4 bottom-8 z-30">
          <div className="max-w-md mx-auto bg-white/85 dark:bg-black/75 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-white/50 dark:border-white/10 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-crimson-500 dark:text-crimson-400 mb-1">
              Checkpoint {nextWaypoint.index + 1} · {nextWaypoint.type.replace('_', ' ')}
            </p>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">
              Have you reached {nextWaypoint.name}?
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-4">{nextWaypoint.description}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDismissedWaypointId(nextWaypoint.id)}
                disabled={confirming}
                className="flex-1 py-2.5 rounded-full border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={confirmArrival}
                disabled={confirming}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-60"
              >
                {confirming ? 'Confirming…' : 'I have arrived'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video story — milestones and side quests. With the AR camera available
          the video plays on a plane anchored in world space (see the spawn
          effect); this layer only carries the source element and the chrome.
          Without AR it falls back to a fullscreen player. */}
      {mediaOverlay?.kind === 'video' && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <video
            key={mediaOverlay.waypoint.id}
            id={`ar-video-src-${mediaOverlay.waypoint.id}`}
            ref={videoRef}
            src={waypointVideo(mediaOverlay.waypoint)}
            playsInline
            crossOrigin="anonymous"
            onEnded={() => setVideoEnded(true)}
            className={arReady ? 'hidden' : 'absolute inset-0 w-full h-full object-contain bg-black/95'}
          />
          {videoNeedsTap && (
            <button
              type="button"
              onClick={() => {
                videoRef.current?.play().catch(() => {});
                setVideoNeedsTap(false);
              }}
              aria-label="Play video"
              className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
              <span className="w-20 h-20 rounded-full bg-crimson-500/90 text-white flex items-center justify-center shadow-lg shadow-crimson-500/40">
                <svg className="w-9 h-9 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-crimson-400 mb-1">
              {mediaOverlay.waypoint.type.replace('_', ' ')}
            </p>
            <h3 className="text-lg font-bold text-white mb-3">{mediaOverlay.waypoint.name}</h3>
            {!videoEnded ? (
              <p className="text-sm text-stone-300">
                {arReady ? 'The story is playing in your world — look around to find it.' : 'Watch the story to continue…'}
              </p>
            ) : mediaOverlay.waypoint.type === 'side_quest' ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sendConfirm(mediaOverlay.waypoint.id);
                    setMediaOverlay(null);
                  }}
                  disabled={confirming}
                  className="flex-1 py-2.5 rounded-full border border-white/25 text-stone-200 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
                >
                  Skip side quest
                </button>
                <button
                  type="button"
                  onClick={() => startSideQuest(mediaOverlay.waypoint)}
                  disabled={confirming}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-navy-400 to-navy-600 text-white text-sm font-semibold shadow-lg shadow-navy-500/30 active:scale-95 transition-transform disabled:opacity-60"
                >
                  Accept side quest
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={replayVideo}
                  disabled={confirming}
                  className="flex-1 py-2.5 rounded-full border border-white/25 text-stone-200 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
                >
                  Replay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sendConfirm(mediaOverlay.waypoint.id);
                    setMediaOverlay(null);
                  }}
                  disabled={confirming}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-60"
                >
                  I got the history
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive 3D model — nodes that carry a .glb model show it in a
          hand-held viewer (drag to rotate, pinch/scroll to zoom) alongside
          its description, instead of the plain arrival prompt. */}
      {mediaOverlay?.kind === 'model3d' && (
        <div className="absolute inset-0 z-40">
          {(window as any).AFRAME ? (
            <div ref={model3dContainerRef} className="absolute inset-0 bg-black/95 touch-none" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/95 px-6">
              <p className="text-sm text-stone-400 text-center">3D preview needs camera access to load — tap continue below.</p>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
            <p className="text-[10px] font-bold uppercase tracking-widest text-crimson-400 mb-1">
              {mediaOverlay.waypoint.type.replace('_', ' ')}
            </p>
            <h3 className="text-lg font-bold text-white mb-1">{mediaOverlay.waypoint.name}</h3>
            <p className="text-sm text-stone-300 mb-1">{mediaOverlay.waypoint.description}</p>
            <p className="text-[11px] text-stone-400 mb-3">Drag to rotate · pinch or scroll to zoom</p>
            <button
              type="button"
              onClick={() => {
                sendConfirm(mediaOverlay.waypoint.id);
                setMediaOverlay(null);
              }}
              disabled={confirming}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-60 pointer-events-auto"
            >
              {confirming ? 'Confirming…' : 'I have arrived'}
            </button>
          </div>
        </div>
      )}

      {/* Waypoint image — turn directions etc., revealed after "I am here" */}
      {mediaOverlay?.kind === 'image' && (
        <div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setMediaOverlay(null)}
        >
          <div
            className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-4" />
            <img
              src={mediaOverlay.waypoint.media}
              alt={mediaOverlay.waypoint.name}
              className="w-full max-h-64 object-contain mb-4"
            />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">{mediaOverlay.waypoint.name}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{mediaOverlay.waypoint.description}</p>
            <button
              type="button"
              onClick={() => setMediaOverlay(null)}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Trip complete */}
      {progressMsg?.allVisited && (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-white/85 dark:bg-black/75 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] border border-white/50 dark:border-white/10 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-crimson-400 to-crimson-600 text-white flex items-center justify-center">
              <Medal className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-1">Trip complete!</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              You've confirmed every checkpoint of {selectedPlace?.name}. Check your badges on the home page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathfinderPage;
