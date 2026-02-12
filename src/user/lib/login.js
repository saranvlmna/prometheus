import User from "../../../database/model/user.js";

export default async (email) => {
  const user = await User.findOne({ email });
  return user;
};
