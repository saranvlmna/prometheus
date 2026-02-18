import Action from "../../../database/model/action.model.js";


export const createAction = async (data) => {
    return await Action.create(data);
};
