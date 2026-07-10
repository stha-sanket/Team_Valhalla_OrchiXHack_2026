import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { UserProgress } from '../../model/UserProgress.js';
import type { UserProgressDocument } from '../../model/UserProgress.js';
import { VisitingPlace } from '../../model/VisitingPlace.js';
import VisitingRoutes from '../../model/VisitingRoutes.js';
import type { RouteDocument } from '../../model/VisitingRoutes.js';
import { User } from '../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

export const meta: RouteMeta = {
  GET: {
    description: "Summarise the authenticated user's trips: progress, milestones and earned badges per visiting place.",
    response: { status: 200, body: { user: { name: 'Prashant', avatar: null }, trips: [] } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;

  const [user, records] = await Promise.all([
    User.findById(userId),
    UserProgress.find({ user_id: userId }) as Promise<WithId<UserProgressDocument>[]>,
  ]);

  const trips = (
    await Promise.all(
      records.map(async (record) => {
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
        // milestones fall back to requiring the full route.
        const badgeEarned =
          milestones.length > 0
            ? milestones.every((m) => m.visited)
            : totalPoints > 0 && visitedPoints === totalPoints;

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
  ).filter(Boolean);

  // Records come back in insertion order; newest-started trip first.
  trips.reverse();

  res.json({
    user: user ? { name: user.name, avatar: user.avatar ?? null } : null,
    trips,
  });
};
