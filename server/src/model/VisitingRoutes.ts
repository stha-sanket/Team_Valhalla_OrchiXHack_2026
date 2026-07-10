import { defineModel } from "express-file-cluster";

export interface RouteDocument {
  coordinates: {
    lat: string;
    long: string;
  };
  type: string;
  description: string;
  name: string;
  visiting_place_id: string;
  media: string;
  index: number;
}

const VisitingRoutes = defineModel<RouteDocument>("VisitingRoutes", {
  coordinates: { type: "object", required: true },
  type: {
    type: "enum",
    enum: ["milestone", "node", "start", "end", "side_quest"],
    required: true,
  },
  description: { type: "string", required: true },
  name: { type: "string", required: true },
  visiting_place_id: { type: "string", required: true },
  media: { type: "string", required: false },
  index: { type: "number", required: true },
});

export default VisitingRoutes;
