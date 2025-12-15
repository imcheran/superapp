import React, { useState, useMemo } from 'react';
import { FinanceData, Transaction, Debt } from '../types';
import { 
    Plus, Trash2, TrendingDown, DollarSign, CreditCard, Users, 
    ArrowUpRight, ArrowDownLeft, X, Check, PieChart as PieIcon, 
    Wallet, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
    List, Settings, Filter 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface FinanceProps {
  data: FinanceData;
  onUpdate: (data: FinanceData) => void;
}

const CATEGORY_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Finance: React.FC<FinanceProps> = ({ data, onUpdate }) => {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'DAILY' | 'CALENDAR' | 'STATS'>('DAILY');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form State
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(data.categories[0] || 'Food');
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Settings State
  const [editBudget, setEditBudget] = useState(data.monthlyBudget.toString());
  const [editBalance, setEditBalance] = useState(data.walletBalance.toString());
  const [newCategory, setNewCategory] = useState('');

  // --- Derived Data ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter transactions for current month
  const monthlyTransactions = useMemo(() => {
      return (data.transactions || []).filter(t => {
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() === month;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, year, month]);

  const monthlyIncome = monthlyTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = monthlyTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const monthlyTotal = monthlyIncome - monthlyExpense;

  // Group by Date for Daily View
  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      monthlyTransactions.forEach(t => {
          const dateKey = t.date.split('T')[0];
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push(t);
      });
      return groups;
  }, [monthlyTransactions]);

  // Daily Totals for Calendar
  const dailyTotals = useMemo(() => {
      const totals: Record<string, { income: number, expense: number }> = {};
      monthlyTransactions.forEach(t => {
          const day = new Date(t.date).getDate();
          if (!totals[day]) totals[day] = { income: 0, expense: 0 };
          if (t.type === 'INCOME') totals[day].income += t.amount;
          else totals[day].expense += t.amount;
      });
      return totals;
  }, [monthlyTransactions]);

  // Chart Data
  const chartData = useMemo(() => {
      const cats: Record<string, number> = {};
      monthlyTransactions.filter(t => t.type === 'EXPENSE').forEach(t => {
          cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
      return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions]);

  // --- Actions ---

  const handleAddTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount) return;

      const val = parseFloat(amount);
      const newTx: Transaction = {
          id: crypto.randomUUID(),
          date: new Date(txDate).toISOString(),
          type: txType,
          amount: val,
          category: txType === 'INCOME' ? 'Income' : category,
          note: note || category
      };

      // Update Wallet Balance logic
      let newBalance = data.walletBalance;
      if (txType === 'INCOME') newBalance += val;
      else newBalance -= val;

      onUpdate({
          ...data,
          transactions: [newTx, ...data.transactions],
          walletBalance: newBalance
      });
      closeAddModal();
  };

  const deleteTransaction = (id: string) => {
      const tx = data.transactions.find(t => t.id === id);
      if (!tx) return;

      // Revert balance change
      let newBalance = data.walletBalance;
      if (tx.type === 'INCOME') newBalance -= tx.amount;
      else newBalance += tx.amount;

      onUpdate({
          ...data,
          transactions: data.transactions.filter(t => t.id !== id),
          walletBalance: newBalance
      });
  };

  const saveSettings = () => {
      onUpdate({
          ...data,
          monthlyBudget: parseFloat(editBudget) || 0,
          walletBalance: parseFloat(editBalance) || 0
      });
      setShowSettingsModal(false);
  };

  const addCustomCategory = () => {
      if (newCategory && !data.categories.includes(newCategory)) {
          onUpdate({
              ...data,
              categories: [...data.categories, newCategory]
          });
          setNewCategory('');
      }
  };

  const openAddModal = () => {
      // Default date to currently viewed month/year, but today's day if within month, else 1st
      const now = new Date();
      let defaultDay = now.getDate();
      if (year !== now.getFullYear() || month !== now.getMonth()) {
          defaultDay = 1;
      }
      const localDate = new Date(year, month, defaultDay + 1).toISOString().split('T')[0];
      
      setTxDate(localDate);
      setShowAddModal(true);
  };

  const closeAddModal = () => {
      setShowAddModal(false);
      setAmount('');
      setNote('');
  };

  // --- Render Helpers ---

  const renderCalendar = () => {
      const firstDay = new Date(year, month, 1).getDay();
      const padding = Array(firstDay).fill(null);
      const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

      return (
          <div className="grid grid-cols-7 gap-1 text-center bg-white rounded-xl p-2 border border-slate-100 shadow-sm">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-xs font-bold text-slate-400 py-2">{d}</div>
              ))}
              {[...padding, ...days].map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} className="h-20 bg-slate-50/30 rounded-lg" />;
                  
                  const stats = dailyTotals[day];
                  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                  
                  return (
                      <div 
                          key={day} 
                          className={`h-20 border border-slate-100 rounded-lg p-1 flex flex-col justify-between hover:border-indigo-200 transition-colors ${isToday ? 'bg-indigo-50/50' : 'bg-white'}`}
                          onClick={() => { setTxDate(`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`); setShowAddModal(true); }}
                      >
                          <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>{day}</span>
                          <div className="space-y-0.5">
                              {stats?.income > 0 && (
                                  <div className="flex justify-end items-center gap-0.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                      <span className="text-[9px] text-emerald-600 font-bold">{stats.income}</span>
                                  </div>
                              )}
                              {stats?.expense > 0 && (
                                  <div className="flex justify-end items-center gap-0.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                                      <span className="text-[9px] text-rose-600 font-bold">{stats.expense}</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in font-sans pb-24">
        
        {/* TOP BAR: Navigation & Settings */}
        <div className="flex items-center justify-between p-1">
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="text-slate-400 hover:text-slate-800"><ChevronLeft size={20} /></button>
                <div className="text-center min-w-[120px]">
                    <h2 className="text-sm font-bold text-slate-800">{monthName} {year}</h2>
                </div>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="text-slate-400 hover:text-slate-800"><ChevronRight size={20} /></button>
            </div>
            <button 
                onClick={() => {
                    setEditBudget(data.monthlyBudget.toString());
                    setEditBalance(data.walletBalance.toString());
                    setShowSettingsModal(true);
                }}
                className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600"
            >
                <Settings size={20} />
            </button>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            
            <div className="grid grid-cols-3 divide-x divide-white/10 mb-6">
                <div className="pr-4">
                    <p className="text-xs text-slate-400 mb-1">Income</p>
                    <p className="text-lg font-bold text-emerald-400">+₹{monthlyIncome.toLocaleString()}</p>
                </div>
                <div className="px-4">
                    <p className="text-xs text-slate-400 mb-1">Expenses</p>
                    <p className="text-lg font-bold text-rose-400">-₹{monthlyExpense.toLocaleString()}</p>
                </div>
                <div className="pl-4">
                    <p className="text-xs text-slate-400 mb-1">Total</p>
                    <p className="text-lg font-bold">₹{monthlyTotal.toLocaleString()}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <div>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Wallet size={12} /> Wallet Balance</p>
                    <p className="text-xl font-bold mt-0.5">₹{data.walletBalance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Budget Left</p>
                    <p className={`text-sm font-bold mt-0.5 ${(data.monthlyBudget - monthlyExpense) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{(data.monthlyBudget - monthlyExpense).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>

        {/* VIEW TABS */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            {[
                { id: 'DAILY', label: 'Daily', icon: List },
                { id: 'CALENDAR', label: 'Calendar', icon: CalendarIcon },
                { id: 'STATS', label: 'Stats', icon: PieIcon }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === tab.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>

        {/* CONTENT AREA */}
        <div className="min-h-[300px]">
            {viewMode === 'DAILY' && (
                <div className="space-y-4">
                    {Object.keys(groupedTransactions).length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <CreditCard size={40} className="mx-auto mb-2 opacity-20" />
                            <p>No transactions this month.</p>
                        </div>
                    ) : (
                        Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => {
                            const dayTx = groupedTransactions[dateKey];
                            const dayIncome = dayTx.filter(t => t.type === 'INCOME').reduce((s,t) => s+t.amount, 0);
                            const dayExpense = dayTx.filter(t => t.type === 'EXPENSE').reduce((s,t) => s+t.amount, 0);
                            const dateObj = new Date(dateKey);

                            return (
                                <div key={dateKey} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 flex justify-between items-center border-b border-slate-100">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-slate-800">{dateObj.getDate()}</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <span className="text-xs text-slate-400">{dateObj.toLocaleString('default', { month: 'short', year: 'numeric'})}</span>
                                        </div>
                                        <div className="flex gap-3 text-xs font-bold">
                                            {dayIncome > 0 && <span className="text-emerald-600">+₹{dayIncome}</span>}
                                            {dayExpense > 0 && <span className="text-rose-600">-₹{dayExpense}</span>}
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {dayTx.map(t => (
                                            <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50 group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {t.type === 'INCOME' ? <ArrowDownLeft size={14} /> : t.category.substring(0,1)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{t.note}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase">{t.category}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                        {t.type === 'INCOME' ? '+' : '-'}₹{t.amount}
                                                    </span>
                                                    <button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {viewMode === 'CALENDAR' && renderCalendar()}

            {viewMode === 'STATS' && (
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PieIcon size={18} className="text-indigo-500" /> Spending Breakdown
                    </h3>
                    <div className="h-64">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">No expenses this month</div>
                        )}
                    </div>
                    <div className="space-y-2 mt-4">
                        {chartData.map((item, index) => (
                            <div key={item.name} className="flex justify-between text-xs">
                                <span className="flex items-center gap-2 text-slate-600">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length]}}></div>
                                    {item.name}
                                </span>
                                <span className="font-bold text-slate-800">₹{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* FLOATING ADD BUTTON */}
        <button 
            onClick={openAddModal}
            className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-transform active:scale-95 z-40"
        >
            <Plus size={28} />
        </button>

        {/* --- ADD TRANSACTION MODAL --- */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">New Transaction</h3>
                        <button onClick={closeAddModal}><X size={20} className="text-slate-400" /></button>
                    </div>
                    
                    <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                        {/* Type Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button type="button" onClick={() => setTxType('EXPENSE')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txType === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Expense</button>
                            <button type="button" onClick={() => setTxType('INCOME')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txType === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Income</button>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input 
                                    type="number" 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500" 
                                    placeholder="0.00" 
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Date</label>
                            <input 
                                type="date" 
                                value={txDate} 
                                onChange={e => setTxDate(e.target.value)} 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-medium"
                            />
                        </div>

                        {/* Category (Expense Only) */}
                        {txType === 'EXPENSE' && (
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Category</label>
                                <select 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)} 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none appearance-none"
                                >
                                    {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Note */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Note / Description</label>
                            <input 
                                type="text" 
                                value={note} 
                                onChange={e => setNote(e.target.value)} 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none" 
                                placeholder={txType === 'INCOME' ? "Salary, Gift..." : "Dinner, Taxi..."}
                            />
                        </div>

                        <button type="submit" className={`w-full py-4 rounded-xl font-bold text-white shadow-lg mt-2 ${txType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                            Add {txType === 'INCOME' ? 'Income' : 'Expense'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- SETTINGS MODAL --- */}
        {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-lg text-slate-800">Finance Settings</h3>
                        <button onClick={() => setShowSettingsModal(false)}><X size={20} className="text-slate-400" /></button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Budget */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Monthly Budget Limit</label>
                            <input 
                                type="number" 
                                value={editBudget} 
                                onChange={e => setEditBudget(e.target.value)} 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                            />
                        </div>

                        {/* Wallet Balance */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex justify-between">
                                <span>Current Wallet Balance</span>
                                <span className="text-rose-500 font-normal normal-case text-[10px]">Manual Override</span>
                            </label>
                            <input 
                                type="number" 
                                value={editBalance} 
                                onChange={e => setEditBalance(e.target.value)} 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Update this if your physical cash doesn't match the app.</p>
                        </div>

                        {/* Categories */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Add Category</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newCategory} 
                                    onChange={e => setNewCategory(e.target.value)} 
                                    placeholder="e.g. Subscriptions"
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none text-sm"
                                />
                                <button 
                                    onClick={addCustomCategory}
                                    className="bg-indigo-100 text-indigo-700 px-4 rounded-xl font-bold hover:bg-indigo-200"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 max-h-24 overflow-y-auto">
                                {data.categories.map(c => (
                                    <span key={c} className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-1 rounded-full text-slate-600">{c}</span>
                                ))}
                            </div>
                        </div>

                        <button onClick={saveSettings} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default Finance;