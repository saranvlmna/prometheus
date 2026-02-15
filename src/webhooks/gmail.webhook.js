export default async (req, res) => {
  try {
    const body = req.body;
    console.log(body);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
