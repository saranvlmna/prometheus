import axios from "axios";

export default async (botToken, channel, ts, limit = 4) => {
  const res = await axios.get("https://slack.com/api/conversations.history", {
    headers: {
      Authorization: `Bearer ${botToken}`,
    },
    params: {
      channel,
      limit,
      latest: ts,
      inclusive: false,
    },
  });

  return res.data.messages || [];
};
