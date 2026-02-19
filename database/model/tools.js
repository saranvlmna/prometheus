import mongoose from "mongoose";

const ToolSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toolId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["connected", "disconnected", "pending"],
      default: "connected",
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

ToolSchema.index({ userId: 1, toolId: 1 }, { unique: true });

const Tool = mongoose.model("Tool", ToolSchema);

export default Tool;
