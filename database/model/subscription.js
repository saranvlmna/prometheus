import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        provider: {
            type: String,
            enum: ["google", "azure"],
            required: true,
        },
        providerId: {
            type: String,
            required: true,
        },
        accessToken: String,
        refreshToken: String,
        expiry: Date,
        lastLogin: Date,

        // Resource-specific subscription IDs (e.g., for Gmail watch, MS Graph)
        subscriptionId: {
            type: String,
            unique: true,
            sparse: true,
        },
        // Fields for Microsoft Graph or other specifically subscribed resources
        resource: String,
        teamId: String,
        teamName: String,
        changeType: String,
        clientState: String,
        expirationDateTime: Date,

        // Gmail specific
        lastHistoryId: String,
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure a user only has one subscription record per provider
subscriptionSchema.index({ userId: 1, provider: 1 }, { unique: true });
subscriptionSchema.index({ provider: 1, providerId: 1 }, { unique: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
