import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export interface PublicUserCard {
  id: string;
  name: string;
  avatar: string | null;
  milestone_count: number;
  joined: string | null;
}

export interface PublicMilestone {
  name: string;
  earned_at: string;
}

export interface PublicTrip {
  progress_id: string;
  place: { id: string; name: string; description: string; badge: string | null };
  total_points: number;
  visited_points: number;
  milestones: { id: string; name: string; description: string; index: number; visited: boolean }[];
  badge_earned: boolean;
}

export interface PublicProfileResponse {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    joined: string | null;
    milestones: PublicMilestone[];
  };
  trips: PublicTrip[];
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    getProfile: builder.query<{ user: UserProfile }, void>({
      query: () => "/user/profile",
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<{ message: string; user: UserProfile }, { name: string; email: string; avatar?: string | null }>({
      query: (body) => ({ url: "/user/profile", method: "PUT", body }),
      invalidatesTags: ["Profile"],
    }),
    searchUsers: builder.query<{ users: PublicUserCard[] }, string>({
      query: (q) => ({ url: "/users/search", params: { q } }),
    }),
    getPublicProfile: builder.query<PublicProfileResponse, string>({
      query: (id) => `/users/${id}`,
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useSearchUsersQuery,
  useGetPublicProfileQuery,
} = userApi;
