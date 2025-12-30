
import React, { useState, useMemo } from 'react';
import { Habit, TrackingData } from '../types';
import { TrendingUp, Trophy, BarChart2, ChevronLeft, ChevronRight, Star, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface DashboardProps {
  habits: Habit[];
  data: TrackingData;
}

const Dashboard: React.FC<DashboardProps> = ({ habits, data }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // --- Calculations ---

  const trendData = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const completions = data[dateStr] || [];
        const completedCount = completions.length || 0;
        const total = habits.length;
        const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        days.push({
            name: i,
            value: completedCount, // Completion Count (Volume)
            percentage: percentage // Consistency % (Efficiency)
        });
    }
    return days;
  }, [data, year, month, habits, daysInMonth]);

  const habitPerformance = useMemo(() => {
    return habits.map(h => {
        let completedCount = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const completions = data[dateStr] || [];
            if (completions.includes(h.id)) completedCount++;
        }
        return { 
          id: h.id,
          name: h.name,
          color: h.color,
          category: h.category,
          targetConsistency: h.targetConsistency,
          rate: Math.round((completedCount / daysInMonth) * 100),
          completions: completedCount
        };
    }).sort((a, b) => b.rate - a.rate);
  }, [habits, data, year, month, daysInMonth]);

  const totalCompletions = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.value, 0);
  }, [trendData]);

  const avgConsistency = useMemo(() => {
    return trendData.length > 0 ? Math.round(trendData.reduce((acc, curr) => acc + curr.percentage, 0) / trendData.length) : 0;
  }, [trendData]);

  const topPerformer = habitPerformance[0];
  const worstPerformer = habitPerformance[habitPerformance.length - 1];

  const getGrade = (score: number) => {
      if (score >= 90) return { grade: 'A', color: 'text-emerald-500' };
      if (score >= 80) return { grade: 'B', color: 'text-indigo-500' };
      if (score >= 70) return { grade: 'C', color: 'text-amber-500' };
      if (score >= 60) return { grade: 'D', color: 'text-orange-500' };
      return { grade: 'F', color: 'text-rose-500' };
  };

  const monthGrade = getGrade(avgConsistency);

  return (
    <div className="space-y-8 animate-fade-in text-slate-900">
      
      {/* HEADER: MONTH NAVIGATION & KEY STATS */}
      <div className="flex flex-col md:flex-row items-stretch gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between md:w-1/3">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-3 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
              >
                  <ChevronLeft size={24} />
              </button>
              <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800">{monthNames[month]}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{year}</p>
              </div>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-3 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
              >
                  <ChevronRight size={24} />
              </button>
          </div>

          <div className="grid grid-cols-2 flex-1 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Completions</p>
                  <p className="text-3xl font-black text-slate-800">{totalCompletions}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Grade</p>
                  <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${monthGrade.color}`}>{monthGrade.grade}</span>
                      <span className="text-sm font-bold text-slate-400">{avgConsistency}% Consistency</span>
                  </div>
              </div>
          </div>
      </div>

      {/* INSIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100 relative overflow-hidden">
              <Star className="absolute top-2 right-2 text-white/10 w-24 h-24 rotate-12" />
              <div className="relative z-10">
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-4">Top Performer</p>
                  <h4 className="text-2xl font-black mb-1">{topPerformer?.name || 'N/A'}</h4>
                  <p className="text-indigo-100 font-bold text-sm">{topPerformer?.rate || 0}% Efficiency This Month</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <AlertCircle className="absolute top-2 right-2 text-slate-100 w-24 h-24 -rotate-12" />
              <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Critical Focus</p>
                  <h4 className="text-2xl font-black text-slate-800 mb-1">{worstPerformer?.name || 'N/A'}</h4>
                  <p className="text-rose-500 font-bold text-sm">{worstPerformer?.rate || 0}% Efficiency This Month</p>
              </div>
          </div>
      </div>

      {/* UNIFIED TREND ANALYSIS (Combined Volume & Consistency) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                  <TrendingUp size={24} className="text-indigo-600" /> Performance Trend Analysis
              </h3>
              <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-indigo-500 rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Volume (Habits)</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-emerald-500 rounded-full"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Efficiency (%)</span>
                  </div>
              </div>
          </div>
          <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                      <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                      />
                      {/* Left Y-Axis for Absolute Completions */}
                      <YAxis 
                          yAxisId="left"
                          orientation="left"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 'bold', fill: '#6366f1'}}
                          domain={[0, (data) => Math.max(data, habits.length || 5)]}
                      />
                      {/* Right Y-Axis for Percentage */}
                      <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 'bold', fill: '#10b981'}}
                          domain={[0, 100]}
                      />
                      <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px'}} 
                          itemStyle={{padding: '2px 0'}}
                      />
                      <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="value" 
                          name="Habits Done"
                          stroke="#6366f1" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                      />
                      <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="percentage" 
                          name="Consistency %"
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 2, fill: '#10b981', strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                  </ComposedChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* MASTER PERFORMANCE HUB */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                  <BarChart2 size={24} className="text-indigo-600" /> Master Performance Hub
              </h3>
              <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Above Goal</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Below Goal</span>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-6 py-4 text-left">Rank</th>
                          <th className="px-6 py-4 text-left">Habit</th>
                          <th className="px-6 py-4 text-center">Actual %</th>
                          <th className="px-6 py-4 text-center">Goal %</th>
                          <th className="px-6 py-4 text-left">Progress</th>
                          <th className="px-6 py-4 text-right">Goal Gap</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {habitPerformance.map((h, index) => {
                          const gap = h.rate - h.targetConsistency;
                          const isAboveGoal = gap >= 0;
                          return (
                              <tr key={h.id} className="hover:bg-slate-50/80 transition-colors group">
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-mono font-bold text-slate-400">#{index + 1}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: h.color}}></div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-800">{h.name}</p>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase">{h.category}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className={`text-base font-black ${isAboveGoal ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {h.rate}%
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center text-sm font-bold text-slate-400">
                                      {h.targetConsistency}%
                                  </td>
                                  <td className="px-6 py-4 min-w-[140px]">
                                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full transition-all duration-1000" 
                                            style={{
                                              width: `${h.rate}%`, 
                                              backgroundColor: h.color,
                                              opacity: isAboveGoal ? 1 : 0.6
                                            }}
                                          ></div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black ${isAboveGoal ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {isAboveGoal ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                          {isAboveGoal ? '+' : ''}{gap}%
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;
