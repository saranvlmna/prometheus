import User from "../../../database/model/user.js";

export default async () => {
  try {
    return await User.findOne().sort({ updatedAt: -1 });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
