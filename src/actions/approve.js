import { STATUS } from "../../shared/constants/system.js";
import eventCreate from "../google/calender/event.create.js";
import subscriptionFind from "../subscription/lib/subscription.find.js";
import actionFindById from "./lib/action.find.by.id.js";
import actionUpdateStatus from "./lib/action.update.status.js";

export default async (req, res) => {
  try {
    const { action_id, source, type } = req.body;
    const { user_id } = req.user;

    const googleSource = ["gmail"];

    let provider;
    if (googleSource.includes(source)) {
      provider = "google";
    }

    const action = await actionFindById(action_id);
    const subscription = await subscriptionFind(user_id, provider);

    if (type == "calendar_reminder") {
      const calender = await eventCreate(subscription?.refreshToken, {
        title: action?.payload?.title,
        description: action?.payload?.description,
        start: action?.payload?.start_time,
        end: action?.payload?.end_time,
      });

      // Update action status to completed
      await actionUpdateStatus(action_id, STATUS.COMPLETED);

      return res.json({ message: "Calender event created successfully", data: calender });
    }

    return res.json({ message: "OK" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
