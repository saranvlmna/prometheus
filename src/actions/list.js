import { findAllActions } from "./lib/action.db.js";

export default async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        const actions = await findAllActions(filter);

        return res.json(actions);
    } catch (error) {
        console.error("[ActionsList] Error fetching actions:", error);
        return res.status(500).json({ error: error.message });
    }
};
