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

    res.sendStatus(200);

    if (event?.type !== "message" || event.bot_id) return;

    const botToken = process.env.SLACK_BOT_TOKEN;

    const extractUserName = (user) => {
      if (!user) return null;
      return user.profile?.display_name || user.profile?.real_name || user.real_name || user.name || null;
    };

    const channelRes = await channelFetch(event.channel);
    const userRes = await userFetch(botToken, event.user);

    const channelName = channelRes?.data?.channel?.name || event.channel;
    const fromUserObj = userRes?.data?.user;
    const fromUser = extractUserName(fromUserObj) || event.user;

    const previous = await messagesFetch(botToken, event.channel, event.ts, 4);

    const rawContextMessages = [
      ...(previous?.reverse() || []),
      {
        user: event.user,
        text: event.text,
        ts: event.ts,
      },
    ];

    const userMap = {};
    userMap[event.user] = fromUser;

    const userIds = new Set();

    for (const msg of rawContextMessages) {
      if (msg.user && !userMap[msg.user]) {
        userIds.add(msg.user);
      }

      if (msg.text) {
        const mentions = [...msg.text.matchAll(/<@([A-Z0-9]+)>/g)];
        mentions.forEach((m) => {
          if (!userMap[m[1]]) userIds.add(m[1]);
        });
      }
    }

    await Promise.all(
      Array.from(userIds).map(async (userId) => {
        try {
          const infoRes = await axios.get("https://slack.com/api/users.info", {
            headers: { Authorization: `Bearer ${botToken}` },
            params: { user: userId },
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
        const mentions = [...msg.text.matchAll(/<@([A-Z0-9]+)>/g)];
        if (mentions.length) {
          toUserId = mentions[0][1];
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

    const lastMessage = contextMessages[contextMessages.length - 1];
    const toUserId = lastMessage?.toUserId;

    if (!toUserId) return;

    const subscription = await Subscription.findOne({
      provider: SUBSCRIPTION.SLACK,
      providerId: toUserId,
    });

    if (!subscription) {
      console.error("No active subscription found for Slack analysis.");
      return;
    }

    const dbUser = await userFindById(subscription.userId);
    if (!dbUser) {
      console.error("User not found:", subscription.userId);
      return;
    }

    const aiResponse = await runSlackAnalysis(contextMessages, dbUser?.persona);

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
  } catch (err) {
    console.error(err);
  }
};
