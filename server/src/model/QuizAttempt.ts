import { defineModel } from "express-file-cluster";

/** A user's single, permanent quiz attempt — kept so they can review the
 * correct answers against their own picks afterwards. One per (user, quiz). */
export interface QuizAttemptDocument {
  user_id: string;
  quiz_id: string;
  /** Option index picked per question, same order as the quiz's questions. */
  answers: number[];
  correct_count: number;
  points: number;
}

export const QuizAttempt = defineModel<QuizAttemptDocument>("QuizAttempt", {
  user_id: { type: "string", required: true },
  quiz_id: { type: "string", required: true },
  answers: { type: "array", default: [] },
  correct_count: { type: "number", required: true },
  points: { type: "number", required: true },
});
