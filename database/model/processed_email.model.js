import mongoose from "mongoose";

const processedEmailSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messageId: {
            type: String,
            required: true,
        },
        processedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound index to ensure uniqueness per user
processedEmailSchema.index({ userId: 1, messageId: 1 }, { unique: true });

// TTL index to automatically expire entries after 30 days
processedEmailSchema.index({ processedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ProcessedEmail = mongoose.model("ProcessedEmail", processedEmailSchema);

export default ProcessedEmail;
