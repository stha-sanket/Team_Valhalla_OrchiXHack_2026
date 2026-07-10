import { useEffect, useRef, useState } from 'react';
import { useGetVisitingPlacesQuery } from '../store/api/visitingPlaceApi';
import { useStartUserProgressMutation, useGetWsTicketMutation } from '../store/api/userProgressApi';
import { loadScript } from '../lib/loadScript';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';

interface NextWaypoint {
  id: string;
  name: string;
  description: string;
  type: string;
  media?: string;
  index: number;
  coordinates: { lat: string; long: string };
}

interface ProgressMessage {
  type: 'progress';
  nextWaypoint: NextWaypoint | null;
  distanceMeters: number | null;
  bearingDegrees: number | null;
  justVisited: boolean;
  allVisited: boolean;
}

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
      arjs-device-orientation-controls="smoothingFactor: 0.1"
      look-controls-enabled="false">
    </a-camera>
    <a-entity id="destinationMarker">
      <a-cylinder radius="0.5" height="0.1" color="#2FA98F"></a-cylinder>
      <a-cylinder radius="0.13" height="1.1" color="#2FA98F" position="0 0.55 0"></a-cylinder>
      <a-cone radius-bottom="0.55" radius-top="0" height="0.5" color="#1C7FA6" position="0 1.35 0"></a-cone>
      <a-sphere radius="0.14" color="#0F5EAB" position="0 1.68 0"></a-sphere>
      <a-ring radius-inner="0.5" radius-outer="0.65" color="#0F5EAB" opacity="0.55" position="0 0.06 0"
        animation="property: scale; from: 1 1 1; to: 2.1 2.1 2.1; dur: 1800; loop: true; easing: easeOutQuad"
        animation__fade="property: opacity; from: 0.55; to: 0; dur: 1800; loop: true; easing: easeOutQuad">
      </a-ring>
    </a-entity>
    <a-entity id="destinationLabel" position="0 2.6 0" look-at="[gps-new-camera]">
      <a-text id="destText" value="" color="#F4ECDC" align="center" scale="4 4 4" font="mozillavr"></a-text>
      <a-text value="▼" color="#0F5EAB" align="center" scale="3 3 3" position="0 -0.8 0"></a-text>
    </a-entity>
  </a-scene>
