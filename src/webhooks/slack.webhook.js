import ConnectedTool from "../../database/model/connected-tool.js";
import User from "../../database/model/user.js";

export default async (req, res) => {
    try {
        const { code, state } = req.query;
        let toolId = null;
        try {
            if (state) {
                const parsedState = JSON.parse(state);
                toolId = parsedState.toolId;
            }
        } catch (e) {
            console.error("[SlackWebhook] Failed to parse state:", e.message);
        }

        // Placeholder for Slack token exchange
        console.log("[SlackWebhook] Received code:", code, "for tool:", toolId);

        // In a real implementation:
        // 1. Exchange code for token
        // 2. Identify user (either by state containing userId or by looking up Slack user)
        // 3. Record Connection

        // For now, we'll assume the first user or similar if we can't get userId easily from state
        // Ideally state would include userId if triggered from frontend

        return res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'AUTH_SUCCESS', 
              toolId: '${toolId}'
            }, "*");
            window.close();
          </script>
          <p>Authentication successful! This window will close automatically.</p>
        </body>
      </html>
    `);
    } catch (error) {
        console.error("[SlackWebhook] Error:", error);
        return res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'AUTH_ERROR', 
              error: '${error.message || "Unknown error"}' 
            }, "*");
            window.close();
          </script>
        </body>
      </html>
    `);
    }
};
