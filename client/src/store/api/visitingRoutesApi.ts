import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export type RouteWaypointType = "start" | "node" | "milestone" | "side_quest" | "end";

export interface VisitingRoute {
  id: string;
  name: string;
  description: string;
  type: RouteWaypointType;
  coordinates: { lat: string; long: string };
  /** Photo URL for the point. */
  media?: string;
  /** Video URL — only used by milestone and side_quest points. */
  video?: string;
  /** Interactive 3D model URL (.glb) — only used by node points. */
  model3d?: string;
  index: number;
  visiting_place_id: string;
}

export interface BulkRoutePoint {
  name: string;
  description: string;
  type: RouteWaypointType;
  coordinates: { lat: string; long: string };
  media?: string;
  video?: string;
  model3d?: string;
  index: number;
}

interface BulkCreateRequest {
  visiting_place_id: string;
  points: BulkRoutePoint[];
}

interface BulkCreateResponse {
  created: VisitingRoute[];
  failed: { index: number; error: string }[];
}

export const visitingRoutesApi = createApi({
  reducerPath: "visitingRoutesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["VisitingRoutes"],
  endpoints: (builder) => ({
    getVisitingRoutes: builder.query<{ routes: VisitingRoute[] }, { visitingPlaceId: string }>({
      query: ({ visitingPlaceId }) => `/visiting-routes?visiting_place_id=${visitingPlaceId}`,
      providesTags: ["VisitingRoutes"],
    }),
    bulkCreateVisitingRoutes: builder.mutation<BulkCreateResponse, BulkCreateRequest>({
      query: (body) => ({ url: "/visiting-routes/bulk", method: "POST", body }),
      invalidatesTags: ["VisitingRoutes"],
    }),
  }),
});

export const { useGetVisitingRoutesQuery, useLazyGetVisitingRoutesQuery, useBulkCreateVisitingRoutesMutation } = visitingRoutesApi;
