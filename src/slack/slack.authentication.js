export default async (req, res) => {
    try {
        const { toolId } = req.query;

        // Slack auth logic placeholder
        // In a real app, you'd use Slack SDK or generate a Slack OAuth URL
        const slackClientId = process.env.SLACK_CLIENT_ID;
        const redirectUri = encodeURIComponent(`${process.env.BACKEND_URL}/webhooks/slack/callback`);
        const scopes = "chat:write,channels:read,groups:read";

        const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${JSON.stringify({ toolId })}`;

        return res.json({ authUrl });
    } catch (error) {
        console.error("Slack auth error:", error);
        return res.status(500).json({
            error: "Failed to generate Slack auth URL",
            message: error.message,
        });
    }
};
