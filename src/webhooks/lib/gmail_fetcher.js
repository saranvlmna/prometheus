export const getNewMessageIds = async (gmail, startHistoryId) => {
    console.log(`[GmailFetcher] Fetching new message IDs starting from historyId: ${startHistoryId}`);
    const messageIds = new Set();
    let newHistoryId = startHistoryId;

    try {
        // If no historyId, fallback to list (first run)
        if (!startHistoryId) {
            console.log("[GmailFetcher] No startHistoryId, listing last 5 messages as fallback.");
            const res = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
            if (res.data.messages) {
                res.data.messages.forEach((m) => {
                    console.log(`[GmailFetcher] Found message ID via fallback: ${m.id}`);
                    messageIds.add(m.id);
                });
            }
            // Get current historyId for next time
            const profile = await gmail.users.getProfile({ userId: "me" });
            newHistoryId = profile.data.historyId;
            console.log(`[GmailFetcher] Fallback complete. New historyId initialized to: ${newHistoryId}`);
            return { messageIds: Array.from(messageIds), newHistoryId };
        }

        let pageToken = null;
        let pageCount = 0;
        do {
            pageCount++;
            console.log(`[GmailFetcher] Listing history page ${pageCount}${pageToken ? ` (token: ${pageToken})` : ""}`);
            const res = await gmail.users.history.list({
                userId: "me",
                startHistoryId,
                historyTypes: ["messageAdded"],
                pageToken,
            });

            if (res.data.history) {
                console.log(`[GmailFetcher] Page ${pageCount} returned ${res.data.history.length} history items`);
                for (const history of res.data.history) {
                    if (history.messagesAdded) {
                        history.messagesAdded.forEach((item) => {
                            if (item.message) {
                                messageIds.add(item.message.id);
                            }
                        });
                    }
                }
            } else {
                console.log(`[GmailFetcher] Page ${pageCount} returned no history items`);
            }

            newHistoryId = res.data.historyId || newHistoryId;
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        console.log(`[GmailFetcher] Completed history fetch. Total unique message IDs found: ${messageIds.size}. New historyId: ${newHistoryId}`);

    } catch (error) {
        if (error.code === 404) {
            // History ID too old/invalid -> reset
            console.warn("[GmailFetcher] History ID invalid/expired. Resetting to current profile historyId...");
            const profile = await gmail.users.getProfile({ userId: "me" });
            newHistoryId = profile.data.historyId;

            console.log("[GmailFetcher] Fetching last 5 messages for continuity after history reset.");
            const res = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
            if (res.data.messages) {
                res.data.messages.forEach((m) => messageIds.add(m.id));
            }
            console.log(`[GmailFetcher] Reset complete. Current historyId: ${newHistoryId}, messages found: ${messageIds.size}`);
        } else {
            console.error(`[GmailFetcher] Fatal error in getNewMessageIds: ${error.message}`, error);
            throw error;
        }
    }

    return { messageIds: Array.from(messageIds), newHistoryId };
};

export const fetchEmailData = async (gmail, messageId) => {
    console.log(`[GmailFetcher] Fetching full email data for message: ${messageId}`);
    try {
        const fullMessage = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full",
        });

        const headers = fullMessage.data.payload.headers;
        const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const from = headers.find((h) => h.name === "From")?.value || "Unknown Sender";
        const date = headers.find((h) => h.name === "Date")?.value || "Unknown Date";

        console.log(`[GmailFetcher] Successfully fetched metadata: "${subject}" from ${from}`);

        let body = "";
        const parts = fullMessage.data.payload.parts;

        if (parts) {
            console.log(`[GmailFetcher] Processing multipart payload with ${parts.length} parts`);
            // Prefer plain text
            const textPart = parts.find((p) => p.mimeType === "text/plain");
            const htmlPart = parts.find((p) => p.mimeType === "text/html");
            const part = textPart || htmlPart;

            if (part?.body?.data) {
                body = Buffer.from(part.body.data, "base64").toString("utf-8");
            }
            // Handle nested multipart/alternative
            else if (part?.parts) {
                console.log("[GmailFetcher] Found nested parts, looking for text/plain");
                const subPart = part.parts.find((p) => p.mimeType === "text/plain");
                if (subPart?.body?.data) {
                    body = Buffer.from(subPart.body.data, "base64").toString("utf-8");
                }
            }
        } else if (fullMessage.data.payload.body?.data) {
            console.log("[GmailFetcher] Processing single-part payload");
            body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString("utf-8");
        }

        console.log(`[GmailFetcher] Extraction complete for message: ${messageId} (Body length: ${body.length})`);

        return {
            id: messageId,
            threadId: fullMessage.data.threadId,
            from,
            subject,
            date,
            snippet: fullMessage.data.snippet,
            body,
        };
    } catch (error) {
        console.error(`[GmailFetcher] Error fetching data for message ${messageId}: ${error.message}`);
        throw error;
    }
};
