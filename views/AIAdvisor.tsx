import React, { useState } from 'react';
import { Habit, TrackingData, DailyLogData, DailyEntry } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { Brain, Send, MessageSquare } from 'lucide-react';

interface AIAdvisorProps {
  habits: Habit[];
  data: TrackingData;
  dailyLogs: DailyLogData;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ habits, data, dailyLogs }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
      { role: 'ai', content: "Hello! I'm Omni. I've analyzed your sleep, nutrition, and habits. Ask me for correlations or improvement plans!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMsg = prompt;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setPrompt('');
    setIsLoading(true);

    // Prepare Comprehensive Context
    // Get last 7 days of logs sorted by date descending
    const recentLogs = Object.entries(dailyLogs)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .slice(0, 7)
        .map(([date, log]: [string, DailyEntry]) => ({
            date,
            sleep: `${log.sleepHours}h (${log.wakeTime} - ${log.sleepTime})`,
            nutrition: log.nutritionLog || "Not logged",
            habitsCompleted: data[date] || [],
            mood: `${log.mood} (${log.moodIntensity}/10)`,
            energy: `${log.energyLevel}/10`
        }));

    const context = `
        You are an advanced Bio-Digital Coach called Omni.
        
        USER DATA SNAPSHOT:
        
        1. ACTIVE HABITS:
        ${habits.map(h => `- ${h.name} (${h.category})`).join('\n')}

        2. RECENT ACTIVITY LOGS (Last 7 Days):
        ${JSON.stringify(recentLogs, null, 2)}
        
        INSTRUCTIONS:
        Analyze the correlation between the user's Sleep, Nutrition (Food), and Habit consistency.
        Look for patterns (e.g., "Poor sleep on days with high sugar intake").
        Provide specific, data-backed improvement advice based on this exact data.
    `;

    const aiResponse = await getAIAnalysis(context, userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-4 bg-indigo-600 text-white flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain size={24} />
            </div>
            <div>
                <h3 className="font-bold">Omni Advisor</h3>
                <p className="text-xs text-indigo-200">Full Bio-Data Analysis</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                        max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed
                        ${msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}
                    `}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
                type="text" 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ask: 'How does my food affect my sleep?'"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
            <button 
                type="submit" 
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
            >
                <Send size={20} />
            </button>
        </form>
    </div>
  );
};

export default AIAdvisor;