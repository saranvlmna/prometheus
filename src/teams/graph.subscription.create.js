import subCreate from "./lib/sub.create.js";
import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";
import { ensureValidToken } from "../../shared/azure/refreshToken.js";

export default async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(401).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accessToken = await ensureValidToken(user._id, "azure");

    if (!accessToken) {
      return res.status(401).json({ message: "Azure subscription or token not found" });
    }

    const subscription = await subCreate(accessToken, user._id);
    return res.json(subscription);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
