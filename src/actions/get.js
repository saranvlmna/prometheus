import actionFindById from "./lib/action.find.by.id.js";

export default async (req, res) => {
  try {
    const { id } = req.params;

    const action = await actionFindById(id);
    if (!action) return res.status(404).json({ error: "Action not found" });

    return res.json(action);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
