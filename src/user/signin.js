import jwtGen from "./lib/jwt.gen.js";
import userCreate from "./lib/user.create.js";
import userFindByEmail from "./lib/user.find.by.email.js";

export default async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and Password are required" });

    let user = await userFindByEmail(email);
    if (user && user.password != password) return res.status(401).json({ message: "Invalid credentials" });

    if (!user) user = await userCreate({ email, password, name });

    const accessToken = jwtGen(user);
    res.json({ message: "Login successful", accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
