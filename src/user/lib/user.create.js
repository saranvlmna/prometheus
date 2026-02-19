import User from "../../../database/model/user.js";

export default async (data) => {
  try {
    return await User.create(data);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
