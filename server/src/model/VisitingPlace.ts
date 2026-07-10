import { defineModel } from "express-file-cluster";

export interface VisitingPlaceDocument {
  start: {
    lat: String;
    long: String;
  };
  end: {
    lat: String;
    long: String;
  };
  name: String;
  description: String;
}

export const VisitingPlace = defineModel<VisitingPlaceDocument>(
  "VisitingPlace",
  {
    start: { type: "object", required: true },
    end: { type: "object", required: true },
    name: { type: "string", required: true },
    description: { type: "string", required: true },
  },
);
