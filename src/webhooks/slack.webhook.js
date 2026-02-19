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

    console.log("[SlackWebhook] Received code:", code, "for tool:", toolId);

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
