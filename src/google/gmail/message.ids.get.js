export default async (gmail, startHistoryId) => {
  const messageIds = new Set();
  let newHistoryId = startHistoryId;

  try {
    if (!startHistoryId) {
      const res = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
      if (res.data.messages) {
        res.data.messages.forEach((m) => {
          console.log(`[GmailFetcher] Found message ID via fallback: ${m.id}`);
          messageIds.add(m.id);
        });
      }
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

    console.log(
      `[GmailFetcher] Completed history fetch. Total unique message IDs found: ${messageIds.size}. New historyId: ${newHistoryId}`,
    );
  } catch (error) {
    if (error.code === 404) {
      console.warn("[GmailFetcher] History ID invalid/expired. Resetting to current profile historyId...");
      const profile = await gmail.users.getProfile({ userId: "me" });
      newHistoryId = profile.data.historyId;

      console.log("[GmailFetcher] Fetching last 5 messages for continuity after history reset.");
      const res = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
      if (res.data.messages) {
        res.data.messages.forEach((m) => messageIds.add(m.id));
      }
      console.log(
        `[GmailFetcher] Reset complete. Current historyId: ${newHistoryId}, messages found: ${messageIds.size}`,
      );
    } else {
      console.error(`[GmailFetcher] Fatal error in getNewMessageIds: ${error.message}`, error);
      throw error;
    }
  }

  return { messageIds: Array.from(messageIds), newHistoryId };
};
