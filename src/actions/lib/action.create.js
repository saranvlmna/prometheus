import Action from "../../../database/model/action.js";

export default async (data) => {
  try {
    return await Action.create(data);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
