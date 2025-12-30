
import { GoogleGenAI } from "@google/genai";

// AI Service implemented using Google GenAI SDK for real-time bio-data analysis
export const getAIAnalysis = async (context: string, prompt: string): Promise<string> => {
  // Always use a named parameter to initialize GoogleGenAI with the API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Calling generateContent directly on ai.models as recommended
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context:\n${context}\n\nUser Message:\n${prompt}`,
      config: {
        systemInstruction: "You are Omni, a world-class Bio-Digital Coach. Your goal is to provide data-backed insights on how lifestyle factors like sleep and nutrition correlate with habit consistency and mood.",
        temperature: 0.7,
      },
    });

    // Extracting text output directly from the .text property as per guidelines
    return response.text || "I was unable to analyze the data at this moment. Please provide more details or try again later.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI Coach is currently unavailable. Please check your network connection or API configuration.";
  }
};
