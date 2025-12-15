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
import Notes from './views/Notes'; // New View
import Auth from './views/Auth';
import QuitHabits from './views/QuitHabits'; 
import { ViewState, Habit, TrackingData, DailyLogData, UserSettings, FinanceData, User, Note } from './types';
import { DEFAULT_HABITS } from './constants';
import { Menu, AlertTriangle } from 'lucide-react';

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
  
  // Storage Keys with Username Prefix
  const KEYS = {
      HABITS: `user_${user.username}_habits`,
      DATA: `user_${user.username}_data`,
      LOGS: `user_${user.username}_daily_logs`,
      FINANCE: `user_${user.username}_finance`,
      SETTINGS: `user_${user.username}_settings`,
      NOTES: `user_${user.username}_notes`,
  };

  // --- Strict Data Initialization (Prevents "White Screen" from corrupted JSON) ---

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
    } catch (e) {
      return {};
    }
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLogData>(() => {
    try {
      const saved = localStorage.getItem(KEYS.LOGS);
      const parsed = saved ? JSON.parse(saved) : {};
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
      return {};
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
        const saved = localStorage.getItem(KEYS.NOTES);
        const parsed = saved ? JSON.parse(saved) : [];
        // Dummy Data for Stage 1 if empty
        if (!parsed || parsed.length === 0) {
            return [
                { id: '1', title: 'Groceries', type: 'list', items: [{id:'a', text:'Milk', done:false}, {id:'b', text:'Eggs', done:true}], color: '#ffffff', isPinned: true, createdAt: new Date().toISOString() },
                { id: '2', title: 'Ideas', type: 'text', content: 'Build a habit tracker app...', color: '#fef08a', isPinned: false, createdAt: new Date().toISOString() },
            ] as Note[];
        }
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
  });

  const [financeData, setFinanceData] = useState<FinanceData>(() => {
      try {
        const saved = localStorage.getItem(KEYS.FINANCE);
        const parsed = (saved ? JSON.parse(saved) : {}) || {};
        return { 
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            bills: Array.isArray(parsed.bills) ? parsed.bills : [],
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [], 
            debts: Array.isArray(parsed.debts) ? parsed.debts : [], 
            categories: Array.isArray(parsed.categories) ? parsed.categories : ["Food", "Travel", "Rent", "Groceries", "Entertainment"],
            monthlyBudget: typeof parsed.monthlyBudget === 'number' ? parsed.monthlyBudget : 10000,
            walletBalance: typeof parsed.walletBalance === 'number' ? parsed.walletBalance : 50000,
            fincoins: typeof parsed.fincoins === 'number' ? parsed.fincoins : 0
        };
      } catch (e) {
        return { 
            transactions: [],
            bills: [],
            expenses: [], 
            debts: [], 
            categories: ["Food", "Travel", "Rent", "Groceries", "Entertainment"],
            monthlyBudget: 10000,
            walletBalance: 50000,
            fincoins: 0
        };
      }
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

  // Persistence Effects
  useEffect(() => localStorage.setItem(KEYS.HABITS, JSON.stringify(habits)), [habits]);
  useEffect(() => localStorage.setItem(KEYS.DATA, JSON.stringify(trackingData)), [trackingData]);
  useEffect(() => localStorage.setItem(KEYS.LOGS, JSON.stringify(dailyLogs)), [dailyLogs]);
  useEffect(() => localStorage.setItem(KEYS.FINANCE, JSON.stringify(financeData)), [financeData]);
  useEffect(() => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem(KEYS.NOTES, JSON.stringify(notes)), [notes]);

  const handleFactoryReset = () => {
      if (confirm("Delete ALL data?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const toggleHabit = (habitId: string, date: string) => {
    const currentDayData = trackingData[date] || [];
    const isCompleted = currentDayData.includes(habitId);
    const earnedXp = isCompleted ? -15 : 15; 
    
    setTrackingData(prev => {
      const dayList = prev[date] || [];
      const newData = isCompleted ? dayList.filter(id => id !== habitId) : [...dayList, habitId];
      return { ...prev, [date]: newData };
    });

    if (settings.mode === 'HERO' && settings.heroStats) {
        setSettings(prev => {
            if (!prev.heroStats) return prev;
            let newXp = prev.heroStats.xp + earnedXp;
            let newLevel = prev.heroStats.level;
            let newNext = prev.heroStats.nextLevelXp;

            if (newXp >= newNext) {
                newXp = newXp - newNext;
                newLevel += 1;
                newNext = Math.round(newNext * 1.2);
            }
            if (newXp < 0) newXp = 0;

            return {
                ...prev,
                heroStats: { ...prev.heroStats, xp: newXp, level: newLevel, nextLevelXp: newNext }
            };
        });
    }
  };

  const activeBuildHabits = habits.filter(h => h.type !== 'QUIT');

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard habits={activeBuildHabits} data={trackingData} settings={settings} logs={dailyLogs} />;
      case ViewState.MONTHLY_DASHBOARD:
        return <MonthlyDashboard habits={activeBuildHabits} data={trackingData} />;
      case ViewState.TRACKER:
        return <Tracker habits={activeBuildHabits} data={trackingData} onToggle={toggleHabit} />;
      case ViewState.QUIT_HABITS:
        return <QuitHabits habits={habits} onUpdateHabits={setHabits} />;
      case ViewState.ANALYTICS:
        return <Analytics habits={activeBuildHabits} data={trackingData} />;
      case ViewState.FINANCE:
        return <Finance data={financeData} onUpdate={setFinanceData} />;
      case ViewState.JOURNAL:
        return <Journal logs={dailyLogs} onUpdate={setDailyLogs} settings={settings} />;
      case ViewState.NOTES:
        return <Notes notes={notes} onUpdate={setNotes} settings={settings} onUpdateSettings={setSettings} />;
      case ViewState.SETTINGS:
        return (
          <Settings 
             habits={habits} 
             onUpdateHabits={setHabits} 
             settings={settings}
             onUpdateSettings={setSettings}
             onReset={handleFactoryReset}
          />
        );
      case ViewState.AI_COACH:
        return <AIAdvisor habits={habits} data={trackingData} dailyLogs={dailyLogs} />;
      default:
        return <Dashboard habits={activeBuildHabits} data={trackingData} settings={settings} logs={dailyLogs} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        username={user.username}
        onLogout={onLogout}
      />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        {/* OmniLife HUD Header */}
        <header className="px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center justify-between w-full md:w-auto">
                 <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                     >
                        <Menu size={24} />
                     </button>

                     <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight truncate">
                        {currentView.toLowerCase().replace('_', ' ')}
                     </h2>
                 </div>
                 
                 <div className="md:hidden w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-slate-100">
                    {user.username.substring(0, 2).toUpperCase()}
                 </div>
             </div>

             <div className="flex items-center gap-4 md:gap-6 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto hide-scrollbar justify-end">
                 <div className="hidden md:flex w-10 h-10 bg-slate-900 rounded-full items-center justify-center text-white font-bold shadow-lg border-2 border-slate-100 shrink-0 uppercase">
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

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(() => {
        try {
          const saved = localStorage.getItem('omni_current_user');
          return saved ? JSON.parse(saved) : null;
        } catch (e) {
          return null;
        }
    });

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        localStorage.setItem('omni_current_user', JSON.stringify(loggedInUser));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('omni_current_user');
    };

    if (!user) {
        return (
            <ErrorBoundary>
                <Auth onLogin={handleLogin} />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <AuthenticatedApp key={user.username} user={user} onLogout={handleLogout} />
        </ErrorBoundary>
    );
};

export default App;