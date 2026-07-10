import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { SignJWT } from 'jose';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Mint a short-lived ticket for authenticating the /ws/pathfinder WebSocket handshake.',
    response: { status: 200, body: { ticket: 'eyJ...', expiresIn: 60 } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

const TICKET_TTL_SECONDS = 60;

export const GET = async (req: Request, res: Response) => {
  const { id, role, email } = (req as any).user;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const ticket = await new SignJWT({ id, role, email, purpose: 'ws-ticket' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${TICKET_TTL_SECONDS}s`)
    .sign(secret);

  res.json({ ticket, expiresIn: TICKET_TTL_SECONDS });
};
