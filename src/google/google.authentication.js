import googleConfig from "../../config/google.config.js";

export default async (req, res) => {
  try {
    const oAuth2Client = googleConfig();

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/chat.messages.readonly",
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/chat.spaces.readonly",
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    return res.json({ authUrl });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({
      error: "Failed to generate auth URL",
      message: error.message
    });
  }
};
