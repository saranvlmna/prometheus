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

    type: {
      type: String,
      enum: ["azure", "google"],
      required: false, // Optional for local users
    },
    providerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    accessToken: String,
    refreshToken: String,
    expiry: Date,
    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
