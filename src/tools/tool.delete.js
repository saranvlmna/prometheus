import userFindById from "../user/lib/user.find.by.id.js";
import toolDelete from "./lib/tool.delete.js";

export default async (req, res) => {
  try {
    const { user_id } = req.user;
    const { toolId } = req.query;

    console.log(user_id, toolId);
    const user = await userFindById(user_id);
    if (!user) return res.json({ message: "User not found" });

    const response = await toolDelete(user_id, toolId);

    return res.json({ message: "Tool deleted successfully", response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
