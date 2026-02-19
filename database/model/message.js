import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["teams", "teams-channel", "outlook"],
      required: true,
    },
    messageId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    chatId: {
      type: String,
    },
    teamId: {
      type: String,
    },
    channelId: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    subject: {
      type: String,
    },
    from: {
      type: String,
    },
    fromEmail: {
      type: String,
    },
    to: {
      type: [String],
    },
    cc: {
      type: [String],
    },
    content: {
      type: String,
    },
    contentType: {
      type: String,
    },
    bodyPreview: {
      type: String,
    },
    receivedDateTime: {
      type: Date,
    },
    hasAttachments: {
      type: Boolean,
    },
    importance: {
      type: String,
    },
    chatType: {
      type: String,
    },
    raw: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ userId: 1, platform: 1, createdDateTime: -1 });

export default mongoose.model("Message", messageSchema);
