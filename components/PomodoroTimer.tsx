
import React, { useState, useEffect } from 'react';
import { PomodoroSettings, PomodoroSession } from '../types';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

interface PomodoroTimerProps {
  settings: PomodoroSettings;
  onSessionComplete: (session: PomodoroSession) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ settings, onSessionComplete }) => {
  const [mode, setMode] = useState<'WORK' | 'BREAK' | 'LONG_BREAK'>('WORK');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // Constants derived from settings
  const WORK_TIME = settings.workDuration * 60;
  const BREAK_TIME = settings.breakDuration * 60;
  const LONG_BREAK_TIME = settings.longBreakDuration * 60;

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
      
      // Create session record
      const session: PomodoroSession = {
        id: crypto.randomUUID(),
        userId: 'current', // Updated by parent
        startTime: new Date(Date.now() - WORK_TIME * 1000).toISOString(),
        endTime: new Date().toISOString(),
        plannedDuration: settings.workDuration,
        actualDuration: settings.workDuration,
        isCompleted: true,
        isBreak: false,
        distractions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      onSessionComplete(session);
      
      if (newCount % settings.sessionsBeforeLongBreak === 0) {
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
    
    // Play sound logic would go here
    if (settings.soundEnabled) {
       // new Audio('/ding.mp3').play().catch(e => console.log('Audio blocked'));
       alert(mode === 'WORK' ? "Work session finished!" : "Break finished!");
    }
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

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8 md:p-12 text-center">
        <div className="flex justify-center gap-2 mb-8 bg-slate-100 p-1 rounded-full w-max mx-auto">
             <button onClick={() => { setMode('WORK'); setTimeLeft(WORK_TIME); setIsActive(false); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'WORK' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Focus</button>
             <button onClick={() => { setMode('BREAK'); setTimeLeft(BREAK_TIME); setIsActive(false); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'BREAK' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Break</button>
             <button onClick={() => { setMode('LONG_BREAK'); setTimeLeft(LONG_BREAK_TIME); setIsActive(false); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'LONG_BREAK' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Long Break</button>
        </div>

        <div className="text-8xl md:text-9xl font-black text-slate-800 mb-10 tabular-nums tracking-tight">
             {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center gap-6">
             <button onClick={toggleTimer} className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95">
                {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
             </button>
             <button onClick={resetTimer} className="w-20 h-20 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
                <RotateCcw size={28} />
             </button>
        </div>
        
        <div className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-wider">
            Session #{sessionCount + 1}
        </div>
    </div>
  );
};

export default PomodoroTimer;
