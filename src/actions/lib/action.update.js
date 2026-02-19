import Action from "../../../database/model/action.js";

export default async (id, data) => {
  try {
    return await Action.findByIdAndUpdate(id, data, { new: true });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
