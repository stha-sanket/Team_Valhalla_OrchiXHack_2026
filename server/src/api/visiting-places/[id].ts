import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { VisitingPlace } from '../../model/VisitingPlace.js';
import VisitingRoutes from '../../model/VisitingRoutes.js';
import type { RouteDocument } from '../../model/VisitingRoutes.js';
import { UserProgress } from '../../model/UserProgress.js';
import type { UserProgressDocument } from '../../model/UserProgress.js';
import type { RouteMeta } from 'express-file-cluster';

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single visiting place by ID (admin only).',
    request: { params: { id: '64f0...' } },
    response: { status: 200, body: { place: {} } },
  },
  PUT: {
    description: 'Update a visiting place by ID (admin only).',
    request: { params: { id: '64f0...' }, body: { name: 'Krishna Mandir', description: 'Updated', lat: '27.7110', long: '85.3243' } },
    response: { status: 200, body: { message: 'Place updated', place: {} } },
  },
  DELETE: {
    description: 'Delete a visiting place and all its route points and progress (admin only).',
    request: { params: { id: '64f0...' } },
    response: { status: 200, body: { message: 'Place deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const place = await VisitingPlace.findById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  res.json({ place });
};

export const PUT = async (req: Request, res: Response) => {
  const { name, description, lat, long, badge } = req.body;
  const updated = await VisitingPlace.update(req.params.id, { name, description, lat, long, badge });
  if (!updated) return res.status(404).json({ error: 'Place not found' });
  res.json({ message: 'Place updated', place: updated });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  const place = await VisitingPlace.findById(id);
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const routes = (await VisitingRoutes.find({ visiting_place_id: id })) as WithId<RouteDocument>[];
  await Promise.all(routes.map((r) => VisitingRoutes.delete(r.id)));

  const progress = (await UserProgress.find({ visiting_place_id: id })) as WithId<UserProgressDocument>[];
  await Promise.all(progress.map((p) => UserProgress.delete(p.id)));

  await VisitingPlace.delete(id);
  res.json({ message: 'Place deleted' });
};
