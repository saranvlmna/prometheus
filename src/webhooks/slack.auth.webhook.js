import axios from "axios";
import jwt from "jsonwebtoken";
import Tool from "../../database/model/tools.js";
import { SUBSCRIPTION } from "../../shared/constants/system.js";
import subscriptionCreate from "../subscription/lib/subscription.create.js";
import subscriptionFind from "../subscription/lib/subscription.find.js";
import userFindByEmail from "../user/lib/user.find.by.email.js";

const client_id = process.env.SLACK_CLIENT_ID;
const client_secret = process.env.SLACK_CLIENT_SECRET;
const redirect_uri = process.env.SLACK_REDIRECT_URI;

export default async (req, res) => {
  try {
    console.log("Received Slack auth callback with query:", req.query);
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    const tokenRes = await axios.post(
      "https://slack.com/api/openid.connect.token",
      new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    if (!tokenRes.data.ok) {
      return res.status(400).json(tokenRes.data);
    }

    const { id_token, access_token } = tokenRes.data;

    const profile = jwt.decode(id_token);

    const slackUserId = profile.sub;
    const email = profile.email;
    const workspaceId = profile["https://slack.com/team_id"];

    let dbUser = await userFindByEmail(email);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    let subscription = await subscriptionFind(dbUser._id, SUBSCRIPTION.SLACK);
    if (!subscription) {
      const subData = {
        userId: dbUser._id,
        provider: SUBSCRIPTION.SLACK,
        providerId: slackUserId,
        accessToken: access_token,
        workspaceId: workspaceId,
        lastLogin: new Date(),
      };
      await subscriptionCreate(subData);
    }

    const { toolId } = JSON.parse(decodeURIComponent(state));

    if (toolId) {
      await Tool.findOneAndUpdate(
        { userId: dbUser._id, toolId },
        { $set: { status: "connected" }, $setOnInsert: { userId: dbUser._id, toolId } },
        { upsert: true, new: true },
      );
    }

    res.send(`
<html>
<body>
<script>
          window.opener.postMessage({ type: 'AUTH_SUCCESS' }, "*");
          window.close();
</script>
<p>Authentication successful! Closing window...</p>
</body>
</html>
  `);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Slack callback failed",
      message: error.message,
    });
  }
};
