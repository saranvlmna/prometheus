import Tool from "../../../database/model/tools.js";

export default async (userId, toolId) => {
  try {
    if (!userId || !toolId) return null;

    return await Tool.deleteOne({ userId, toolId });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
