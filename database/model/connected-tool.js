import mongoose from "mongoose";

const connectedToolSchema = new mongoose.Schema(
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
            enum: ["connected", "disconnected"],
            default: "connected",
        },
        config: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

connectedToolSchema.index({ userId: 1, toolId: 1 }, { unique: true });

const ConnectedTool = mongoose.model("ConnectedTool", connectedToolSchema);

export default ConnectedTool;
