import { ignite, gracefulShutdown } from "express-file-cluster";
import { attachPathfinderWebSocketServer } from "./ws/pathfinder.js";

// PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGINS are read from .env automatically.
// efc.config.ts is not auto-loaded by ignite() (and importing it here would cross
// tsconfig's rootDir boundary), so its structural fields are inlined directly below —
// keep this in sync with efc.config.ts if you change either.
ignite({
  cors: { credentials: true },
  cluster: true,
  workers: 2,
  tasks: { backend: "bullmq", concurrency: 5 },
})
  .then((server) => {
    // undefined in the cluster primary process — only real workers get a listening server.
    if (server) attachPathfinderWebSocketServer(server);
    gracefulShutdown(server);
  })
  .catch(console.error);
