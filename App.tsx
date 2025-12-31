
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import MonthlyDashboard from './views/MonthlyDashboard';
import Tracker from './views/Tracker';
import AIAdvisor from './views/AIAdvisor';
import Analytics from './views/Analytics';
import Journal from './views/Journal';
import Settings from './views/Settings';
import Finance from './views/Finance';
import QuitHabits from './views/QuitHabits';
import Notes from './views/Notes';
// Import New Views
import Tasks from './views/Tasks';
import Pomodoro from './views/Pomodoro';

import AuthComponent from './components/AuthComponent';
import { auth } from './services/firebase'; 
import { ViewState, Habit, TrackingData, DailyLogData, UserSettings, FinanceData, User, Note, UserData, Task, TaskList, PomodoroSession, PomodoroSettings } from './types';
import { DEFAULT_HABITS } from './constants';
import { Menu, AlertTriangle, Cloud, CloudOff } from 'lucide-react';
import { useCloudStorage } from './hooks/useCloudStorage';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  declare props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl border border-red-100 max-w-lg w-full text-center">
            <div className="flex items-center justify-center gap-3 text-red-600 mb-4">
               <AlertTriangle size={32} />
               <h1 className="text-xl font-bold">Data Error Detected</h1>
            </div>
            <p className="text-slate-600 mb-6">
                Your local save data appears to be corrupted, causing the app to crash. 
                Please reset your local cache to fix this.
            </p>
            <div className="bg-slate-100 p-3 rounded text-left mb-6 overflow-hidden">
                <p className="text-xs text-slate-400 font-mono">Error Details:</p>
                <code className="text-xs text-red-800 font-mono block whitespace-pre-wrap break-all">
                 {this.state.error?.message || "Unknown Error"}
               </code>
            </div>
            <button 
              onClick={() => {
                  localStorage.clear();
                  window.location.reload();
              }} 
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg"
            >
              Reset App Data & Reload
            </button>
            <p className="text-xs text-slate-400 mt-4">This will clear local settings but fix the white screen.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Authenticated App Component ---
interface AuthenticatedAppProps {
    user: User;
    onLogout: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { saveToCloud, loadFromCloud } = useCloudStorage<UserData>();
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Storage Keys
  const KEYS = {
      HABITS: `user_${user.username}_habits`,
      DATA: `user_${user.username}_data`,
      LOGS: `user_${user.username}_daily_logs`,
      FINANCE: `user_${user.username}_finance`,
      SETTINGS: `user_${user.username}_settings`,
      NOTES: `user_${user.username}_notes`,
      TASKS: `user_${user.username}_tasks`,
      TASK_LISTS: `user_${user.username}_task_lists`,
      POMODORO_SESSIONS: `user_${user.username}_pomodoro_sessions`,
      POMODORO_SETTINGS: `user_${user.username}_pomodoro_settings`,
  };

