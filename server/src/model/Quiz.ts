import { defineModel } from "express-file-cluster";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index into `options` — never sent to regular users. */
  correct_index: number;
}

export interface QuizDocument {
  visiting_place_id: string;
  questions: QuizQuestion[];
}

/** One optional quiz per visiting place, always 5 questions. */
export const Quiz = defineModel<QuizDocument>("Quiz", {
  visiting_place_id: { type: "string", required: true, unique: true },
  questions: {
    type: "array",
    items: {
      type: "object",
      properties: {
        question: { type: "string", required: true },
        options: { type: "array", required: true },
        correct_index: { type: "number", required: true },
      },
    },
    default: [],
  },
});
