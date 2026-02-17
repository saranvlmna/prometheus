import axios from "axios";
import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";

export default async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code missing");
  }

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID,
        scope: [
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
          "Tasks.ReadWrite",
        ].join(" "),
        code,
        redirect_uri: process.env.REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI, // fallback if needed
        grant_type: "authorization_code",
        client_secret: process.env.AZURE_CLIENT_SECRET,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // 2. Get user profile
    const profileResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, displayName, mail, userPrincipalName } = profileResponse.data;
    const email = mail || userPrincipalName;

    if (!email) {
      return res.status(400).send("No email found in Microsoft profile");
    }

    // 3. Manage User (Identity)
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name: displayName, email });
      console.log("[AzureAuth] Created new user:", email);
    } else {
      console.log("[AzureAuth] Found existing user:", email);
    }

    // 4. Manage Subscription (Credentials)
    let sub = await Subscription.findOne({ userId: user._id, provider: "azure" });

    const subData = {
      userId: user._id,
      provider: "azure",
      providerId: id,
      accessToken: access_token,
      refreshToken: refresh_token || sub?.refreshToken,
      expiry: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined,
      lastLogin: new Date(),
    };

    if (sub) {
      Object.assign(sub, subData);
      await sub.save();
      console.log("[AzureAuth] Updated existing subscription for", email);
    } else {
      sub = await Subscription.create(subData);
      console.log("[AzureAuth] Created new subscription for", email);
    }

    res.send(`Login successful! Welcome ${user.name}. Your Azure subscription is now active.`);
  } catch (error) {
    console.error("[AzureAuth] Callback Error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed");
  }
};
