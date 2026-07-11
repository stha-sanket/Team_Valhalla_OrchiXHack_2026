import { defineModel } from "express-file-cluster";

export interface MilestoneEntry {
  name: string;
  earned_at: string; // ISO 8601 timestamp
}

export interface UserDocument {
  name: string;
  email: string;
  password: string;
  role: string;
  milestones: MilestoneEntry[];
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  verifyToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  refreshToken?: string;
  refreshTokenExpiry?: Date;
}

export const User = defineModel<UserDocument>("User", {
  name: { type: "string", required: true },
  email: { type: "string", required: true, unique: true },
  password: { type: "string", required: true },
  role: { type: "string", required: true, default: "user" },
  milestones: {
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string", required: true },
        earned_at: { type: "string", required: true },
      },
    },
    default: [],
  },
  avatar: { type: "string" },
  isVerified: { type: "boolean", default: false },
  isActive: { type: "boolean", default: true },
  verifyToken: { type: "string" },
  resetToken: { type: "string" },
  resetTokenExpiry: { type: "date" },
  refreshToken: { type: "string" },
  refreshTokenExpiry: { type: "date" },
});
