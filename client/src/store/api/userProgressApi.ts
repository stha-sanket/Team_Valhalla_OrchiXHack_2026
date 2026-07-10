import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface RouteProgressEntry {
  route_id: string;
  route_index: number;
  visited: boolean;
}

export interface UserProgress {
  id: string;
  user_id: string;
  visiting_place_id: string;
  route_progress: RouteProgressEntry[];
}

interface WsTicketResponse {
  ticket: string;
  expiresIn: number;
}

export interface TripMilestone {
  id: string;
  name: string;
  description: string;
  index: number;
  visited: boolean;
}

export interface TripSummary {
  progress_id: string;
  place: {
    id: string;
    name: string;
    description: string;
    badge: string | null;
  };
  total_points: number;
  visited_points: number;
  milestones: TripMilestone[];
  badge_earned: boolean;
}

export interface ProgressSummaryResponse {
  user: { name: string; avatar: string | null } | null;
  trips: TripSummary[];
}

export const userProgressApi = createApi({
  reducerPath: "userProgressApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getUserProgress: builder.query<{ progress: UserProgress | null }, { visitingPlaceId: string }>({
      query: ({ visitingPlaceId }) => `/user-progress?visiting_place_id=${visitingPlaceId}`,
    }),
    getProgressSummary: builder.query<ProgressSummaryResponse, void>({
      query: () => "/user-progress/summary",
    }),
    startUserProgress: builder.mutation<{ progress: UserProgress }, { visiting_place_id: string }>({
      query: (body) => ({ url: "/user-progress", method: "POST", body }),
    }),
    // Ticket must never be cached — a fresh one is needed on every WS (re)connect.
    // Modeled as a mutation even though the server route is a GET, purely to opt out of RTK Query's cache.
    getWsTicket: builder.mutation<WsTicketResponse, void>({
      query: () => ({ url: "/ws/ticket", method: "GET" }),
    }),
  }),
});

export const {
  useGetUserProgressQuery,
  useGetProgressSummaryQuery,
  useStartUserProgressMutation,
  useGetWsTicketMutation,
} = userProgressApi;
