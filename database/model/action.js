import mongoose from "mongoose";

const actionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    sourceId: {
      type: String,
      required: true,
      index: true,
    },
    context: {
      type: Object,
      default: {},
    },
    type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      default: "medium",
    },
    payload: {
      type: Object,
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    reasoning: {
      type: String,
    },
    confidence: {
      type: Number,
    },
    executedAt: {
      type: Date,
    },
    executionResult: {
      type: Object,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true },
);

actionSchema.index({ userId: 1, status: 1 });

const Action = mongoose.model("Action", actionSchema);

export default Action;
