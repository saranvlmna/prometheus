import googleConfig from "../../config/google.js";

/* ------------------------------------------------ */
/* Tool specific scopes                             */
/* ------------------------------------------------ */

const SCOPES_MAP = {
  gmail: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.modify"],

  "google-tasks": ["https://www.googleapis.com/auth/tasks"],

  "google-calendar": ["https://www.googleapis.com/auth/calendar.events"],

  "google-meet": ["https://www.googleapis.com/auth/calendar.events"],

  "google-chat": [
    "https://www.googleapis.com/auth/chat.messages.readonly",
    "https://www.googleapis.com/auth/chat.spaces.readonly",
  ],
};

/* ------------------------------------------------ */
/* Identity scopes                                  */
/* ------------------------------------------------ */

const IDENTITY_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

/* ------------------------------------------------ */

export default async (req, res) => {
  try {
    const { toolId } = req.query;

    if (!toolId) {
      return res.status(400).json({ error: "toolId is required" });
    }

    /* ---------- not implemented ---------- */

    const notImplemented = ["google-chat"]; // fixed spacing bug

    if (notImplemented.includes(toolId)) {
      return res.status(400).json({
        error: `${toolId} not implemented yet`,
      });
    }

    /* ---------- oauth client ---------- */

    const oAuth2Client = googleConfig();

    console.log("[GoogleAuth] Redirect URI:", oAuth2Client._redirectUri);
    console.log("[GoogleAuth] Client ID:", oAuth2Client._clientId);
    console.log("[GoogleAuth] Tool:", toolId);

    /* ---------- scopes ---------- */

    const toolScopes = SCOPES_MAP[toolId] || [];

    const scopes = [...new Set([...toolScopes, ...IDENTITY_SCOPES])];

    console.log("[GoogleAuth] Using scopes:", scopes);

    /* ---------- auth url ---------- */

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline", // refresh token
      scope: scopes,
      prompt: "consent", // force new scopes
      include_granted_scopes: true, // incremental auth ⭐
      state: JSON.stringify({ toolId }),
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
