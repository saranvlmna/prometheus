import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
    },
    preferences: {
      autoExecuteActions: { type: Boolean, default: false },
    },
    isPersonaCreated: {
      type: Boolean,
      default: false,
    },
    persona: {
      role: { type: String },
      company: { type: String },
      projectKeywords: [{ type: String }],
      tools: [{ type: String }],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
