import React, { useState, useMemo } from 'react';
import { Habit, TrackingData } from '../types';
import { Check, ChevronLeft, ChevronRight, BarChart3, Trophy, Flame, CheckCircle2 } from 'lucide-react';

interface TrackerProps {
  habits: Habit[];
  data: TrackingData;
  onToggle: (habitId: string, date: string) => void;
}

type HeatmapScope = 'Month' | 'Year';

// --- Heatmap Sub-Component ---
const HabitHeatmap: React.FC<{ habit: Habit, data: TrackingData, currentDate: Date, scope: HeatmapScope }> = ({ habit, data, currentDate, scope }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  let startDate: Date;
  let endDate: Date;

  if (scope === 'Year') {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  } else {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
  }

  const startDay = startDate.getDay(); 
  const paddingCount = startDay;
  const padding = Array.from({ length: paddingCount }).fill(null);
  
  const dates: Date[] = [];
  let d = new Date(startDate);
  d.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(0,0,0,0);

  while (d <= end) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  
  const allCells = [...padding, ...dates];

  const toLocalISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const stats = useMemo(() => {
    let total = 0;
    let currentStreak = 0;
    
    // 1. Calculate Total Completions in the visible scope
    dates.forEach(date => {
        const ds = toLocalISO(date);
        if (data[ds]?.includes(habit.id)) {
            total++;
        }
    });

    // 2. Calculate Live Streak (Independent of scope, looks at ALL time)
    // Logic: If today is done, count from today back. 
    // If today is NOT done, but yesterday IS, count from yesterday back (so streak doesn't show 0).
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = toLocalISO(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalISO(yesterday);

    let checkDate = new Date(today); // Default start checking from today

    const isTodayDone = data[todayStr]?.includes(habit.id);
    const isYesterdayDone = data[yesterdayStr]?.includes(habit.id);

    if (isTodayDone) {
        // Streak is active including today
        checkDate = new Date(today);
    } else if (isYesterdayDone) {
        // Streak is active up to yesterday
        checkDate = new Date(yesterday);
    } else {
        // Streak broken
        currentStreak = 0;
        return { total, currentStreak };
    }

    // Count backwards
    while (true) {
        const cds = toLocalISO(checkDate);
        if (data[cds]?.includes(habit.id)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return { total, currentStreak };
  }, [data, habit.id, dates]);

  // Render Classes & Dimensions
  let gridClass = '';
  let cellClass = '';
  
  if (scope === 'Month') {
      gridClass = "grid grid-rows-7 grid-flow-col gap-1.5 w-max"; 
      cellClass = "w-6 h-6 rounded shadow-sm";
  } else {
      gridClass = "grid grid-rows-7 grid-flow-col gap-1 w-full max-w-full overflow-hidden"; 
      cellClass = "w-full aspect-square rounded-[2px]"; 
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
        <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{backgroundColor: habit.color}}>
                        <Check size={18} strokeWidth={3} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{habit.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{scope} Mastery Pattern</p>
                    </div>
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
                            
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const isFuture = date > today;
                            
                            return (
                                <div 
                                    key={dateStr}
                                    title={`${date.toDateString()}`}
                                    className={`${cellClass} transition-all duration-300 ${isDone ? 'scale-100 shadow-sm' : 'bg-slate-200 scale-90'}`}
                                    style={{ 
                                        backgroundColor: isDone ? habit.color : undefined,
                                        opacity: isFuture ? 0.3 : 1 
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* Counts / Stats Column */}
        <div className="flex flex-col justify-center gap-2 min-w-[130px] md:border-l md:border-slate-100 md:pl-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Done</span>
                </div>
                <span className="text-sm font-black text-slate-700">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Live Streak</span>
                </div>
                <span className="text-sm font-black text-orange-600">{stats.currentStreak}</span>
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

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
                    <span className="text-xl font-normal text-slate-400">{year}</span>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500"><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['Month', 'Year'] as HeatmapScope[]).map(scope => (
                    <button
                        key={scope}
                        onClick={() => setHeatmapScope(scope)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${heatmapScope === scope ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {scope} View
                    </button>
                ))}
            </div>
        </div>

        <div className="overflow-x-auto">
            <div className="min-w-max">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80">
                            <th className="sticky left-0 z-20 bg-slate-50 border-r border-slate-200 p-4 text-left min-w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Habit List</span>
                            </th>
                            {days.map(day => (
                                <th key={day} className="p-2 min-w-[36px] text-center border-b border-slate-200">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1)}
                                        </span>
                                        <span className={`text-sm font-black ${new Date().getDate() === day && new Date().getMonth() === month ? 'text-indigo-600' : 'text-slate-700'}`}>
                                            {day}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {habits.map(habit => (
                            <tr key={habit.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="sticky left-0 z-20 bg-white border-r border-slate-200 p-4 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: habit.color}}></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 leading-none">{habit.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{habit.category}</p>
                                        </div>
                                    </div>
                                </td>
                                {days.map(day => {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isDone = data[dateStr]?.includes(habit.id);
                                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                    
                                    return (
                                        <td key={day} className="p-1 border-slate-200/50">
                                            <button
                                                onClick={() => onToggle(habit.id, dateStr)}
                                                className={`
                                                    w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all duration-300
                                                    ${isDone 
                                                        ? 'text-white scale-100 shadow-md' 
                                                        : isToday ? 'bg-slate-200 border-2 border-slate-300' : 'bg-slate-100 hover:bg-slate-200'}
                                                `}
                                                style={{ backgroundColor: isDone ? habit.color : undefined }}
                                            >
                                                {isDone && <Check size={16} strokeWidth={3} />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
              <BarChart3 className="text-indigo-600" size={20} />
              <h3 className="font-bold text-slate-800">Visual Pattern Mastery</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
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