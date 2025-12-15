import React, { useState } from 'react';
import { Habit, TrackingData } from '../types';
import { ChevronLeft, ChevronRight, Star, AlertCircle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MonthlyProps {
  habits: Habit[];
  data: TrackingData;
}

const MonthlyDashboard: React.FC<MonthlyProps> = ({ habits, data }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Generate Graph Data
  const graphData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const completed = data[dateStr]?.length || 0;
      const total = habits.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { day, percentage };
  });

  const averageConsistency = Math.round(graphData.reduce((acc, curr) => acc + curr.percentage, 0) / daysInMonth);
  
  // Calculate Habit Performance for Ranking
  const habitPerformance = habits.map(h => {
      let completedCount = 0;
      for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          if (data[dateStr]?.includes(h.id)) completedCount++;
      }
      return { ...h, rate: Math.round((completedCount / daysInMonth) * 100) };
  }).sort((a, b) => b.rate - a.rate);

  const topPerformer = habitPerformance[0];
  const worstPerformer = habitPerformance[habitPerformance.length - 1];

  const getGrade = (score: number) => {
      if (score >= 90) return { grade: 'A', color: 'text-emerald-500' };
      if (score >= 80) return { grade: 'B', color: 'text-indigo-500' };
      if (score >= 70) return { grade: 'C', color: 'text-amber-500' };
      if (score >= 60) return { grade: 'D', color: 'text-orange-500' };
      return { grade: 'F', color: 'text-rose-500' };
  };

  const monthGrade = getGrade(averageConsistency);

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Month Navigation */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"
            >
                <ChevronLeft size={20} />
            </button>
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Monthly Deep Dive</p>
            </div>
            <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"
            >
                <ChevronRight size={20} />
            </button>
        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Month Grade</p>
                <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-black ${monthGrade.color}`}>{monthGrade.grade}</span>
                    <span className="text-sm font-medium text-slate-500">{averageConsistency}% Avg</span>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Top Performer</p>
                    <h3 className="font-bold text-slate-800 truncate">{topPerformer?.name || 'None'}</h3>
                    <p className="text-emerald-500 text-sm font-bold mt-1">{topPerformer?.rate || 0}% Consistency</p>
                </div>
                <div className="absolute top-4 right-4 p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                    <Star size={16} fill="currentColor" />
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Needs Focus</p>
                    <h3 className="font-bold text-slate-800 truncate">{worstPerformer?.name || 'None'}</h3>
                    <p className="text-rose-500 text-sm font-bold mt-1">{worstPerformer?.rate || 0}% Consistency</p>
                </div>
                 <div className="absolute top-4 right-4 p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <AlertCircle size={16} />
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trend</p>
                <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={20} className="text-emerald-500" />
                    <span className="font-bold text-emerald-500">Improving</span>
                </div>
                <p className="text-xs text-slate-400">First vs Last Day</p>
            </div>
        </div>

        {/* Main Graph & Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6">Daily Score Consistency</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                            <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6">Habit Performance Ranking</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {habitPerformance.map((h, i) => (
                        <div key={h.id} className="flex items-center gap-3 text-sm">
                            <span className="text-slate-400 font-mono w-4">{i + 1}.</span>
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: h.color}}></div>
                            <span className="flex-1 truncate font-medium text-slate-700">{h.name}</span>
                            
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full bg-slate-300" 
                                    style={{width: `${h.rate}%`, backgroundColor: h.rate > 80 ? '#10b981' : h.rate > 50 ? '#f59e0b' : '#ef4444'}}
                                ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-8 text-right">{h.rate}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default MonthlyDashboard;
