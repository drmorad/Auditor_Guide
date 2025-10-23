import { GoogleGenAI, Type } from "@google/genai";
import { Sop, UserRole } from '../types';

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
  required: ["title", "steps"],
};

export const generateSop = async (topic: string, details: string): Promise<Sop> => {
  try {
    const prompt = `
      Generate a comprehensive Standard Operating Procedure (SOP).
      
      The main topic for the SOP is: "${topic}"
      
      If provided, here are some key details, requirements, or specific points that must be included in the procedure: "${details}"

      The SOP should be structured with a clear title, purpose, scope, and a series of actionable steps. Each step must have its own title and a detailed description. The language should be professional and unambiguous. The output must strictly conform to the provided JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert in creating clear, professional, and compliant Standard Operating Procedures (SOPs) for various business environments. Your goal is to produce documents that are easy for employees to understand and follow.",
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

export const generateSopFromDocument = async (fileContent: string, mimeType: string): Promise<Sop> => {
    try {
        const prompt = "Analyze the provided document (which could be text or an image) and extract or create a structured Standard Operating Procedure (SOP) from its content. The SOP should have a clear title, purpose, scope, and a series of actionable steps. The output must strictly conform to the provided JSON schema.";

        const contentPart = mimeType.startsWith('image/')
            ? { inlineData: { data: fileContent.split(',')[1], mimeType } }
            : { text: fileContent };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [contentPart, { text: prompt }] },
            config: {
                systemInstruction: "You are an expert in analyzing documents and creating clear, professional Standard Operating Procedures (SOPs). Your goal is to accurately interpret the provided content and structure it into a usable SOP format.",
                responseMimeType: "application/json",
                responseSchema: sopSchema,
                temperature: 0.5,
            }
        });

        const jsonText = response.text;
        const sopData = JSON.parse(jsonText);

        if (!sopData.title || !sopData.steps || !Array.isArray(sopData.steps)) {
            throw new Error("Invalid SOP structure received from document analysis.");
        }

        return sopData as Sop;

    } catch (error) {
        console.error("Error generating SOP from document:", error);
        throw new Error("Failed to analyze document and create SOP.");
    }
};

export const reviewSop = async (sopContent: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert in operational procedure analysis. Review the following Standard Operating Procedure (SOP).
      Your goal is to provide actionable feedback to improve its clarity, completeness, and adherence to best practices.

      Analyze the SOP based on the following criteria:
      1.  **Clarity:** Is the language clear, concise, and unambiguous? Are there any jargon or confusing terms?
      2.  **Completeness:** Does it include essential sections like Purpose, Scope, and detailed procedural steps? Is any critical information missing?
      3.  **Actionability:** Are the steps written in an active voice? Are they easy for an employee to follow and execute?
      4.  **Formatting & Structure:** Is the SOP well-organized? Is the formatting easy to read?

      Provide your feedback in a structured format. Use markdown for headings (e.g., "**Overall Summary**"), bold text for emphasis, and bullet points (using '*') for specific suggestions. Start with an overall summary, then provide a point-by-point breakdown of recommended improvements.

      --- SOP FOR REVIEW ---
      ${sopContent}
      --- END SOP ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3, // Lower temp for more deterministic, analytical feedback
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error reviewing SOP:", error);
    throw new Error("Failed to get SOP review from the AI assistant.");
  }
};


export const getChatResponse = async (question: string, context: string): Promise<string> => {
    try {
        const prompt = `
            You are an AI assistant for a compliance management application.
            Your task is to answer the user's question based *only* on the context provided below.
            Do not use any external knowledge. If the answer cannot be found in the context, state that clearly.
            Format your answer in a clear and helpful way, using markdown for lists or emphasis if needed.

            ---CONTEXT---
            ${context}
            ---END CONTEXT---

            User's Question: "${question}"
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.2,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error getting chat response:", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
};

export const suggestUserRole = async (jobTitle: string): Promise<{ role: UserRole; reasoning: string; }> => {
  const roleSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
      role: {
        type: Type.STRING,
        enum: ['Admin', 'Editor', 'Viewer'],
        description: "The suggested role based on the job title.",
      },
      reasoning: {
        type: Type.STRING,
        description: "A brief explanation for the role suggestion.",
      },
    },
    required: ["role", "reasoning"],
  };

  try {
    const prompt = `
      You are an expert HR and Operations consultant for the hospitality industry, specializing in compliance management systems.
      Your task is to suggest a user role for a new team member based on their job title.

      The application has three user roles:
      - **Admin:** Full access. Can manage users, settings, hotels, and all documents/inspections. Suitable for General Managers, Directors of Operations, or system administrators.
      - **Editor:** Can create and edit documents, and conduct inspections. Cannot manage users or system settings. Suitable for department heads like Executive Chefs, Head of Housekeeping, or Maintenance Supervisors.
      - **Viewer:** Read-only access. Can view documents and completed inspection reports. Cannot create or edit anything. Suitable for line-level staff, trainees, or external auditors.

      Based on the following job title, provide the most appropriate role and a brief reasoning for your choice.
      Job Title: "${jobTitle}"

      The output must strictly conform to the provided JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: roleSuggestionSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text;
    const suggestionData = JSON.parse(jsonText);

    if (!suggestionData.role || !suggestionData.reasoning || !['Admin', 'Editor', 'Viewer'].includes(suggestionData.role)) {
      throw new Error("Invalid role suggestion structure received from API.");
    }

    return suggestionData as { role: UserRole; reasoning: string; };

  } catch (error) {
    console.error("Error suggesting user role:", error);
    throw new Error("Failed to get role suggestion from the AI assistant.");
  }
};