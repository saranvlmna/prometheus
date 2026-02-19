import jwtVerify from "../../src/user/lib/jwt.verify.js";
import userFindById from "../../src/user/lib/user.find.by.id.js";

export default async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    if (!token) return res.status(403).json({ message: "No token provided" });

    const decoded = jwtVerify(token);

    const user = await userFindById(decoded.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    req["user"] = decoded;

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
