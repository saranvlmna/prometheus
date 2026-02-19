import actionFindAll from "./lib/action.find.all.js";

export default async (req, res) => {
  try {
    const { status, type } = req.query;
    const { user_id: userId } = req.user;

    const filter = { userId };

    if (status) filter.status = status;
    if (type) filter.type = type;

    const actions = await actionFindAll(filter);

    return res.json(actions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
