import Subscription from "../../../database/model/subscription.js";

export default async (id, data) => {
  try {
    return await Subscription.findByIdAndUpdate(id, data, { new: true });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
