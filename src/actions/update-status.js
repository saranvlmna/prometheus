import { findActionById, updateAction } from "./lib/action.db.js";
import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";
import createGoogleTask from "../google/lib/tasks.create.js";
import createGmailDraft from "../google/lib/gmail.draft.create.js";

export default async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'declined'

        const action = await findActionById(id);
        if (!action) return res.status(404).json({ error: "Action not found" });

        if (status === "declined") {
            const updatedAction = await updateAction(id, { status: "declined" });
            return res.json({ message: "Action declined", action: updatedAction });
        }

        if (status === "approved") {
            // Pre-emptively set to approved to avoid race conditions if needed
            // But we'll follow the existing pattern of updating before execution
            await updateAction(id, { status: "approved" });

            const user = await User.findById(action.userId);
            if (!user) {
                await updateAction(id, { status: "failed", errorMessage: "User not found" });
                return res.status(404).json({ error: "User not found" });
            }

            const sub = await Subscription.findOne({ userId: user._id, provider: "google" });
            if (!sub || (!sub.accessToken && !sub.refreshToken)) {
                await updateAction(id, {
                    status: "failed",
                    errorMessage: "Google credentials not found on subscription"
                });
                return res.status(400).json({ error: "Google credentials missing" });
            }

            const tokens = { access_token: sub.accessToken, refresh_token: sub.refreshToken };

            try {
                const content = action.payload || action.content;

                if (action.type === "task" || action.type === "google_task") {
                    await createGoogleTask(tokens, content);
                } else if (action.type === "mail" || action.type === "gmail_reply") {
                    await createGmailDraft(tokens, content);
                }

                const completedAction = await updateAction(id, { status: "completed" });
                return res.json({ message: "Action executed successfully", action: completedAction });
            } catch (execError) {
                const failedAction = await updateAction(id, {
                    status: "failed",
                    errorMessage: execError.message
                });
                return res.status(500).json({ error: "Execution failed", details: execError.message, action: failedAction });
            }
        }

        return res.status(400).json({ error: "Invalid status update" });
    } catch (error) {
        console.error("[ActionUpdateStatus] Error updating action status:", error);
        return res.status(500).json({ error: error.message });
    }
};
