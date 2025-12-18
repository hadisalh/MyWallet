import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, ICON_MAP } from '../constants';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, AlertCircle, Repeat, Calendar, Wallet, TrendingUp, Landmark, PieChart as PieIcon, BarChart3, Clock, ChevronLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from 'recharts';
import { Modal } from '../components/ui/Modal';
import { TransactionType, RecurringFrequency, Category } from '../types';
import { isSameMonth, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const { transactions, settings, addTransaction, addRecurring, deleteTransaction, categories } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'month'>('month');

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]); 
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');

  useEffect(() => {
    const filtered = categories.filter(c => type === 'income' ? (c.id === 'salary' || c.id === 'gift' || c.id === 'other') : c.id !== 'salary');
    if (filtered.length > 0) setSelectedCategory(filtered[0]);
  }, [type, categories]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => filter === 'month' ? isSameMonth(parseISO(t.date), now) : true);
  }, [transactions, filter]);

  const { totalIncome, totalExpense } = useMemo(() => {
      const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      return { totalIncome: income, totalExpense: expense };
  }, [filteredTransactions]);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const barChartData = [
    { name: 'الدخل', amount: totalIncome, color: '#10b981' },
    { name: 'المصروف', amount: totalExpense, color: '#ef4444' },
  ];

  const categoryExpenses = useMemo(() => {
      return filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const existing = acc.find(c => c.name === t.category);
            if (existing) existing.value += t.amount;
            else acc.push({ 
                name: t.category, 
                value: t.amount, 
                color: categories.find(c => c.label === t.category)?.color || '#94a3b8' 
            });
            return acc;
        }, [] as any[])
        .sort((a: any, b: any) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    const finalDate = date ? new Date(date).toISOString() : new Date().toISOString();
    
    if (isRecurring) {
        addRecurring({ amount: parseFloat(amount), type, category: selectedCategory.label, notes, frequency, startDate: finalDate });
    } else {
        addTransaction({ amount: parseFloat(amount), type, category: selectedCategory.label, notes, date: finalDate });
    }
    
    setIsAddModalOpen(false);
    setAmount(''); 
    setNotes('');
    setIsRecurring(false);
  };

  const getTimeGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "صباح الخير";
      if (hour < 18) return "مساء الخير";
      return "ليلة سعيدة";
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fadeIn px-2 sm:px-0">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {getTimeGreeting()} 👋
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-bold mt-1">إليك ملخصك المالي الدقيق</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-1">
                <button onClick={() => setFilter('month')} className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'month' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400'}`}>هذا الشهر</button>
                <button onClick={() => setFilter('all')} className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400'}`}>الكل</button>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-primary-600 text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all">
                <Plus size={20} strokeWidth={3} />
                <span className="hidden sm:inline">إضافة</span>
            </button>
        </div>
      </div>

      {/* Main Balance Card - High Contrast Green */}
      <div className="relative overflow-hidden rounded-3xl bg-primary-600 p-8 text-white shadow-2xl border border-primary-500">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                          <Wallet size={20} className="text-white" />
                      </div>
                      <span className="text-white/80 text-xs font-black uppercase tracking-widest">إجمالي رصيد محفظتك</span>
                  </div>
                  <h3 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                      {formatCurrency(balance, settings.currency)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                      <div className="bg-white/20 text-white px-3 py-1.5 rounded-xl text-[11px] font-black backdrop-blur-md">
                          الادخار: {savingsRate.toFixed(1)}%
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
                  <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                      <div className="flex items-center gap-2 text-white mb-1">
                          <ArrowDownLeft size={16} strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase">الدخل</span>
                      </div>
                      <p className="text-xl font-black text-white">{formatCurrency(totalIncome, settings.currency)}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                      <div className="flex items-center gap-2 text-white mb-1">
                          <ArrowUpRight size={16} strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase">المصروف</span>
                      </div>
                      <p className="text-xl font-black text-white">{formatCurrency(totalExpense, settings.currency)}</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Activity Section */}
          <div className="lg:col-span-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Clock size={18} className="text-primary-500" />
                          العمليات المالية
                      </h4>
                  </div>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {filteredTransactions.length === 0 ? (
                          <div className="text-center py-20 text-slate-400">لا توجد عمليات حالياً</div>
                      ) : (
                          filteredTransactions.map(t => (
                              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:border-primary-500 transition-all group">
                                  <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                                          {t.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                      </div>
                                      <div>
                                          <p className="font-black text-sm text-slate-900 dark:text-white leading-none mb-1">{t.category}</p>
                                          <p className="text-[11px] text-slate-500 font-bold">{formatDate(t.date)}</p>
                                      </div>
                                  </div>
                                  <div className="text-left">
                                      <p className={`font-black text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                                      </p>
                                      <button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          {/* Charts Column */}
          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
                  <h4 className="font-black text-slate-900 dark:text-white mb-6">التوزيع البياني</h4>
                  <div className="h-64 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={categoryExpenses} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {categoryExpenses.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                      {categoryExpenses.slice(0, 5).map((cat: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white">{formatCurrency(cat.value, settings.currency)}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* Transaction Modal - Redesigned for Maximum Visibility */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة عملية جديدة">
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>دخل</button>
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'}`}>مصروف</button>
              </div>

              {/* Amount Input - Explicit Black/White Text */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">المبلغ المالي</label>
                  <input 
                    type="number" 
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full text-5xl font-black text-center bg-transparent outline-none text-slate-950 dark:text-white" 
                  />
                  <span className="text-slate-400 font-bold mt-2 block">{settings.currency}</span>
              </div>

              {/* Category Grid - Improved Contrast */}
              <div className="space-y-3">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest px-1">اختر التصنيف</label>
                  <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {categories
                        .filter(c => type === 'income' ? (c.id === 'salary' || c.id === 'gift' || c.id === 'other') : c.id !== 'salary')
                        .map(cat => {
                            const Icon = ICON_MAP[cat.iconName] || AlertCircle;
                            const isSelected = selectedCategory.id === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                                        isSelected 
                                        ? `border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md` 
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`} style={isSelected ? { backgroundColor: cat.color } : {}}>
                                        <Icon size={18} strokeWidth={3} />
                                    </div>
                                    <span className={`text-[10px] font-black text-center truncate w-full ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>{cat.label}</span>
                                </button>
                            );
                        })
                      }
                  </div>
              </div>

              {/* Form Fields - Fixed Background Contrast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase px-1">التاريخ</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase px-1">ملاحظات</label>
                      <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثلاً: غداء" className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold" />
                  </div>
              </div>

              <button type="submit" className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg">
                  <Plus size={24} strokeWidth={4} />
                  <span>تأكيد العملية</span>
              </button>
          </form>
      </Modal>
    </div>
  );
};

export default Dashboard;