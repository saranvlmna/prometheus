import googleConfig from "../../config/google.config.js";

const SCOPES_MAP = {
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "openid",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  "google-tasks": [
    "https://www.googleapis.com/auth/tasks",
    "openid",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  "google-calendar": [
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  "google-meet": [
    "https://www.googleapis.com/auth/calendar.events", // Meet often uses calendar scopes or specific ones if available
    "openid",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  "google-chat": [
    "https://www.googleapis.com/auth/chat.messages.readonly",
    "https://www.googleapis.com/auth/chat.spaces.readonly",
    "openid",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
};

const DEFAULT_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export default async (req, res) => {
  try {
    const { toolId } = req.query;
    const oAuth2Client = googleConfig();

    console.log("[GoogleAuth] Generating URL. Redirect URI:", oAuth2Client._redirectUri);
    console.log("[GoogleAuth] Client ID:", oAuth2Client._clientId);

    const scopes = SCOPES_MAP[toolId] || DEFAULT_SCOPES;

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: JSON.stringify({ toolId }), // Passing toolId via state to retrieve it in webhook
    });

    return res.json({ authUrl });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({
      error: "Failed to generate auth URL",
      message: error.message,
    });
  }
};
