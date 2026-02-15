import messagesFetch from "../google/lib/messages.fetch.js";

export default async (req, res) => {
  try {
    const code = req.query.code;

    const messages = await messagesFetch(code);

    res.json(messages);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
