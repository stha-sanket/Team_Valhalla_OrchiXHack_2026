import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../model/User.js';
import { buildTripSummaries } from '../../lib/tripSummaries.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: "A member's public profile: name, avatar, milestones and earned badges (any signed-in user). Email and account internals are never exposed.",
    request: { params: { id: '64f0...' } },
    response: {
      status: 200,
      body: {
        user: { id: '64f0...', name: 'Prashant', avatar: null, joined: '2026-07-01T00:00:00.000Z', milestones: [] },
        trips: [],
      },
    },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  // Suspended accounts are hidden from the community.
  if (!user || !user.isActive) return res.status(404).json({ error: 'User not found' });

  const trips = await buildTripSummaries(user.id);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar ?? null,
      joined: (user as { createdAt?: string | Date }).createdAt ?? null,
      milestones: user.milestones ?? [],
    },
    trips,
  });
};
