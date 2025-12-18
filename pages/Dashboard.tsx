import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, ICON_MAP } from '../constants';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, AlertCircle, Repeat, Calendar, Wallet, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from 'recharts';
import { Modal } from '../components/ui/Modal';
import { TransactionType, RecurringFrequency, Category } from '../types';
import { isSameMonth, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const { transactions, settings, addTransaction, addRecurring, deleteTransaction, categories } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'month'>('all');

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
    // Reset Form
    setAmount(''); 
    setNotes('');
    setIsRecurring(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-0">
      
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex w-full sm:w-auto">
            <button onClick={() => setFilter('all')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500'}`}>الكل</button>
            <button onClick={() => setFilter('month')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'month' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500'}`}>هذا الشهر</button>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg w-full sm:w-auto justify-center hover:bg-primary-700 active:scale-95 transition-all">
          <Plus size={18} /><span>عملية جديدة</span>
        </button>
      </div>

      {/* Hero Balance Card - Enhanced Professional Redesign */}
      <div className="relative overflow-hidden rounded-[3rem] bg-[#0f172a] p-8 md:p-10 text-white shadow-2xl border border-white/10">
          {/* Abstract background decorations */}
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-primary-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Main Balance Info */}
              <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                          <Wallet size={20} className="text-primary-400" />
                      </div>
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">الرصيد المتوفر</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-l from-white to-gray-400 bg-clip-text text-transparent">
                        {formatCurrency(balance, settings.currency)}
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                            <TrendingUp size={14} />
                            <span>{savingsRate.toFixed(1)}% معدل الادخار</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 text-gray-400 border border-white/10 px-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                            <Landmark size={14} />
                            <span>حالة المحفظة: {balance >= 0 ? 'آمنة' : 'عجز'}</span>
                        </div>
                    </div>
                  </div>
              </div>

              {/* Income/Expense Quick Stats */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
                              <ArrowDownLeft size={20} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Total Income</span>
                      </div>
                      <p className="text-emerald-400 text-xs font-bold mb-1 opacity-80">إجمالي الدخل</p>
                      <p className="text-2xl font-black">{formatCurrency(totalIncome, settings.currency)}</p>
                  </div>

                  <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-400 group-hover:scale-110 transition-transform">
                              <ArrowUpRight size={20} />
                          </div>
                          <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">Total Expense</span>
                      </div>
                      <p className="text-rose-400 text-xs font-bold mb-1 opacity-80">إجمالي المصروف</p>
                      <p className="text-2xl font-black">{formatCurrency(totalExpense, settings.currency)}</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">تحليل التدفقات</h3>
                <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            <YAxis hide />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff'}} />
                            <Bar dataKey="amount" radius={[8, 8, 8, 8]}>
                                {barChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">العمليات الأخيرة</h3>
                <div className="space-y-4">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm italic">لا توجد عمليات مسجلة حالياً</div>
                    ) : (
                        filteredTransactions.slice(0, 10).map(t => {
                            const Icon = ICON_MAP[categories.find(c => c.label === t.category)?.iconName || 'AlertCircle'] || AlertCircle;
                            return (
                                <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30 group hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl transition-colors ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm dark:text-white">{t.category}</p>
                                            <p className="text-[10px] text-gray-500">{formatDate(t.date)} {t.notes ? `• ${t.notes}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                                        </p>
                                        <button onClick={() => deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">توزيع المصروفات</h3>
            <div className="h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={categoryExpenses} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {categoryExpenses.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
                {categoryExpenses.slice(0, 5).map((cat: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div>
                            <span className="dark:text-gray-300 font-medium">{cat.name}</span>
                        </div>
                        <span className="font-bold dark:text-white">{formatCurrency(cat.value, settings.currency)}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة عملية جديدة">
          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500'}`}>دخل</button>
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-white dark:bg-gray-700 text-rose-600 shadow-sm' : 'text-gray-500'}`}>مصروف</button>
              </div>

              <div className="relative">
                  <input 
                    type="number" 
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full text-5xl font-black text-center py-6 bg-transparent outline-none dark:text-white border-b-2 border-gray-100 dark:border-gray-800 focus:border-primary-500 transition-colors" 
                  />
                  <span className="absolute left-0 bottom-6 text-gray-400 font-bold text-sm">{settings.currency}</span>
              </div>

              <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">اختر التصنيف</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
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
                                        : 'border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-200'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`} style={isSelected ? { backgroundColor: cat.color } : {}}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold text-center ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500'}`}>{cat.label}</span>
                                </button>
                            );
                        })
                      }
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                        <Calendar size={14} />
                        تاريخ العملية
                      </label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-700 dark:text-white outline-none focus:border-primary-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">ملاحظات</label>
                      <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثلاً: غداء عمل" className="w-full p-4 rounded-xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-700 dark:text-white outline-none focus:border-primary-500 transition-all text-sm" />
                  </div>
              </div>

              {/* Recurring Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${isRecurring ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            <Repeat size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-white">عملية متكررة</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">للاشتراكات والدخل الثابت</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                  </div>

                  {isRecurring && (
                      <div className="grid grid-cols-4 gap-2 mt-4 animate-[fadeIn_0.3s_ease-out]">
                          {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((freq) => (
                              <button
                                  key={freq}
                                  type="button"
                                  onClick={() => setFrequency(freq)}
                                  className={`py-2 px-1 rounded-xl text-[10px] font-black border-2 transition-all ${
                                      frequency === freq 
                                      ? 'bg-primary-600 border-primary-600 text-white' 
                                      : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-500'
                                  }`}
                              >
                                  {freq === 'daily' ? 'يومياً' : freq === 'weekly' ? 'أسبوعياً' : freq === 'monthly' ? 'شهرياً' : 'سنوياً'}
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              <button type="submit" className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span>{isRecurring ? 'بدء التكرار التلقائي' : 'إضافة العملية'}</span>
                  <Plus size={20} />
              </button>
          </form>
      </Modal>
    </div>
  );
};

export default Dashboard;