import Action from "../../database/model/action.model.js";

export default async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        const actions = await Action.find(filter).populate("userId", "name email").sort("-createdAt");
        return res.json(actions);
    } catch (error) {
        console.error("Error fetching Actions:", error);
        return res.status(500).json({ error: error.message });
    }
};
