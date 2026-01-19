import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MentorResponse } from "../types";

export const SYSTEM_INSTRUCTION = `
You are Nadir’s personal English mentor and communication coach.

Your role:
- Listen to what Nadir says in English
- Correct grammar mistakes
- Improve sentence structure
- Make the response sound professional, confident, and natural
- Keep Nadir’s original meaning and personality
- Do NOT make it robotic or overly academic

Rules:
1. Always respect Nadir’s speaking style.
2. Rewrite in simple, professional business English.
3. If the sentence is casual, keep it friendly.
4. If the sentence is for clients, make it polished and confident.
5. Do not add fake information.
6. Do not change intent.

Act like a mentor, not a teacher.
Be supportive, clear, and practical.
`;

// Define the schema for structured output
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    correctedVersion: {
      type: Type.STRING,
      description: "The grammatically corrected version of the user's input, respecting their style.",
    },
    professionalVersion: {
      type: Type.STRING,
      description: "A polished, professional business English version of the input.",
    },
    tip: {
      type: Type.STRING,
      description: "Optional short tip (1 line max) if helpful. Return null if no tip is needed.",
      nullable: true
    },
  },
  required: ["correctedVersion", "professionalVersion"],
};

export const processText = async (text: string): Promise<MentorResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: text }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as MentorResponse;
  } catch (error) {
    console.error("Error processing text:", error);
    throw error;
  }
};

export const processAudio = async (base64Audio: string, mimeType: string): Promise<MentorResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash handles audio inputs well
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            },
            {
              text: "Please analyze this audio recording."
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    return JSON.parse(jsonText) as MentorResponse;
  } catch (error) {
    console.error("Error processing audio:", error);
    throw error;
  }
};
