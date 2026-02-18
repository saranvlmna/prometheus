import Action from "../../../database/model/action.model.js";


export const deleteAction = async (id) => {
    return await Action.findByIdAndDelete(id);
};
