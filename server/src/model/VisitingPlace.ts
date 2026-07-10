import { defineModel } from "express-file-cluster";

export interface VisitingPlaceDocument {
  name: string;
  description: string;
  lat: string;
  long: string;
}

export const VisitingPlace = defineModel<VisitingPlaceDocument>(
  "VisitingPlace",
  {
    name: { type: "string", required: true },
    description: { type: "string", required: true },
    lat: { type: "string", required: true },
    long: { type: "string", required: true },
  },
);
