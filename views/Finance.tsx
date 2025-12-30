
import React, { useState, useMemo } from 'react';
import { FinanceData, Transaction, Debt, Asset, TransactionType, FinanceCategory } from '../types';
import { 
    Plus, Trash2, TrendingDown, DollarSign, CreditCard, Users, 
    ArrowUpRight, ArrowDownLeft, X, Check, PieChart as PieIcon, 
    Wallet, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
    List, Filter, UserPlus, Handshake, CheckCircle2, Clock,
    RotateCcw, BookOpen, Landmark, Eye, EyeOff,
    Activity, ArrowRight, Settings2, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts';

interface FinanceProps {
  data: FinanceData;
  onUpdate: (data: FinanceData) => void;
}

const CATEGORY_COLORS = ['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c'];

const Finance: React.FC<FinanceProps> = ({ data, onUpdate }) => {
  // --- Initialization & Fallbacks ---
  const assets = data.assets || [];
  const categories = data.categories || [];

  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // Form State
  const [txType, setTxType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || '');
  const [note, setNote] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [friendName, setFriendName] = useState('');
  const [isDebtLinked, setIsDebtLinked] = useState(false);

  // Category Manager State
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');

  // Budget Edit State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(data.monthlyBudget.toString());

  // --- Calculations ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthlyTransactions = useMemo(() => {
      return (data.transactions || []).filter(t => {
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() === month;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.transactions, year, month]);

  const monthlyIncome = monthlyTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = monthlyTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  
  const budgetPercent = Math.min(100, Math.round((monthlyExpense / (data.monthlyBudget || 1)) * 100));
  const budgetLeft = Math.max(0, data.monthlyBudget - monthlyExpense);

  const netAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const lendTotal = (data.debts || []).filter(d => d.type === 'Lent' && d.status === 'Pending').reduce((sum, d) => sum + d.amount, 0);
  const borrowTotal = (data.debts || []).filter(d => d.type === 'Borrowed' && d.status === 'Pending').reduce((sum, d) => sum + d.amount, 0);

  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const total = (data.transactions || [])
            .filter(t => t.date.startsWith(dateStr) && t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);
        days.push({ day: i, amount: total });
    }
    return days;
  }, [data.transactions, daysInMonth, year, month]);

  const catChartData = useMemo(() => {
      const cats: Record<string, number> = {};
      monthlyTransactions.filter(t => t.type === 'EXPENSE').forEach(t => {
          cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
      return Object.entries(cats).map(([name, value]) => {
          const catObj = categories.find(c => c.name === name);
          return { name, value, emoji: catObj?.emoji || '✨' };
      }).sort((a, b) => b.value - a.value);
  }, [monthlyTransactions, categories]);

  // --- Actions ---

  const handleAddTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) return;

      const newTx: Transaction = {
          id: crypto.randomUUID(),
          date: new Date(txDate).toISOString(),
          type: txType,
          amount: val,
          category: isDebtLinked ? 'Friends' : (txType === 'INCOME' ? 'Income' : selectedCategory),
          note: isDebtLinked ? `${txType === 'INCOME' ? 'Got from' : 'Gave to'} ${friendName}` : (note || selectedCategory),
          assetId: selectedAssetId
      };

      const updatedAssets = assets.map(a => {
          if (a.id === selectedAssetId) {
              return { ...a, balance: txType === 'INCOME' ? a.balance + val : a.balance - val };
          }
          return a;
      });

      let newDebts = [...(data.debts || [])];
      if (isDebtLinked && friendName) {
          newDebts = [{
              id: crypto.randomUUID(),
              type: txType === 'INCOME' ? 'Borrowed' : 'Lent',
              person: friendName,
              amount: val,
              status: 'Pending',
              date: new Date(txDate).toISOString()
          }, ...newDebts];
      }

      onUpdate({
          ...data,
          transactions: [newTx, ...(data.transactions || [])],
          assets: updatedAssets,
          debts: newDebts
      });
      closeAddModal();
  };

  const deleteTransaction = (id: string) => {
      const tx = data.transactions.find(t => t.id === id);
      if (!tx) return;
      const updatedAssets = assets.map(a => {
          if (a.id === tx.assetId) {
              return { ...a, balance: tx.type === 'INCOME' ? a.balance - tx.amount : a.balance + tx.amount };
          }
          return a;
      });
      onUpdate({
          ...data,
          transactions: data.transactions.filter(t => t.id !== id),
          assets: updatedAssets
      });
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    onUpdate({
      ...data,
      categories: [...data.categories, { name: newCatName.trim(), emoji: newCatEmoji }]
    });
    setNewCatName('');
    setNewCatEmoji('✨');
  };

  const removeCategory = (name: string) => {
    onUpdate({
      ...data,
      categories: data.categories.filter(c => c.name !== name)
    });
  };

  const updateBudget = () => {
    onUpdate({ ...data, monthlyBudget: parseFloat(tempBudget) || 0 });
    setIsEditingBudget(false);
  };

  const closeAddModal = () => {
      setShowAddModal(false);
      setAmount('');
      setNote('');
      setFriendName('');
      setIsDebtLinked(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans p-2 bg-slate-50 min-h-[calc(100vh-100px)]">
        
        {/* TOP BAR: DATE PICKER & CATEGORY MGR */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
            <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-white rounded-lg transition-all"><ChevronLeft size={18} /></button>
                <div className="text-center min-w-[120px]">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{monthName} {year}</span>
                </div>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-white rounded-lg transition-all"><ChevronRight size={18} /></button>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => setShowCatModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                    <Settings2 size={16} /> Manage Categories
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                    <Plus size={18} /> New Record
                </button>
            </div>
        </div>

        {/* 3-COLUMN DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COL: Portfolio & Budget */}
            <div className="lg:col-span-3 space-y-6">
                {/* Net Assets Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Assets</p>
                        <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="text-slate-400">
                            {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-6">
                        ₹{isBalanceVisible ? netAssets.toLocaleString() : '••••••'}
                    </h3>
                    <div className="space-y-3">
                        {assets.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-500 shadow-sm">
                                        {a.type === 'CASH' ? <DollarSign size={16} /> : <Landmark size={16} />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">{a.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">₹{a.balance.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Budget Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Budget</p>
                        <button onClick={() => setIsEditingBudget(!isEditingBudget)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-lg">
                            <Settings2 size={14} />
                        </button>
                    </div>

                    {isEditingBudget ? (
                        <div className="space-y-2 animate-fade-in">
                            <input 
                                type="number" 
                                value={tempBudget} 
                                onChange={e => setTempBudget(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                            />
                            <button onClick={updateBudget} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Budget</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                                        <circle 
                                            cx="32" cy="32" r="28" stroke="#6366f1" strokeWidth="6" fill="transparent"
                                            strokeDasharray={2 * Math.PI * 28}
                                            strokeDashoffset={2 * Math.PI * 28 * (1 - budgetPercent / 100)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute text-[10px] font-black text-indigo-600">{budgetPercent}%</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">₹{data.monthlyBudget.toLocaleString()}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Plan for {monthName}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-2xl">
                                <p className="text-[10px] font-black text-emerald-600 uppercase">Available Left</p>
                                <p className="text-sm font-black text-emerald-800">₹{budgetLeft.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CENTER COL: Ledger (Lg: 5) */}
            <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[750px] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={16} className="text-indigo-500" /> Transaction Ledger
                        </h4>
                        <div className="flex gap-4">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase">In</p>
                                <p className="text-xs font-black text-emerald-600">₹{monthlyIncome.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Out</p>
                                <p className="text-xs font-black text-rose-600">₹{monthlyExpense.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {monthlyTransactions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                                <CreditCard size={80} className="mb-4" />
                                <p className="font-black text-sm uppercase tracking-widest">No Records Found</p>
                            </div>
                        ) : (
                            monthlyTransactions.map(t => {
                                const cat = categories.find(c => c.name === t.category) || { name: 'Other', emoji: '✨' };
                                const asset = assets.find(a => a.id === t.assetId);
                                return (
                                    <div key={t.id} className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner group-hover:bg-white">
                                                {cat.emoji}
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-black text-slate-800 truncate max-w-[150px]">{t.note}</h5>
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                                                    <span>{new Date(t.date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="text-indigo-500">{t.category}</span>
                                                    <span>•</span>
                                                    <span>{asset?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm font-black tabular-nums ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-900'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                            </span>
                                            <button 
                                                onClick={() => deleteTransaction(t.id)} 
                                                className="opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-500 transition-all p-2 bg-slate-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COL: Analysis (Lg: 4) */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <PieIcon size={16} className="text-indigo-500" /> Category Analysis
                    </h4>
                    
                    <div className="h-64 w-full relative mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={catChartData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={70} outerRadius={90} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {catChartData.map((_, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke="none" />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Spent Total</span>
                            <span className="text-xl font-black text-slate-800">₹{monthlyExpense.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {catChartData.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 font-bold italic py-4">No data to display</p>
                        ) : (
                            catChartData.map((cat, idx) => (
                                <div key={cat.name} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></div>
                                    <span className="text-xs font-black text-slate-700 flex-1 flex items-center gap-2">
                                        <span className="text-lg">{cat.emoji}</span> {cat.name}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-900">₹{cat.value.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{((cat.value / (monthlyExpense || 1)) * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Spending Frequency (Trend) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Activity size={16} className="text-amber-500" /> Spending Frequency
                    </h4>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="amount" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Day 01</span>
                        <span>Day {daysInMonth}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* CATEGORY MANAGEMENT MODAL */}
        {showCatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                    <div className="px-8 py-6 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                        <h3 className="font-black text-lg text-slate-800">Categories</h3>
                        <button onClick={() => setShowCatModal(false)} className="p-2 bg-white rounded-full border border-slate-200 shadow-sm"><X size={18} /></button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-4 gap-2 h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map(c => (
                                <div key={c.name} className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl relative group">
                                    <span className="text-2xl">{c.emoji}</span>
                                    <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">{c.name}</span>
                                    <button onClick={() => removeCategory(c.name)} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 p-4 bg-indigo-50/50 rounded-2xl">
                            <input 
                                value={newCatEmoji} 
                                onChange={e => setNewCatEmoji(e.target.value)} 
                                className="w-12 text-center bg-white border border-slate-200 rounded-xl text-xl outline-none" 
                                placeholder="Emoji"
                            />
                            <input 
                                value={newCatName} 
                                onChange={e => setNewCatName(e.target.value)} 
                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none" 
                                placeholder="New category name..."
                            />
                            <button onClick={addCategory} className="bg-indigo-600 text-white p-2 rounded-xl"><Plus size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ADD TRANSACTION MODAL */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                    <div className="px-8 py-6 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-800 leading-none">Record Bill</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Ledger Entry</p>
                            </div>
                        </div>
                        <button onClick={closeAddModal} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button type="button" onClick={() => setTxType('EXPENSE')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${txType === 'EXPENSE' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500'}`}>Outflow</button>
                            <button type="button" onClick={() => setTxType('INCOME')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${txType === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}>Inflow</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl text-slate-300">₹</span>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none text-2xl" 
                                        placeholder="0" 
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Transaction Date</label>
                                <input 
                                    type="date" 
                                    value={txDate}
                                    onChange={e => setTxDate(e.target.value)}
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none text-sm appearance-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Account Source</label>
                                <select 
                                    value={selectedAssetId} 
                                    onChange={e => setSelectedAssetId(e.target.value)} 
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none"
                                    required
                                >
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} (₹{a.balance.toLocaleString()})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Category</label>
                                <select 
                                    value={selectedCategory} 
                                    onChange={e => setSelectedCategory(e.target.value)} 
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none"
                                    required
                                >
                                    {categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <input 
                                type="checkbox" 
                                id="debtLink"
                                checked={isDebtLinked} 
                                onChange={e => setIsDebtLinked(e.target.checked)} 
                                className="w-5 h-5 rounded text-indigo-600 accent-indigo-600"
                            />
                            <label htmlFor="debtLink" className="text-xs font-black text-indigo-700 cursor-pointer">Lend/Borrow with Friend</label>
                        </div>

                        {isDebtLinked && (
                            <div className="animate-fade-in space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Friend's Name</label>
                                <input 
                                    type="text" 
                                    value={friendName} 
                                    onChange={e => setFriendName(e.target.value)} 
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none" 
                                    placeholder="Enter person's name..."
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Note / Memo</label>
                            <input 
                                type="text" 
                                value={note} 
                                onChange={e => setNote(e.target.value)} 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none text-sm" 
                                placeholder="What was this bill for?"
                            />
                        </div>

                        <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-lg">
                            Submit Record
                        </button>
                    </form>
                </div>
            </div>
        )}

    </div>
  );
};

export default Finance;
