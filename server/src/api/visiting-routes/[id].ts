import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import VisitingRoutes from '../../model/VisitingRoutes.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single route point by ID.',
    request: { params: { id: '64f0...' } },
    response: { status: 200, body: { route: {} } },
  },
  PUT: {
    description: 'Update a route point by ID (admin only).',
    request: { params: { id: '64f0...' }, body: { name: 'Courtyard door', description: 'Updated', type: 'start', coordinates: { lat: '27.7110', long: '85.3243' }, index: 0 } },
    response: { status: 200, body: { message: 'Route point updated', route: {} } },
  },
  DELETE: {
    description: 'Delete a route point by ID (admin only).',
    request: { params: { id: '64f0...' } },
    response: { status: 200, body: { message: 'Route point deleted' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const route = await VisitingRoutes.findById(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route point not found' });
  res.json({ route });
};

export const PUT = async (req: Request, res: Response) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, description, type, coordinates, media, index } = req.body;
  const updated = await VisitingRoutes.update(req.params.id, { name, description, type, coordinates, media, index });
  if (!updated) return res.status(404).json({ error: 'Route point not found' });
  res.json({ message: 'Route point updated', route: updated });
};

export const DELETE = async (req: Request, res: Response) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const route = await VisitingRoutes.findById(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route point not found' });
  await VisitingRoutes.delete(req.params.id);
  res.json({ message: 'Route point deleted' });
};
