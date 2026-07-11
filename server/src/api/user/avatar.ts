import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: "Set the authenticated user's avatar to an image URL (e.g. a generated cartoon avatar).",
      request: { body: { url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png' } },
      response: { status: 200, body: { message: 'Avatar updated', url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png' } },
  },
  DELETE: {
    description: 'Remove the authenticated user\'s avatar.',
      response: { status: 200, body: { message: 'Avatar removed' } },
  },
};

export const middlewares = [requireAuth('user')];

export const POST = async (req: Request, res: Response) => {
  const { id } = (req as any).user;
  const { url } = req.body;
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
    return res.status(400).json({ error: 'url must be an http(s) image URL' });
  }
  const updated = await User.update(id, { avatar: url });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'Avatar updated', url });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = (req as any).user;
  const updated = await User.update(id, { avatar: '' });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'Avatar removed' });
};
