import mongoose from "mongoose";

const actionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // The origin of the action (e.g., "gmail", "google_chat", "slack")
        source: {
            type: String,
            required: true,
            index: true,
        },
        // The ID of the source object (e.g., email messageId, chat message name)
        sourceId: {
            type: String,
            required: true,
            index: true,
        },
        // Context needed to link back to the source (e.g., threadId, spaceName)
        context: {
            type: Object,
            default: {},
        },
        // The specific action type (e.g., "google_task", "jira_ticket")
        type: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "declined", "executing", "completed", "failed"],
            default: "pending",
            index: true,
        },
        priority: {
            type: String,
            enum: ["high", "medium", "low", "ignore"],
            default: "medium",
        },
        title: String,
        description: String,
        // The payload required to execute the action (e.g., { title: "Buy milk", due_date: "..." })
        payload: {
            type: Object,
            required: true,
        },
        // AI Reasoning/Metadata
        reasoning: String,
        confidence: Number,

        // Execution tracking
        executedAt: Date,
        executionResult: Object,
        errorMessage: String,
    },
    { timestamps: true }
);

// Index for finding actions by user and status (common query)
actionSchema.index({ userId: 1, status: 1 });

const Action = mongoose.model("Action", actionSchema);

export default Action;
