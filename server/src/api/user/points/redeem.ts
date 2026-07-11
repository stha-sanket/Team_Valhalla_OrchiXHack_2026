import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { REWARDS, spendPoints } from '../../../lib/arPoints.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: "Redeem a reward from the catalog with the caller's AR points.",
    request: { body: { reward_id: 'canteen-tea' } },
    response: { status: 200, body: { message: 'Redeemed Canteen tea voucher', total: 15 } },
  },
};

export const middlewares = [requireAuth('user')];

export const POST = async (req: Request, res: Response) => {
  const { id: userId } = (req as any).user;
  const reward = REWARDS.find((r) => r.id === req.body.reward_id);
  if (!reward) return res.status(404).json({ error: 'Unknown reward.' });

  const result = await spendPoints(userId, reward);
  if (!result.ok) return res.status(400).json({ error: result.error });

  res.json({ message: `Redeemed ${reward.name}`, total: result.total });
};
