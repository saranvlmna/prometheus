import Action from "../../../database/model/action.model.js";


export const updateAction = async (id, data) => {
    return await Action.findByIdAndUpdate(id, data, { new: true });
};
