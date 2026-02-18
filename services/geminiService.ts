import { GoogleGenAI } from "@google/genai";
import { ULTRA_CODE_PROMPT } from "../constants";
import { ModelType } from "../types";

/**
 * Maps the application's internal model IDs to official Gemini model names.
 * Optimized to use 'gemini-3-flash-preview' as the primary model to avoid 429 quota issues.
 */
const mapModelId = (modelId: ModelType): string => {
  switch (modelId) {
    case 'void-4':
      // We use gemini-3-flash-preview instead of pro to ensure reliability and speed
      return 'gemini-3-flash-preview';
    default:
      return 'gemini-3-flash-preview';
  }
};

/**
 * Normalizes history parts to the format expected by the @google/genai SDK.
 */
const formatHistory = (history: { role: 'user' | 'assistant', parts: { text: string }[] }[]) => {
  return history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: h.parts.map(p => ({ text: p.text }))
  }));
};

export const getAIResponse = async (
  message: string, 
  modelId: ModelType, 
  history: { role: 'user' | 'assistant', parts: { text: string }[] }[] = []
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = mapModelId(modelId);
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...formatHistory(history),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: ULTRA_CODE_PROMPT,
        temperature: 0.7,
      },
    });

    return { 
      text: response.text || "Response returned empty.", 
      sources: [] 
    };
  } catch (error: any) {
    console.error("Gemini service error:", error);
    throw new Error(error.message || "Failed to process request with Gemini.");
  }
};

export async function* getAIResponseStream(
  message: string,
  modelId: ModelType,
  history: { role: 'user' | 'assistant', parts: { text: string }[] }[] = []
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = mapModelId(modelId);
    
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: [
        ...formatHistory(history),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: ULTRA_CODE_PROMPT,
        temperature: 0.7,
      },
    });

    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    console.error("Gemini stream failure:", error);
    throw new Error(error.message || "Connection to Gemini lost.");
  }
}

export const generateImage = async (prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned from model.");
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};