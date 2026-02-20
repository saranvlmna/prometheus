import messagesFetch from "../slack/lib/messages.fetch.js";

export default async (req, res) => {
  try {
    const event = req.body.event;
    console.log("Received Slack event:", event);

    if (event?.type === "message" && !event.bot_id) {
      const botToken = process.env.SLACK_BOT_TOKEN;

      console.log("User:", event.user);
      console.log("Text:", event.text);

      const previous = await messagesFetch(botToken, event.channel, event.ts, 4);

      const contextMessages = [
        ...previous.reverse(),
        {
          user: event.user,
          text: event.text,
          ts: event.ts,
        },
      ];

      console.log("Context messages:", contextMessages);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(200);
  }
};
