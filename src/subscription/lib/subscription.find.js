import Subscription from "../../../database/model/subscription.js";

export default async (userId, provider) => {
  try {
    return await Subscription.findOne({ userId, provider });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
