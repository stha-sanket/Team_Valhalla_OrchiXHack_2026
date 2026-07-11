import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useCreateVisitingPlaceMutation } from '../../store/api/visitingPlaceApi';
import { useBulkCreateVisitingRoutesMutation } from '../../store/api/visitingRoutesApi';
import type { RouteWaypointType } from '../../store/api/visitingRoutesApi';

interface CapturedWaypoint {
  name: string;
  description: string;
  type: RouteWaypointType;
  lat: number;
  long: number;
  accuracy: number;
}

const WAYPOINT_TYPES: RouteWaypointType[] = ['start', 'node', 'milestone', 'side_quest', 'end'];

function accuracyClass(acc: number | null): string {
  if (acc == null) return 'text-stone-400';
  if (acc <= 10) return 'text-emerald-600 dark:text-emerald-400';
  if (acc <= 25) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

const WaypointLoggerPage = () => {
  const [phase, setPhase] = useState<'place' | 'capture'>('place');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [placeDescription, setPlaceDescription] = useState('');
  const [placeLat, setPlaceLat] = useState('');
  const [placeLong, setPlaceLong] = useState('');

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [wpName, setWpName] = useState('');
  const [wpDescription, setWpDescription] = useState('');
  const [wpType, setWpType] = useState<RouteWaypointType>('node');
  const [waypoints, setWaypoints] = useState<CapturedWaypoint[]>([]);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createPlace, { isLoading: isCreatingPlace }] = useCreateVisitingPlaceMutation();
  const [bulkCreateRoutes, { isLoading: isSaving }] = useBulkCreateVisitingRoutesMutation();

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation unsupported');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setGeoError(null);
        if (!placeLat && !placeLong) {
          setPlaceLat(pos.coords.latitude.toFixed(6));
          setPlaceLong(pos.coords.longitude.toFixed(6));
        }
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePlace = async () => {
    if (!placeName.trim() || !placeDescription.trim() || !placeLat || !placeLong) return;
    const { place } = await createPlace({
      name: placeName.trim(),
      description: placeDescription.trim(),
      lat: placeLat,
      long: placeLong,
    }).unwrap();
    setPlaceId(place.id);
    setPhase('capture');
    showToast('Place created — start capturing waypoints');
  };

  const handleCapture = () => {
    if (!position || !wpName.trim() || !wpDescription.trim()) return;
    setWaypoints((prev) => [
      ...prev,
      {
        name: wpName.trim(),
        description: wpDescription.trim(),
        type: wpType,
        lat: position.coords.latitude,
        long: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
    ]);
    setWpName('');
    setWpDescription('');
    showToast(`Captured "${wpName.trim()}"`);
  };

  const moveWaypoint = (i: number, dir: -1 | 1) => {
    setWaypoints((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const removeWaypoint = (i: number) => {
    setWaypoints((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSaveRoute = async () => {
    if (!placeId || waypoints.length === 0) return;
    const { created, failed } = await bulkCreateRoutes({
      visiting_place_id: placeId,
      points: waypoints.map((wp, index) => ({
        name: wp.name,
        description: wp.description,
        type: wp.type,
        coordinates: { lat: String(wp.lat.toFixed(7)), long: String(wp.long.toFixed(7)) },
        index,
      })),
    }).unwrap();

    if (failed.length > 0) {
      showToast(`Saved ${created.length}, ${failed.length} failed — retry those`);
    } else {
      showToast(`Route saved — ${created.length} waypoints`);
      setWaypoints([]);
    }
  };

  const accuracy = position?.coords.accuracy ?? null;

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-10 pb-28">
      <div className="w-full max-w-lg space-y-4">
        <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10">
          <p className="text-highlight1 text-xs font-bold tracking-widest uppercase mb-1">Venue Setup Tool</p>
          <h1 className="text-xl font-bold text-stone-900 dark:text-white">Waypoint Logger</h1>
        </div>

        {phase === 'place' && (
          <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1">Place name</label>
              <input
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="e.g. Krishna Mandir, Patan"
                className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1">Description</label>
              <input
                value={placeDescription}
                onChange={(e) => setPlaceDescription(e.target.value)}
                placeholder="e.g. A Newari temple in Patan Durbar Square"
                className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1">Latitude</label>
                <input
                  value={placeLat}
                  onChange={(e) => setPlaceLat(e.target.value)}
                  className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1">Longitude</label>
                <input
                  value={placeLong}
                  onChange={(e) => setPlaceLong(e.target.value)}
                  className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
                />
              </div>
            </div>
            <p className="text-xs text-stone-400">
              {geoError ? `GPS error: ${geoError}` : position ? 'Lat/long auto-filled from your current position — edit if needed.' : 'Waiting for GPS fix...'}
            </p>
            <button
              type="button"
              onClick={handleCreatePlace}
              disabled={isCreatingPlace || !placeName.trim() || !placeDescription.trim() || !placeLat || !placeLong}
              className="w-full bg-highlight1 text-white font-medium text-sm py-2 rounded-md shadow-lg shadow-highlight1/30 hover:shadow-highlight1/50 transition-all duration-300 disabled:opacity-60"
            >
              {isCreatingPlace ? 'Creating...' : 'Create place & start capturing'}
            </button>
          </div>
        )}

        {phase === 'capture' && (
          <>
            <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs text-stone-500 dark:text-stone-400">Latitude</span>
                <span className="text-sm font-mono text-stone-900 dark:text-white">{position?.coords.latitude.toFixed(6) ?? '—'}</span>
              </div>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs text-stone-500 dark:text-stone-400">Longitude</span>
                <span className="text-sm font-mono text-stone-900 dark:text-white">{position?.coords.longitude.toFixed(6) ?? '—'}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-stone-500 dark:text-stone-400">Accuracy</span>
                <span className={`text-sm font-mono font-semibold ${accuracyClass(accuracy)}`}>
                  {accuracy != null ? `±${Math.round(accuracy)} m` : geoError ?? 'no fix yet'}
                </span>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 space-y-3">
              <input
                value={wpName}
                onChange={(e) => setWpName(e.target.value)}
                placeholder="Waypoint name, e.g. Courtyard door"
                className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
              />
              <input
                value={wpDescription}
                onChange={(e) => setWpDescription(e.target.value)}
                placeholder="Short description"
                className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
              />
              <select
                value={wpType}
                onChange={(e) => setWpType(e.target.value as RouteWaypointType)}
                className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all shadow-sm"
              >
                {WAYPOINT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!position || !wpName.trim() || !wpDescription.trim()}
                className="w-full bg-highlight1 text-white font-medium text-sm py-2 rounded-md shadow-lg shadow-highlight1/30 hover:shadow-highlight1/50 transition-all duration-300 disabled:opacity-60"
              >
                {position ? `Capture waypoint here (±${Math.round(position.coords.accuracy)} m)` : 'Waiting for GPS...'}
              </button>
            </div>

            <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10">
              <p className="text-stone-700 dark:text-stone-300 text-sm font-semibold mb-3">
                Captured waypoints, in order ({waypoints.length})
              </p>
              {waypoints.length === 0 ? (
                <p className="text-stone-400 text-sm text-center py-4">No waypoints yet — capture your first one above.</p>
              ) : (
                <ul className="space-y-2">
                  {waypoints.map((wp, i) => (
                    <li key={i} className="flex items-center gap-3 py-2 border-b border-stone-200 dark:border-stone-700 last:border-none">
                      <span className="w-6 h-6 rounded-full bg-highlight1/15 text-highlight1 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{wp.name} <span className="text-xs text-stone-400 font-normal">({wp.type})</span></p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">{wp.lat.toFixed(6)}, {wp.long.toFixed(6)}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button type="button" onClick={() => moveWaypoint(i, -1)} className="w-7 h-7 rounded-md bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 text-xs">↑</button>
                        <button type="button" onClick={() => moveWaypoint(i, 1)} className="w-7 h-7 rounded-md bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 text-xs">↓</button>
                        <button type="button" onClick={() => removeWaypoint(i)} className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs"><X className="w-4 h-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={handleSaveRoute}
                disabled={isSaving || waypoints.length === 0}
                className="w-full mt-4 bg-highlight2 text-white font-medium text-sm py-2 rounded-md shadow-lg shadow-highlight2/30 hover:shadow-highlight2/50 transition-all duration-300 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save route to server'}
              </button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 bg-highlight1 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
};

export default WaypointLoggerPage;
