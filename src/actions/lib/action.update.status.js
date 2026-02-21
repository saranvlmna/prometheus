import Action from "../../../database/model/action.js";

export default async (id, status) => {
    try {
        console.log("Action Update Status:", id, status);
        return await Action.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    } catch (error) {
        console.error("Action Update Status Error:", error);
        throw error;
    }
};