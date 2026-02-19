import { ACTION_TYPES, STATUS, SUBSCRIPTION } from "../../shared/constants/system.js";
import createGmailDraft from "../google/gmail/draft.create.js";
import createGoogleTask from "../google/task/tasks.create.js";
import subscriptionFind from "../subscription/lib/subscription.find.js";
import findById from "../user/lib/user.find.by.id.js";
import actionUpdate from "./lib/action.update.js";

export default async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const action = await findActionById(id);
    if (!action) return res.status(404).json({ error: "Action not found" });

    if (status === STATUS.DECLINED) {
      const updatedAction = await actionUpdate(id, { status: STATUS.DECLINED });
      return res.json({ message: "Action declined", action: updatedAction });
    }

    if (status === STATUS.APPROVED) {
      await updateAction(id, { status: STATUS.APPROVED });

      const user = await findById(action.userId);
      if (!user) {
        await updateAction(id, { status: STATUS.FAILED, errorMessage: "User not found" });
        return res.status(404).json({ error: "User not found" });
      }

      const subscription = await subscriptionFind(user._id, SUBSCRIPTION.GOOGLE);
      if (!subscription || (!subscription.accessToken && !subscription.refreshToken)) {
        await updateAction(id, {
          status: STATUS.FAILED,
          errorMessage: "Google credentials not found on subscription",
        });
        return res.status(400).json({ error: "Google credentials missing" });
      }

      const tokens = { access_token: subscription.accessToken, refresh_token: subscription.refreshToken };

      const content = action.payload || action.content;

      if (action.type === ACTION_TYPES.TASK || action.type === ACTION_TYPES.GOOGLE_TASK) {
        await createGoogleTask(tokens, content);
      } else if (action.type === ACTION_TYPES.MAIL || action.type === ACTION_TYPES.MAIL_REPLY) {
        await createGmailDraft(tokens, content);
      }

      const completedAction = await updateAction(id, { status: STATUS.COMPLETED });
      return res.json({ message: "Action executed successfully", action: completedAction });
    }

    return res.status(400).json({ error: "Invalid status update" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
