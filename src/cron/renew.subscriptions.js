// src/cron/renew.subscriptions.js
import cron from "node-cron";
import axios from "axios";
import Subscription from "../../database/model/subscription.js";
import User from "../../database/model/user.js";
import { ensureValidToken } from "../utils/refreshToken.js";

// Run every 30 minutes
cron.schedule("*/30 * * * *", async () => {
    console.log("🔄 Checking subscriptions for renewal...");

    try {
        // Find subscriptions expiring in next 15 minutes
        // Using 45 mins buffer since they run every 30 mins and expire in 60 mins max for chats
        // Actually, chats expire in 60 mins. If we run every 30 mins:
        // T=0 (created, expires T+60)
        // T=30 (expires T+60, remaining 30). We should renew if remaining < 45? 30 < 45, yes.
        // T=60 (expired). 

        // Let's renew anything expiring in the next 45 minutes to be safe.
        // Expiration date <= Now + 45 mins

        const checkTime = new Date(Date.now() + 45 * 60 * 1000);

        const expiringSubscriptions = await Subscription.find({
            expirationDateTime: {
                $lte: checkTime,
            },
        });

        console.log(`Found ${expiringSubscriptions.length} subscription(s) to renew`);

        for (const sub of expiringSubscriptions) {
            try {
                const user = await User.findById(sub.userId);
                if (!user) {
                    console.warn(`User for subscription ${sub.subscriptionId} not found, deleting subscription.`);
                    await sub.deleteOne();
                    continue;
                }

                const accessToken = await ensureValidToken(user);

                // Calculate new expiration (1 hour for chats, 3 days for emails)
                // We can infer type from resource
                const isEmail = sub.resource.includes("messages") && !sub.resource.includes("chats");

                // Expiration: 1 hour (minus small buffer) for chats, 3 days for emails
                const duration = isEmail ? 4230 : 55; // minutes

                const newExpiration = new Date(
                    Date.now() + duration * 60 * 1000
                ).toISOString();

                console.log(`Renewing ${sub.subscriptionId} for resource ${sub.resource} until ${newExpiration}`);

                // Renew subscription
                const response = await axios.patch(
                    `https://graph.microsoft.com/v1.0/subscriptions/${sub.subscriptionId}`,
                    {
                        expirationDateTime: newExpiration,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                // Update in database
                sub.expirationDateTime = response.data.expirationDateTime;
                await sub.save();

                console.log(`✅ Renewed subscription: ${sub.subscriptionId}`);
            } catch (error) {
                console.error(`❌ Failed to renew ${sub.subscriptionId}:`, error.response?.data || error.message);

                // If renewal fails, try to create a new subscription? 
                // Or if it's 404, it's gone.
                if (error.response?.status === 404) {
                    await sub.deleteOne();
                    console.log(`🗑️ Deleted invalid local subscription: ${sub.subscriptionId}`);
                }
            }
        }
    } catch (error) {
        console.error("❌ Subscription renewal error:", error);
    }
});

export default cron;
