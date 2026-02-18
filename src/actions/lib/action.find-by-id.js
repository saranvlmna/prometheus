import Action from "../../../database/model/action.model.js";


export const findActionById = async (id) => {
    return await Action.findById(id).populate("userId", "name email");
};
