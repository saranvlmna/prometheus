import { findActionById, updateAction } from "./lib/action.db.js";

export default async (req, res) => {
    try {
        const { id } = req.params;
        const { payload } = req.body;

        const action = await findActionById(id);
        if (!action) return res.status(404).json({ error: "Action not found" });

        // Prevent modification of finished actions
        if (["completed", "failed", "declined"].includes(action.status)) {
            return res.status(400).json({
                error: `Cannot update payload for action with status: ${action.status}`
            });
        }

        const updatedAction = await updateAction(id, { payload });

        return res.json({ message: "Action payload updated", action: updatedAction });
    } catch (error) {
        console.error("[ActionUpdatePayload] Error updating action payload:", error);
        return res.status(500).json({ error: error.message });
    }
};
