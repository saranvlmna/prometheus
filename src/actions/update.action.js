import actionUpdate from "./lib/action.update.js";
import actionFindById from "./lib/action.find.by.id.js";

export default async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const { user_id } = req.user;

        const action = await actionFindById(id);
        if (!action) return res.status(404).json({ error: "Action not found" });

        if (action?.userId?._id != user_id) {
            return res.status(403).json({ error: "Unauthorized access to this action" });
        }

        const updatedAction = await actionUpdate(id, data);

        return res.json({
            message: "Action updated successfully",
            action: updatedAction,
        });
    } catch (error) {
        console.error("Update Action Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
