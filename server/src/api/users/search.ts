import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Search members by name or email. Returns public profile cards (any signed-in user).',
    request: { query: { q: 'prashant' } },
    response: { status: 200, body: { users: [{ id: '64f0...', name: 'Prashant', avatar: null, milestone_count: 2, joined: '2026-07-01T00:00:00.000Z' }] } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

const MAX_RESULTS = 20;

export const GET = async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters.' });
  }

  const all = await User.find({});
  const users = all
    // Suspended accounts are hidden from the community.
    .filter((u) => u.isActive && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
    .slice(0, MAX_RESULTS)
    .map((u) => ({
      id: (u as { id?: string }).id,
      name: u.name,
      avatar: u.avatar ?? null,
      milestone_count: (u.milestones ?? []).length,
      joined: (u as { createdAt?: string | Date }).createdAt ?? null,
    }));

  res.json({ users });
};
