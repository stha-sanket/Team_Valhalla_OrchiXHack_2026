import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Mark a user\'s email as verified (admin only).',
      request: { params: { id: 'usr_01HXZ' } },
      response: { status: 200, body: { message: 'User usr_01HXZ verified' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const POST = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await User.update(id, { isVerified: true });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ message: `User ${id} verified` });
};
