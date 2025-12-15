import React, { useState } from 'react';
import { Habit, TrackingData } from '../types';
import { Check, Trophy, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface TrackerProps {
  habits: Habit[];
  data: TrackingData;
  onToggle: (habitId: string, date: string) => void;
}

type HeatmapScope = 'Week' | 'Month' | 'Year';

// --- Heatmap Sub-Component ---
const HabitHeatmap: React.FC<{ habit: Habit, data: TrackingData, currentDate: Date, scope: HeatmapScope }> = ({ habit, data, currentDate, scope }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  let startDate: Date;
  let endDate: Date;

  if (scope === 'Year') {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  } else if (scope === 'Month') {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
  } else {
    // Week: Sunday to Saturday of current date's week
    const day = currentDate.getDay(); // 0 is Sunday
    const diff = currentDate.getDate() - day;
    startDate = new Date(currentDate);
    startDate.setDate(diff);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  }

  // Padding logic for Vertical-Flow Grids (Year/Month)
  const startDay = startDate.getDay(); 
  const paddingCount = scope === 'Week' ? 0 : startDay;
  const padding = Array.from({ length: paddingCount }).fill(null);
  
  const dates = [];
  let d = new Date(startDate);
  d.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(0,0,0,0);

  while (d <= end) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  
  const allCells = [...padding, ...dates];

  // Helper to safely format local date to match TrackingData keys
  const toLocalISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const totalDays = dates.length;
  const completedDays = dates.filter(d => {
      const k = toLocalISO(d);
      return data[k]?.includes(habit.id);
  }).length;
  const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Render Classes & Dimensions
  let gridClass = '';
  let cellClass = '';
  
  if (scope === 'Week') {
      gridClass = "grid grid-cols-7 gap-3 w-full"; // Horizontal
      cellClass = "aspect-square rounded-lg w-full";
  } else if (scope === 'Month') {
      gridClass = "grid grid-rows-7 grid-flow-col gap-1.5 w-max"; // Vertical flow
      cellClass = "w-6 h-6 rounded text-[8px] flex items-center justify-center font-medium text-slate-500/50";
  } else {
      // Year - Compact visualization without labels
      // Using w-full to try to fit spread out
      gridClass = "grid grid-rows-7 grid-flow-col gap-1 w-full max-w-full overflow-hidden"; 
      cellClass = "w-full aspect-square rounded-[2px]"; 
  }

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors shadow-sm">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105" style={{backgroundColor: habit.color}}>
                    <Check size={18} strokeWidth={3} />
                 </div>
                 <div>
                     <h4 className="font-bold text-slate-800 text-sm leading-tight">{habit.name}</h4>
                     <p className="text-xs text-slate-400 font-medium mt-0.5">{scope} View • {percentage}% Consistency</p>
                 </div>
            </div>
            <div className="text-right">
                <span className="text-xl font-black text-slate-700">{completedDays}</span>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Days Done</p>
            </div>
        </div>
        
        <div className="w-full">
            <div className={`overflow-x-auto hide-scrollbar ${scope === 'Year' ? 'pb-2' : ''}`}>
                <div className={gridClass}>
                    {allCells.map((cell, i) => {
                        if (!cell) return <div key={`pad-${i}`} className={`${cellClass} bg-transparent`} />;
                        
                        const date = cell as Date;
                        const dateStr = toLocalISO(date);
                        const isDone = data[dateStr]?.includes(habit.id);
                        
                        // Future check needs to be safe too
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const isFuture = date > today;
                        
                        return (
                            <div 
                                key={dateStr}
                                title={`${date.toDateString()}`}
                                className={`${cellClass} transition-all duration-300 ${isDone ? 'scale-100 shadow-sm' : 'bg-slate-100 scale-90'}`}
                                style={{ 
                                    backgroundColor: isDone ? habit.color : undefined,
                                    opacity: isFuture ? 0.3 : 1 
                                }}
                            >
                                {(scope === 'Week' || scope === 'Month') && (
                                    <span>{date.getDate()}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Main Tracker Component ---
const Tracker: React.FC<TrackerProps> = ({ habits, data, onToggle }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [heatmapScope, setHeatmapScope] = useState<HeatmapScope>('Year');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper Calculation Functions
  const getHabitStats = (habitId: string) => {
    let completedCount = 0;
    let tempStreak = 0;
    let bestStreak = 0;

    for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isDone = data[dStr]?.includes(habitId);
        if (isDone) {
            completedCount++;
            tempStreak++;
            if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    }

    const consistency = Math.round((completedCount / daysInMonth) * 100);
    return { consistency, bestStreak };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* SECTION 1: MONTHLY GRID TRACKER */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
                    <span className="text-xl font-normal text-slate-400">{year}</span>
                </div>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>

        {/* Grid Container */}
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
            <thead className="bg-slate-50">
                <tr>
                <th className="p-3 text-left min-w-[180px] border-r border-slate-200 bg-slate-50 sticky left-0 z-20 font-bold text-xs text-slate-500 uppercase tracking-wider shadow-[1px_0_3px_rgba(0,0,0,0.05)]">Habit Name</th>
                
                {days.map(d => {
                    const date = new Date(year, month, d);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                        <th key={d} className={`min-w-[34px] border-r border-slate-100 py-2 px-0 text-center ${isToday ? 'bg-indigo-50' : ''}`}>
                            <div className="flex flex-col items-center">
                                <span className={`text-[9px] font-bold uppercase leading-none mb-1 ${isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {date.toLocaleDateString('en-US', {weekday: 'narrow'})}
                                </span>
                                <span className={`text-xs font-bold leading-none ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>{d}</span>
                            </div>
                        </th>
                    )
                })}

                <th className="px-2 py-2 min-w-[60px] bg-emerald-50/50 border-l border-slate-200 text-[10px] font-bold text-emerald-700 uppercase">Cons. %</th>
                <th className="px-2 py-2 min-w-[60px] bg-amber-50/50 border-l border-slate-200 text-[10px] font-bold text-amber-700 uppercase">Best</th>
                </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
                {habits.map(habit => {
                    const stats = getHabitStats(habit.id);

                    return (
                        <tr key={habit.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-3 border-r border-slate-200 bg-white sticky left-0 z-10 group-hover:bg-slate-50 transition-colors shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{backgroundColor: habit.color}}></div>
                                    <span className="font-medium text-slate-700 text-sm truncate max-w-[140px]">{habit.name}</span>
                                </div>
                            </td>

                            {days.map(d => {
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const isDone = data[dateStr]?.includes(habit.id);
                                const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
                                
                                return (
                                    <td key={d} className={`border-r border-slate-100 p-0 text-center relative ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                        <button
                                            onClick={() => onToggle(habit.id, dateStr)}
                                            className="w-full h-9 flex items-center justify-center hover:bg-slate-100/80 transition-colors outline-none focus:bg-slate-100"
                                        >
                                            {isDone && (
                                                <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center shadow-sm animate-fade-in" style={{backgroundColor: habit.color}}>
                                                    <Check size={12} className="text-white" strokeWidth={4} />
                                                </div>
                                            )}
                                        </button>
                                    </td>
                                )
                            })}

                            <td className="px-2 py-2 text-center border-l border-slate-200 bg-emerald-50/10">
                                <span className="text-xs font-bold text-emerald-600">{stats.consistency}%</span>
                            </td>
                            <td className="px-2 py-2 text-center border-l border-slate-200 bg-amber-50/10">
                                <div className="flex items-center justify-center gap-1 text-amber-600">
                                    <Trophy size={10} />
                                    <span className="text-xs font-bold">{stats.bestStreak}</span>
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
            </table>
        </div>
      </div>

      {/* SECTION 2: HEATMAPS */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-inner p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                  <BarChart3 className="text-slate-600" />
                  <h3 className="text-lg font-bold text-slate-800">Habit Heatmaps</h3>
              </div>
              <div className="flex bg-white p-1 rounded-lg self-start sm:self-auto shadow-sm border border-slate-200">
                  {(['Week', 'Month', 'Year'] as HeatmapScope[]).map(scope => (
                      <button
                        key={scope}
                        onClick={() => setHeatmapScope(scope)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${heatmapScope === scope ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                      >
                          {scope}
                      </button>
                  ))}
              </div>
          </div>
          {/* Dynamically adjust grid columns: 1 column for Year view to maximize width, 2 columns for smaller views */}
          <div className={`grid grid-cols-1 ${heatmapScope === 'Year' ? 'xl:grid-cols-1' : 'xl:grid-cols-2'} gap-6`}>
              {habits.map(habit => (
                  <HabitHeatmap 
                    key={habit.id} 
                    habit={habit} 
                    data={data} 
                    currentDate={currentDate} 
                    scope={heatmapScope} 
                  />
              ))}
          </div>
      </div>

    </div>
  );
};

export default Tracker;