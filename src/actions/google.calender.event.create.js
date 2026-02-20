import eventCreate from "../google/calender/event.create.js";
import subscriptionFind from "../subscription/lib/subscription.find.js";
import actionFindById from "./lib/action.find.by.id.js";

export default async (req, res) => {
  try {
    const { action_id, provider } = req.query;
    const { user_id } = req.user;

    const action = await actionFindById(action_id);
    const subscription = await subscriptionFind(user_id, provider);

    console.log("action", subscription?.refreshToken);

    const calender = await eventCreate(subscription?.refreshToken, {
      title: "Team Meeting",
      description: "Discuss Slack integration",
      start: "2026-02-22T10:00:00+05:30",
      end: "2026-02-22T11:00:00+05:30",
    });

    return res.json({ message: "Calender event created successfully", data: calender });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
