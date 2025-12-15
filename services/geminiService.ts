// AI Service temporarily disabled as per user request
export const getAIAnalysis = async (context: string, prompt: string): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "AI Coach is currently disabled. Please enable it in later versions to get personalized insights.";
};