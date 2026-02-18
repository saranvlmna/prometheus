import { findActionById } from "./lib/action.db.js";

export default async (req, res) => {
    try {
        const { id } = req.params;
        const action = await findActionById(id);

        if (!action) {
            return res.status(404).json({ error: "Action not found" });
        }

        return res.json(action);
    } catch (error) {
        console.error("[ActionGet] Error fetching action:", error);
        return res.status(500).json({ error: error.message });
    }
};
