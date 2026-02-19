import actionFindById from "./lib/action.find.by.id.js";
import actionUpdate from "./lib/action.update.js";

export default async (req, res) => {
  try {
    const { id } = req.params;
    const { payload } = req.body;

    const action = await actionFindById(id);
    if (!action) return res.status(404).json({ error: "Action not found" });

    if (["completed", "failed", "declined"].includes(action.status)) {
      return res.status(400).json({
        error: `Cannot update payload for action with status: ${action.status}`,
      });
    }

    const updatedAction = await actionUpdate(id, { payload });

    return res.json({ message: "Action payload updated", action: updatedAction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
