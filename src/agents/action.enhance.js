import client from "../../config/azure.openai.js";

const deployment = process.env.AZURE_DEPLOYMENT;

export default async (action, description, persona) => {
    try {
        const personaContext = persona
            ? `The user's professional persona:
         Role: ${persona.role}
         Company: ${persona.company || "Not specified"}
         Project Keywords: ${(persona.projectKeywords || []).join(", ") || "Not specified"}
         Tools: ${(persona.tools || []).join(", ") || "Not specified"}`
            : "No professional persona specified.";

        const messages = [
            {
                role: "system",
                content: `You are an expert office assistant. Your task is to enhance an action payload based on a user's description and their professional context.
                  Ensure the enhanced payload is professional, detailed, and aligns with the user's role and tools.
                  
                  ${personaContext}
                  
                  Original Action Context: ${JSON.stringify(action.context)}
                  Action Type: ${action.type}
                  
                  Return ONLY a JSON object representing the enhanced payload. Do not include any other text.`,
            },
            {
                role: "user",
                content: `Original Payload: ${JSON.stringify(action.payload)}
                  
                  Enhancement Request: ${description}
                  
                  Please provide the enhanced payload.`,
            },
        ];

        const response = await client.chat.completions.create({
            model: deployment,
            messages,
            response_format: { type: "json_object" },
        });

        const enhancedPayload = JSON.parse(response.choices[0].message.content);
        return enhancedPayload;
    } catch (error) {
        console.error("Action Enhancement Agent Error:", error);
        throw error;
    }
};