import React, { useState, useEffect, useMemo } from 'react';
import { Habit, RelapseRecord } from '../types';
import { Ban, RefreshCw, Wind, History, ChevronUp, Edit2, X, AlertTriangle, Clock, Zap, BarChart2, IndianRupee, Trophy, CheckCircle2 } from 'lucide-react';

interface QuitHabitsProps {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
}

const TRIGGER_OPTIONS = [
    "Stress/Anxiety", "Boredom", "Social Pressure", "Alcohol/Party", "After Meal", "Waking Up", "Anger/Frustration", "Sadness", "Cravings", "Other"
];

type HeatmapScope = 'Month' | 'Year';

// --- Heatmap Sub-Component for Quit Habits ---
const QuitHeatmap: React.FC<{ habit: Habit, currentDate: Date, scope: HeatmapScope }> = ({ habit, currentDate, scope }) => {
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

  // The journey starts at the original quit date, or the earliest recorded relapse
  const journeyStart = useMemo(() => {
      const datesInHistory = (habit.quitHistory || []).map(r => new Date(r.date).getTime());
      const currentQuit = habit.quitDate ? new Date(habit.quitDate).getTime() : Date.now();
      const original = habit.originalQuitDate ? new Date(habit.originalQuitDate).getTime() : currentQuit;
      const min = Math.min(original, ...datesInHistory);
      const res = new Date(min);
      res.setHours(0,0,0,0);
      return res;
  }, [habit]);

  const stats = useMemo(() => {
    let successCount = 0;
    let relapseCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    dates.forEach(date => {
        if (date > today || date < journeyStart) return;
        const dateStr = toLocalISO(date);
        const isRelapse = habit.quitHistory?.some(r => r.date.startsWith(dateStr));
        if (isRelapse) relapseCount++;
        else successCount++;
    });
    return { successCount, relapseCount };
  }, [dates, habit.quitHistory, journeyStart]);

  // Render Classes & Dimensions
  let gridClass = '';
  let cellClass = '';
  
  if (scope === 'Month') {
      gridClass = "grid grid-rows-7 grid-flow-col gap-1.5 w-max"; 
      cellClass = "w-5 h-5 rounded-sm shadow-sm";
  } else {
      gridClass = "grid grid-rows-7 grid-flow-col gap-1 w-full max-w-full overflow-hidden"; 
      cellClass = "w-full aspect-square rounded-[1px]"; 
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
        <div className={`overflow-x-auto hide-scrollbar flex-1 ${scope === 'Year' ? 'pb-2' : ''}`}>
            <div className={gridClass}>
                {allCells.map((cell, i) => {
                    if (!cell) return <div key={`pad-${i}`} className={`${cellClass} bg-transparent`} />;
                    
                    const date = cell as Date;
                    const dateStr = toLocalISO(date);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    
                    const isRelapse = habit.quitHistory?.some(r => r.date.startsWith(dateStr));
                    const isFuture = date > today;
                    const beforeStart = date < journeyStart;
                    const isSuccess = !beforeStart && !isRelapse && !isFuture;
                    
                    let bgColor = 'bg-slate-300'; // Darker base for empty/future
                    if (isRelapse) bgColor = 'bg-rose-600'; // Strong Red
                    else if (isSuccess) bgColor = 'bg-emerald-600'; // Strong Green
                    else if (beforeStart) bgColor = 'bg-slate-100 opacity-20';

                    return (
                        <div 
                            key={dateStr}
                            title={`${date.toDateString()}${isRelapse ? ' - Relapse' : isSuccess ? ' - Success' : ''}`}
                            className={`${cellClass} transition-all duration-300 ${bgColor} ${isSuccess || isRelapse ? 'scale-100 shadow-md' : 'scale-90 opacity-40'}`}
                        />
                    );
                })}
            </div>
        </div>

        {/* Counts Sidebar */}
        <div className="flex flex-col justify-center gap-2 min-w-[130px] border-l border-slate-100 pl-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Success</span>
                </div>
                <span className="text-sm font-black text-emerald-600">{stats.successCount}</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Relapses</span>
                </div>
                <span className="text-sm font-black text-rose-600">{stats.relapseCount}</span>
            </div>
        </div>
    </div>
  );
};