`;

const PathfinderPage = () => {
  const { data: placesData } = useGetVisitingPlacesQuery();
  const [startProgress] = useStartUserProgressMutation();
  const [getTicket] = useGetWsTicketMutation();

  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [phase, setPhase] = useState<Phase>('gate');
  const [gateError, setGateError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<ProgressMessage | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [headingDisplay, setHeadingDisplay] = useState<number | null>(null);
  const [arReady, setArReady] = useState(false);
  const [arError, setArError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const smoothedHeadingRef = useRef<number | null>(null);
  const arrowSvgRef = useRef<SVGSVGElement | null>(null);
  const distTextRef = useRef<HTMLDivElement | null>(null);
  const progressMsgRef = useRef<ProgressMessage | null>(null);

  useEffect(() => {
    progressMsgRef.current = progressMsg;
  }, [progressMsg]);

  const places = placesData?.places ?? [];

  useEffect(() => {
    if (places.length > 0 && !selectedPlaceId) {
      setSelectedPlaceId(places[0].id);
    }
  }, [places, selectedPlaceId]);

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
        distTextRef.current.style.color = '#2FA98F';
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
    if (progressMsg?.nextWaypoint && arReady) {
      const marker = document.getElementById('destinationMarker');
      const label = document.getElementById('destinationLabel');
      const destText = document.getElementById('destText');
      const { lat, long } = progressMsg.nextWaypoint.coordinates;
      marker?.setAttribute('gps-new-entity-place', `latitude: ${lat}; longitude: ${long}`);
      label?.setAttribute('gps-new-entity-place', `latitude: ${lat}; longitude: ${long}`);
      destText?.setAttribute('value', progressMsg.nextWaypoint.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressMsg, arReady]);

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
        const msg = JSON.parse(event.data) as ProgressMessage;
        if (msg.type === 'progress') setProgressMsg(msg);
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
    };
  };

  const start = async () => {
    setGateError(null);
    if (!selectedPlaceId) {
      setGateError('No destination available yet.');
      return;
    }

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
        await loadScript('/vendor/aframe-look-at-component.min.js');
        setArReady(true);
      } catch (e) {
        console.error('AR.js failed to load:', e);
        setArError('AR camera overlay failed to load — HUD compass still active.');
      }
    }

    connectWebSocket(selectedPlaceId).catch((e) => {
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

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, []);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);

  if (phase === 'gate') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="text-highlight1 text-xs font-bold tracking-widest uppercase mb-3">Kathmandu Valley</p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Heritage AR Pathfinder</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm max-w-sm mb-6">
          Follow a live compass arrow (and an AR pin) through the valley to heritage sites. Needs your location and compass — best used outdoors.
        </p>

        <select
          value={selectedPlaceId}
          onChange={(e) => setSelectedPlaceId(e.target.value)}
          className="w-full max-w-xs bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-highlight1"
        >
          {places.length === 0 && <option>No places yet</option>}
          {places.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={start}
          disabled={places.length === 0}
          className="px-8 py-3 rounded-full bg-highlight1 text-white font-semibold shadow-lg shadow-highlight1/30 hover:shadow-highlight1/50 transition-all disabled:opacity-60"
        >
          Start Navigating
        </button>

        {gateError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400 max-w-xs">{gateError}</p>
        )}
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 rounded-full border-3 border-highlight1/20 border-t-highlight1 animate-spin" />
        <p className="text-stone-500 dark:text-stone-400 text-sm">Getting your position...</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen overflow-hidden pb-28 ${arReady ? '' : 'bg-black'}`}>
      {/*
        The <a-scene> is mounted directly under <body> (see the arReady effect), after
        this wrapper in DOM order, so its fixed fullscreen canvas paints over the page
        background. HUD elements below carry z-20 to stay above the canvas.
      */}

      <div className="absolute top-0 left-0 right-0 z-20 flex gap-2 p-3 bg-gradient-to-b from-black/65 to-transparent">
        <span className="flex-1 px-3 py-2.5 rounded-md bg-black/70 border border-white/15 text-white text-sm truncate">
          {selectedPlace?.name}
        </span>
      </div>

      {arError && (
        <div className="absolute top-20 left-3 right-3 z-20 bg-red-500/15 border border-red-500/40 text-red-300 text-xs px-3 py-2 rounded-md text-center">
          {arError}
        </div>
      )}
      {calibrating && (
        <div className="absolute top-20 left-3 right-3 z-20 bg-highlight1/15 border border-highlight1/40 text-highlight1 text-xs px-3 py-2 rounded-md text-center">
          ↺ Wave your phone in a figure-8 to calibrate the compass
        </div>
      )}
      {headingDisplay != null && (
        <div className="absolute top-20 right-3 z-20 bg-black/70 border border-white/15 text-stone-300 text-xs px-2.5 py-1.5 rounded-md">
          hdg {headingDisplay}°
        </div>
      )}

      <div className="absolute left-0 right-0 bottom-24 z-20 flex flex-col items-center px-4 pointer-events-none">
        <div className="w-36 h-36 rounded-full flex items-center justify-center relative mb-2 border border-highlight1/35" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(47,169,143,0.14), rgba(0,0,0,0.35))' }}>
          <svg ref={arrowSvgRef} viewBox="0 0 100 100" className="w-20 h-20 transition-transform duration-150" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>
            <defs>
              <linearGradient id="arrowGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#1C7FA6" />
                <stop offset="100%" stopColor="#2FA98F" />
              </linearGradient>
            </defs>
            <polygon points="50,6 78,62 50,48 22,62" fill="url(#arrowGrad)" stroke="#17140F" strokeWidth={2} strokeLinejoin="round" />
            <circle cx="50" cy="70" r="9" fill="#17140F" opacity={0.55} />
          </svg>
        </div>
        <div ref={distTextRef} className="text-xl font-bold text-white">— m</div>
        {progressMsg?.nextWaypoint && !progressMsg.allVisited && (
          <div className="text-xs text-highlight1 uppercase tracking-widest mt-0.5">{progressMsg.nextWaypoint.name}</div>
        )}
        <div className="text-[11px] text-stone-300 mt-2 max-w-xs text-center">Point the top of your phone forward and follow the arrow</div>
      </div>
    </div>
  );
};

export default PathfinderPage;
