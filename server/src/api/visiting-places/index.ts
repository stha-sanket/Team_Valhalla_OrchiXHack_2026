import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { VisitingPlace } from '../../model/VisitingPlace.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all visiting places.',
    response: { status: 200, body: { places: [] } },
  },
  POST: {
    description: 'Create a new visiting place (admin only).',
    request: { body: { name: 'Krishna Mandir', description: 'A Newari temple', lat: '27.7110', long: '85.3243', badge: 'https://example.com/badges/krishna-mandir.png' } },
    response: { status: 201, body: { message: 'Place created', place: {} } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (_req: Request, res: Response) => {
  const places = await VisitingPlace.find({});
  res.json({ places });
};

export const POST = async (req: Request, res: Response) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, description, lat, long, badge } = req.body;
  if (!name || !description || !lat || !long) {
    return res.status(400).json({ error: 'name, description, lat and long are required' });
  }
  const place = await VisitingPlace.create({ name, description, lat, long, badge });
  res.status(201).json({ message: 'Place created', place });
};
