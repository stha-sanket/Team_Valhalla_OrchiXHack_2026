import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { getOrCreateLedger, REWARDS } from '../../lib/arPoints.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: "The caller's private AR points balance, ledger, and the redeemable rewards catalog. AR points are never exposed to other users.",
    response: { status: 200, body: { total: 45, entries: [{ source: 'milestone', ref_id: '64f0...', label: 'Visit Orchid Parking Area', points: 10, earned_at: '2026-07-11T00:00:00.000Z' }], rewards: [] } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;
  const ledger = await getOrCreateLedger(userId);
  // Newest first for display.
  const entries = [...ledger.entries].sort((a, b) => b.earned_at.localeCompare(a.earned_at));
  res.json({ total: ledger.total, entries, rewards: REWARDS });
};
