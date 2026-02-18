import User from "../../../database/model/user.js";

export default async (email, password) => {
  // Find user by email and include password field
  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    // 1. User not found -> Create new user
    const name = email.split("@")[0]; // Default name from email
    user = await User.create({
      name,
      email,
      password,
    });
    user.password = undefined;
    return user;
  }

  // 2. User exists -> Check password
  if (user.password) {
    // If user has a password, verify it
    if (user.password !== password) {
      return null; // Password mismatch
    }
  } else {
    // If user doesn't have a password (e.g. SSO), set it now
    user.password = password;
    await user.save();
  }

  user.password = undefined;
  return user;
};