  // --- Strict Data Initialization ---

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(KEYS.HABITS);
      const parsed = saved ? JSON.parse(saved) : DEFAULT_HABITS;
      return Array.isArray(parsed) ? parsed : DEFAULT_HABITS;
    } catch (e) {
      return DEFAULT_HABITS;
    }
  });

  const [trackingData, setTrackingData] = useState<TrackingData>(() => {
    try {
      const saved = localStorage.getItem(KEYS.DATA);
      const parsed = saved ? JSON.parse(saved) : {};
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) { return {}; }
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLogData>(() => {
    try {
      const saved = localStorage.getItem(KEYS.LOGS);
      const parsed = saved ? JSON.parse(saved) : {};
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) { return {}; }
  });

  const [financeData, setFinanceData] = useState<FinanceData>(() => {
      try {
        const saved = localStorage.getItem(KEYS.FINANCE);
        const parsed = (saved ? JSON.parse(saved) : {}) || {};
        return { 
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            bills: Array.isArray(parsed.bills) ? parsed.bills : [],
            debts: Array.isArray(parsed.debts) ? parsed.debts : [], 
            categories: Array.isArray(parsed.categories) ? parsed.categories : [
                { name: 'Food', emoji: '🍔', budgetLimit: 5000 },
                { name: 'Transport', emoji: '🚕', budgetLimit: 2000 },
                { name: 'Shopping', emoji: '🛍️', budgetLimit: 3000 },
                { name: 'Bills', emoji: '🧾', budgetLimit: 4000 }
            ],
            assets: Array.isArray(parsed.assets) ? parsed.assets : [
                { id: 'cash', name: 'Cash', type: 'CASH', balance: 0 },
                { id: 'bank', name: 'Bank', type: 'BANK', balance: 0 }
            ],
            monthlyBudget: typeof parsed.monthlyBudget === 'number' ? parsed.monthlyBudget : 10000,
            walletBalance: typeof parsed.walletBalance === 'number' ? parsed.walletBalance : 50000,
            budgetHistory: parsed.budgetHistory || {}
        };
      } catch (e) {
        return { 
            transactions: [], bills: [], debts: [], assets: [],
            categories: [], monthlyBudget: 10000, walletBalance: 50000,
            budgetHistory: {}
        };
      }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
      try {
          const saved = localStorage.getItem(KEYS.NOTES);
          const parsed = saved ? JSON.parse(saved) : [];
          return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
        const saved = localStorage.getItem(KEYS.TASKS);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  const [taskLists, setTaskLists] = useState<TaskList[]>(() => {
    try {
        const saved = localStorage.getItem(KEYS.TASK_LISTS);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>(() => {
    try {
        const saved = localStorage.getItem(KEYS.POMODORO_SESSIONS);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => {
    try {
        const saved = localStorage.getItem(KEYS.POMODORO_SETTINGS);
        return saved ? JSON.parse(saved) : { 
          workDuration: 25, 
          breakDuration: 5, 
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartNextSession: false,
          soundEnabled: true,
          soundVolume: 0.5,
          quietHoursEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00"
        };
    } catch (e) { return { workDuration: 25, breakDuration: 5, longBreakDuration: 15, sessionsBeforeLongBreak: 4, autoStartNextSession: false, soundEnabled: true, soundVolume: 0.5, quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "07:00" }; }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(KEYS.SETTINGS);
      const parsed = saved ? JSON.parse(saved) : null;
      
      const defaultSettings = { 
          deepWorkInterval: 90,
          mode: 'HERO' as const,
          chronotype: 'BEAR' as const,
          heroStats: { hp: 100, maxHp: 100, xp: 0, level: 1, nextLevelXp: 500 }
      };

      if (!parsed) return defaultSettings;
      return {
          ...defaultSettings,
          ...parsed,
          heroStats: { ...defaultSettings.heroStats, ...(parsed.heroStats || {}) }
      };
    } catch (e) {
      return { 
          deepWorkInterval: 90,
          mode: 'HERO' as const,
          chronotype: 'BEAR' as const,
          heroStats: { hp: 100, maxHp: 100, xp: 0, level: 1, nextLevelXp: 500 }
      };
    }
  });

  // --- Cloud Synchronization ---
  
  useEffect(() => {
    const fetchCloudData = async () => {
      setIsSyncing(true);
      const cloudData = await loadFromCloud();
      if (cloudData) {
        if (cloudData.habits) setHabits(cloudData.habits);
        if (cloudData.trackingData) setTrackingData(cloudData.trackingData);
        if (cloudData.dailyLogs) setDailyLogs(cloudData.dailyLogs);
        if (cloudData.financeData) setFinanceData(cloudData.financeData);
        if (cloudData.settings) setSettings(cloudData.settings);
        if (cloudData.notes) setNotes(cloudData.notes);
        if (cloudData.tasks) setTasks(cloudData.tasks);
        if (cloudData.taskLists) setTaskLists(cloudData.taskLists);
        if (cloudData.pomodoroSessions) setPomodoroSessions(cloudData.pomodoroSessions);
        if (cloudData.pomodoroSettings) setPomodoroSettings(cloudData.pomodoroSettings);
      }
      setIsCloudSynced(true); 
      setIsSyncing(false);
    };
    fetchCloudData();
  }, []);

  useEffect(() => {
    if (!isCloudSynced) return;

    const saveData = async () => {
        setIsSyncing(true);
        await saveToCloud({
            habits,
            trackingData,
            dailyLogs,
            financeData,
            settings,
            notes,
            tasks,
            taskLists,
            pomodoroSessions,
            pomodoroSettings
        });
        setIsSyncing(false);
    };

    const timer = setTimeout(saveData, 3000);
    return () => clearTimeout(timer);
  }, [habits, trackingData, dailyLogs, financeData, settings, notes, tasks, taskLists, pomodoroSessions, pomodoroSettings, isCloudSynced]);


  // Persistence Effects (Local Storage)
  useEffect(() => localStorage.setItem(KEYS.HABITS, JSON.stringify(habits)), [habits, KEYS.HABITS]);
  useEffect(() => localStorage.setItem(KEYS.DATA, JSON.stringify(trackingData)), [trackingData, KEYS.DATA]);
  useEffect(() => localStorage.setItem(KEYS.LOGS, JSON.stringify(dailyLogs)), [dailyLogs, KEYS.LOGS]);
  useEffect(() => localStorage.setItem(KEYS.FINANCE, JSON.stringify(financeData)), [financeData, KEYS.FINANCE]);
  useEffect(() => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)), [settings, KEYS.SETTINGS]);
  useEffect(() => localStorage.setItem(KEYS.NOTES, JSON.stringify(notes)), [notes, KEYS.NOTES]);
  useEffect(() => localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks)), [tasks, KEYS.TASKS]);
  useEffect(() => localStorage.setItem(KEYS.TASK_LISTS, JSON.stringify(taskLists)), [taskLists, KEYS.TASK_LISTS]);
  useEffect(() => localStorage.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(pomodoroSessions)), [pomodoroSessions, KEYS.POMODORO_SESSIONS]);
  useEffect(() => localStorage.setItem(KEYS.POMODORO_SETTINGS, JSON.stringify(pomodoroSettings)), [pomodoroSettings, KEYS.POMODORO_SETTINGS]);

  const toggleHabit = (habitId: string, date: string) => {
    const currentDayData = trackingData[date] || [];
    const isCompleted = currentDayData.includes(habitId);
    
    setTrackingData(prev => {
      const dayList = prev[date] || [];
      const newData = isCompleted ? dayList.filter(id => id !== habitId) : [...dayList, habitId];
      return { ...prev, [date]: newData };
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard habits={habits.filter(h => h.type !== 'QUIT')} data={trackingData} />;
      case ViewState.MONTHLY_DASHBOARD:
        return <MonthlyDashboard habits={habits.filter(h => h.type !== 'QUIT')} data={trackingData} />;
      case ViewState.TRACKER:
        return <Tracker habits={habits.filter(h => h.type !== 'QUIT')} data={trackingData} onToggle={toggleHabit} />;
      case ViewState.QUIT_HABITS:
        return <QuitHabits habits={habits} onUpdateHabits={setHabits} />;
      case ViewState.ANALYTICS:
        return <Analytics habits={habits.filter(h => h.type !== 'QUIT')} data={trackingData} />;
      case ViewState.FINANCE:
        return <Finance data={financeData} onUpdate={setFinanceData} />;
      case ViewState.JOURNAL:
        return (
            <div className="space-y-8">
                 <Journal logs={dailyLogs} onUpdate={setDailyLogs} settings={settings} />
                 <div className="border-t border-slate-200 pt-8">
                     <Notes notes={notes} onUpdate={setNotes} settings={settings} onUpdateSettings={setSettings} />
                 </div>
            </div>
        );
      case ViewState.SETTINGS:
        return <Settings habits={habits} onUpdateHabits={setHabits} settings={settings} onUpdateSettings={setSettings} onReset={() => {localStorage.clear(); window.location.reload();}} />;
      case ViewState.AI_COACH:
        return <AIAdvisor habits={habits} data={trackingData} dailyLogs={dailyLogs} />;
      
      // --- NEW VIEWS ---
      case ViewState.INBOX:
      case ViewState.TODAY:
      case ViewState.WEEK:
      case ViewState.UPCOMING:
      case ViewState.COMPLETED:
        return <Tasks tasks={tasks} onUpdateTasks={setTasks} />; // Reuse Tasks view for now with filters to be implemented inside
      
      case ViewState.CALENDAR:
        return <div className="text-center p-10 text-slate-400">Calendar View (Implementation Pending)</div>;

      case ViewState.POMODORO:
        return <Pomodoro settings={pomodoroSettings} onSessionComplete={(session) => setPomodoroSessions([...pomodoroSessions, session])} />;
        
      default:
        return <Dashboard habits={habits} data={trackingData} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-60px)] bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        username={user.username}
        onLogout={onLogout}
      />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        {/* Header */}
        <header className="px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center justify-between w-full md:w-auto">
                 <div className="flex items-center gap-3">
                     <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <Menu size={24} />
                     </button>
                     <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight truncate">
                        {currentView.toLowerCase().replace('_', ' ')}
                     </h2>
                     {isCloudSynced ? (
                         <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-400">
                            <Cloud size={14} className={isSyncing ? "text-indigo-500 animate-pulse" : "text-emerald-500"} />
                            <span className="text-[10px] font-bold uppercase hidden md:inline">{isSyncing ? 'Syncing...' : 'Saved'}</span>
                         </div>
                     ) : (
                         <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-400" title="Loading from Cloud...">
                            <CloudOff size={14} className="text-slate-400" />
                         </div>
                     )}
                 </div>
                 <div className="md:hidden w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-slate-100">
                    {user.username.substring(0, 2).toUpperCase()}
                 </div>
             </div>
        </header>

        <div className="p-4 md:p-8 pb-20 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// --- App Bridge ---
const AppBridge: React.FC = () => {
    const firebaseUser = auth.currentUser;
    const appUser: User = {
        username: firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Traveler',
        createdAt: new Date().toISOString()
    };

    return (
        <AuthenticatedApp 
            key={appUser.username} 
            user={appUser} 
            onLogout={() => auth.signOut()} 
        />
    );
}

// --- Main App ---
const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AuthComponent>
                <AppBridge />
            </AuthComponent>
        </ErrorBoundary>
    );
};

export default App;
