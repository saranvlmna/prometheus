import personaCreate from "./lib/persona.create.js";
import personaGet from "./lib/persona.get.js";

export default async (req, res) => {
    try {
        const { user_id: userId } = req.user;

        if (req.method === "GET") {
            const persona = await personaGet(userId);
            return res.json({
                message: "Persona fetched successfully",
                persona,
            });
        }

        if (req.method === "POST") {
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

            return res.json({
                message: "Persona updated successfully",
                persona: updatedUser.persona,
            });
        }

        res.status(405).json({ message: "Method Not Allowed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
