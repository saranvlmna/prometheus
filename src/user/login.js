import login from "./lib/login.js";

export default async (req, res) => {
  try {
    const response = await login(req.email);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
