// src/teams/lib/sub.create.js
import axios from "axios";
import Subscription from "../../../database/model/subscription.js";

export default async (accessToken, userId) => {
  try {
    // const webhookUrl = process.env.WEBHOOK_PUBLIC_URL;
    const webhookUrl = "https://gwdgz-106-76-189-33.a.free.pinggy.link";

    if (!webhookUrl) {
      throw new Error("WEBHOOK_PUBLIC_URL environment variable is not set");
    }

    const subscriptions = [];

    // 1. Subscribe to user's chat messages (personal + group chats they're part of)
    try {
      const chatExpiration = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour max

      const chatsSub = await axios.post(
        "https://graph.microsoft.com/v1.0/subscriptions",
        {
          changeType: "created,updated",
          notificationUrl: `${webhookUrl}/webhook/teams`,
          resource: "me/chats/getAllMessages", // ✅ User-specific: only chats user is part of
          expirationDateTime: chatExpiration,
          clientState: "secureChatsValue",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      await Subscription.create({
        subscriptionId: chatsSub.data.id,
        userId,
        resource: "me/chats/getAllMessages",
        changeType: "created,updated",
        clientState: "secureChatsValue",
        expirationDateTime: chatsSub.data.expirationDateTime,
      });

      subscriptions.push({ type: "teams-chat", data: chatsSub.data });
      console.log("✅ Teams chat subscription created");
    } catch (error) {
      console.error("❌ Teams chat subscription failed:", error.response?.data || error.message);
    }

    // 2. Subscribe to user's Outlook emails
    try {
      const emailExpiration = new Date(Date.now() + 4230 * 60 * 1000).toISOString(); // ~3 days max

      const outlookSub = await axios.post(
        "https://graph.microsoft.com/v1.0/subscriptions",
        {
          changeType: "created,updated",
          notificationUrl: `${webhookUrl}/webhook/outlook`,
          resource: "me/messages",
          expirationDateTime: emailExpiration,
          clientState: "secureOutlookValue",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      await Subscription.create({
        subscriptionId: outlookSub.data.id,
        userId,
        resource: "me/messages",
        changeType: "created,updated",
        clientState: "secureOutlookValue",
        expirationDateTime: outlookSub.data.expirationDateTime,
      });

      subscriptions.push({ type: "outlook", data: outlookSub.data });
      console.log("✅ Outlook subscription created");
    } catch (error) {
      console.error("❌ Outlook subscription failed:", error.response?.data || error.message);
    }

    // 3. Subscribe to Teams channels (if user is member)
    try {
      const teamsExpiration = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const teamsSub = await axios.post(
        "https://graph.microsoft.com/v1.0/subscriptions",
        {
          changeType: "created,updated",
          notificationUrl: `${webhookUrl}/webhook/teams-channels`,
          resource: "me/joinedTeams/getAllMessages", // ✅ Only teams user has joined
          expirationDateTime: teamsExpiration,
          clientState: "secureTeamsChannelsValue",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      await Subscription.create({
        subscriptionId: teamsSub.data.id,
        userId,
        resource: "me/joinedTeams/getAllMessages",
        changeType: "created,updated",
        clientState: "secureTeamsChannelsValue",
        expirationDateTime: teamsSub.data.expirationDateTime,
      });

      subscriptions.push({ type: "teams-channels", data: teamsSub.data });
      console.log("✅ Teams channels subscription created");
    } catch (error) {
      console.error("❌ Teams channels subscription failed:", error.response?.data || error.message);
    }

    return {
      message: `${subscriptions.length} subscription(s) created successfully`,
      subscriptions,
    };
  } catch (error) {
    console.error("Fatal subscription error:", error);
    throw error;
  }
};
