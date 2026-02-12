import subCreate from "./lib/sub.create";

export default async (req, res) => {
  try {
    const subscription = await subCreate();
    return subscription;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
