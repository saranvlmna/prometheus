import actionDelete from "./lib/action.delete.js";

export default async (req, res) => {
  try {
    const { action_id, remark } = req.body;

    const deleteAction = await actionDelete(action_id);

    return res.json({
      message: "Action deleted successfully",
      action: deleteAction,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
