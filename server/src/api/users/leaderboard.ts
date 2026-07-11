import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../model/User.js';
import { UserProgress } from '../../model/UserProgress.js';
import VisitingRoutes from '../../model/VisitingRoutes.js';
import type { RouteDocument } from '../../model/VisitingRoutes.js';
import type { RouteMeta } from 'express-file-cluster';

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

const SORTS = ['milestones', 'places', 'side_quests'] as const;
type SortKey = (typeof SORTS)[number];

export const meta: RouteMeta = {
  GET: {
    description:
      'Community leaderboard sorted by milestones, visited places, or completed side quests. AR points are private and never included.',
    request: { query: { by: 'milestones' } },
    response: {
      status: 200,
      body: { by: 'milestones', entries: [{ id: '64f0...', name: 'Prashant', avatar: null, milestones: 3, places: 1, side_quests: 2 }] },
    },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

const MAX_ENTRIES = 20;

export const GET = async (req: Request, res: Response) => {
  const by = (SORTS as readonly string[]).includes(String(req.query.by)) ? (req.query.by as SortKey) : 'milestones';

  const [users, allProgress, allRoutes] = await Promise.all([
    User.find({}),
    UserProgress.find({}),
    VisitingRoutes.find({}) as Promise<WithId<RouteDocument>[]>,
  ]);
  const routeTypeById = new Map(allRoutes.map((r) => [r.id, r.type]));

  const entries = users
    .filter((u) => u.isActive && u.role === 'user')
    .map((u) => {
      const userId = (u as { id?: string }).id;
      const records = allProgress.filter((p) => p.user_id === userId);

      let milestones = 0;
      let sideQuests = 0;
      let places = 0;
      for (const record of records) {
        const visited = record.route_progress.filter((p) => p.visited);
        if (visited.length > 0) places += 1;
        for (const p of visited) {
          const type = routeTypeById.get(p.route_id);
          if (type === 'milestone') milestones += 1;
          else if (type === 'side_quest') sideQuests += 1;
        }
      }

      return { id: userId, name: u.name, avatar: u.avatar ?? null, milestones, places, side_quests: sideQuests };
    })
    .sort((a, b) => {
      const key = by === 'places' ? 'places' : by === 'side_quests' ? 'side_quests' : 'milestones';
      // Tie-break on the other metrics so the order is stable and sensible.
      return (
        b[key] - a[key] ||
        b.milestones - a.milestones ||
        b.places - a.places ||
        b.side_quests - a.side_quests ||
        a.name.localeCompare(b.name)
      );
    })
    .slice(0, MAX_ENTRIES);

  res.json({ by, entries });
};
