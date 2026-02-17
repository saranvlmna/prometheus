import axios from "axios";
import qs from "qs";
import Subscription from "../../database/model/subscription.js";

/**
 * Ensures a valid token exists for the given user and provider.
 * If the current token is close to expiry or we suspect it's old, it refreshes it.
 * 
 * @param {import("mongoose").Types.ObjectId} userId 
 * @param {string} provider - "google" or "azure"
 */
export const ensureValidToken = async (userId, provider = "azure") => {
    const sub = await Subscription.findOne({ userId, provider });

    if (!sub || !sub.refreshToken) {
        console.warn(`[TokenRefresh] No ${provider} subscription or refresh token for user ${userId}`);
        return sub?.accessToken;
    }

    try {
        // For simplicity, we currently just refresh if this function is called.
        // In a more advanced version, we'd check sub.expiry (Date.now() + 5 mins).
        return await refreshAccessToken(sub);
    } catch (error) {
        console.error(`[TokenRefresh] Error ensuring valid ${provider} token:`, error.message);
        return sub.accessToken; // Fallback to existing
    }
};

const refreshAccessToken = async (sub) => {
    try {
        const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

        const requestBody = {
            client_id: process.env.AZURE_CLIENT_ID,
            client_secret: process.env.AZURE_CLIENT_SECRET,
            scope: "offline_access User.Read Mail.Read Mail.ReadBasic Calendars.ReadWrite Chat.Read Chat.ReadBasic Tasks.ReadWrite",
            refresh_token: sub.refreshToken,
            grant_type: "refresh_token",
        };

        const response = await axios.post(tokenEndpoint, qs.stringify(requestBody), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Update Subscription
        sub.accessToken = access_token;
        if (refresh_token) {
            sub.refreshToken = refresh_token;
        }

        // Calculate expiry if expires_in is provided
        if (expires_in) {
            sub.expiry = new Date(Date.now() + expires_in * 1000);
        }

        await sub.save();
        console.log(`[TokenRefresh] 🔄 Refreshed ${sub.provider} access token for user ${sub.userId}`);

        return access_token;
    } catch (error) {
        console.error(`[TokenRefresh] ❌ Failed to refresh ${sub.provider} token:`, error.response?.data || error.message);
        throw error;
    }
};
