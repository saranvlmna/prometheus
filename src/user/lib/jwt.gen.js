import jwt from "jsonwebtoken";

const JWT_SECRET = "mysecret";

export default (data) => {
  try {
    const payload = {
      user_id: data._id,
      email: data.email,
      name: data.name,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1h",
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
