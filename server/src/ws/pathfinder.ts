import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket, type RawData } from 'ws';
import { jwtVerify } from 'jose';
import { VisitingPlace } from '../model/VisitingPlace.js';
import { evaluateProximity, confirmVisit } from '../lib/proximity.js';

interface TicketPayload {
  id: string;
  role: string;
  email: string;
  purpose: string;
}

export function attachPathfinderWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://internal');
    if (url.pathname !== '/ws/pathfinder') {
      return;
    }

    const ticket = url.searchParams.get('ticket');
    const visitingPlaceId = url.searchParams.get('visiting_place_id');

    if (!ticket || !visitingPlaceId) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    (async () => {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(ticket, secret);
      const ticketPayload = payload as unknown as TicketPayload;
      if (ticketPayload.purpose !== 'ws-ticket') {
        throw new Error('Invalid ticket purpose');
      }

      const place = await VisitingPlace.findById(visitingPlaceId);
      if (!place) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, ticketPayload, visitingPlaceId);
      });
    })().catch(() => {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    });
  });

  wss.on('connection', (ws: WebSocket, user: TicketPayload, visitingPlaceId: string) => {
    // Last reported position — checkpoint confirmations are validated against it.
    let lastLocation: { lat: number; long: number } | null = null;

    ws.on('message', async (raw: RawData) => {
      let msg: unknown;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'invalid JSON' }));
        return;
      }

      const parsed = msg as { type?: string; lat?: number; long?: number; route_id?: string };

      if (parsed.type === 'confirm_visit') {
        if (typeof parsed.route_id !== 'string') {
          ws.send(JSON.stringify({ type: 'error', message: 'expected {type:"confirm_visit", route_id}' }));
          return;
        }
        if (!lastLocation) {
          ws.send(JSON.stringify({ type: 'visit_result', confirmed: false, reason: 'No location received yet.' }));
          return;
        }
        try {
          const result = await confirmVisit({
            userId: user.id,
            visitingPlaceId,
            routeId: parsed.route_id,
            lat: lastLocation.lat,
            long: lastLocation.long,
          });
          ws.send(JSON.stringify({
            type: 'visit_result',
            confirmed: result.confirmed,
            reason: result.confirmed ? undefined : result.reason,
            route_id: parsed.route_id,
          }));
          ws.send(JSON.stringify({ type: 'progress', ...result.progress }));
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' }));
        }
        return;
      }

      if (parsed.type !== 'location' || typeof parsed.lat !== 'number' || typeof parsed.long !== 'number') {
        ws.send(JSON.stringify({ type: 'error', message: 'expected {type:"location", lat, long} or {type:"confirm_visit", route_id}' }));
        return;
      }

      lastLocation = { lat: parsed.lat, long: parsed.long };

      try {
        const result = await evaluateProximity({
          userId: user.id,
          visitingPlaceId,
          lat: parsed.lat,
          long: parsed.long,
        });
        ws.send(JSON.stringify({ type: 'progress', ...result }));
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' }));
      }
    });
  });
}