// --- SOS Modal Component ---
const SOSModal = ({ onClose }: { onClose: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(60);
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        const cycle = setInterval(() => {
            setPhase(p => {
                if (p === 'Inhale') return 'Hold';
                if (p === 'Hold') return 'Exhale';
                return 'Inhale';
            });
        }, 4000); 

        return () => {
            clearInterval(timer);
            clearInterval(cycle);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm text-center text-white space-y-8">
                <div>
                    <h2 className="text-3xl font-black mb-2">SOS Mode</h2>
                    <p className="text-indigo-200">Ride the wave. It will pass.</p>
                </div>
                
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    <div className={`absolute inset-0 bg-indigo-500 rounded-full opacity-30 animate-ping ${phase === 'Inhale' ? 'duration-[4000ms]' : 'duration-0'}`}></div>
                    <div className={`w-32 h-32 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border-4 transition-all duration-1000 ${phase === 'Inhale' ? 'scale-110 border-emerald-400' : phase === 'Hold' ? 'scale-100 border-amber-400' : 'scale-90 border-indigo-400'}`}>
                        <span className="text-2xl font-bold">{phase}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-4xl font-mono font-bold">{timeLeft}s</div>
                    <p className="text-sm text-indigo-300">Wait for the timer before you decide.</p>
                    {timeLeft === 0 ? (
                        <button onClick={onClose} className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                            I Defeated It!
                        </button>
                    ) : (
                        <button onClick={onClose} className="text-sm text-white/50 hover:text-white underline">
                            Close (I'm okay)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuitHabits: React.FC<QuitHabitsProps> = ({ habits, onUpdateHabits }) => {
  const quitHabits = habits.filter(h => h.type === 'QUIT');
  
  const [activeTab, setActiveTab] = useState<'Tracker' | 'Analytics'>('Tracker');
  const [heatmapScope, setHeatmapScope] = useState<HeatmapScope>('Year');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [relapseModal, setRelapseModal] = useState<{isOpen: boolean, habitId: string | null}>({ isOpen: false, habitId: null });
  const [relapseDate, setRelapseDate] = useState<string>('');
  const [selectedTrigger, setSelectedTrigger] = useState<string>(TRIGGER_OPTIONS[0]);
  const [, setTick] = useState(0); 

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const openRelapseModal = (id: string) => {
      const now = new Date();
      const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setRelapseDate(localIso);
      setRelapseModal({ isOpen: true, habitId: id });
  };

  const confirmRelapse = () => {
      if (!relapseModal.habitId || !relapseDate) return;
      const habit = habits.find(h => h.id === relapseModal.habitId);
      if (!habit) return;

      const newQuitDate = new Date(relapseDate);
      const previousQuitDate = habit.quitDate ? new Date(habit.quitDate) : newQuitDate;
      const durationSeconds = Math.floor((newQuitDate.getTime() - previousQuitDate.getTime()) / 1000);
      
      const newRecord: RelapseRecord = {
          date: newQuitDate.toISOString(),
          durationSeconds: Math.max(0, durationSeconds),
          trigger: selectedTrigger 
      };

      const updatedHistory = [newRecord, ...(habit.quitHistory || [])];
      // Keep track of the original start date to prevent vanishing history
      const originalStart = habit.originalQuitDate || habit.quitDate;

      const updatedHabits = habits.map(h => 
        h.id === relapseModal.habitId ? { ...h, quitDate: newQuitDate.toISOString(), originalQuitDate: originalStart, quitHistory: updatedHistory } : h
      );
      
      onUpdateHabits(updatedHabits);
      setRelapseModal({ isOpen: false, habitId: null });
  };

  const getDuration = (isoDate?: string) => {
    if (!isoDate) return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = Math.max(0, new Date().getTime() - new Date(isoDate).getTime());
    return {
        totalSeconds: Math.floor(diff / 1000),
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  };

  const formatDurationString = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      const min = Math.floor(seconds / 60);
      if (min < 60) return `${min}m`;
      const hours = Math.floor(min / 60);
      if (hours < 24) return `${hours}h ${min % 60}m`;
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-4xl mx-auto relative">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Ban className="text-rose-500" /> Quit Bad Habits
                </h2>
                <p className="text-slate-500 text-sm mt-1">Consistency patterns and abstinence tracking.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto shadow-sm">
                <button 
                    onClick={() => setActiveTab('Tracker')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Tracker' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                    Journey
                </button>
                <button 
                    onClick={() => setActiveTab('Analytics')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Analytics' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                    Analytics
                </button>
            </div>
        </div>

        {quitHabits.length === 0 && (
            <div className="bg-slate-100 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No 'Quit' habits configured.</p>
            </div>
        )}

        {activeTab === 'Tracker' && (
            <div className="space-y-6">
                
                <button 
                    onClick={() => setSosOpen(true)}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95 group"
                >
                    <Wind className="animate-pulse" size={24} />
                    <div className="text-left">
                        <p className="font-black text-lg uppercase leading-none">Panic Button (SOS)</p>
                        <p className="text-orange-100 text-xs font-medium">Cravings pass in about 15 minutes. Wait it out.</p>
                    </div>
                </button>

                <div className="flex justify-end mb-2">
                    <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
                        {(['Month', 'Year'] as HeatmapScope[]).map(scope => (
                            <button
                                key={scope}
                                onClick={() => setHeatmapScope(scope)}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${heatmapScope === scope ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {scope}
                            </button>
                        ))}
                    </div>
                </div>

                {quitHabits.map(habit => {
                    const duration = getDuration(habit.quitDate);
                    const isExpanded = expandedId === habit.id;
                    const moneySaved = habit.quitCostPerDay ? (duration.totalSeconds / 86400) * habit.quitCostPerDay : 0;
                    
                    return (
                        <div key={habit.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-5 flex flex-col md:flex-row gap-6 border-b border-slate-50">
                                <div className="flex items-center gap-4 md:flex-col md:items-start md:w-32 md:border-r md:border-slate-100 md:pr-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md" style={{backgroundColor: habit.color || '#64748b'}}>
                                        <Ban size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight truncate">{habit.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Clean Streak</p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-800 tabular-nums">{duration.days}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase mr-3">Days</span>
                                        <span className="text-2xl font-bold text-slate-600 tabular-nums">{duration.hours}</span>
                                        <span className="text-xs font-bold text-slate-400 lowercase mr-2">h</span>
                                        <span className="text-2xl font-bold text-slate-600 tabular-nums">{duration.minutes}</span>
                                        <span className="text-xs font-bold text-slate-400 lowercase">m</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {habit.quitCostPerDay ? (
                                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"><IndianRupee size={10} /> Saved</p>
                                                <p className="text-lg font-bold text-emerald-800">₹{moneySaved.toFixed(0)}</p>
                                            </div>
                                        ) : null}
                                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1"><Trophy size={10} /> Best</p>
                                            <p className="text-lg font-bold text-amber-800">{formatDurationString(habit.quitHistory?.reduce((max, r) => Math.max(max, r.durationSeconds), 0) || 0)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col items-center justify-end gap-2 md:pl-4 md:border-l border-slate-50">
                                    <button 
                                        onClick={() => openRelapseModal(habit.id)}
                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 border border-transparent transition-all flex items-center justify-center group"
                                        title="Log Relapse"
                                    >
                                        <RefreshCw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
                                    </button>
                                    <button 
                                        onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                                        className={`w-10 h-10 rounded-xl border border-transparent transition-all flex items-center justify-center ${isExpanded ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        title="History"
                                    >
                                        {isExpanded ? <ChevronUp size={18} /> : <History size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50/50">
                                <QuitHeatmap habit={habit} currentDate={new Date()} scope={heatmapScope} />
                            </div>

                             {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4 animate-fade-in">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <History size={12} /> Log History
                                    </h4>
                                    {habit.quitHistory && habit.quitHistory.length > 0 ? (
                                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-black">
                                                    <tr>
                                                        <th className="px-4 py-2">Date</th>
                                                        <th className="px-4 py-2">Duration</th>
                                                        <th className="px-4 py-2">Trigger</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {habit.quitHistory.map((record, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-2 text-slate-600">{new Date(record.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-2 font-bold text-slate-700">{formatDurationString(record.durationSeconds)}</td>
                                                            <td className="px-4 py-2 text-slate-500 text-xs">
                                                                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{record.trigger || 'Unknown'}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 text-center py-4">No relapses recorded yet. Keep it up!</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        {/* Analytics Tab (Brief placeholders as per original) */}
        {activeTab === 'Analytics' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center space-y-4">
                <BarChart2 size={48} className="mx-auto text-indigo-500 opacity-20" />
                <h3 className="font-bold text-slate-800">Pattern Recognition</h3>
                <p className="text-sm text-slate-500">Track and identify common triggers for relapses to build better defense systems.</p>
            </div>
        )}

        {/* --- RELAPSE MODAL --- */}
        {relapseModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-4 bg-rose-500 flex items-center gap-3 text-white">
                        <AlertTriangle size={24} />
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Log Relapse</h3>
                            <p className="text-rose-100 text-xs">It's okay. Honesty is the first step back.</p>
                        </div>
                        <button onClick={() => setRelapseModal({ isOpen: false, habitId: null })} className="ml-auto text-white/70 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Trigger</label>
                            <select 
                                value={selectedTrigger}
                                onChange={(e) => setSelectedTrigger(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none appearance-none"
                            >
                                {TRIGGER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Relapse Time</label>
                            <input 
                                type="datetime-local" 
                                value={relapseDate}
                                onChange={(e) => setRelapseDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none"
                            />
                        </div>

                        <button 
                            onClick={confirmRelapse}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> Restart Journey
                        </button>
                    </div>
                </div>
            </div>
        )}

        {sosOpen && <SOSModal onClose={() => setSosOpen(false)} />}
    </div>
  );
};

export default QuitHabits;