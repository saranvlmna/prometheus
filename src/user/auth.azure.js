import crypto from "crypto";

export default (req, res) => {
  // Define scopes cleanly as an array
  const scopes = [
    "openid",
    "profile",
    "email",
    "offline_access",
    "User.Read",
    "Mail.Read",
    "Mail.ReadBasic",
    "Calendars.ReadWrite",
    "Chat.Read",
    "Chat.ReadBasic",
    // "ChannelMessage.Read.All",
    // "Team.ReadBasic.All",
    "Tasks.ReadWrite",
    // "Chat.Read.All",
    // "ChannelMessage.Read.All",
    // "Mail.Read",
    // "Calendars.Read",
    // "Tasks.ReadWrite",
  ];

  // Generate a random state for security (CSRF protection)
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.REDIRECT_URI,
    response_mode: "query",
    scope: scopes.join(" "),
    state: state,
    prompt: "select_account"
  });

  const authUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;

  res.redirect(authUrl);
};
