import { defineModel } from "express-file-cluster";

export interface ArPointsEntry {
  /** What earned (or, for redemptions, spent) the points. */
  source: "quiz" | "side_quest" | "milestone" | "place_complete" | "redeem";
  /** Quiz id, route id or visiting place id — one award per (source, ref_id) pair, ever. */
  ref_id: string;
  /** Human-readable description, e.g. the checkpoint or place name. */
  label: string;
  /** Negative for redemptions. */
  points: number;
  earned_at: string; // ISO 8601 timestamp
}

/**
 * A user's private AR points ledger. Points are completely virtual and are
 * never exposed on public profiles or leaderboards.
 */
export interface ArPointsDocument {
  user_id: string;
  total: number;
  entries: ArPointsEntry[];
}

export const ArPoints = defineModel<ArPointsDocument>("ArPoints", {
  user_id: { type: "string", required: true, unique: true },
  total: { type: "number", required: true, default: 0 },
  entries: {
    type: "array",
    items: {
      type: "object",
      properties: {
        source: { type: "string", required: true },
        ref_id: { type: "string", required: true },
        label: { type: "string", required: true },
        points: { type: "number", required: true },
        earned_at: { type: "string", required: true },
      },
    },
    default: [],
  },
});
