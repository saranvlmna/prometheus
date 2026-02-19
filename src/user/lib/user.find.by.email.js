import User from "../../../database/model/user.js";

export default async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
