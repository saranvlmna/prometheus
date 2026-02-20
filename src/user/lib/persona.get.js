import User from "../../../database/model/user.js";

export default async (userId) => {
    try {
        const user = await User.findById(userId).select("persona");
        return user ? user.persona : null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};