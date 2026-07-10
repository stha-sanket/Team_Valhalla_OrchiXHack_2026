import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { UserProgress } from '../../model/UserProgress.js';
import { seedUserProgress } from '../../lib/proximity.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: "Fetch the authenticated user's progress for a visiting place.",
    request: { query: { visiting_place_id: '64f0...' } },
    response: { status: 200, body: { progress: null } },
  },
  POST: {
    description: "Start (or resume) the authenticated user's progress for a visiting place.",
    request: { body: { visiting_place_id: '64f0...' } },
    response: { status: 200, body: { progress: {} } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;
  const { visiting_place_id } = req.query;
  if (!visiting_place_id || typeof visiting_place_id !== 'string') {
    return res.status(400).json({ error: 'visiting_place_id query param is required' });
  }
  const progress = await UserProgress.findOne({ user_id: userId, visiting_place_id });
  res.json({ progress: progress ?? null });
};

export const POST = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;
  const { visiting_place_id } = req.body;
  if (!visiting_place_id) return res.status(400).json({ error: 'visiting_place_id is required' });
  const progress = await seedUserProgress(userId, visiting_place_id);
  res.json({ progress });
};
