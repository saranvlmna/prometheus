import userFindById from "./lib/user.find.by.id.js";

export default async (req, res) => {
  try {
    const { user_id: userId } = req.user;

    const userDoc = await userFindById(userId);

    if (!userDoc) return res.status(404).json({ message: "User not found" });

    const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };

    delete user.password;

    res.json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
