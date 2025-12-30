
import React, { useState, useMemo } from 'react';
import { FinanceData, Transaction, TransactionType, CategoryBudget, ExpenseInsight, FinanceAnalytics } from '../types';
import { 
    Plus, Trash2, DollarSign, Wallet, ChevronLeft, ChevronRight, 
    Calendar as CalendarIcon, BookOpen, Landmark, Eye, EyeOff,
    Activity, PieChart as PieIcon, ArrowUpRight, ArrowDownLeft,
    X, Settings2, Sparkles, Tag, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Search, Filter
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface FinanceProps {
  data: FinanceData;
  onUpdate: (data: FinanceData) => void;
}

const CATEGORY_COLORS = ['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c'];

export default function Finance({ data, onUpdate }: FinanceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analysis' | 'budget'>('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewScope, setViewScope] = useState<'MONTH' | 'YEAR'>('MONTH');
  
  // Transaction List State
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Transaction Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(data.categories[0]?.name || '');
  const [note, setNote] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(data.assets[0]?.id || '');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Helpers ---
  function filteredTransactions(): Transaction[] {
    let startTime: Date;
    let endTime: Date;

    if (viewScope === 'YEAR') {
        startTime = new Date(selectedYear, 0, 1);
        endTime = new Date(selectedYear, 11, 31, 23, 59, 59);
    } else {
        startTime = new Date(selectedYear, selectedMonth, 1);
        endTime = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    }
    
    return data.transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesDate = tDate >= startTime && tDate <= endTime;
      const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
      const matchesSearch = searchQuery === '' || 
        t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesDate && matchesCategory && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const transactions = useMemo(() => filteredTransactions(), [selectedMonth, selectedYear, viewScope, filterCategory, searchQuery, data.transactions]);

  // --- Analytics Calculations ---
  const financeAnalytics = useMemo((): FinanceAnalytics => {
    const filtered = filteredTransactions();
    const income = filtered.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Category breakdown
    const categoryTotals = new Map<string, number>();
    filtered.filter(t => t.type === 'EXPENSE').forEach(t => {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + t.amount);
    });

    const categoryBreakdown = Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expense > 0 ? (amount / expense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    let daysInPeriod: number;
    if (viewScope === 'YEAR') {
        // Approximate for simplicity
        daysInPeriod = 365;
    } else {
        daysInPeriod = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    }
    
    const dailyAverage = expense / Math.max(1, daysInPeriod); 
    const projectedMonthEnd = (dailyAverage * daysInPeriod); // In yearly view this is Projected Year End

    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings: savings,
      savingsRate,
      categoryBreakdown,
      dailyAverage,
      projectedMonthEnd
    };
  }, [selectedMonth, selectedYear, viewScope, data.transactions]);

  // Category Budget Analysis
  const categoryBudgets = useMemo((): CategoryBudget[] => {
    const filtered = filteredTransactions();
    return data.categories
      .filter(cat => cat.budgetLimit && cat.budgetLimit > 0)
      .map(cat => {
        const spent = filtered
          .filter(t => t.type === 'EXPENSE' && t.category === cat.name)
          .reduce((sum, t) => sum + t.amount, 0);
        
        // If viewScope is YEAR, multiply monthly budget by 12
        const budgetLimit = viewScope === 'YEAR' ? (cat.budgetLimit || 0) * 12 : (cat.budgetLimit || 0);
        
        const remaining = budgetLimit - spent;
        const percentageUsed = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
        
        return {
          category: cat.name,
          budgetLimit,
          spent,
          remaining,
          percentageUsed,
          isOverBudget: spent > budgetLimit
        };
      })
      .sort((a, b) => b.percentageUsed - a.percentageUsed);
  }, [selectedMonth, selectedYear, viewScope, data.transactions, data.categories]);

  // Expense Insights
  const expenseInsights = useMemo((): ExpenseInsight[] => {
    // Insights logic primarily compares against previous month. 
    // If in yearly mode, we could compare against previous year, but for simplicity let's disable granular insights in yearly view or keep monthly logic.
    // For now, we will return empty for YEAR view to avoid confusion, or implement Yearly comparison later.
    if (viewScope === 'YEAR') return [];

    const currentMonthTx = filteredTransactions();
    const prevMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const prevMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    
    const previousMonthTx = data.transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'EXPENSE' && tDate >= prevMonthStart && tDate <= prevMonthEnd;
    });

    const insights: ExpenseInsight[] = [];
    data.categories.forEach(cat => {
      const currentSpend = currentMonthTx
        .filter(t => t.type === 'EXPENSE' && t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const lastMonthSpend = previousMonthTx
        .filter(t => t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);

      if (currentSpend > 0 || lastMonthSpend > 0) {
        let changePercentage = 0;
        if (lastMonthSpend > 0) {
           changePercentage = ((currentSpend - lastMonthSpend) / lastMonthSpend) * 100;
        } else if (currentSpend > 0) {
           changePercentage = 100;
        }
        
        let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
        if (Math.abs(changePercentage) > 5) {
          trend = changePercentage > 0 ? 'UP' : 'DOWN';
        }

        let recommendation;
        if (trend === 'UP' && changePercentage > 20) {
          recommendation = `Spending spiked by ${changePercentage.toFixed(0)}%. Check your recent ${cat.name} transactions.`;
        } else if (trend === 'DOWN' && Math.abs(changePercentage) > 10) {
          recommendation = `Great job! Spending reduced by ${Math.abs(changePercentage).toFixed(0)}%.`;
        }

        insights.push({
          category: cat.name,
          currentMonthSpend: currentSpend,
          lastMonthSpend,
          changePercentage,
          trend,
          recommendation
        });
      }
    });

    return insights.sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage));
  }, [selectedMonth, selectedYear, viewScope, data.transactions, data.categories]);


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
          category: selectedCategory,
          note: note || selectedCategory,
          assetId: selectedAssetId
      };

      const updatedAssets = data.assets.map(a => {
          if (a.id === selectedAssetId) {
              return { ...a, balance: txType === 'INCOME' ? a.balance + val : a.balance - val };
          }
          return a;
      });

      onUpdate({
          ...data,
          transactions: [newTx, ...(data.transactions || [])],
          assets: updatedAssets
      });
      closeAddModal();
  };

  const deleteTransaction = (id: string) => {
      const tx = data.transactions.find(t => t.id === id);
      if (!tx) return;
      const updatedAssets = data.assets.map(a => {
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

  const closeAddModal = () => {
      setShowAddModal(false);
      setAmount('');
      setNote('');
      setTxDate(new Date().toISOString().split('T')[0]);
  };

  const updateCategoryBudget = (categoryName: string, limit: number) => {
      const updatedCats = data.categories.map(c => 
          c.name === categoryName ? { ...c, budgetLimit: limit } : c
      );
      onUpdate({ ...data, categories: updatedCats });
  };

  const updateMonthlyBudget = (val: number) => {
      onUpdate({ ...data, monthlyBudget: val });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans p-2 bg-slate-50 min-h-[calc(100vh-100px)]">
      
      {/* HEADER: Title & Period Selector */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-5 rounded-3xl shadow-sm border border-slate-200 gap-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <DollarSign className="text-indigo-600" /> Finance Tracker
        </h1>
        <div className="flex gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                <button 
                    onClick={() => setViewScope('MONTH')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewScope === 'MONTH' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setViewScope('YEAR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewScope === 'YEAR' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Yearly
                </button>
            </div>

            {viewScope === 'MONTH' && (
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-slate-100 font-bold text-slate-700 px-4 py-2 rounded-xl border-none outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                            {new Date(2024, i).toLocaleDateString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>
            )}
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-100 font-bold text-slate-700 px-4 py-2 rounded-xl border-none outline-none cursor-pointer hover:bg-slate-200 transition-colors"
            >
                {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - 2 + i}>
                        {new Date().getFullYear() - 2 + i}
                    </option>
                ))}
            </select>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex p-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {['overview', 'transactions', 'analysis', 'budget'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">{viewScope === 'YEAR' ? 'Annual ' : ''}Income</h3>
              <p className="text-2xl font-black text-emerald-900">₹{financeAnalytics.totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
              <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">{viewScope === 'YEAR' ? 'Annual ' : ''}Expense</h3>
              <p className="text-2xl font-black text-rose-900">₹{financeAnalytics.totalExpense.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Savings</h3>
              <p className="text-2xl font-black text-indigo-900">₹{financeAnalytics.netSavings.toLocaleString()}</p>
              <p className="text-xs font-bold text-indigo-400 mt-1">{financeAnalytics.savingsRate.toFixed(1)}% Rate</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
              <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Projected</h3>
              <p className="text-2xl font-black text-amber-900">₹{financeAnalytics.projectedMonthEnd.toLocaleString()}</p>
              <p className="text-xs font-bold text-amber-400 mt-1">{viewScope === 'YEAR' ? 'Year' : 'Month'} End Est.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Spending Categories */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={20} /> Top Spending Categories
                 </h3>
                 <div className="space-y-4">
                    {financeAnalytics.categoryBreakdown.slice(0, 5).map((cat, idx) => {
                        const emoji = data.categories.find(c => c.name === cat.category)?.emoji || '✨';
                        return (
                          <div key={idx} className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shadow-inner">
                                {emoji}
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-700 text-sm">{cat.category}</span>
                                    <span className="font-bold text-slate-900 text-sm">₹{cat.amount.toLocaleString()}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{width: `${cat.percentage}%`}}></div>
                                </div>
                             </div>
                             <span className="text-xs font-bold text-slate-400 w-10 text-right">{cat.percentage.toFixed(0)}%</span>
                          </div>
                        );
                    })}
                    {financeAnalytics.categoryBreakdown.length === 0 && <p className="text-slate-400 italic text-center">No expense data yet.</p>}
                 </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-start justify-center relative overflow-hidden">
                  <Sparkles className="absolute top-4 right-4 text-white/10 w-32 h-32 rotate-12" />
                  <h3 className="text-2xl font-black mb-2 relative z-10">Record Transaction</h3>
                  <p className="text-slate-400 mb-6 max-w-xs relative z-10">Keep your ledger up to date by adding your daily income and expenses.</p>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 relative z-10"
                  >
                      <Plus size={18} /> Add New Record
                  </button>
              </div>
          </div>
        </div>
      )}

      {/* --- TRANSACTIONS TAB --- */}
      {activeTab === 'transactions' && (
        <div className="space-y-6 animate-fade-in">
           {/* Toolbar */}
           <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 px-4">
                   <Search size={20} className="text-slate-400" />
                   <input 
                      type="text" 
                      placeholder="Search notes or categories..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 outline-none text-slate-700 font-medium placeholder:text-slate-400"
                   />
               </div>
               <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 px-4 min-w-[200px]">
                   <Filter size={20} className="text-slate-400" />
                   <select 
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="flex-1 outline-none text-slate-700 font-bold bg-transparent cursor-pointer"
                   >
                       <option value="ALL">All Categories</option>
                       {data.categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                   </select>
               </div>
               <button 
                   onClick={() => setShowAddModal(true)}
                   className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
               >
                   <Plus size={18} /> Add
               </button>
           </div>

           {/* Ledger List */}
           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                       <BookOpen size={16} className="text-indigo-600" /> Ledger ({viewScope === 'YEAR' ? 'Annual' : 'Monthly'})
                   </h3>
                   <span className="text-xs font-bold text-slate-400">{transactions.length} records found</span>
               </div>
               <div className="p-4 space-y-3">
                   {transactions.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                           <Search size={48} className="mb-4 opacity-20" />
                           <p className="font-bold">No transactions found for this {viewScope === 'YEAR' ? 'year' : 'month'}.</p>
                       </div>
                   ) : (
                       transactions.map(t => {
                           const cat = data.categories.find(c => c.name === t.category) || { name: 'Other', emoji: '✨' };
                           const asset = data.assets.find(a => a.id === t.assetId);
                           return (
                               <div key={t.id} className="group p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner group-hover:bg-indigo-50 transition-colors">
                                           {cat.emoji}
                                       </div>
                                       <div>
                                           <h4 className="font-bold text-slate-800 text-sm">{t.note}</h4>
                                           <div className="flex items-center gap-2 mt-1">
                                               <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{new Date(t.date).toLocaleDateString()}</span>
                                               <span className="text-[10px] font-bold text-indigo-500 uppercase">{t.category}</span>
                                               <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Landmark size={10} /> {asset?.name}</span>
                                           </div>
                                       </div>
                                   </div>
                                   <div className="flex items-center gap-4">
                                       <span className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-800'}`}>
                                           {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                       </span>
                                       <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
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
      )}

      {/* --- ANALYSIS TAB --- */}
      {activeTab === 'analysis' && (
        <div className="space-y-6 animate-fade-in">
           {/* Budget Bars */}
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <Activity className="text-indigo-600" size={20} /> {viewScope === 'YEAR' ? 'Annual' : 'Monthly'} Budget Health
               </h3>
               {categoryBudgets.length === 0 ? (
                   <div className="text-center py-10">
                       <p className="text-slate-400 font-medium">Set category budgets in the 'Budget' tab to see analysis.</p>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       {categoryBudgets.map(b => (
                           <div key={b.category} className="space-y-2">
                               <div className="flex justify-between text-xs font-bold">
                                   <span className="text-slate-700">{b.category}</span>
                                   <span className={b.isOverBudget ? 'text-rose-500' : 'text-slate-400'}>
                                       {b.percentageUsed.toFixed(0)}% ({b.isOverBudget ? `₹${Math.abs(b.remaining).toLocaleString()} Over` : `₹${b.remaining.toLocaleString()} Left`})
                                   </span>
                               </div>
                               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                   <div 
                                       className={`h-full rounded-full ${b.isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                       style={{ width: `${Math.min(b.percentageUsed, 100)}%` }}
                                   ></div>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>

           {/* Expense Breakdown Pie Chart (Replaces Trends & Recommendations) */}
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <PieIcon className="text-emerald-500" size={20} /> {viewScope === 'YEAR' ? 'Annual' : 'Monthly'} Expense Breakdown
               </h3>
               
               {financeAnalytics.categoryBreakdown.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                       <PieIcon size={48} className="mb-4 opacity-20" />
                       <p>No expense data found for this period.</p>
                   </div>
               ) : (
                   <div className="flex flex-col md:flex-row items-center gap-8">
                       <div className="w-full md:w-1/2 h-80">
                           <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                   <Pie
                                       data={financeAnalytics.categoryBreakdown}
                                       cx="50%"
                                       cy="50%"
                                       innerRadius={60}
                                       outerRadius={100}
                                       paddingAngle={5}
                                       dataKey="amount"
                                   >
                                       {financeAnalytics.categoryBreakdown.map((entry, index) => (
                                           <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                       ))}
                                   </Pie>
                                   <Tooltip 
                                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}}
                                        itemStyle={{color: '#1e293b'}}
                                   />
                               </PieChart>
                           </ResponsiveContainer>
                       </div>
                       
                       <div className="w-full md:w-1/2 grid grid-cols-1 gap-3">
                           {financeAnalytics.categoryBreakdown.map((cat, idx) => (
                               <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                   <div className="flex items-center gap-3">
                                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}}></div>
                                       <span className="font-bold text-slate-700">{cat.category}</span>
                                   </div>
                                   <div className="text-right">
                                       <p className="font-black text-slate-800">₹{cat.amount.toLocaleString()}</p>
                                       <p className="text-xs text-slate-400 font-bold">{cat.percentage.toFixed(1)}%</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
           </div>
        </div>
      )}

      {/* --- BUDGET TAB --- */}
      {activeTab === 'budget' && (
        <div className="space-y-6 animate-fade-in">
           
           {/* Monthly Budget Input Card */}
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Wallet className="text-indigo-600" size={20} /> Total Monthly Budget
                </h3>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-3xl font-black text-slate-300">₹</span>
                    <input 
                        type="number"
                        value={data.monthlyBudget || ''}
                        onChange={(e) => updateMonthlyBudget(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-transparent text-3xl font-black text-slate-800 outline-none w-full placeholder:text-slate-300"
                    />
                </div>
                <p className="text-xs text-slate-400 mt-3 pl-2">
                    Enter your total expected income or spending limit for the month. This drives the 50/30/20 rule calculations below.
                </p>
           </div>

           {/* 50/30/20 Rule */}
           <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
               <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                   <PieIcon size={24} className="text-indigo-400" /> 50/30/20 Rule Guide
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                       <h4 className="text-xs font-bold text-indigo-300 uppercase mb-1">50% Needs</h4>
                       <p className="text-2xl font-black">₹{(data.monthlyBudget * 0.5).toLocaleString()}</p>
                       <p className="text-xs text-slate-400 mt-2">Rent, Groceries, Utilities</p>
                   </div>
                   <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                       <h4 className="text-xs font-bold text-emerald-300 uppercase mb-1">30% Wants</h4>
                       <p className="text-2xl font-black">₹{(data.monthlyBudget * 0.3).toLocaleString()}</p>
                       <p className="text-xs text-slate-400 mt-2">Dining, Hobbies, Shopping</p>
                   </div>
                   <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                       <h4 className="text-xs font-bold text-amber-300 uppercase mb-1">20% Savings</h4>
                       <p className="text-2xl font-black">₹{(data.monthlyBudget * 0.2).toLocaleString()}</p>
                       <p className="text-xs text-slate-400 mt-2">Investments, Debt Repayment</p>
                   </div>
               </div>
           </div>

           {/* Budget Planner */}
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <Settings2 className="text-slate-600" size={20} /> Category Limits (Monthly)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {data.categories.map((cat, idx) => (
                       <div key={cat.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">
                               {cat.emoji}
                           </div>
                           <div className="flex-1">
                               <p className="text-xs font-bold text-slate-500 uppercase">{cat.name}</p>
                               <div className="flex items-center gap-1">
                                   <span className="text-slate-400 font-bold">₹</span>
                                   <input 
                                      type="number" 
                                      value={cat.budgetLimit || ''}
                                      onChange={(e) => updateCategoryBudget(cat.name, parseFloat(e.target.value))}
                                      className="bg-transparent font-black text-slate-800 w-full outline-none"
                                      placeholder="0"
                                   />
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
        </div>
      )}

      {/* --- ADD TRANSACTION MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="px-8 py-6 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                    <h3 className="font-black text-xl text-slate-800">Add Record</h3>
                    <button onClick={closeAddModal} className="p-2 bg-white rounded-full border border-slate-200 shadow-sm"><X size={18} /></button>
                </div>
                
                <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button type="button" onClick={() => setTxType('EXPENSE')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${txType === 'EXPENSE' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500'}`}>EXPENSE</button>
                        <button type="button" onClick={() => setTxType('INCOME')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${txType === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}>INCOME</button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Amount</label>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date</label>
                            <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none">
                                {data.categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Source Account</label>
                        <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none">
                            {data.assets.map(a => <option key={a.id} value={a.id}>{a.name} (₹{a.balance})</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Note</label>
                        <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none text-sm" placeholder="Description..." />
                    </div>

                    <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all text-lg">Save Transaction</button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}
