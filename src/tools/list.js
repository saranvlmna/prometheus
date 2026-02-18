import { CONNECTED_TOOLS, AVAILABLE_TOOLS } from "./lib/tools.config.js";
import ConnectedTool from "../../database/model/connected-tool.js";
import jwt from "jsonwebtoken";

export default async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        let userId = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (e) {
                console.warn("Invalid token in tools list:", e.message);
            }
        }

        let userConnectedTools = [];
        if (userId) {
            userConnectedTools = await ConnectedTool.find({ userId, status: "connected" });
        }

        const connectedToolIds = userConnectedTools.map(t => t.toolId);

        // Merge static config with user connection status
        const allTools = [...CONNECTED_TOOLS, ...AVAILABLE_TOOLS].map(tool => ({
            ...tool,
            status: connectedToolIds.includes(tool.id) ? "connected" : tool.status
        }));

        res.json({
            connected: allTools.filter(t => t.status === "connected"),
            available: allTools.filter(t => t.status !== "connected")
        });
    } catch (error) {
        console.error("Error fetching tools:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
