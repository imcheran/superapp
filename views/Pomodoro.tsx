
import React, { useState, useEffect } from 'react';
import { PomodoroSettings, PomodoroSession } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Coffee, Brain } from 'lucide-react';

interface PomodoroProps {
  settings?: PomodoroSettings;
  onSessionComplete: (session: PomodoroSession) => void;
}

const Pomodoro: React.FC<PomodoroProps> = ({ settings, onSessionComplete }) => {
  const [mode, setMode] = useState<'WORK' | 'BREAK' | 'LONG_BREAK'>('WORK');
  const [timeLeft, setTimeLeft] = useState((settings?.workDuration || 25) * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // Defaults
  const WORK_TIME = (settings?.workDuration || 25) * 60;
  const BREAK_TIME = (settings?.breakDuration || 5) * 60;
  const LONG_BREAK_TIME = (settings?.longBreakDuration || 15) * 60;

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    if (mode === 'WORK') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      onSessionComplete({
        id: crypto.randomUUID(),
        userId: 'current_user',
        startTime: new Date(Date.now() - WORK_TIME * 1000).toISOString(),
        endTime: new Date().toISOString(),
        plannedDuration: settings?.workDuration || 25,
        actualDuration: settings?.workDuration || 25,
        isCompleted: true,
        isBreak: false,
        distractions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (newCount % (settings?.sessionsBeforeLongBreak || 4) === 0) {
        setMode('LONG_BREAK');
        setTimeLeft(LONG_BREAK_TIME);
      } else {
        setMode('BREAK');
        setTimeLeft(BREAK_TIME);
      }
    } else {
      setMode('WORK');
      setTimeLeft(WORK_TIME);
    }
    
    // Play sound if enabled (omitted for strict no-external-assets)
    alert(mode === 'WORK' ? "Focus session complete! Take a break." : "Break over! Back to work.");
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'WORK') setTimeLeft(WORK_TIME);
    else if (mode === 'BREAK') setTimeLeft(BREAK_TIME);
    else setTimeLeft(LONG_BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = mode === 'WORK' ? WORK_TIME : mode === 'BREAK' ? BREAK_TIME : LONG_BREAK_TIME;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="max-w-xl mx-auto py-10 animate-fade-in text-center font-sans">
       <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-800 mb-2">Focus Timer</h2>
          <p className="text-slate-500">Stay productive with the Pomodoro technique.</p>
       </div>

       {/* Timer Card */}
       <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-2 bg-indigo-500 transition-all duration-1000" style={{ width: `${getProgress()}%` }}></div>
          
          <div className="flex justify-center gap-2 mb-8 bg-slate-100 p-1 rounded-full w-max mx-auto">
             <button 
                onClick={() => { setMode('WORK'); setTimeLeft(WORK_TIME); setIsActive(false); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'WORK' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
             >
                Focus
             </button>
             <button 
                onClick={() => { setMode('BREAK'); setTimeLeft(BREAK_TIME); setIsActive(false); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'BREAK' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
             >
                Short Break
             </button>
             <button 
                onClick={() => { setMode('LONG_BREAK'); setTimeLeft(LONG_BREAK_TIME); setIsActive(false); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'LONG_BREAK' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
             >
                Long Break
             </button>
          </div>

          <div className="text-8xl md:text-9xl font-black text-slate-800 mb-10 tabular-nums tracking-tight">
             {formatTime(timeLeft)}
          </div>

          <div className="flex justify-center gap-6">
             <button 
                onClick={toggleTimer}
                className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center transition-transform active:scale-95"
             >
                {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
             </button>
             <button 
                onClick={resetTimer}
                className="w-20 h-20 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors"
             >
                <RotateCcw size={28} />
             </button>
          </div>
       </div>

       {/* Stats */}
       <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Brain size={24} />
             </div>
             <div className="text-left">
                <p className="text-xs font-bold text-slate-400 uppercase">Sessions</p>
                <p className="text-2xl font-black text-slate-800">{sessionCount}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Coffee size={24} />
             </div>
             <div className="text-left">
                <p className="text-xs font-bold text-slate-400 uppercase">Focus Time</p>
                <p className="text-2xl font-black text-slate-800">{Math.round(sessionCount * (settings?.workDuration || 25))}m</p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Pomodoro;
