import axios from "axios";
const botToken = process.env.SLACK_BOT_TOKEN;

export default async (channel) => {
  try {
    return await axios.get("https://slack.com/api/conversations.info", {
      headers: {
        Authorization: `Bearer ${botToken}`,
      },
      params: {
        channel: channel,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
