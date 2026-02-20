import axios from "axios";
import Subscription from "../../database/model/subscription.js";
import { SUBSCRIPTION } from "../../shared/constants/system.js";
import slackActionOrchestrator from "../agents/lib/executor/slack.action.orchestrator.js";
import { runSlackAnalysis } from "../agents/slack.analysis.js";
import channelFetch from "../slack/lib/channel.fetch.js";
import messagesFetch from "../slack/lib/messages.fetch.js";
import userFetch from "../slack/lib/user.fetch.js";
import userFindById from "../user/lib/user.find.by.id.js";

export default async (req, res) => {
  try {
    const { type, challenge, event } = req.body;

    if (type === "url_verification") {
      return res.status(200).send(challenge);
    }

    if (event?.type === "message" && !event.bot_id) {
      const botToken = process.env.SLACK_BOT_TOKEN;

      const extractUserName = (user) => {
        if (!user) return null;
        return user.profile?.display_name || user.profile?.real_name || user.real_name || user.name || null;
      };

      const channelRes = await channelFetch(event.channel);

      const userRes = await userFetch(event.user);

      const channelName = channelRes.data?.channel?.name || event.channel;
      const fromUserObj = userRes.data?.user;
      const fromUser = extractUserName(fromUserObj) || event.user;

      const previous = await messagesFetch(botToken, event.channel, event.ts, 4);

      const rawContextMessages = [
        ...previous.reverse(),
        {
          user: event.user,
          text: event.text,
          ts: event.ts,
        },
      ];

      let toUser = null;
      if (event.thread_ts) {
        toUser = null;
      }

      const userMap = {};
      userMap[event.user] = fromUser;

      const userIds = new Set();

      for (const msg of rawContextMessages) {
        if (msg.user && !userMap[msg.user]) {
          userIds.add(msg.user);
        }

        if (msg.text) {
          const mentionMatch = msg.text.match(/<@([A-Z0-9]+)>/);
          if (mentionMatch && !userMap[mentionMatch[1]]) {
            userIds.add(mentionMatch[1]);
          }
        }
      }

      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const infoRes = await axios.get("https://slack.com/api/users.info", {
              headers: {
                Authorization: `Bearer ${botToken}`,
              },
              params: {
                user: userId,
              },
            });

            const userObj = infoRes.data?.user;
            userMap[userId] = extractUserName(userObj) || userId;
          } catch {
            userMap[userId] = userId;
          }
        }),
      );

      const contextMessages = rawContextMessages.map((msg) => {
        const fromUserId = msg.user || null;
        const fromUserName = fromUserId ? userMap[fromUserId] || fromUserId : null;

        let toUserId = null;
        let toUserName = null;
        if (msg.text) {
          const mentionMatch = msg.text.match(/<@([A-Z0-9]+)>/);
          if (mentionMatch) {
            toUserId = mentionMatch[1];
            toUserName = userMap[toUserId] || toUserId;
          }
        }

        return {
          channelName,
          fromUser: fromUserName,
          fromUserId,
          toUser: toUserName,
          toUserId,
          message: msg.text || "",
        };
      });

      const toUserId = contextMessages[4]?.toUserId;

      const subscription = await Subscription.findOne({
        provider: SUBSCRIPTION.SLACK,
        providerId: toUserId,
      });

      if (!subscription) {
        console.error("No active subscription found for Slack analysis.");
        return res.sendStatus(200);
      }

      const dbUser = await userFindById(subscription.userId);
      if (!dbUser) {
        console.error("User not found for subscription:", subscription.userId);
        return res.sendStatus(200);
      }

      const aiResponse = await runSlackAnalysis(contextMessages, dbUser?.persona);

      console.log("aiResponseaiResponse",aiResponse)
      
      const lastMessage = contextMessages[4];

      const actionCreate = await slackActionOrchestrator(
        aiResponse,
        {
          channelName: lastMessage.channelName,
          fromUser: lastMessage.fromUser,
          toUser: lastMessage.toUser,
          message: lastMessage.message,
        },
        dbUser,
        null,
        { autoExecute: true },
      );
      console.log("Action Created", actionCreate);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(200);
  }
};
