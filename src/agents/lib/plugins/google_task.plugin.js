import { google } from "googleapis";

const GoogleTaskPlugin = {
    type: "google_task",
    label: "Google Task",

    validate(payload) {
        const errors = [];
        if (!payload.title) errors.push("title is required");
        return { valid: errors.length === 0, errors };
    },

    async execute(payload, context) {
        const { oAuth2Client } = context;
        try {
            const tasks = google.tasks({ version: "v1", auth: oAuth2Client });

            const taskBody = {
                title: payload.title,
                notes: payload.notes || "",
                status: "needsAction",
            };

            if (payload.due_date) {
                taskBody.due = new Date(payload.due_date).toISOString();
            }

            const response = await tasks.tasks.insert({
                tasklist: "@default",
                requestBody: taskBody,
            });

            return {
                success: true,
                result: {
                    taskId: response.data.id,
                    taskLink: response.data.selfLink,
                    title: response.data.title,
                },
            };
        } catch (error) {
            console.error("[GoogleTaskPlugin] Error:", error.message);
            return { success: false, error: error.message };
        }
    },
};

export default GoogleTaskPlugin;
