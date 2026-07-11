import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { UserProgress } from '../../model/UserProgress.js';
import { seedUserProgress } from '../../lib/proximity.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: "Reset the caller's route progress for a place so it can be revisited. Earned badges, milestones and AR points are permanent and survive the reset.",
    request: { body: { visiting_place_id: '64f0...' } },
    response: { status: 200, body: { message: 'Progress reset', progress: {} } },
  },
};

export const middlewares = [requireAuth('user')];

export const POST = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;
  const { visiting_place_id } = req.body;
  if (!visiting_place_id) return res.status(400).json({ error: 'visiting_place_id is required' });

  // Delete and re-seed rather than flipping flags, so a revisit also picks up
  // any route changes made since the first walk.
  const existing = await UserProgress.findOne({ user_id: userId, visiting_place_id });
  if (existing) await UserProgress.delete(existing.id);

  const progress = await seedUserProgress(userId, visiting_place_id);
  res.json({ message: 'Progress reset', progress });
};
