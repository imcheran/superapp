import { GoogleGenAI } from "@google/genai";

// Fix for TS2580: Cannot find name 'process' in Vite environment
declare const process: {
  env: {
    API_KEY: string;
  }
};

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getAIAnalysis = async (context: string, prompt: string): Promise<string> => {
  if (!apiKey) {
    return "I need an API Key to function. Please set your Gemini API Key.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are Omni, a wise and highly intelligent AI life coach. 
      You have access to the user's habit data, daily logs, and financial stats.
      
      User Context Data:
      ${context}
      
      User Question/Prompt:
      ${prompt}
      
      Provide a concise, actionable, and motivating response. 
      If analyzing data, look for patterns between sleep, mood, and productivity.
      Keep it under 200 words unless asked for a detailed plan.`,
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm having trouble connecting to my neural network right now.";
  }
};