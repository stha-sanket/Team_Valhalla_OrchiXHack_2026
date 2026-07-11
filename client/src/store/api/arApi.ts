import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface QuizQuestionPublic {
  question: string;
  options: string[];
}

export interface QuizReview {
  /** Empty for attempts made before answer storage existed. */
  answers: number[];
  correct_indexes: number[];
  /** Null when the original picks weren't stored. */
  correct_count: number | null;
}

export interface PlaceQuizResponse {
  /** True until the caller has visited every checkpoint of the place. */
  locked: boolean;
  /** Absent while locked. */
  quiz?: { id: string; questions: QuizQuestionPublic[] };
  attempted: boolean;
  earned_points: number;
  /** The caller's past attempt vs the correct answers — null until attempted. */
  review?: QuizReview | null;
}

export interface QuizAttemptResponse {
  correct_count: number;
  points_awarded: number;
  correct_indexes: number[];
}

export interface ArPointsEntry {
  source: "quiz" | "side_quest" | "milestone" | "place_complete" | "redeem";
  ref_id: string;
  label: string;
  /** Negative for redemptions. */
  points: number;
  earned_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface MyPointsResponse {
  total: number;
  entries: ArPointsEntry[];
  rewards: Reward[];
}

export type LeaderboardSort = "milestones" | "places" | "side_quests";

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  milestones: number;
  places: number;
  side_quests: number;
}

export const arApi = createApi({
  reducerPath: "arApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Quiz", "Points"],
  endpoints: (builder) => ({
    getPlaceQuiz: builder.query<PlaceQuizResponse, string>({
      query: (placeId) => `/visiting-places/${placeId}/quiz`,
      providesTags: (_res, _err, placeId) => [{ type: "Quiz", id: placeId }],
    }),
    submitQuizAttempt: builder.mutation<QuizAttemptResponse, { placeId: string; answers: number[] }>({
      query: ({ placeId, answers }) => ({
        url: `/visiting-places/${placeId}/quiz/attempt`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: (_res, _err, { placeId }) => [{ type: "Quiz", id: placeId }, "Points"],
    }),
    getMyPoints: builder.query<MyPointsResponse, void>({
      query: () => "/user/points",
      providesTags: ["Points"],
    }),
    getLeaderboard: builder.query<{ by: LeaderboardSort; entries: LeaderboardEntry[] }, LeaderboardSort>({
      query: (by) => ({ url: "/users/leaderboard", params: { by } }),
    }),
    redeemReward: builder.mutation<{ message: string; total: number }, string>({
      query: (rewardId) => ({ url: "/user/points/redeem", method: "POST", body: { reward_id: rewardId } }),
      invalidatesTags: ["Points"],
    }),
  }),
});

export const {
  useGetPlaceQuizQuery,
  useSubmitQuizAttemptMutation,
  useGetMyPointsQuery,
  useGetLeaderboardQuery,
  useRedeemRewardMutation,
} = arApi;
