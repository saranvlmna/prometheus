import jwt from "jsonwebtoken";

const JWT_SECRET = "mysecret";

export default (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
