import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ULTRA_CODE_PROMPT } from "../constants.ts";
import { ModelType, GroundingSource } from "../types.ts";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getModelName = (modelId: ModelType, isCodeRequest: boolean): string => {
  if (isCodeRequest) {
    return 'gemini-3-pro-preview';
  }
  return 'gemini-3-flash-preview';
};

export const getAIResponse = async (
  message: string, 
  modelId: ModelType, 
  history: { role: 'user' | 'assistant', parts: { text: string }[] }[] = [],
  forceArchitectMode: boolean = false
) => {
  const isCodeRequest = forceArchitectMode || (message.toLowerCase().includes('generate') && (message.toLowerCase().includes('code') || message.toLowerCase().includes('website') || message.toLowerCase().includes('app') || message.toLowerCase().includes('build')));
  
  const ai = getAI();
  const modelName = getModelName(modelId, isCodeRequest);
  
  const systemInstruction = isCodeRequest 
    ? ULTRA_CODE_PROMPT
    : "You are Void AI, a premium neural assistant. Provide detailed and helpful responses.";

  try {
    const config: any = {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: isCodeRequest ? 32768 : 0 }
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: h.parts })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config
    });

    const text = response.text || "";
    const sources: GroundingSource[] = [];

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export async function* getAIResponseStream(
  message: string,
  modelId: ModelType,
  history: { role: 'user' | 'assistant', parts: { text: string }[] }[] = [],
  forceArchitectMode: boolean = false
) {
  const isCodeRequest = forceArchitectMode || (message.toLowerCase().includes('generate') && (message.toLowerCase().includes('code') || message.toLowerCase().includes('website') || message.toLowerCase().includes('app') || message.toLowerCase().includes('build')));
  
  const ai = getAI();
  const modelName = getModelName(modelId, isCodeRequest);
  
  const systemInstruction = isCodeRequest 
    ? ULTRA_CODE_PROMPT
    : "You are Void AI, a premium neural assistant.";

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: h.parts })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: isCodeRequest ? 32768 : 0 }
      }
    });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    throw error;
  }
}

export const generateImage = async (prompt: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    throw new Error("No image data returned.");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};