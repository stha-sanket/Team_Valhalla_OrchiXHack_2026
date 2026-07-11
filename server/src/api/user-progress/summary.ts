import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../model/User.js';
import { buildTripSummaries } from '../../lib/tripSummaries.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: "Summarise the authenticated user's trips: progress, milestones and earned badges per visiting place.",
    response: { status: 200, body: { user: { name: 'Prashant', avatar: null }, trips: [] } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;

  const [user, trips] = await Promise.all([User.findById(userId), buildTripSummaries(userId)]);

  res.json({
    user: user ? { name: user.name, avatar: user.avatar ?? null } : null,
    trips,
  });
};
