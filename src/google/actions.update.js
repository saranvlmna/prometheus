import Action from "../../database/model/action.model.js";
import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";
import createGoogleTask from "./lib/tasks.create.js";
import createGmailDraft from "./lib/gmail.draft.create.js";

// This file seems to be an old endpoint for manual approval/execution.
// With the new Orchestrator, execution logic is also handled by plugins.
// However, to keep this endpoint working for now, we'll adapt it to the Action model.
export default async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'declined'

        const action = await Action.findById(id);
        if (!action) return res.status(404).json({ error: "Action not found" });

        if (status === "declined") {
            action.status = "declined";
            await action.save();
            return res.json({ message: "Action declined", action });
        }

        if (status === "approved") {
            // Mark as approved. To re-trigger execution, you'd typically route this back through the Orchestrator
            // or the specific plugin. For legacy support, we'll keep the direct calls if the payload matches.

            action.status = "approved";
            await action.save();

            const user = await User.findById(action.userId);
            if (!user) {
                action.status = "failed";
                action.errorMessage = "User not found";
                await action.save();
                return res.status(404).json({ error: "User not found" });
            }

            const sub = await Subscription.findOne({ userId: user._id, provider: "google" });
            if (!sub || (!sub.accessToken && !sub.refreshToken)) {
                action.status = "failed";
                action.errorMessage = "Google credentials not found on subscription";
                await action.save();
                return res.status(400).json({ error: "Google credentials missing" });
            }

            const tokens = { access_token: sub.accessToken, refresh_token: sub.refreshToken };

            try {
                // Legacy support for "task" and "mail" types from the old GoogleAction model
                // The new system uses "google_task", "gmail_reply", etc.
                // We map them here if needed, or assume the old code pathways are still relevant for old data.

                // Note: The new Action model uses `payload` instead of `content`. 
                // We'll check both to be safe during migration or just strictly use payload.
                const content = action.payload || action.content;

                if (action.type === "task" || action.type === "google_task") {
                    await createGoogleTask(tokens, content);
                } else if (action.type === "mail" || action.type === "gmail_reply") {
                    await createGmailDraft(tokens, content);
                }

                action.status = "completed";
                await action.save();
                return res.json({ message: "Action executed successfully", action });
            } catch (execError) {
                action.status = "failed";
                action.errorMessage = execError.message;
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
