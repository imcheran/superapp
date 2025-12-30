
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Tracker from './views/Tracker';
import Settings from './views/Settings';
import Finance from './views/Finance';
import Auth from './views/Auth';
import QuitHabits from './views/QuitHabits'; 
import { ViewState, Habit, TrackingData, UserSettings, FinanceData, User } from './types';
import { DEFAULT_HABITS } from './constants';
import { Menu, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

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
                Your local save data appears to be corrupted. Please reset your local cache to fix this.
            </p>
            <button 
              onClick={() => {
                  localStorage.clear();
                  window.location.reload();
              }} 
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg"
            >
              Reset App Data & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AuthenticatedApp: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const KEYS = {
      HABITS: `user_${user.username}_habits`,
      DATA: `user_${user.username}_data`,
      FINANCE: `user_${user.username}_finance`,
      SETTINGS: `user_${user.username}_settings`,
  };

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(KEYS.HABITS);
      const parsed = saved ? JSON.parse(saved) : DEFAULT_HABITS;
      return Array.isArray(parsed) ? parsed : DEFAULT_HABITS;
    } catch (e) { return DEFAULT_HABITS; }
  });

  const [trackingData, setTrackingData] = useState<TrackingData>(() => {
    try {
      const saved = localStorage.getItem(KEYS.DATA);
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
              { name: 'Food', emoji: '🍱' },
              { name: 'Bus', emoji: '🚌' },
              { name: 'Transport', emoji: '🚇' },
              { name: 'Friends', emoji: '🤝' },
              { name: 'Shopping', emoji: '🛍️' },
              { name: 'Groceries', emoji: '🛒' }
            ],
            assets: Array.isArray(parsed.assets) ? parsed.assets : [
              { id: 'cash', name: 'Cash', type: 'CASH', balance: 50000 },
              { id: 'bank', name: 'Bank Card', type: 'BANK', balance: 0 }
            ],
            monthlyBudget: typeof parsed.monthlyBudget === 'number' ? parsed.monthlyBudget : 10000,
            walletBalance: typeof parsed.walletBalance === 'number' ? parsed.walletBalance : 50000
        };
      } catch (e) {
        return { 
            transactions: [], bills: [], debts: [], assets: [],
            categories: [
              { name: 'Food', emoji: '🍱' },
              { name: 'Bus', emoji: '🚌' },
              { name: 'Transport', emoji: '🚇' },
              { name: 'Friends', emoji: '🤝' }
            ],
            monthlyBudget: 10000, walletBalance: 50000
        };
      }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(KEYS.SETTINGS);
      const parsed = saved ? JSON.parse(saved) : null;
      const defaultSettings: UserSettings = { 
          deepWorkInterval: 90,
          mode: 'HERO',
          chronotype: 'BEAR',
          heroStats: { hp: 100, maxHp: 100, xp: 0, level: 1, nextLevelXp: 500 }
      };
      return parsed ? { ...defaultSettings, ...parsed } : defaultSettings;
    } catch (e) {
      return { 
          deepWorkInterval: 90, mode: 'HERO', chronotype: 'BEAR',
          heroStats: { hp: 100, maxHp: 100, xp: 0, level: 1, nextLevelXp: 500 }
      };
    }
  });

  useEffect(() => localStorage.setItem(KEYS.HABITS, JSON.stringify(habits)), [habits]);
  useEffect(() => localStorage.setItem(KEYS.DATA, JSON.stringify(trackingData)), [trackingData]);
  useEffect(() => localStorage.setItem(KEYS.FINANCE, JSON.stringify(financeData)), [financeData]);
  useEffect(() => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)), [settings]);

  const toggleHabit = (habitId: string, date: string) => {
    setTrackingData(prev => {
      const dayList = prev[date] || [];
      const isCompleted = dayList.includes(habitId);
      const newData = isCompleted ? dayList.filter(id => id !== habitId) : [...dayList, habitId];
      return { ...prev, [date]: newData };
    });
  };

  const activeBuildHabits = habits.filter(h => h.type !== 'QUIT');

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard habits={activeBuildHabits} data={trackingData} />;
      case ViewState.TRACKER:
        return <Tracker habits={activeBuildHabits} data={trackingData} onToggle={toggleHabit} />;
      case ViewState.QUIT_HABITS:
        return <QuitHabits habits={habits} onUpdateHabits={setHabits} />;
      case ViewState.FINANCE:
        return <Finance data={financeData} onUpdate={setFinanceData} />;
      case ViewState.SETTINGS:
        return <Settings habits={habits} onUpdateHabits={setHabits} settings={settings} onUpdateSettings={setSettings} onReset={() => {localStorage.clear(); window.location.reload();}} />;
      default:
        return <Dashboard habits={activeBuildHabits} data={trackingData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} username={user.username} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <header className="px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
                 <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight truncate">{currentView.toLowerCase().replace('_', ' ')}</h2>
             </div>
             <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-slate-100 uppercase">
                {user.username.substring(0, 2).toUpperCase()}
             </div>
        </header>
        <div className="p-4 md:p-8 pb-20 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(() => {
        try {
          const saved = localStorage.getItem('omni_current_user');
          return saved ? JSON.parse(saved) : null;
        } catch (e) { return null; }
    });
    if (!user) return <ErrorBoundary><Auth onLogin={(u) => {setUser(u); localStorage.setItem('omni_current_user', JSON.stringify(u));}} /></ErrorBoundary>;
    return <ErrorBoundary><AuthenticatedApp key={user.username} user={user} onLogout={() => {setUser(null); localStorage.removeItem('omni_current_user');}} /></ErrorBoundary>;
};

export default App;
