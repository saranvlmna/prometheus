export default (req, res) => {
  try {
    console.log(req, body);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
