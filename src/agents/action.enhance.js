import client from "../../config/azure.openai.js";

const deployment = process.env.AZURE_DEPLOYMENT;

export default async (action, description, persona) => {
  try {
    const azureAiClient = client();

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
        content: `You are an expert office assistant. Your task is to enhance an action based on a user's refinement description and their professional context.
                  
                  ${personaContext}
                  
                  Original Action Context: ${JSON.stringify(action.context)}
                  Action Type: ${action.type}
                  
                  You must return a JSON object with the following fields:
                  - "enhancedPayload": The refined and detailed payload for the action.
                  - "title": A concise, professional title for the action.
                  - "description": A clear, professional description of the action and its purpose.
                  - "reasoning": A brief explanation of why these enhancements were made based on the user's request and persona.
                  
                  Ensure the enhanced payload is professional, detailed, and aligns with the user's role and tools.`,
      },
      {
        role: "user",
        content: `Original Payload: ${JSON.stringify(action.payload)}
                  
                  Refinement Request: ${description}
                  
                  Please provide the enhanced action details.`,
      },
    ];

    const response = await azureAiClient.chat.completions.create({
      model: deployment,
      messages,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Action Enhancement Agent Error:", error);
    throw error;
  }
};
