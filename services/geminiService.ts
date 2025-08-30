
import { GoogleGenAI, Type } from "@google/genai";
import { Sop } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const sopSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "The official title of the Standard Operating Procedure.",
    },
    purpose: {
      type: Type.STRING,
      description: "A brief statement explaining the reason for this SOP.",
    },
    scope: {
      type: Type.STRING,
      description: "Describes the areas, departments, and personnel this SOP applies to.",
    },
    steps: {
      type: Type.ARRAY,
      description: "The sequential steps of the procedure.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A concise heading for the step."
          },
          description: {
            type: Type.STRING,
            description: "A detailed description of the actions to be taken in this step.",
          },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["title", "purpose", "scope", "steps"],
};

export const generateSop = async (topic: string, details: string): Promise<Sop> => {
  try {
    const prompt = `
      Create a detailed Standard Operating Procedure (SOP) for a food service or pharmacy environment.
      
      Topic: ${topic}
      
      Key Details to Include: ${details}

      Generate a comprehensive SOP based on the topic and details provided. Ensure the steps are clear, concise, and easy to follow. The output must conform to the provided JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: sopSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    const sopData = JSON.parse(jsonText);
    
    // Basic validation
    if (!sopData.title || !sopData.steps || !Array.isArray(sopData.steps)) {
        throw new Error("Invalid SOP structure received from API.");
    }
    
    return sopData as Sop;

  } catch (error) {
    console.error("Error generating SOP:", error);
    throw new Error("Failed to generate SOP. Please check your prompt and API key.");
  }
};
