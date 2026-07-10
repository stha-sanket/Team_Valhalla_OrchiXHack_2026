import type { EFCConfig } from "express-file-cluster";

// Structural config only — runtime values (PORT, DATABASE_URL, JWT_SECRET, etc.) are read from .env
const config: EFCConfig = {
  authStrategy: "http-only",
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://q4n8mbr4-5173.inc1.devtunnels.ms",
    ],
    credentials: true,
  },
  tasks: { backend: "bullmq", concurrency: 5 },
  globalMiddlewares: [],
};

export default config;
