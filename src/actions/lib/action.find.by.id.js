import Action from "../../../database/model/action.js";

export default async (id) => {
  try {
    return await Action.findById(id).populate("userId", "name email");
  } catch (error) {
    console.log(error);
    throw error;
  }
};
