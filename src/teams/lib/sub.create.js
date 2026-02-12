import axios from "axios";

export default async (accessToken) => {
  try {
    const expiration = new Date(Date.now() + 55 * 60 * 1000).toISOString();

    const webhookUrl = "https://binarybits.in/webhook/teams";

    // Personal + Group Chats
    const chatsSubscription = await axios.post(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        changeType: "created",
        notificationUrl: webhookUrl,
        resource: "/chats/getAllMessages",
        expirationDateTime: expiration,
        clientState: "secureChatsValue",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Channel Messages (All Teams)
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
      },
    );

    return {
      message: "Subscriptions created successfully",
      chatsSubscription: chatsSubscription.data,
      teamsSubscription: teamsSubscription.data,
    };
  } catch (error) {
    console.error("Subscription error:", error.response?.data || error.message);
    throw error;
  }
};
