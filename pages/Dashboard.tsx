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
  
  // Recurring State
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
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn px-2 sm:px-0">
      
      {/* Upper Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                {getTimeGreeting()} 👋
            </h2>
            <p className="text-gray-500 text-sm font-medium">إليك ملخص محفظتك لهذا اليوم</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-1 md:flex-none">
                <button 
                    onClick={() => setFilter('month')} 
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'month' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                    هذا الشهر
                </button>
                <button 
                    onClick={() => setFilter('all')} 
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                    الكل
                </button>
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="bg-primary-600 text-white p-3 md:px-6 md:py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-primary-500/30 hover:bg-primary-700 active:scale-95 transition-all group"
            >
                <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden md:inline">إضافة معاملة</span>
            </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Balance & Analytics */}
          <div className="lg:col-span-8 space-y-6">
              
              {/* Modern Hero Balance Card */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] p-6 md:p-10 text-white shadow-2xl border border-white/5 group">
                  <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-primary-500/20 rounded-full blur-[80px] group-hover:bg-primary-500/30 transition-all duration-700"></div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                      <div className="space-y-4 w-full md:w-auto">
                          <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                  <Wallet size={20} className="text-primary-400" />
                              </div>
                              <span className="text-gray-400 text-xs font-black uppercase tracking-widest">الرصيد الكلي المتوفر</span>
                          </div>
                          <h3 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-l from-white to-gray-400 bg-clip-text text-transparent">
                              {formatCurrency(balance, settings.currency)}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black backdrop-blur-sm">
                                  <TrendingUp size={14} />
                                  <span>ادخار {savingsRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-white/5 text-gray-400 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black backdrop-blur-sm">
                                  <Landmark size={14} />
                                  <span>{balance >= 0 ? 'المحفظة مستقرة' : 'يوجد عجز مالي'}</span>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
                          <div className="p-4 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                  <ArrowDownLeft size={16} />
                                  <span className="text-[10px] font-black uppercase">Income</span>
                              </div>
                              <p className="text-lg font-black">{formatCurrency(totalIncome, settings.currency)}</p>
                          </div>
                          <div className="p-4 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                              <div className="flex items-center gap-2 text-rose-400 mb-1">
                                  <ArrowUpRight size={16} />
                                  <span className="text-[10px] font-black uppercase">Expense</span>
                              </div>
                              <p className="text-lg font-black">{formatCurrency(totalExpense, settings.currency)}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                          <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart3 size={18} className="text-primary-500" />
                            تحليل التدفقات
                          </h4>
                      </div>
                      <div className="h-64 w-full" dir="ltr">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barChartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                                  <YAxis hide />
                                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff'}} />
                                  <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={40}>
                                      {barChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-6">
                          <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <PieIcon size={18} className="text-orange-500" />
                            توزيع المصاريف
                          </h4>
                      </div>
                      <div className="h-64 w-full" dir="ltr">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={categoryExpenses} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                      {categoryExpenses.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff'}} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Column: Recent Transactions */}
          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full min-h-[500px]">
                  <div className="flex justify-between items-center mb-6 px-2">
                      <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock size={18} className="text-primary-500" />
                          العمليات الأخيرة
                      </h4>
                      <button className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1">
                          مشاهدة الكل
                          <ChevronLeft size={14} />
                      </button>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                      {filteredTransactions.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3 opacity-40">
                              <AlertCircle size={40} />
                              <p className="text-xs font-bold">لا توجد عمليات حالياً</p>
                          </div>
                      ) : (
                          filteredTransactions.slice(0, 15).map(t => {
                              const Icon = ICON_MAP[categories.find(c => c.label === t.category)?.iconName || 'AlertCircle'] || AlertCircle;
                              return (
                                  <div key={t.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 group hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                                              <Icon size={18} />
                                          </div>
                                          <div>
                                              <p className="font-black text-xs dark:text-white leading-none mb-1">{t.category}</p>
                                              <p className="text-[10px] text-gray-500 font-medium">{formatDate(t.date)}</p>
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                          <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                                          </p>
                                          <button onClick={() => deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                              <Trash2 size={12} />
                                          </button>
                                      </div>
                                  </div>
                              )
                          })
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Transaction Modal (Same logic, slightly polished) */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة عملية جديدة">
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-2xl">
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${type === 'income' ? 'bg-white dark:bg-gray-600 text-emerald-600 shadow-sm' : 'text-gray-500'}`}>دخل</button>
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-600 text-rose-600 shadow-sm' : 'text-gray-500'}`}>مصروف</button>
              </div>

              <div className="relative group">
                  <input 
                    type="number" 
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full text-5xl font-black text-center py-8 bg-transparent outline-none dark:text-white border-b-2 border-gray-100 dark:border-gray-700 focus:border-primary-500 transition-colors" 
                  />
                  <span className="absolute left-0 bottom-8 text-gray-400 font-black text-sm uppercase tracking-tighter">{settings.currency}</span>
              </div>

              <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">اختر التصنيف</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto custom-scrollbar p-1">
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
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                                        isSelected 
                                        ? `border-primary-500 bg-primary-50 dark:bg-primary-900/20` 
                                        : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-400 shadow-inner'}`} style={isSelected ? { backgroundColor: cat.color } : {}}>
                                        <Icon size={18} />
                                    </div>
                                    <span className={`text-[10px] font-black text-center truncate w-full ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500'}`}>{cat.label}</span>
                                </button>
                            );
                        })
                      }
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Calendar size={14} /> تاريخ العملية
                      </label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:border-primary-500 transition-all text-sm font-bold shadow-sm" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <AlertCircle size={14} /> ملاحظات
                      </label>
                      <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثلاً: غداء عمل" className="w-full p-4 rounded-2xl border border-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:border-primary-500 transition-all text-sm font-bold shadow-sm" />
                  </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl transition-all ${isRecurring ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-400 shadow-inner'}`}>
                            <Repeat size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black dark:text-white leading-none mb-1">تفعيل التكرار</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">جدولة العملية تلقائياً</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                  </div>

                  {isRecurring && (
                      <div className="grid grid-cols-4 gap-2 mt-5 animate-[slideUp_0.3s_ease-out]">
                          {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((freq) => (
                              <button
                                  key={freq}
                                  type="button"
                                  onClick={() => setFrequency(freq)}
                                  className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${
                                      frequency === freq 
                                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg' 
                                      : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-400'
                                  }`}
                              >
                                  {freq === 'daily' ? 'يومياً' : freq === 'weekly' ? 'أسبوعياً' : freq === 'monthly' ? 'شهرياً' : 'سنوياً'}
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              <button type="submit" className="w-full py-5 bg-primary-600 text-white font-black rounded-[1.8rem] shadow-2xl shadow-primary-500/30 hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg">
                  <Plus size={24} />
                  <span>{isRecurring ? 'بدء الجدولة الذكية' : 'تأكيد العملية'}</span>
              </button>
          </form>
      </Modal>
    </div>
  );
};

export default Dashboard;