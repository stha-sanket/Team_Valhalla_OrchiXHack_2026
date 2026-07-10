import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import VisitingRoutes from '../../model/VisitingRoutes.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List route points for a visiting place, ordered by index.',
    request: { query: { visiting_place_id: '64f0...' } },
    response: { status: 200, body: { routes: [] } },
  },
  POST: {
    description: 'Create a single route point (admin only).',
    request: {
      body: {
        visiting_place_id: '64f0...',
        name: 'Courtyard door',
        description: 'Entrance to the courtyard',
        type: 'start',
        coordinates: { lat: '27.7110', long: '85.3243' },
        index: 0,
      },
    },
    response: { status: 201, body: { message: 'Route point created', route: {} } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { visiting_place_id } = req.query;
  if (!visiting_place_id || typeof visiting_place_id !== 'string') {
    return res.status(400).json({ error: 'visiting_place_id query param is required' });
  }
  const routes = await VisitingRoutes.find({ visiting_place_id });
  routes.sort((a, b) => a.index - b.index);
  res.json({ routes });
};

export const POST = async (req: Request, res: Response) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { visiting_place_id, name, description, type, coordinates, media, index } = req.body;
  if (!visiting_place_id || !name || !description || !type || !coordinates || index === undefined) {
    return res.status(400).json({ error: 'visiting_place_id, name, description, type, coordinates and index are required' });
  }
  const route = await VisitingRoutes.create({ visiting_place_id, name, description, type, coordinates, media, index });
  res.status(201).json({ message: 'Route point created', route });
};
