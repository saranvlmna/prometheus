import personaCreate from "./lib/persona.create.js";
import personaGet from "./lib/persona.get.js";

export const getPersona = async (req, res) => {
    try {
        const { user_id: userId } = req.user;
        const persona = await personaGet(userId);
        res.json({
            message: "Persona fetched successfully",
            persona,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createPersona = async (req, res) => {
    try {
        const { user_id: userId } = req.user;
        const { role, company, projectKeywords, tools } = req.body;

        if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }

        const updatedUser = await personaCreate(userId, {
            role,
            company,
            projectKeywords,
            tools,
        });

        res.json({
            message: "Persona updated successfully",
            persona: updatedUser.persona,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
