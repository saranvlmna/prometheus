import axios from "axios";

export default async (eventDetails, userToken) => {
  try {
    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/events",
      {
        subject: eventDetails.subject,
        body: {
          contentType: "HTML",
          content: eventDetails.description || "Scheduled via AI Agent",
        },
        start: {
          dateTime: eventDetails.start,
          timeZone: "UTC",
        },
        end: {
          dateTime: eventDetails.end || new Date(new Date(eventDetails.start).getTime() + 30 * 60000).toISOString(),
          timeZone: "UTC",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    return `Event scheduled successfully. ID: ${response.data.id}`;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw new Error("Failed to schedule meeting");
  }
};
