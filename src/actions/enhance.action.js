import actionFindById from "./lib/action.find.by.id.js";
import actionUpdate from "./lib/action.payload.update.js";
import actionEnhance from "../agents/action.enhance.js";
import userFindById from "../user/lib/user.find.by.id.js";

export default async (req, res) => {
    try {
        const { actionId } = req.params;
        const { needAiEnhance, description, payload } = req.body;
        const { user_id: userId } = req.user;

        const action = await actionFindById(actionId);
        if (!action) return res.status(404).json({ error: "Action not found" });

        // Check if the action belongs to the user
        if (action.userId.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized access to this action" });
        }

        let finalPayload = payload;

        if (needAiEnhance) {
            if (!description) {
                return res.status(400).json({ error: "Description is required for AI enhancement" });
            }

            const user = await userFindById(userId);
            const persona = user?.persona;

            finalPayload = await actionEnhance(action, description, persona);
        }

        const updatedAction = await actionUpdate(actionId, { payload: finalPayload });

        return res.json({
            message: needAiEnhance ? "Action enhanced and updated" : "Action updated",
            action: updatedAction,
        });
    } catch (error) {
        console.error("Enhance Action Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
