import Action from "../../../database/model/action.js";

export default async (filter = {}) => {
  try {
    return await Action.find(filter).populate("userId", "name email").sort("-createdAt");
  } catch (error) {
    console.log(error);
    throw error;
  }
};
