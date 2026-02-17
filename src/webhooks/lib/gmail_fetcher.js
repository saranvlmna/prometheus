export const getNewMessageIds = async (gmail, startHistoryId) => {
    const messageIds = new Set();
    let newHistoryId = startHistoryId;

    try {
        // If no historyId, fallback to list (first run)
        if (!startHistoryId) {
            console.log("[GmailFetcher] No startHistoryId, listing last 5 messages.");
            const res = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
            if (res.data.messages) {
                res.data.messages.forEach((m) => messageIds.add(m.id));
            }
            // Get current historyId for next time
            const profile = await gmail.users.getProfile({ userId: "me" });
            newHistoryId = profile.data.historyId;
            return { messageIds: Array.from(messageIds), newHistoryId };
        }

        let pageToken = null;
        do {
            const res = await gmail.users.history.list({
                userId: "me",
                startHistoryId,
                historyTypes: ["messageAdded"],
                pageToken,
            });

            if (res.data.history) {
                for (const history of res.data.history) {
                    if (history.messagesAdded) {
                        history.messagesAdded.forEach((item) => {
                            if (item.message) messageIds.add(item.message.id);
                        });
                    }
                }
            }

            newHistoryId = res.data.historyId || newHistoryId;
            pageToken = res.data.nextPageToken;
        } while (pageToken);

    } catch (error) {
        if (error.code === 404) {
            // History ID too old/invalid -> reset
            console.warn("[GmailFetcher] History ID invalid/expired. Resetting...");
            const profile = await gmail.users.getProfile({ userId: "me" });
            newHistoryId = profile.data.historyId;
            // Optionally fetch recent messages here if critical to not miss any
            const res = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
            if (res.data.messages) {
                res.data.messages.forEach((m) => messageIds.add(m.id));
            }
        } else {
            throw error;
        }
    }

    return { messageIds: Array.from(messageIds), newHistoryId };
};

export const fetchEmailData = async (gmail, messageId) => {
    const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
    });

    const headers = fullMessage.data.payload.headers;
    const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
    const from = headers.find((h) => h.name === "From")?.value || "Unknown Sender";
    const date = headers.find((h) => h.name === "Date")?.value || "Unknown Date";

    let body = "";
    const parts = fullMessage.data.payload.parts;

    if (parts) {
        // Prefer plain text
        const textPart = parts.find((p) => p.mimeType === "text/plain");
        const htmlPart = parts.find((p) => p.mimeType === "text/html");
        const part = textPart || htmlPart;

        if (part?.body?.data) {
            body = Buffer.from(part.body.data, "base64").toString("utf-8");
        }
        // Handle nested multipart/alternative
        else if (part?.parts) {
            const subPart = part.parts.find((p) => p.mimeType === "text/plain");
            if (subPart?.body?.data) {
                body = Buffer.from(subPart.body.data, "base64").toString("utf-8");
            }
        }
    } else if (fullMessage.data.payload.body?.data) {
        body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString("utf-8");
    }

    return {
        id: messageId,
        threadId: fullMessage.data.threadId,
        from,
        subject,
        date,
        snippet: fullMessage.data.snippet,
        body,
    };
};
