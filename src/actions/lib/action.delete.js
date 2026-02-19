import Action from "../../../database/model/action.js";

export default async (id) => {
  try {
    return await Action.findByIdAndDelete(id);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
