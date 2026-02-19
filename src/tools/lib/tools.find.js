import Tool from "../../../database/model/tools.js";

export default async function toolsFind(userId) {
  try {
    if (!userId) return [];

    return await Tool.find({ userId }).lean();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
