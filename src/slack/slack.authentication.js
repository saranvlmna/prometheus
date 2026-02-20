export default async (req, res) => {
  try {
    const { toolId } = req.query;

    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI;

    const state = encodeURIComponent(JSON.stringify({ toolId }));

    const loginScopes = "openid profile email";

    const loginUrl =
      `https://slack.com/openid/connect/authorize` +
      `?client_id=${clientId}` +
      `&scope=${encodeURIComponent(loginScopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${state}`;

    const botScopes = [
      "channels:history",
      "channels:read",
      "groups:history",
      "groups:read",
      "im:history",
      "im:read",
      "mpim:history",
      "mpim:read",
      "chat:write",
      "channels:join",
    ].join(",");

    const userScopes = ["openid", "profile", "email"].join(",");

    const installUrl =
      `https://slack.com/oauth/v2/authorize` +
      `?client_id=${clientId}` +
      `&scope=${encodeURIComponent(botScopes)}` +
      `&user_scope=${encodeURIComponent(userScopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`;

    return res.json({
      loginUrl,
      installUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to generate Slack auth URL",
      message: error.message,
    });
  }
};
