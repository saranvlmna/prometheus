import axios from "axios";

export default async (taskDetails, userToken) => {
  try {
    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/todo/lists/tasks/tasks",
      {
        title: taskDetails.title,
        body: {
          content: taskDetails.description || "",
          contentType: "text",
        },
        dueDateTime: taskDetails.dueDate
          ? {
              dateTime: taskDetails.dueDate,
              timeZone: "UTC",
            }
          : undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    return `Task created successfully. ID: ${response.data.id}`;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw new Error("Failed to create To-Do task");
  }
};
