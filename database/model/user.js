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

    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false,
    },
    // Generic preferences that apply to the user regardless of login method
    preferences: {
      autoExecuteActions: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
