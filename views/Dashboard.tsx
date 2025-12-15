import React from 'react';
import { Habit, TrackingData, UserSettings, DailyLogData } from '../types';
import { TrendingUp, Trophy, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  habits: Habit[];
  data: TrackingData;
  settings: UserSettings;
  logs: DailyLogData;
}

const Dashboard: React.FC<DashboardProps> = ({ habits, data }) => {
  // Stats Calculation
  // Calculate total completions by summing array lengths in data object
  const totalCompletions = Object.values(data).reduce<number>((acc, curr: string[]) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
  
  // Real Trend Data (Last 30 Days)
  const getTrendData = () => {
      const days = [];
      const today = new Date();
      // Loop backwards 30 days
      for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          // Get count from actual tracking data
          const count = data[key]?.length || 0;
          days.push({
              name: d.toLocaleString('en-US', { day: 'numeric', month: 'short' }),
              value: count
          });
      }
      return days;
  };
  
  const trendData = getTrendData();

  // Habit Stats for Analytics Table
  const getHabitStats = (habit: Habit) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // 1. Total Days (All time)
    let totalCompletions = 0;
    
    // 2. Current % (Last 30 days)
    let last30DaysCount = 0;
    const daysToCheck = 30;

    // 3. Yearly Stats
    let yearCompletions = 0;
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear = Math.floor((Number(today) - Number(startOfYear)) / 1000 / 60 / 60 / 24) + 1;
    
    // 4. Monthly Stats for Best Month
    const monthlyCounts: Record<string, number> = {};

    Object.entries(data).forEach(([dateStr, completedHabits]: [string, string[]]) => {
      if (completedHabits.includes(habit.id)) {
        totalCompletions++;
        
        const date = new Date(dateStr);
        // Check Last 30 Days
        const timeDiff = today.getTime() - date.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        if (daysDiff >= 0 && daysDiff < 30) {
            last30DaysCount++;
        }

        // Check Yearly
        if (date.getFullYear() === currentYear) {
            yearCompletions++;
        }

        // Monthly bucket
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });

    const currentConsistency = Math.round((last30DaysCount / daysToCheck) * 100);
    const yearlyAvg = dayOfYear > 0 ? Math.round((yearCompletions / dayOfYear) * 100) : 0;

    // Find Best Month
    let bestMonthName = '-';
    let maxCount = 0;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    Object.entries(monthlyCounts).forEach(([key, count]) => {
        if (count > maxCount) {
            maxCount = count;
            const [y, m] = key.split('-');
            bestMonthName = monthNames[parseInt(m)];
        }
    });
    if (maxCount === 0) bestMonthName = monthNames[currentMonth];

    return {
        currentConsistency,
        yearlyAvg,
        totalCompletions,
        bestMonth: bestMonthName,
        gap: currentConsistency - habit.targetConsistency,
        status: currentConsistency >= habit.targetConsistency ? 'ON TRACK' : 'OFF TRACK',
        grade: currentConsistency >= 90 ? 'A' : currentConsistency >= 80 ? 'B' : currentConsistency >= 60 ? 'C' : currentConsistency >= 40 ? 'D' : 'F',
        recommendation: currentConsistency < 50 ? 'Start smaller, aim for 3 days/week.' : currentConsistency < 80 ? 'Good progress, try stacking habits.' : 'Excellent! Increase intensity.'
    };
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-900">
      
      {/* Top Stats Row (Moved to top since bio-hero is removed) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
              { label: 'Yearly Average', value: '78%', sub: 'A-', color: 'text-slate-800' },
              { label: 'Total Completions', value: totalCompletions, sub: '', color: 'text-slate-800' },
              { label: 'Best Month', value: 'Jan', sub: '92%', color: 'text-slate-800' },
              { label: 'Success Rate', value: '84%', sub: '', color: 'text-indigo-600' }
          ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value} <span className="text-sm font-medium text-emerald-500 ml-1">{stat.sub}</span>
                  </p>
              </div>
          ))}
      </div>

      {/* Graph Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" /> 30-Day Completion Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                    <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={3} />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* SECTION 1: GOAL SETTING & TRACKING */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" /> Goal Setting & Tracking
                </h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-yellow-50/50 border-y border-yellow-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4 text-left">Habit</th>
                            <th className="px-6 py-4 text-center">Goal %</th>
                            <th className="px-6 py-4 text-center">Current %</th>
                            <th className="px-6 py-4 text-center w-1/3">Progress</th>
                            <th className="px-6 py-4 text-center">Gap %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {habits.map(habit => {
                            const stats = getHabitStats(habit);
                            const isNegativeGap = stats.gap < 0;

                            return (
                                <tr key={habit.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: habit.color}}></div>
                                            <span className="font-medium text-slate-700">{habit.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-600">{habit.targetConsistency}%</td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800">{stats.currentConsistency}%</td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${stats.currentConsistency}%`, backgroundColor: habit.color }}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[8px] font-bold text-slate-400/80">{stats.currentConsistency}%</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-center font-bold ${isNegativeGap ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {stats.gap > 0 ? '+' : ''}{stats.gap}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* SECTION 2: INDIVIDUAL HABIT DEEP-DIVE ANALYSIS */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <BarChart2 size={18} className="text-indigo-500" /> Individual Habit Deep-Dive Analysis
                </h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-indigo-50/30 border-y border-indigo-50 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                            <th className="px-6 py-4 text-left">Habit</th>
                            <th className="px-6 py-4 text-center">Yearly Avg %</th>
                            <th className="px-6 py-4 text-center">Best Month</th>
                            <th className="px-6 py-4 text-center">Total Days</th>
                            <th className="px-6 py-4 text-center">Grade</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-left">Recommendation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {habits.map(habit => {
                            const stats = getHabitStats(habit);
                            const gradeColor = stats.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : stats.grade === 'B' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700';
                            const statusColor = stats.status === 'ON TRACK' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100';

                            return (
                                <tr key={habit.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: habit.color}}></div>
                                            <span className="font-medium text-slate-700">{habit.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-700">{stats.yearlyAvg}%</td>
                                    <td className="px-6 py-4 text-center text-slate-600">{stats.bestMonth}</td>
                                    <td className="px-6 py-4 text-center text-slate-600">{stats.totalCompletions}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold ${gradeColor}`}>
                                            {stats.grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${statusColor}`}>
                                            {stats.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                                        {stats.recommendation}
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