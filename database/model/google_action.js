import mongoose from "mongoose";

const googleActionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["task", "mail"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "declined", "success", "failed"],
            default: "pending",
        },
        content: {
            type: Object, // Stores { title, notes } for tasks or { subject, body } for mail
            required: true,
        },
        reference: {
            spaceName: String,
            threadName: String,
            messageName: String,
        },
        error: String,
        reasoning: String,
    },
    {
        timestamps: true,
    }
);

const GoogleAction = mongoose.model("GoogleAction", googleActionSchema);

export default GoogleAction;
