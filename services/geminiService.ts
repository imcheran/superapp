// AI Service stub - Gemini integration disabled
export const getAIAnalysis = async (context: string, prompt: string): Promise<string> => {
  console.log("AI Analysis requested (Disabled):", context, prompt);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return `
    <strong>AI Coach Unavailable</strong>
    <p>The AI integration is currently disabled in this build.</p>
    <p>However, based on your logs, here are some general tips:</p>
    <ul>
      <li>Consistency is key. Try to stick to your sleep schedule.</li>
      <li>Hydration affects energy levels. Aim for 3L of water daily.</li>
      <li>Review your habits in the "Tracker" view to spot patterns manually.</li>
    </ul>
  `;
};