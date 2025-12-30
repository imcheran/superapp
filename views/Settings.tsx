
import React, { useState } from 'react';
import { Habit, UserSettings } from '../types';
import { HABIT_COLORS } from '../constants';
import { Trash2, Plus, X, ChevronDown, ChevronUp, Edit2, Minus, Ban, CheckSquare, RefreshCw, IndianRupee } from 'lucide-react';

interface SettingsProps {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ habits, onUpdateHabits, settings, onUpdateSettings, onReset }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // New Habit Form State
  const defaultHabit: Habit = {
      id: '', name: '', description: '', category: 'Health',
      goalFrequency: 7, targetConsistency: 100, color: HABIT_COLORS[0],
      streakGoal: 0, trackingType: 'BOOLEAN', dailyTarget: 1, unit: 'Day',
      type: 'BUILD', quitDate: new Date().toISOString(), quitCostPerDay: 0
  };
  const [formData, setFormData] = useState<Habit>(defaultHabit);
  const [showAdvanced, setShowAdvanced] = useState(true);

  // --- Habit CRUD ---

  const openModal = (habit?: Habit) => {
      if (habit) {
          setEditingHabit(habit);
          setFormData({ ...habit, type: habit.type || 'BUILD' }); // Ensure type exists
      } else {
          setEditingHabit(null);
          setFormData({ ...defaultHabit, id: crypto.randomUUID() });
      }
      setModalOpen(true);
      setShowAdvanced(true);
  };

  const saveHabit = () => {
      if (!formData.name.trim()) return;
      
      const payload = { ...formData };
      // If switching to build, ensure consistency props are sane
      if (payload.type === 'BUILD') {
          payload.quitDate = undefined;
          payload.quitCostPerDay = undefined;
      } else {
          // If quit, ensure quitDate exists
          if (!payload.quitDate) payload.quitDate = new Date().toISOString();
      }

      if (editingHabit) {
          onUpdateHabits(habits.map(h => h.id === editingHabit.id ? payload : h));
      } else {
          onUpdateHabits([...habits, payload]);
      }
      setModalOpen(false);
  };

  const deleteHabit = (id: string) => {
      if (confirm('Delete this habit? Tracking data will remain but visuals will update.')) {
          onUpdateHabits(habits.filter(h => h.id !== id));
      }
  };

  const adjustDailyTarget = (delta: number) => {
      const current = formData.dailyTarget || 1;
      const newVal = Math.max(1, current + delta);
      setFormData({...formData, dailyTarget: newVal});
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in font-sans pb-20 relative">
        
        {/* HABIT LIST */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Active Habits</h3>
                <button 
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2"
                >
                    <Plus size={16} /> Add Habit
                </button>
            </div>
            <div className="divide-y divide-slate-100">
                {habits.map((habit) => (
                    <div key={habit.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm relative" style={{backgroundColor: habit.color}}>
                                {habit.type === 'QUIT' && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5"><Ban size={12} className="text-rose-500" /></div>}
                                {habit.name.substring(0,1)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    {habit.name}
                                    {habit.type === 'QUIT' && <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold uppercase">Quit</span>}
                                </h4>
                                <p className="text-xs text-slate-400">
                                    {habit.type === 'QUIT' 
                                        ? 'Abstinence Tracker' 
                                        : habit.trackingType === 'COUNT' ? `Target: ${habit.dailyTarget} ${habit.unit || 'units'}` : 'Daily Completion'
                                    } 
                                    • {habit.category}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(habit)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteHabit(habit.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {habits.length === 0 && <p className="p-8 text-center text-slate-400 italic">No habits configured yet.</p>}
            </div>
        </div>

        {/* --- ADD/EDIT HABIT MODAL --- */}
        {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                <div className="bg-[#121212] w-full max-w-md rounded-t-2xl sm:rounded-3xl border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar text-slate-200 ring-1 ring-white/10">
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#121212]/95 backdrop-blur z-10">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold text-white">{editingHabit ? 'Edit Habit' : 'New Habit'}</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        
                        {/* Habit Type Selector */}
                        <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-xl">
                            <button 
                                onClick={() => setFormData({...formData, type: 'BUILD'})}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${formData.type !== 'QUIT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                <CheckSquare size={16} /> Build Routine
                            </button>
                            <button 
                                onClick={() => setFormData({...formData, type: 'QUIT'})}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${formData.type === 'QUIT' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Ban size={16} /> Quit Addiction
                            </button>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder={formData.type === 'QUIT' ? "Addiction to Quit (e.g., Smoking)" : "Habit Name"}
                                className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-xl border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-lg font-medium placeholder:text-slate-600"
                                autoFocus
                            />
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Add a description or motivation..."
                                    className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-xl border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm min-h-[80px] resize-none placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {/* Color Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Color</label>
                            <div className="grid grid-cols-5 gap-3">
                                {HABIT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setFormData({...formData, color: c})}
                                        className={`w-full aspect-square rounded-xl transition-all ${formData.color === c ? 'ring-2 ring-white scale-110 opacity-100' : 'hover:scale-105 opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {formData.color === c && (
                                            <div className="w-2 h-2 bg-black/40 rounded-full mx-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Toggle */}
                        <div className="pt-2 border-t border-white/5">
                            <button 
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors w-full justify-center py-2"
                            >
                                Advanced Options {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {/* Advanced Fields */}
                        {showAdvanced && (
                            <div className="space-y-6 animate-fade-in">
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categories</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                            className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-xl border border-white/10 focus:border-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="Health">Health</option>
                                            <option value="Productivity">Productivity</option>
                                            <option value="Mindfulness">Mindfulness</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Learning">Learning</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Conditional Fields based on Type */}
                                {formData.type !== 'QUIT' ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Streak Goal</label>
                                                <div className="bg-[#1E1E1E] px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between group hover:border-white/20 transition-colors">
                                                    <span className="text-sm text-slate-300">{formData.streakGoal ? `${formData.streakGoal} Days` : 'None'}</span>
                                                    <input 
                                                        type="number" 
                                                        value={formData.streakGoal}
                                                        onChange={e => setFormData({...formData, streakGoal: parseInt(e.target.value)})}
                                                        className="w-8 bg-transparent text-right outline-none text-sm text-slate-400 focus:text-white"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reminder</label>
                                                <div className="bg-[#1E1E1E] px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between cursor-not-allowed opacity-50">
                                                    <span className="text-sm text-slate-300">0 Active</span>
                                                    <ChevronDown size={16} className="text-slate-500" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tracking Method</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => setFormData({...formData, trackingType: 'BOOLEAN'})}
                                                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${formData.trackingType === 'BOOLEAN' ? 'bg-slate-700 border-slate-500 text-white shadow-sm' : 'bg-[#1E1E1E] border-white/10 text-slate-400 hover:bg-[#252525]'}`}
                                                >
                                                    Step By Step
                                                </button>
                                                <button 
                                                    onClick={() => setFormData({...formData, trackingType: 'COUNT'})}
                                                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${formData.trackingType === 'COUNT' ? 'bg-slate-700 border-slate-500 text-white shadow-sm' : 'bg-[#1E1E1E] border-white/10 text-slate-400 hover:bg-[#252525]'}`}
                                                >
                                                    Custom Value
                                                </button>
                                            </div>
                                            
                                            {/* Custom Value Target Fields */}
                                            {formData.trackingType === 'COUNT' && (
                                                <div className="space-y-2 animate-fade-in">
                                                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Completions Per Day</label>
                                                     <div className="flex gap-2">
                                                        <div className="flex-1 bg-[#1E1E1E] rounded-xl border border-white/10 flex items-center px-2">
                                                            <input 
                                                                type="number"
                                                                value={formData.dailyTarget}
                                                                onChange={e => setFormData({...formData, dailyTarget: parseFloat(e.target.value)})}
                                                                className="bg-transparent text-white px-2 py-3 outline-none w-full text-center font-bold"
                                                                min="1"
                                                            />
                                                            <span className="text-slate-500 text-sm font-medium pr-2 whitespace-nowrap">/ {formData.unit || 'Day'}</span>
                                                        </div>
                                                        <button onClick={() => adjustDailyTarget(-1)} className="w-12 bg-[#1E1E1E] rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252525]">
                                                            <Minus size={20} />
                                                        </button>
                                                        <button onClick={() => adjustDailyTarget(1)} className="w-12 bg-[#1E1E1E] rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252525]">
                                                            <Plus size={20} />
                                                        </button>
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                            <RefreshCw className="text-rose-500 mt-1" size={20} />
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Reset Date</h4>
                                                <p className="text-xs text-slate-400 mb-2">When did you last relapse or start quitting?</p>
                                                <input 
                                                    type="datetime-local" 
                                                    value={formData.quitDate ? formData.quitDate.substring(0, 16) : new Date().toISOString().substring(0, 16)}
                                                    onChange={e => setFormData({...formData, quitDate: new Date(e.target.value).toISOString()})}
                                                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                                            <IndianRupee className="text-emerald-500 mt-1" size={20} />
                                            <div className="w-full">
                                                <h4 className="text-sm font-bold text-white">Financial Impact</h4>
                                                <p className="text-xs text-slate-400 mb-2">Daily cost of this habit (e.g., cigarette pack cost).</p>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={formData.quitCostPerDay || 0}
                                                    onChange={e => setFormData({...formData, quitCostPerDay: parseFloat(e.target.value)})}
                                                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                        
                        {/* Save Button */}
                        <div className="pt-4">
                            <button 
                                onClick={saveHabit}
                                className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all active:scale-95 text-lg ${formData.type === 'QUIT' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20' : 'bg-[#8b5cf6] hover:bg-[#7c3aed] shadow-purple-900/20'}`}
                            >
                                {editingHabit ? 'Save Changes' : formData.type === 'QUIT' ? 'Start Quitting' : 'Create Habit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default Settings;
