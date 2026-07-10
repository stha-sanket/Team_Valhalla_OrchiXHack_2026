import VisitingRoutes from '../model/VisitingRoutes.js';
import { UserProgress } from '../model/UserProgress.js';
import type { RouteDocument } from '../model/VisitingRoutes.js';

export const VISIT_THRESHOLD_METERS = Number(process.env.VISIT_THRESHOLD_METERS ?? 4);

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function haversineDistanceMeters(lat1: number, long1: number, lat2: number, long2: number): number {
  const R = 6371000;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(long2 - long1);
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDegrees(lat1: number, long1: number, lat2: number, long2: number): number {
  const dLng = toRad(long2 - long1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const x = Math.sin(dLng) * Math.cos(phi2);
  const y = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}

export async function seedUserProgress(userId: string, visitingPlaceId: string) {
  const existing = await UserProgress.findOne({ user_id: userId, visiting_place_id: visitingPlaceId });
  if (existing) return existing;

  const routes = (await VisitingRoutes.find({ visiting_place_id: visitingPlaceId })) as WithId<RouteDocument>[];
  routes.sort((a, b) => a.index - b.index);

  return UserProgress.create({
    user_id: userId,
    visiting_place_id: visitingPlaceId,
    route_progress: routes.map((r) => ({ route_id: r.id, route_index: r.index, visited: false })),
  });
}

export interface ProximityResult {
  nextWaypoint: {
    id: string;
    name: string;
    description: string;
    type: string;
    media?: string;
    index: number;
    coordinates: { lat: string; long: string };
  } | null;
  distanceMeters: number | null;
  bearingDegrees: number | null;
  justVisited: boolean;
  allVisited: boolean;
}

export async function evaluateProximity(params: {
  userId: string;
  visitingPlaceId: string;
  lat: number;
  long: number;
}): Promise<ProximityResult> {
  const { userId, visitingPlaceId, lat, long } = params;

  const routes = (await VisitingRoutes.find({ visiting_place_id: visitingPlaceId })) as WithId<RouteDocument>[];
  routes.sort((a, b) => a.index - b.index);
  const routesById = new Map(routes.map((r) => [r.id, r]));

  const progress = await seedUserProgress(userId, visitingPlaceId);

  const findNextUnvisited = () => progress.route_progress.find((p) => !p.visited) ?? null;

  let next = findNextUnvisited();
  if (!next) {
    return { nextWaypoint: null, distanceMeters: null, bearingDegrees: null, justVisited: false, allVisited: true };
  }

  let route = routesById.get(next.route_id);
  if (!route) {
    return { nextWaypoint: null, distanceMeters: null, bearingDegrees: null, justVisited: false, allVisited: true };
  }

  let distance = haversineDistanceMeters(lat, long, parseFloat(route.coordinates.lat), parseFloat(route.coordinates.long));
  let bearing = bearingDegrees(lat, long, parseFloat(route.coordinates.lat), parseFloat(route.coordinates.long));
  let justVisited = false;

  if (distance <= VISIT_THRESHOLD_METERS) {
    justVisited = true;
    const updatedProgress = progress.route_progress.map((p) =>
      p.route_id === next!.route_id ? { ...p, visited: true } : p,
    );
    await UserProgress.update(progress.id, { route_progress: updatedProgress });

    next = updatedProgress.find((p) => !p.visited) ?? null;
    if (!next) {
      return { nextWaypoint: null, distanceMeters: 0, bearingDegrees: null, justVisited: true, allVisited: true };
    }
    route = routesById.get(next.route_id);
    if (!route) {
      return { nextWaypoint: null, distanceMeters: 0, bearingDegrees: null, justVisited: true, allVisited: true };
    }
    distance = haversineDistanceMeters(lat, long, parseFloat(route.coordinates.lat), parseFloat(route.coordinates.long));
    bearing = bearingDegrees(lat, long, parseFloat(route.coordinates.lat), parseFloat(route.coordinates.long));
  }

  return {
    nextWaypoint: {
      id: route.id,
      name: route.name,
      description: route.description,
      type: route.type,
      media: route.media,
      index: route.index,
      coordinates: route.coordinates,
    },
    distanceMeters: Math.round(distance),
    bearingDegrees: Math.round(bearing),
    justVisited,
    allVisited: false,
  };
}
