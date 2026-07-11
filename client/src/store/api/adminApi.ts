import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  milestones?: { name: string; earned_at: string }[];
  createdAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
}

export interface DayCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface AdminAnalytics {
  periodDays: number;
  registrations: DayCount[];
  milestones: DayCount[];
  roles: { role: string; count: number }[];
  status: { active: number; suspended: number; verified: number; unverified: number };
  places: { id: string; name: string; started: number; completed: number }[];
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AdminUsers", "AdminStats"],
  endpoints: (builder) => ({
    getAdminStats: builder.query<{ stats: AdminStats }, void>({
      query: () => "/admin/dashboard",
      providesTags: ["AdminStats"],
    }),
    getAdminAnalytics: builder.query<AdminAnalytics, { days?: number } | void>({
      query: (args) => ({ url: "/admin/analytics", params: args?.days ? { days: args.days } : undefined }),
      providesTags: ["AdminStats"],
    }),
    getAdminUsers: builder.query<{ users: AdminUser[]; total: number; page: number; limit: number }, { page?: number; limit?: number } | void>({
      query: (args) => ({ url: "/admin/users", params: { page: args?.page ?? 1, limit: args?.limit ?? 100 } }),
      providesTags: ["AdminUsers"],
    }),
    updateAdminUser: builder.mutation<{ message: string; user: AdminUser }, { id: string; name?: string; email?: string; role?: string; isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
    deleteAdminUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
    suspendUser: builder.mutation<{ message: string }, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/suspend`, method: "POST", body: { reason } }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
    activateUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/admin/users/${id}/activate`, method: "POST" }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
    verifyUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/admin/users/${id}/verify`, method: "POST" }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useSuspendUserMutation,
  useActivateUserMutation,
  useVerifyUserMutation,
} = adminApi;
