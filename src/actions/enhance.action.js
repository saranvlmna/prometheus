import actionFindById from "./lib/action.find.by.id.js";
import actionUpdate from "./lib/action.payload.update.js";
import actionEnhance from "../agents/action.enhance.js";
import userFindById from "../user/lib/user.find.by.id.js";

export default async (req, res) => {
    try {
        const { actionId } = req.params;
        const { description } = req.body;
        const { user_id } = req.user;

        const action = await actionFindById(actionId);
        if (!action) return res.status(404).json({ error: "Action not found" });

        // Check if the action belongs to the user
        if (action.userId.toString() !== user_id) {
            return res.status(403).json({ error: "Unauthorized access to this action" });
        }

        if (!description) {
            return res.status(400).json({ error: "Description is required for enhancement" });
        }

        const user = await userFindById(userId);
        const persona = user?.persona;

        const enhancement = await actionEnhance(action, description, persona);

        return res.json({
            message: "Action enhanced successfully",
            enhancement,
        });
    } catch (error) {
        console.error("Enhance Action Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
