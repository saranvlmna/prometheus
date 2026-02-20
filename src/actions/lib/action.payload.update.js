import Action from "../../../database/model/action.js";

export default async (id, data) => {
    try {
        return await Action.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true },
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
};