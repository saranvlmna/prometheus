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
        const { subscriptionId, resource, resourceData, clientState } = notification;

        // Security Check
        if (clientState !== "secureOutlookValue") {
          console.warn("Invalid client state received for Outlook");
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
        // Outlook notifications usually contain the ID of the changed item in 'resourceData.id'
        // We use the User's token to fetch the full message.

        let fullMessageData = resourceData;

        try {
          // Construct absolute URL. resource is 'me/messages' usually, but we need specific message
          // or use resourceData.id
          const messageId = resourceData?.id;
          if (messageId) {
            const resourceUrl = `https://graph.microsoft.com/v1.0/me/messages/${messageId}`;
            // console.log("Fetching full email from:", resourceUrl);

            const messageResponse = await axios.get(resourceUrl, {
              headers: { Authorization: `Bearer ${user.accessToken}` }
            });

            fullMessageData = messageResponse.data; // Now we have the full email body { body: { content: "..." }, subject: "..." }
          }

        } catch (fetchError) {
          console.error("Failed to fetch email content:", fetchError.message);
        }

        // 5. Build an event object that the Agent expects
        const eventContext = {
          resourceData: fullMessageData,
          user: user
        };

        await processEvent("outlook", eventContext);
      }
    }

    res.status(202).send();
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send();
  }
};
