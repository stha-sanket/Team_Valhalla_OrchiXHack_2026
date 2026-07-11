import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Suspend a user account (admin only).',
      request: { params: { id: 'usr_01HXZ' }, body: { reason: 'Terms of service violation' } },
      response: { status: 200, body: { message: 'User usr_01HXZ suspended', reason: 'Terms of service violation' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const POST = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const updated = await User.update(id, { isActive: false });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ message: `User ${id} suspended`, reason });
};
