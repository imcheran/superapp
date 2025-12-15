
import React, { useState } from 'react';
import { Habit, TrackingData } from '../types';
import { Trophy, ChevronDown, Calendar, BarChart3, Edit2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

interface AnalyticsProps {
  habits: Habit[];
  data: TrackingData;
}

const Analytics: React.FC<AnalyticsProps> = ({ habits, data }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'Calendar' | 'Statistics'>('Statistics');
  const [currentDate, setCurrentDate] = useState(new Date());

  const selectedHabit = habits.find(h => h.id === selectedHabitId) || habits[0];
  
  if (!selectedHabit) return <div className="p-8 text-center text-slate-400">No habits found.</div>;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // --- Statistics Logic ---
  const calculateStats = () => {
    let completedCount = 0;
    const dailyData = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isDone = data[dateStr]?.includes(selectedHabit.id);
        if (isDone) completedCount++;
        
        dailyData.push({
            day: i,
            value: isDone ? 1 : 0,
            fill: isDone ? selectedHabit.color : '#e2e8f0'
        });
    }

    const score = Math.round((completedCount / daysInMonth) * 100);
    return { score, dailyData, completedCount };
  };

  const { score, dailyData, completedCount } = calculateStats();

  // --- Circular Progress Component ---
  const CircularProgress = ({ score, color }: { score: number, color: string }) => {
      const radius = 80;
      const stroke = 12;
      const normalizedRadius = radius - stroke * 2;
      const circumference = normalizedRadius * 2 * Math.PI;
      const strokeDashoffset = circumference - (score / 100) * circumference;

      return (
          <div className="relative flex items-center justify-center w-64 h-64 mx-auto">
              <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] transition-all duration-500">
                  <circle
                      stroke="#f1f5f9"
                      strokeWidth={stroke}
                      fill="transparent"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                  />
                  <circle
                      stroke={color}
                      strokeWidth={stroke}
                      strokeDasharray={circumference + ' ' + circumference}
                      style={{ strokeDashoffset }}
                      strokeLinecap="round"
                      fill="transparent"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                      className="transition-all duration-1000 ease-out"
                  />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-slate-800">{score}</span>
              </div>
          </div>
      );
  };

  // --- Calendar Render ---
  const renderCalendar = () => {
      const firstDay = new Date(year, month, 1).getDay();
      const padding = Array(firstDay).fill(null);
      const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

      return (
          <div className="grid grid-cols-7 gap-2 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-xs font-bold text-slate-400 py-2">{d}</div>
              ))}
              {[...padding, ...days].map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isDone = data[dateStr]?.includes(selectedHabit.id);
                  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                  
                  return (
                      <div 
                          key={day} 
                          className={`
                              aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all
                              ${isDone 
                                  ? 'text-white shadow-sm' 
                                  : isToday ? 'bg-slate-100 border-2 border-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}
                          `}
                          style={{ backgroundColor: isDone ? selectedHabit.color : undefined }}
                      >
                          {day}
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in font-sans pb-10">
        
        {/* Navigation & Selector */}
        <div className="flex items-center gap-2 mb-4">
             <button onClick={() => {}} className="text-slate-400 hover:text-slate-800">
                 <ChevronDown className="rotate-90" size={24} />
             </button>
             <div className="relative flex-1 group">
                 <select 
                    value={selectedHabitId}
                    onChange={(e) => setSelectedHabitId(e.target.value)}
                    className="w-full text-xl font-bold text-slate-800 bg-transparent outline-none appearance-none cursor-pointer py-1 pr-8 truncate"
                 >
                     {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600" />
             </div>
             <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{backgroundColor: selectedHabit.color}}>
                 <Trophy size={14} />
             </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 mb-6">
            <button 
                onClick={() => setActiveTab('Calendar')}
                className={`flex-1 pb-3 text-sm font-bold transition-all ${activeTab === 'Calendar' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Calendar
            </button>
            <button 
                onClick={() => setActiveTab('Statistics')}
                className={`flex-1 pb-3 text-sm font-bold transition-all ${activeTab === 'Statistics' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Statistics
            </button>
            <button className="flex-1 pb-3 text-sm font-bold text-slate-300 cursor-not-allowed">
                Edit
            </button>
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 min-h-[500px] flex flex-col">
            
            {activeTab === 'Statistics' ? (
                <>
                    <div className="text-center mb-6">
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Habit score</span>
                    </div>

                    <CircularProgress score={score} color={selectedHabit.color} />

                    <div className="mt-8 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-center">
                                <h4 className="text-lg font-bold text-slate-800">{new Date().toLocaleString('default', { month: 'long' })}</h4>
                                <p className="text-xs text-slate-400">{year}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-slate-800">{completedCount}</span>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Days</p>
                            </div>
                        </div>

                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData} barGap={2}>
                                    <Tooltip cursor={{fill: 'transparent'}} content={() => null} />
                                    <Bar dataKey="value" radius={[2, 2, 2, 2]}>
                                        {dailyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} interval={3} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 text-lg">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{completedCount} Check-ins</div>
                     </div>
                     <div className="flex-1">
                        {renderCalendar()}
                     </div>
                     <div className="mt-6 p-4 bg-slate-50 rounded-xl text-center">
                         <p className="text-sm text-slate-500">Keep up the streak! Consistency is key.</p>
                     </div>
                </div>
            )}
        </div>

        {/* Total Pages / Yearly Stat (Visual Filler from Ref) */}
        {activeTab === 'Statistics' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex justify-between items-center">
                <button className="text-slate-400 hover:bg-slate-50 p-2 rounded-full"><ChevronDown className="rotate-90" /></button>
                <div className="text-center">
                    <h4 className="font-bold text-slate-800">{year}</h4>
                    <p className="text-sm text-slate-400">Total Completions</p>
                </div>
                <button className="text-slate-400 hover:bg-slate-50 p-2 rounded-full"><ChevronDown className="-rotate-90" /></button>
            </div>
        )}
    </div>
  );
};

export default Analytics;
