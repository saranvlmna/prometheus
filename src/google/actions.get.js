import GoogleAction from "../../database/model/google_action.js";

export default async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        const actions = await GoogleAction.find(filter).populate("userId", "name email").sort("-createdAt");
        return res.json(actions);
    } catch (error) {
        console.error("Error fetching Google Actions:", error);
        return res.status(500).json({ error: error.message });
    }
};
