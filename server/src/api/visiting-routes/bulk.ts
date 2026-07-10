import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { VisitingPlace } from '../../model/VisitingPlace.js';
import VisitingRoutes from '../../model/VisitingRoutes.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Bulk-create an ordered set of route points for a visiting place (admin only).',
    request: {
      body: {
        visiting_place_id: '64f0...',
        points: [
          { name: 'Courtyard door', description: 'Entrance', type: 'start', coordinates: { lat: '27.7110', long: '85.3243' }, index: 0 },
        ],
      },
    },
    response: { status: 201, body: { created: [], failed: [] } },
  },
};

export const middlewares = [requireAuth('admin')];

export const POST = async (req: Request, res: Response) => {
  const { visiting_place_id, points } = req.body;
  if (!visiting_place_id || !Array.isArray(points) || points.length === 0) {
    return res.status(400).json({ error: 'visiting_place_id and a non-empty points array are required' });
  }

  const place = await VisitingPlace.findById(visiting_place_id);
  if (!place) return res.status(404).json({ error: 'Visiting place not found' });

  const created: unknown[] = [];
  const failed: { index: number; error: string }[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    try {
      const route = await VisitingRoutes.create({ ...point, visiting_place_id });
      created.push(route);
    } catch (err) {
      failed.push({ index: i, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  res.status(201).json({ created, failed });
};
