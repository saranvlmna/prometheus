import Action from "../../../database/model/action.model.js";


export const findAllActions = async (filter = {}) => {
    return await Action.find(filter)
        .populate("userId", "name email")
        .sort("-createdAt");
};
