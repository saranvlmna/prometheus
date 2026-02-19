import Subscription from "../../../database/model/subscription.js";

export default async (data) => {
  try {
    return await Subscription.create(data);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
