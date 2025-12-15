
import React, { useState } from 'react';
import { DailyLogData, UserSettings, DailyEntry } from '../types';
import { Save, BookOpen, Moon, Activity, Zap, Brain, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface JournalProps {
  logs: DailyLogData;
  onUpdate: (logs: DailyLogData) => void;
  settings: UserSettings;
}

const Journal: React.FC<JournalProps> = ({ logs, onUpdate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getFormattedDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const currentDateStr = getFormattedDate(selectedDate);

  // Default empty entry
  const defaultEntry: DailyEntry = {
    date: currentDateStr,
    wakeTime: '07:00', sleepTime: '23:00', sleepHours: 8,
    steps: 0, exerciseMinutes: 0, exerciseType: '', waterLiters: 0, mealsQuality: 3, caffeineServings: 0, screenTime: 0,
    mood: 'Neutral', moodIntensity: 5, stressLevel: 5, energyLevel: 5, socialScore: 3,
    deepWorkBlocks: 0, shallowWorkHours: 0, tasksPlanned: '', tasksCompleted: '', focusScore: 5, distractions: '',
    learningMinutes: 0, learningNotes: '', skillImproved: '',
    highlight: '', challenge: '', wins: '', improvements: '', gratitude: '', summary: '', nutritionLog: '',
    tomorrowPriorities: '', firstAction: '', obstacles: '',
    healthScore: 0, productivityScore: 0, mindScore: 0, dayScore: 0
  };

  const [entry, setEntry] = useState<DailyEntry>(logs[currentDateStr] || defaultEntry);

  // Update entry state when date changes
  React.useEffect(() => {
    setEntry(logs[currentDateStr] || { ...defaultEntry, date: currentDateStr });
  }, [currentDateStr, logs]);

  const handleChange = (field: keyof DailyEntry, value: any) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  // --- Sleep Tracker Synchronization Logic ---

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 1440; // +24 hours
    return parseFloat((diff / 60).toFixed(2));
  };

  const calculateWakeTime = (start: string, hours: number) => {
    if (!start) return '07:00';
    const [sH, sM] = start.split(':').map(Number);
    const totalMins = (sH * 60 + sM) + (hours * 60);
    const nH = Math.floor(totalMins / 60) % 24;
    const nM = Math.round(totalMins % 60);
    return `${String(nH).padStart(2, '0')}:${String(nM).padStart(2, '0')}`;
  };

  const handleSleepTimeChange = (val: string) => {
      const duration = calculateDuration(val, entry.wakeTime);
      setEntry(prev => ({ ...prev, sleepTime: val, sleepHours: duration }));
  };

  const handleWakeTimeChange = (val: string) => {
      const duration = calculateDuration(entry.sleepTime, val);
      setEntry(prev => ({ ...prev, wakeTime: val, sleepHours: duration }));
  };

  const handleDurationChange = (val: number) => {
      const wake = calculateWakeTime(entry.sleepTime, val);
      setEntry(prev => ({ ...prev, sleepHours: val, wakeTime: wake }));
  };

  // ---------------------------------------------

  const handleSave = () => {
    onUpdate({ ...logs, [currentDateStr]: entry });
    alert('Journal entry saved.');
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.value) {
          setSelectedDate(new Date(e.target.value));
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
        
        {/* Header Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Daily Journal</h2>
                    <p className="text-xs text-slate-500">Track biometrics, focus, and reflections.</p>
                </div>
            </div>

            {/* Central Date Picker */}
            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all">
                    <ChevronLeft size={18} />
                </button>
                
                <div className="relative group">
                    <div className="flex items-center gap-2 px-4 py-2 cursor-pointer font-bold text-slate-700 min-w-[180px] justify-center">
                        <Calendar size={16} className="text-indigo-500" />
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {/* Hidden Date Input triggered on click */}
                    <input 
                        type="date" 
                        value={currentDateStr}
                        onChange={handleDateInput}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onClick={(e) => (e.target as HTMLInputElement).showPicker()} 
                    />
                </div>

                <button onClick={() => changeDate(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all">
                    <ChevronRight size={18} />
                </button>
            </div>

            <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 transition-all shadow-lg shadow-slate-900/20 w-full md:w-auto justify-center">
                <Save size={18} /> Save Entry
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Sleep & Vitals */}
            <div className="space-y-6">
                {/* Sleep Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold">
                            <Moon size={20} className="text-indigo-500" /> Sleep Schedule
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded">Duration: {entry.sleepHours}h</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bedtime</label>
                            <input 
                                type="time" 
                                value={entry.sleepTime} 
                                onChange={e => handleSleepTimeChange(e.target.value)} 
                                className="bg-transparent font-bold text-slate-800 outline-none w-full" 
                            />
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Wake Up</label>
                            <input 
                                type="time" 
                                value={entry.wakeTime} 
                                onChange={e => handleWakeTimeChange(e.target.value)} 
                                className="bg-transparent font-bold text-slate-800 outline-none w-full" 
                            />
                        </div>
                    </div>

                    <div>
                         <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Quality & Duration</label>
                         <input 
                            type="range" min="0" max="14" step="0.1" 
                            value={entry.sleepHours} 
                            onChange={e => handleDurationChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                         <div className="flex justify-between mt-1 text-xs font-bold text-indigo-600">
                             <span>0h</span>
                             <span>{entry.sleepHours}h</span>
                             <span>14h</span>
                         </div>
                    </div>
                </div>

                {/* Vitals & Nutrition */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-500 font-bold mb-6">
                        <Activity size={20} /> Vitals & Nutrition
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Steps</label>
                             <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2">
                                 <span className="text-orange-500 mr-2">🔥</span>
                                 <input type="number" value={entry.steps} onChange={e => handleChange('steps', parseInt(e.target.value))} className="bg-transparent font-bold text-slate-800 w-full outline-none" placeholder="0" />
                             </div>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Water (L)</label>
                             <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2">
                                 <span className="text-blue-500 mr-2">💧</span>
                                 <input type="number" step="0.1" value={entry.waterLiters} onChange={e => handleChange('waterLiters', parseFloat(e.target.value))} className="bg-transparent font-bold text-slate-800 w-full outline-none" placeholder="0" />
                             </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nutrition Log</label>
                        <textarea 
                            value={entry.nutritionLog} 
                            onChange={e => handleChange('nutritionLog', e.target.value)}
                            className="w-full p-3 bg-yellow-50/50 border border-yellow-100 rounded-xl text-sm text-slate-700 h-24 focus:outline-none focus:ring-2 focus:ring-yellow-200 resize-none"
                            placeholder="Breakfast: Oatmeal, Lunch: Salad..."
                        ></textarea>
                    </div>
                </div>
            </div>

            {/* Column 2: Productivity & Energy */}
            <div className="space-y-6">
                {/* Productivity Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold">
                            <Brain size={20} className="text-indigo-600" /> Productivity
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded">Score: {Math.round((entry.deepWorkBlocks * 1.5 + (entry.tasksCompleted.length > 5 ? 5 : 0)) * 10) / 10}</span>
                    </div>

                    <div className="bg-indigo-50/50 p-4 rounded-xl mb-6 text-center">
                        <label className="text-xs font-bold text-indigo-400 uppercase mb-1 block">Deep Work Blocks</label>
                        <div className="text-3xl font-black text-indigo-900 mb-2">{entry.deepWorkBlocks.toFixed(1)}h</div>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handleChange('deepWorkBlocks', Math.max(0, entry.deepWorkBlocks - 0.5))} className="w-8 h-8 rounded-full bg-white shadow text-indigo-600 font-bold hover:bg-indigo-50">-</button>
                             <span className="font-bold text-indigo-300 self-center">90 min sessions</span>
                            <button onClick={() => handleChange('deepWorkBlocks', entry.deepWorkBlocks + 0.5)} className="w-8 h-8 rounded-full bg-white shadow text-indigo-600 font-bold hover:bg-indigo-50">+</button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tasks Completed</label>
                        <textarea 
                            value={entry.tasksCompleted} 
                            onChange={e => handleChange('tasksCompleted', e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600 h-32 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                            placeholder="- Finished Q3 Report&#10;- Cleared Inbox&#10;- Team Meeting"
                        ></textarea>
                    </div>
                </div>

                {/* Energy Levels */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 text-amber-500 font-bold mb-6">
                        <Zap size={20} /> Energy Levels
                    </div>
                    
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Current Energy</span>
                        <span className="text-xl font-bold text-amber-500">{entry.energyLevel}/10</span>
                    </div>
                    <input 
                        type="range" min="1" max="10" step="1" 
                        value={entry.energyLevel} 
                        onChange={e => handleChange('energyLevel', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default Journal;
