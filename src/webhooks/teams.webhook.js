import processEvent from "../agents/index.js";
import Subscription from "../../database/model/subscription.js";
import User from "../../database/model/user.js";
import axios from "axios";

export default async (req, res) => {
  try {
    // 1. Validation Handshake
    if (req.query.validationToken) {
      res.set("Content-Type", "text/plain");
      return res.status(200).send(req.query.validationToken);
    }

    // 2. Process Notifications
    if (req.body.value) {
      for (const notification of req.body.value) {
        const { subscriptionId, resource, clientState, resourceData } = notification;

        // Security Check
        if (clientState !== "secureTeamsValue" && clientState !== "secureChatsValue") {
          console.warn("Invalid client state received");
          continue;
        }

        // 3. Lookup Subscription to find User
        const subscription = await Subscription.findOne({ subscriptionId }).populate("userId");
        const user = subscription ? subscription.userId : null;

        if (!user || !user.accessToken) {
          console.error("User not found for subscription:", subscriptionId);
          continue;
        }

        // 4. Fetch Actual Content (Real World Scenario)
        // Graph webhooks often send a "resource" URL but not the full body (or it's encrypted)
        // We use the User's token to fetch the message details from the 'resource' URL.

        let fullMessageData = resourceData; // Default to what we have

        try {
          // Construct absolute URL. Notification 'resource' is relative to graph endpoint.
          const resourceUrl = `https://graph.microsoft.com/v1.0/${resource}`;

          // console.log("Fetching full message from:", resourceUrl);

          const messageResponse = await axios.get(resourceUrl, {
            headers: { Authorization: `Bearer ${user.accessToken}` }
          });

          fullMessageData = messageResponse.data; // Now we have the full message body

        } catch (fetchError) {
          console.error("Failed to fetch message content:", fetchError.message);
        }

        // 5. Build an event object that the Agent expects
        const eventContext = {
          resourceData: fullMessageData,
          user: user // Pass user context to agent directly!
        };

        await processEvent("teams", eventContext);
      }
    }

    res.status(202).send();
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send();
  }
};
