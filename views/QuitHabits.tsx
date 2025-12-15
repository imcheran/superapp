
import React, { useState, useEffect } from 'react';
import { Habit, RelapseRecord } from '../types';
import { Ban, RefreshCw, Flame, Info, History, ChevronDown, ChevronUp, Edit2, Calendar, X, AlertTriangle, Clock, Zap, BarChart2, IndianRupee, Trophy, Wind, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface QuitHabitsProps {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
}

const TRIGGER_OPTIONS = [
    "Stress/Anxiety", "Boredom", "Social Pressure", "Alcohol/Party", "After Meal", "Waking Up", "Anger/Frustration", "Sadness", "Cravings", "Other"
];

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

        // Breathing Cycle (4-7-8 technique ish)
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
  
  // States
  const [activeTab, setActiveTab] = useState<'Tracker' | 'Analytics'>('Tracker');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [relapseModal, setRelapseModal] = useState<{isOpen: boolean, habitId: string | null}>({ isOpen: false, habitId: null });
  const [relapseDate, setRelapseDate] = useState<string>('');
  const [selectedTrigger, setSelectedTrigger] = useState<string>(TRIGGER_OPTIONS[0]);
  const [, setTick] = useState(0); // Force re-render for timers

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Logic ---

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
          trigger: selectedTrigger // Capture Trigger
      };

      const updatedHistory = [newRecord, ...(habit.quitHistory || [])];
      const updatedHabits = habits.map(h => 
        h.id === relapseModal.habitId ? { ...h, quitDate: newQuitDate.toISOString(), quitHistory: updatedHistory } : h
      );
      
      onUpdateHabits(updatedHabits);
      setRelapseModal({ isOpen: false, habitId: null });
  };

  const handleDateEdit = (id: string, newDateStr: string) => {
      const updatedHabits = habits.map(h => h.id === id ? { ...h, quitDate: new Date(newDateStr).toISOString() } : h);
      onUpdateHabits(updatedHabits);
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

  const getMilestones = (seconds: number) => {
      const milestones = [
          { name: '24 Hours', sec: 86400 },
          { name: '3 Days', sec: 259200 },
          { name: '1 Week', sec: 604800 },
          { name: '1 Month', sec: 2592000 }
      ];
      const next = milestones.find(m => m.sec > seconds);
      const prev = [...milestones].reverse().find(m => m.sec <= seconds);
      
      return { 
          current: prev ? prev.name : 'Starting', 
          next: next ? next.name : 'Mastery', 
          percent: next && prev ? ((seconds - prev.sec) / (next.sec - prev.sec)) * 100 : 
                   next ? (seconds / next.sec) * 100 : 100
      };
  };

  // --- Render ---

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-4xl mx-auto relative">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Ban className="text-rose-500" /> Quit Bad Habits
                </h2>
                <p className="text-slate-500 text-sm mt-1">Track abstinence, money saved, and triggers.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button 
                    onClick={() => setActiveTab('Tracker')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Tracker' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                    Tracker
                </button>
                <button 
                    onClick={() => setActiveTab('Analytics')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Analytics' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                    Trigger Analysis
                </button>
            </div>
        </div>

        {quitHabits.length === 0 && (
            <div className="bg-slate-100 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No 'Quit' habits configured.</p>
                <p className="text-sm text-slate-400 mt-2">Go to Settings and create a habit with type "Quit Addiction".</p>
            </div>
        )}

        {/* --- TRACKER TAB --- */}
        {activeTab === 'Tracker' && (
            <div className="space-y-6">
                
                {/* Panic Button */}
                <button 
                    onClick={() => setSosOpen(true)}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white p-4 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-3 transition-transform active:scale-95 group"
                >
                    <Wind className="animate-pulse" size={24} />
                    <div className="text-left">
                        <p className="font-black text-lg uppercase leading-none">Panic Button (SOS)</p>
                        <p className="text-orange-100 text-xs font-medium">Having a craving? Click here.</p>
                    </div>
                </button>

                {quitHabits.map(habit => {
                    const duration = getDuration(habit.quitDate);
                    const isExpanded = expandedId === habit.id;
                    const moneySaved = habit.quitCostPerDay ? (duration.totalSeconds / 86400) * habit.quitCostPerDay : 0;
                    const milestone = getMilestones(duration.totalSeconds);
                    const bestStreak = habit.quitHistory?.reduce((max, r) => Math.max(max, r.durationSeconds), 0) || 0;
                    
                    return (
                        <div key={habit.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                            {/* Main Card */}
                            <div className="p-5 flex flex-col md:flex-row gap-6">
                                {/* Left: Icon & Label */}
                                <div className="flex items-center gap-4 md:flex-col md:items-start md:w-32 md:border-r md:border-slate-100 md:pr-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md" style={{backgroundColor: habit.color || '#64748b'}}>
                                        <Ban size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{habit.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Started: {new Date(habit.quitDate || '').toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Middle: Timer & Stats */}
                                <div className="flex-1 space-y-4">
                                    {/* Timer */}
                                    <div className="flex flex-wrap items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-800 tabular-nums">{duration.days}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase mr-3">Days</span>
                                        <span className="text-2xl font-bold text-slate-600 tabular-nums">{duration.hours}</span>
                                        <span className="text-xs font-bold text-slate-400 lowercase mr-2">h</span>
                                        <span className="text-2xl font-bold text-slate-600 tabular-nums">{duration.minutes}</span>
                                        <span className="text-xs font-bold text-slate-400 lowercase mr-2">m</span>
                                        <span className="text-xl font-bold text-slate-400 tabular-nums">{duration.seconds}</span>
                                        <span className="text-xs font-bold text-slate-300 lowercase">s</span>
                                    </div>

                                    {/* Milestone Progress */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                            <span>{milestone.current}</span>
                                            <span>Target: {milestone.next}</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${milestone.percent}%`}}></div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {habit.quitCostPerDay ? (
                                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"><IndianRupee size={10} /> Money Saved</p>
                                                <p className="text-lg font-bold text-emerald-800">₹{moneySaved.toFixed(0)}</p>
                                            </div>
                                        ) : null}
                                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1"><Trophy size={10} /> Best Streak</p>
                                            <p className="text-lg font-bold text-amber-800">{formatDurationString(bestStreak)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex md:flex-col items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-4">
                                    <button 
                                        onClick={() => openRelapseModal(habit.id)}
                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 border border-transparent transition-all flex items-center justify-center group"
                                        title="Log Relapse"
                                    >
                                        <RefreshCw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
                                    </button>
                                    <button 
                                        onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                                        className={`w-10 h-10 rounded-xl border border-transparent transition-all flex items-center justify-center ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        title="History"
                                    >
                                        {isExpanded ? <ChevronUp size={18} /> : <History size={18} />}
                                    </button>
                                    <div className="relative">
                                         <input 
                                            type="datetime-local"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleDateEdit(habit.id, e.target.value)}
                                        />
                                        <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                             {/* Expandable History Table */}
                             {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-fade-in">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <History size={12} /> Recent History
                                    </h4>
                                    {habit.quitHistory && habit.quitHistory.length > 0 ? (
                                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2">Date</th>
                                                        <th className="px-4 py-2">Duration</th>
                                                        <th className="px-4 py-2">Trigger</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {habit.quitHistory.slice(0, 5).map((record, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-2 text-slate-600">{new Date(record.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-2 font-bold text-slate-700">{formatDurationString(record.durationSeconds)}</td>
                                                            <td className="px-4 py-2 text-slate-500 text-xs">
                                                                <span className="bg-slate-100 px-2 py-1 rounded-full">{record.trigger || 'Unknown'}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic text-center py-2">No history yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'Analytics' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quitHabits.map(habit => {
                        // Aggregate Triggers
                        const triggerCounts: Record<string, number> = {};
                        habit.quitHistory?.forEach(r => {
                            const t = r.trigger || "Unknown";
                            triggerCounts[t] = (triggerCounts[t] || 0) + 1;
                        });
                        const chartData = Object.entries(triggerCounts)
                            .map(([name, count]) => ({ name, count }))
                            .sort((a,b) => b.count - a.count);

                        return (
                            <div key={habit.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: habit.color}}></div>
                                    {habit.name} Triggers
                                </h3>
                                
                                {chartData.length > 0 ? (
                                    <div className="space-y-3">
                                        {chartData.map((item, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-bold text-slate-600">{item.name}</span>
                                                    <span className="text-slate-400">{item.count} times</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full" 
                                                        style={{
                                                            width: `${(item.count / chartData[0].count) * 100}%`,
                                                            backgroundColor: habit.color || '#6366f1'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        <BarChart2 size={24} className="mb-2 opacity-50" />
                                        <p className="text-sm">No relapse data available</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {quitHabits.length > 0 && (
                     <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex gap-4">
                        <Activity className="text-indigo-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-indigo-900">Why track triggers?</h4>
                            <p className="text-sm text-indigo-700 mt-1">
                                Understanding <i>why</i> you relapse is the first step to prevention. 
                                If "Stress" is your top trigger, consider using the SOS Panic Button's breathing exercise next time you feel overwhelmed.
                            </p>
                        </div>
                     </div>
                )}
            </div>
        )}

        {/* --- RELAPSE MODAL --- */}
        {relapseModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-4 bg-rose-500 flex items-center gap-3 text-white">
                        <AlertTriangle size={24} />
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Record Relapse</h3>
                            <p className="text-rose-100 text-xs">Resetting your progress</p>
                        </div>
                        <button 
                            onClick={() => setRelapseModal({ isOpen: false, habitId: null })}
                            className="ml-auto text-white/70 hover:text-white p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Zap size={12} /> Main Trigger
                            </label>
                            <select 
                                value={selectedTrigger}
                                onChange={(e) => setSelectedTrigger(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none appearance-none"
                            >
                                {TRIGGER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Clock size={12} /> Time of Relapse
                            </label>
                            <input 
                                type="datetime-local" 
                                value={relapseDate}
                                onChange={(e) => setRelapseDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={confirmRelapse}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <RefreshCw size={18} /> Record & Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- SOS OVERLAY --- */}
        {sosOpen && <SOSModal onClose={() => setSosOpen(false)} />}

    </div>
  );
};

export default QuitHabits;
