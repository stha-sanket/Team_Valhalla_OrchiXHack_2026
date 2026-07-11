import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../../model/User.js';
import { UserProgress } from '../../../model/UserProgress.js';
import { VisitingPlace } from '../../../model/VisitingPlace.js';
import type { VisitingPlaceDocument } from '../../../model/VisitingPlace.js';
import type { RouteMeta } from 'express-file-cluster';

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

export const meta: RouteMeta = {
  GET: {
    description: 'Analytics overview for the admin dashboard: registrations & milestones per day, role/status breakdowns, trip completion per place (admin only).',
      request: { query: { days: '30' } },
      response: {
        status: 200,
        body: {
          periodDays: 30,
          registrations: [{ date: '2026-07-01', count: 2 }],
          milestones: [{ date: '2026-07-01', count: 1 }],
          roles: [{ role: 'user', count: 12 }],
          status: { active: 10, suspended: 2, verified: 8, unverified: 4 },
          places: [{ id: '64f0...', name: 'Orchid College', started: 6, completed: 2 }],
        },
      },
  },
};

export const middlewares = [requireAuth('admin')];

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Empty per-day series covering the last `days` days, keyed by UTC date. */
function emptySeries(days: number): Map<string, number> {
  const series = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    series.set(dayKey(d), 0);
  }
  return series;
}

const toSortedArray = (series: Map<string, number>) =>
  [...series.entries()].map(([date, count]) => ({ date, count }));

export const GET = async (req: Request, res: Response) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));

  const [users, allProgress, places] = await Promise.all([
    User.find({}),
    UserProgress.find({}),
    VisitingPlace.find({}) as Promise<WithId<VisitingPlaceDocument>[]>,
  ]);

  // Registrations per day — createdAt comes from mongoose timestamps, which
  // the model type doesn't declare but the runtime always attaches.
  const registrations = emptySeries(days);
  for (const u of users) {
    const createdAt = (u as { createdAt?: string | Date }).createdAt;
    if (!createdAt) continue;
    const key = dayKey(new Date(createdAt));
    if (registrations.has(key)) registrations.set(key, registrations.get(key)! + 1);
  }

  // Milestones earned per day, from user.milestones[].earned_at.
  const milestones = emptySeries(days);
  for (const u of users) {
    for (const m of u.milestones ?? []) {
      const key = dayKey(new Date(m.earned_at));
      if (milestones.has(key)) milestones.set(key, milestones.get(key)! + 1);
    }
  }

  const roleCounts = new Map<string, number>();
  for (const u of users) {
    roleCounts.set(u.role, (roleCounts.get(u.role) ?? 0) + 1);
  }

  const status = {
    active: users.filter((u) => u.isActive).length,
    suspended: users.filter((u) => !u.isActive).length,
    verified: users.filter((u) => u.isVerified).length,
    unverified: users.filter((u) => !u.isVerified).length,
  };

  // Trip completion per place: started = has a progress record, completed = every stop visited.
  const placeStats = places.map((place) => {
    const progress = allProgress.filter((p) => p.visiting_place_id === place.id);
    const completed = progress.filter(
      (p) => p.route_progress.length > 0 && p.route_progress.every((r) => r.visited),
    );
    return { id: place.id, name: place.name, started: progress.length, completed: completed.length };
  });

  res.json({
    periodDays: days,
    registrations: toSortedArray(registrations),
    milestones: toSortedArray(milestones),
    roles: [...roleCounts.entries()].map(([role, count]) => ({ role, count })),
    status,
    places: placeStats,
  });
};
