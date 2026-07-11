import VisitingRoutes from '../model/VisitingRoutes.js';
import { UserProgress } from '../model/UserProgress.js';
import { User } from '../model/User.js';
import type { RouteDocument } from '../model/VisitingRoutes.js';

export const VISIT_THRESHOLD_METERS = Number(process.env.VISIT_THRESHOLD_METERS ?? 4);

// A confirmation is accepted within a laxer radius than the arrival prompt,
// so GPS drift between "prompt shown" and "user taps yes" can't reject it.
export const CONFIRM_RADIUS_METERS = Math.max(VISIT_THRESHOLD_METERS * 5, 25);

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
  /** Within the visit threshold of the next waypoint — the client should ask the user to confirm. */
  arrived: boolean;
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

  const next = progress.route_progress.find((p) => !p.visited) ?? null;
  if (!next) {
    return { nextWaypoint: null, distanceMeters: null, bearingDegrees: null, arrived: false, allVisited: true };
  }

  const route = routesById.get(next.route_id);
  if (!route) {
    return { nextWaypoint: null, distanceMeters: null, bearingDegrees: null, arrived: false, allVisited: true };
  }

  const distance = haversineDistanceMeters(lat, long, parseFloat(route.coordinates.lat), parseFloat(route.coordinates.long));
  const bearing = bearingDegrees(lat, long, parseFloat(route.coordinates.lat), parseFloat(route.coordinates.long));

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
    // Arrival no longer auto-completes the checkpoint — the user must confirm
    // via confirmVisit() before it is marked visited.
    arrived: distance <= VISIT_THRESHOLD_METERS,
    allVisited: false,
  };
}

export type ConfirmVisitResult =
  | { confirmed: true; progress: ProximityResult }
  | { confirmed: false; reason: string; progress: ProximityResult };

export async function confirmVisit(params: {
  userId: string;
  visitingPlaceId: string;
  routeId: string;
  lat: number;
  long: number;
}): Promise<ConfirmVisitResult> {
  const { userId, visitingPlaceId, routeId, lat, long } = params;

  const evaluate = () => evaluateProximity({ userId, visitingPlaceId, lat, long });

  const progress = await seedUserProgress(userId, visitingPlaceId);
  const next = progress.route_progress.find((p) => !p.visited) ?? null;
  if (!next) {
    return { confirmed: false, reason: 'All checkpoints are already visited.', progress: await evaluate() };
  }
  if (next.route_id !== routeId) {
    return { confirmed: false, reason: 'This is not the current checkpoint.', progress: await evaluate() };
  }

  const route = await VisitingRoutes.findById(routeId);
  if (!route) {
    return { confirmed: false, reason: 'Checkpoint not found.', progress: await evaluate() };
  }

  const distance = haversineDistanceMeters(lat, long, parseFloat(route.coordinates.lat), parseFloat(route.coordinates.long));
  if (distance > CONFIRM_RADIUS_METERS) {
    return { confirmed: false, reason: `You're still ${Math.round(distance)} m away from this checkpoint.`, progress: await evaluate() };
  }

  const updatedProgress = progress.route_progress.map((p) => (p.route_id === routeId ? { ...p, visited: true } : p));
  await UserProgress.update(progress.id, { route_progress: updatedProgress });

  // If the confirmed checkpoint is a milestone, record it on the user's profile.
  if (route.type === 'milestone') {
    const user = await User.findById(userId);
    if (user) {
      const existingMilestones = user.milestones ?? [];
      const alreadyEarned = existingMilestones.some((m: any) => m.name === route.name);
      if (!alreadyEarned) {
        const updatedMilestones = [
          ...existingMilestones,
          { name: route.name, earned_at: new Date().toISOString() },
        ];
        await User.update(user.id, { milestones: updatedMilestones });
      }
    }
  }

  return { confirmed: true, progress: await evaluate() };
}
