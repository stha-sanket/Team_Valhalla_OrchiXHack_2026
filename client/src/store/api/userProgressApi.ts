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

export const userProgressApi = createApi({
  reducerPath: "userProgressApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getUserProgress: builder.query<{ progress: UserProgress | null }, { visitingPlaceId: string }>({
      query: ({ visitingPlaceId }) => `/user-progress?visiting_place_id=${visitingPlaceId}`,
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
  useStartUserProgressMutation,
  useGetWsTicketMutation,
} = userProgressApi;
