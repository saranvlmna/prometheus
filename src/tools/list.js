import { AVAILABLE_TOOLS } from "../../config/tools.js";
import toolsFind from "./lib/tools.find.js";
export default async (req, res) => {
  try {
    const { user_id } = req.user;

    const avalidTools = AVAILABLE_TOOLS;
    const connectedTools = await toolsFind(user_id);
    if (connectedTools.length === 0) return res.json({ tools: AVAILABLE_TOOLS });

    const result = [];
    avalidTools.forEach((tool) => {
      const isConnected = connectedTools.some((connectedTool) => connectedTool.toolId === tool.id);
      if (isConnected) {
        tool.status = "connected";
      }
      result.push(tool);
    });
    return res.json({ tools: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
