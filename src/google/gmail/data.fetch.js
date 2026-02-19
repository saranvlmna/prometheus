export default async (gmail, messageId) => {
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
      const textPart = parts.find((p) => p.mimeType === "text/plain");
      const htmlPart = parts.find((p) => p.mimeType === "text/html");
      const part = textPart || htmlPart;

      if (part?.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      } else if (part?.parts) {
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
    console.error(` ${messageId}: ${error.message}`);
    throw error;
  }
};
