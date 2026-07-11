import { UserProgress } from '../model/UserProgress.js';
import type { UserProgressDocument } from '../model/UserProgress.js';
import { VisitingPlace } from '../model/VisitingPlace.js';
import VisitingRoutes from '../model/VisitingRoutes.js';
import type { RouteDocument } from '../model/VisitingRoutes.js';
import { User } from '../model/User.js';
import { ArPoints } from '../model/ArPoints.js';

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

export interface TripSummary {
  progress_id: string;
  place: { id: string; name: string; description: string; badge: string | null };
  total_points: number;
  visited_points: number;
  milestones: { id: string; name: string; description: string; index: number; visited: boolean }[];
  badge_earned: boolean;
}

/** Visiting place ids the user has fully completed at least once, ever — the
 * place_complete ledger entries are permanent, so this survives progress resets. */
async function everCompletedPlaceIds(userId: string): Promise<Set<string>> {
  const ledger = await ArPoints.findOne({ user_id: userId });
  return new Set(
    (ledger?.entries ?? []).filter((e) => e.source === 'place_complete').map((e) => e.ref_id),
  );
}

/** True once the user has visited every checkpoint of the place's route,
 * now or on any previous walk. */
export async function hasCompletedPlace(userId: string, visitingPlaceId: string): Promise<boolean> {
  const record = await UserProgress.findOne({ user_id: userId, visiting_place_id: visitingPlaceId });
  if (record && record.route_progress.length > 0 && record.route_progress.every((p) => p.visited)) {
    return true;
  }
  return (await everCompletedPlaceIds(userId)).has(visitingPlaceId);
}

/** Per-place progress, milestones and earned badges for a user — newest trip first. */
export async function buildTripSummaries(userId: string): Promise<TripSummary[]> {
  const [records, user, completedEver] = await Promise.all([
    UserProgress.find({ user_id: userId }) as Promise<WithId<UserProgressDocument>[]>,
    User.findById(userId),
    everCompletedPlaceIds(userId),
  ]);
  // Milestones stamped on the user profile are permanent — they keep a badge
  // "earned" even after the route progress is reset for a revisit.
  const earnedMilestoneNames = new Set((user?.milestones ?? []).map((m) => m.name));

  const trips = (
    await Promise.all(
      records.map(async (record): Promise<TripSummary | null> => {
        const [place, routes] = await Promise.all([
          VisitingPlace.findById(record.visiting_place_id),
          VisitingRoutes.find({ visiting_place_id: record.visiting_place_id }) as Promise<WithId<RouteDocument>[]>,
        ]);
        if (!place) return null;

        const visitedIds = new Set(record.route_progress.filter((p) => p.visited).map((p) => p.route_id));
        const totalPoints = record.route_progress.length;
        const visitedPoints = record.route_progress.filter((p) => p.visited).length;

        const milestones = routes
          .filter((r) => r.type === 'milestone')
          .sort((a, b) => a.index - b.index)
          .map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            index: r.index,
            visited: visitedIds.has(r.id),
          }));

        // The badge is awarded once every milestone is completed; places without
        // milestones fall back to requiring the full route. Once earned it is
        // permanent: profile milestones and the place_complete ledger survive
        // progress resets.
        const badgeEarned =
          milestones.length > 0
            ? milestones.every((m) => m.visited) || milestones.every((m) => earnedMilestoneNames.has(m.name))
            : (totalPoints > 0 && visitedPoints === totalPoints) || completedEver.has(record.visiting_place_id);

        return {
          progress_id: record.id,
          place: {
            id: place.id,
            name: place.name,
            description: place.description,
            badge: place.badge ?? null,
          },
          total_points: totalPoints,
          visited_points: visitedPoints,
          milestones,
          badge_earned: badgeEarned,
        };
      }),
    )
  ).filter((t): t is TripSummary => t !== null);

  // Records come back in insertion order; newest-started trip first.
  trips.reverse();
  return trips;
}
