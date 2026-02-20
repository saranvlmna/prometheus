import axios from "axios";
import jwt from "jsonwebtoken";

export default async (req, res) => {
  try {
    console.log("Received Slack auth callback with query:", req.query);
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    const client_id = process.env.SLACK_CLIENT_ID;
    const client_secret = process.env.SLACK_CLIENT_SECRET;
    const redirect_uri = process.env.SLACK_REDIRECT_URI;

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

    /*
      profile contains:
      sub → slack user id
      email
      name
      picture
      https://slack.com/team_id
    */

    const slackUserId = profile.sub;
    const email = profile.email;
    const name = profile.name;
    const workspaceId = profile["https://slack.com/team_id"];

    // 3️⃣ Create / login user in DB (example)
    const user = {
      slackUserId,
      email,
      name,
      workspaceId,
      access_token,
    };

    console.log("Slack user:", user);

    // TODO:
    // upsert user in DB
    // return res.redirect(`${process.env.FRONTEND_URL}/auth/success?email=${encodeURIComponent(email)}`);
    return res.json({ message: "Slack authentication successful", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Slack callback failed",
      message: error.message,
    });
  }
};
