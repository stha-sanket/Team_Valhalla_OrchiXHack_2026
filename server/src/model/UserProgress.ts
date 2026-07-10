import { defineModel } from "express-file-cluster";

export interface UserProgressDocument {
  user_id: string;
  visiting_place_id: string;
  route_progress: {
    route_id: string;
    route_index: number;
    visited: boolean;
  }[];
}

export const UserProgress = defineModel<UserProgressDocument>("UserProgress", {
  user_id: { type: "string", required: true },
  visiting_place_id: { type: "string", required: true },
  route_progress: [
    {
      route_id: { type: "string", required: true },
      route_index: { type: "number", required: true },
      visited: { type: "boolean", required: true }
    }
  ]
});
