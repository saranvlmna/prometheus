import { AVAILABLE_TOOLS } from "../../config/tools.js";
import toolsFind from "./lib/tools.find.js";

export default async (req, res) => {
  try {
    const { user_id } = req.user;

    const connectedTools = await toolsFind(user_id);

    const tools = AVAILABLE_TOOLS.map((tool) => ({ ...tool }));

    if (!connectedTools.length) {
      return res.json({ tools });
    }

    const result = tools.map((tool) => {
      const isConnected = connectedTools.some((connectedTool) => connectedTool.toolId === tool.id);

      return {
        ...tool,
        status: isConnected ? "connected" : (tool.status ?? "disconnected"),
      };
    });

    return res.json({ tools: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
