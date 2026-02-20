import User from "../../../database/model/user.js";

export default async (userId, personaData) => {
    try {
        return await User.findByIdAndUpdate(
            userId,
            { $set: { persona: personaData, isPersonaCreated: true } },
            { new: true, runValidators: true },
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
};

