// import axios from "axios";
// import Subscription from "../../../database/model/subscription.js";

// export default async (accessToken, userId) => {
//   try {
//     const expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString();
//     const webhookUrl = "https://amyxg-106-76-181-49.a.free.pinggy.link";

//     // 1. Chats subscription
//     const chatsSubscription = await axios.post(
//       "https://graph.microsoft.com/v1.0/subscriptions",
//       {
//         changeType: "created",
//         notificationUrl: `${webhookUrl}/webhook/teams`,
//         resource: "/me/chats",
//         expirationDateTime: expiration,
//         clientState: "secureChatsValue",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     await Subscription.create({
//       subscriptionId: chatsSubscription.data.id,
//       userId,
//       resource: "/me/chats",
//       changeType: "created",
//       clientState: "secureChatsValue",
//       expirationDateTime: chatsSubscription.data.expirationDateTime,
//     });

//     // 2. Outlook subscription
//     const outlookSubscription = await axios.post(
//       "https://graph.microsoft.com/v1.0/subscriptions",
//       {
//         changeType: "created,updated",
//         notificationUrl: `${webhookUrl}/webhook/outlook`,
//         resource: "/me/messages",
//         expirationDateTime: expiration,
//         clientState: "secureOutlookValue",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     await Subscription.create({
//       subscriptionId: outlookSubscription.data.id,
//       userId,
//       resource: "/me/messages",
//       changeType: "created,updated",
//       clientState: "secureOutlookValue",
//       expirationDateTime: outlookSubscription.data.expirationDateTime,
//     });

//     return {
//       message: "Subscriptions created successfully",
//       chatsSubscription: chatsSubscription.data,
//       outlookSubscription: outlookSubscription.data,
//     };

//   } catch (error) {
//     console.error("Subscription error:", error.response?.data || error.message);
//     throw error;
//   }
// };














import axios from "axios";
import Subscription from "../../../database/model/subscription.js";

export default async (accessToken, userId) => {
  try {
    const expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour (max for chats/messages)

    // const webhookUrl = process.env.WEBHOOK_PUBLIC_URL + "/webhook/teams";
    const webhookUrl = "https://amyxg-106-76-181-49.a.free.pinggy.link/webhook/teams";

    // 1. Chats Subscription
    const chatsSubscription = await axios.post(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        changeType: "created",
        notificationUrl: webhookUrl,
        resource: "/chats/getAllMessages",
        // resource: "/me/chats",
        expirationDateTime: expiration,
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
      subscriptionId: chatsSubscription.data.id,
      userId: userId,
      resource: "/chats/getAllMessages",
      // resource: "/me/chats",
      changeType: "created",
      clientState: "secureChatsValue",
      expirationDateTime: chatsSubscription.data.expirationDateTime,
    });

    // 2. Teams Channel Messages Subscription
    const teamsSubscription = await axios.post(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        changeType: "created",
        notificationUrl: webhookUrl,
        resource: "/teams/getAllMessages",
        expirationDateTime: expiration,
        clientState: "secureTeamsValue",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    await Subscription.create({
      subscriptionId: teamsSubscription.data.id,
      userId: userId,
      resource: "/teams/getAllMessages",
      changeType: "created",
      clientState: "secureTeamsValue",
      expirationDateTime: teamsSubscription.data.expirationDateTime,
    });

    // 3. Outlook Email Subscription
    const outlookSubscription = await axios.post(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        changeType: "created,updated",
        // notificationUrl: process.env.WEBHOOK_PUBLIC_URL + "/webhook/outlook",
        notificationUrl: "https://amyxg-106-76-181-49.a.free.pinggy.link/webhook/outlook",
        resource: "me/messages",
        expirationDateTime: expiration,
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
      subscriptionId: outlookSubscription.data.id,
      userId: userId,
      resource: "me/messages",
      changeType: "created,updated",
      clientState: "secureOutlookValue",
      expirationDateTime: outlookSubscription.data.expirationDateTime,
    });

    return {
      message: "Subscriptions created and saved successfully",
      chatsSubscription: chatsSubscription.data,
      teamsSubscription: teamsSubscription.data,
      outlookSubscription: outlookSubscription.data,
    };
  } catch (error) {
    console.error("Subscription error:", error.response?.data || error.message);
    throw error;
  }
};
