import login from "./lib/login.js";

export default async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await login(email, password);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
