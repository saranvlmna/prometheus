import GoogleAction from "../../database/model/google_action.js";
import User from "../../database/model/user.js";
import createGoogleTask from "./lib/tasks.create.js";
import createGmailDraft from "./lib/gmail.draft.create.js";


export const getActions = async (req, res) => {
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


export const updateActionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'declined'

        const action = await GoogleAction.findById(id);
        if (!action) return res.status(404).json({ error: "Action not found" });

        if (status === "declined") {
            action.status = "declined";
            await action.save();
            return res.json({ message: "Action declined", action });
        }

        if (status === "approved") {
            action.status = "approved";
            await action.save(); // Mark as approved before executing

            // Execute action
            const user = await User.findById(action.userId);
            if (!user || (!user.accessToken && !user.refreshToken)) {
                action.status = "failed";
                action.error = "User credentials not found";
                await action.save();
                return res.status(400).json({ error: "User credentials missing" });
            }

            const tokens = { access_token: user.accessToken, refresh_token: user.refreshToken };

            try {
                if (action.type === "task") {
                    await createGoogleTask(tokens, action.content);
                } else if (action.type === "mail") {
                    await createGmailDraft(tokens, action.content);
                }

                action.status = "success";
                await action.save();
                return res.json({ message: "Action executed successfully", action });
            } catch (execError) {
                action.status = "failed";
                action.error = execError.message;
                await action.save();
                return res.status(500).json({ error: "Execution failed", details: execError.message });
            }
        }

        return res.status(400).json({ error: "Invalid status update" });
    } catch (error) {
        console.error("Error updating action status:", error);
        return res.status(500).json({ error: error.message });
    }
};
