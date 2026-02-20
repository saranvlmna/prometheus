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
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    subscriptionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    expiry: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    resource: {
      type: String,
    },
    teamId: {
      type: String,
    },
    teamName: {
      type: String,
    },
    changeType: {
      type: String,
    },
    clientState: {
      type: String,
    },
    expirationDateTime: {
      type: Date,
    },
    lastHistoryId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

subscriptionSchema.index({ userId: 1, provider: 1 }, { unique: true });
subscriptionSchema.index({ provider: 1, providerId: 1 }, { unique: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
