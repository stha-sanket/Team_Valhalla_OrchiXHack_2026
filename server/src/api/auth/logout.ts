import type { Request, Response } from 'express';
import { clearAuthCookies } from '../../lib/authCookies.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Clear the auth cookies and log the user out.',
    response: { status: 200, body: { message: 'Logged out successfully' } },
  },
};

export const POST = async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully' });
};
