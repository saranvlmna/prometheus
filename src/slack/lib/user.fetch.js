import axios from "axios";
const botToken = process.env.SLACK_BOT_TOKEN;

export default async (user) => {
  try {
    return await axios.get("https://slack.com/api/users.info", {
      headers: {
        Authorization: `Bearer ${botToken}`,
      },
      params: {
        user: user,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
