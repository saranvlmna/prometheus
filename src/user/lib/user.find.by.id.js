import User from "../../../database/model/user.js";

export default async (id) => {
  try {
    return await User.findById(id);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
