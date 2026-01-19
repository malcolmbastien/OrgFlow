
import { GoogleGenAI, Type } from "@google/genai";
import { WorkflowModel } from "../types";

// Always initialize with the direct object parameter and use the process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates or updates the organizational model using Gemini 3 Pro.
 * Uses responseSchema to ensure reliable JSON structure output.
 */
export async function generateOrgFlow(prompt: string, currentModel: WorkflowModel): Promise<WorkflowModel> {
  // Use generateContent for text/JSON generation. Do not define model separately.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Update the organizational model based on: "${prompt}".
    
    The model follows a 4-pillar structure for each level (Strategic, Portfolio, Team):
    1. Inputs: Incoming signals (Customer feedback, regulatory requirements, market trends, mandates). These have type: 'input' and should have a 'source' (e.g. "External Market", "Strategic Tier").
    2. Who (Teams): Organizational groups responsible for activities at that level.
    3. How (Rituals): Recurring meetings processing inputs into work.
    4. What (Work Items): Initiatives, epics, and stories that are the result of rituals.
    
    Current Model: ${JSON.stringify(currentModel)}
    
    Ensure that new incoming requests are categorized correctly. If the user asks to add customer feedback, it's an Input. If they ask for a new meeting, it's a Ritual. If they ask for a project, it's a Work Item (Initiative/Epic).
    
    Output JSON following the structure: { teams[], workItems[], rituals[], connections[] }.
    Ensure IDs are unique and references (e.g., owningTeamId) are valid.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          teams: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                members: { type: Type.ARRAY, items: { type: Type.STRING } },
                level: { type: Type.STRING },
                teamType: { type: Type.STRING },
                collaborators: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "name", "members", "level"]
            }
          },
          workItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "input, initiative, epic, story" },
                level: { type: Type.STRING },
                description: { type: Type.STRING },
                owningTeamId: { type: Type.STRING },
                source: { type: Type.STRING, description: "The origin of the input if applicable" },
                status: { type: Type.STRING }
              },
              required: ["id", "title", "type", "level"]
            }
          },
          rituals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                level: { type: Type.STRING },
                participants: { type: Type.ARRAY, items: { type: Type.STRING } },
                agendaItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                ritualFrequency: { type: Type.STRING },
                owningTeamId: { type: Type.STRING }
              },
              required: ["id", "title", "level", "participants", "agendaItems", "ritualFrequency"]
            }
          },
          connections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                label: { type: Type.STRING },
                style: { type: Type.STRING }
              },
              required: ["id", "from", "to", "style"]
            }
          }
        },
        required: ["teams", "workItems", "rituals", "connections"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return { 
      ...currentModel, 
      teams: data.teams || currentModel.teams,
      workItems: data.workItems || currentModel.workItems,
      rituals: data.rituals || currentModel.rituals,
      connections: data.connections || currentModel.connections 
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return currentModel;
  }
}
