import { defineModel } from "express-file-cluster";

export interface VisitingPlaceDocument {
  name: string;
  description: string;
  lat: string;
  long: string;
  badge: string;
  /** Geofence radius in meters — being within it counts as physically at a checkpoint. */
  visit_threshold_meters: number;
  /** Denormalized count of users who completed this place — bumped once per
   * user on their first completion, so reads never scan users or progress. */
  visitor_count: number;
}

export const VisitingPlace = defineModel<VisitingPlaceDocument>(
  "VisitingPlace",
  {
    name: { type: "string", required: true },
    description: { type: "string", required: true },
    lat: { type: "string", required: true },
    long: { type: "string", required: true },
    badge: { type: "string", required: false },
    // Compulsory on every place record; the default only fills it at creation
    // when the admin doesn't supply one.
    visit_threshold_meters: { type: "number", required: true, default: 10 },
    visitor_count: { type: "number", required: false, default: 0 },
  },
);
