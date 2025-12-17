import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, ICON_MAP } from '../constants';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Plus, Trash2, Calendar, AlertCircle, PieChart as PieChartIcon, Repeat, Check, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from 'recharts';
import { Modal } from '../components/ui/Modal';
import { TransactionType, RecurringFrequency } from '../types';
import { isSameMonth, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const { transactions, settings, addTransaction, addRecurring, deleteTransaction, budget, categories } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'month'>('all');

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]); 
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');

  const isExpense = type === 'expense';
  const accentText = isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
  const accentBg = isExpense ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
  const accentBorder = isExpense ? 'border-rose-200 dark:border-rose-800' : 'border-emerald-200 dark:border-emerald-800';

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
        if (filter === 'month') {
            return isSameMonth(parseISO(t.date), now);
        }
        return true;
    });
  }, [transactions, filter]);

  const { totalIncome, totalExpense } = useMemo(() => {
      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

      const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
      
      return { totalIncome: income, totalExpense: expense };
  }, [filteredTransactions]);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const { monthlyExpenses, budgetProgress } = useMemo(() => {
      const now = new Date();
      const expenses = transactions
        .filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), now))
        .reduce((acc, t) => acc + t.amount, 0);
      const progress = budget.monthlyIncome > 0 ? (expenses / budget.monthlyIncome) * 100 : 0;
      return { monthlyExpenses: expenses, budgetProgress: progress };
  }, [transactions, budget.monthlyIncome]);

  const barChartData = useMemo(() => [
    { name: 'الدخل', amount: totalIncome, color: '#10b981' },
    { name: 'المصروفات', amount: totalExpense, color: '#ef4444' },
  ], [totalIncome, totalExpense]);

  const categoryExpenses = useMemo(() => {
      return filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const existing = acc.find(c => c.name === t.category);
            if (existing) {
                existing.value += t.amount;
            } else {
                const defaultCat = categories.find(dc => dc.label === t.category);
                acc.push({ 
                    name: t.category, 
                    value: t.amount, 
                    color: defaultCat ? defaultCat.color : '#94a3b8' 
                });
            }
            return acc;
        }, [] as { name: string, value: number, color: string }[])
        .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    let finalDate: string;
    if (date) {
        const [y, m, d] = date.split('-').map(Number);
        const localDate = new Date(y, m - 1, d, 12, 0, 0); 
        finalDate = localDate.toISOString();
    } else {
        finalDate = new Date().toISOString();
    }
    
    if (isRecurring) {
        addRecurring({
            amount: parseFloat(amount),
            type,
            category: selectedCategory.label,
            notes,
            frequency,
            startDate: finalDate
        });
    } else {
        addTransaction({
            amount: parseFloat(amount),
            type,
            category: selectedCategory.label,
            notes,
            date: finalDate,
        });
    }
    
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setNotes('');
    setIsRecurring(false);
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
  };

  const getCategoryIcon = (catLabel: string) => {
      const cat = categories.find(c => c.label === catLabel);
      if (cat && ICON_MAP[cat.iconName]) {
          return ICON_MAP[cat.iconName];
      }
      return AlertCircle;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex w-full sm:w-auto">
            <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
                كل الوقت
            </button>
            <button
                onClick={() => setFilter('month')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'month' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
                هذا الشهر
            </button>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20 active:scale-95 w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>عملية جديدة</span>
        </button>
      </div>

      {/* بطاقة الرصيد الرئيسية - تم تحسين الألوان هنا */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] dark:from-[#064e3b] dark:to-[#022c22] p-8 shadow-2xl shadow-gray-200 dark:shadow-black/50 text-white transform transition-transform hover:scale-[1.01] duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                  <p className="text-gray-300 font-medium mb-1 text-sm uppercase tracking-wider opacity-80">الرصيد الحالي</p>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
                      {formatCurrency(balance, settings.currency)}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-emerald-300 bg-white/10 px-3 py-1 rounded-full w-fit backdrop-blur-sm border border-white/10">
                      <TrendingUp size={14} />
                      <span className="font-bold">{savingsRate.toFixed(1)}% معدل الادخار</span>
                  </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-emerald-400 mb-1">
                          <div className="p-1 rounded-full bg-emerald-500/20"><ArrowDownLeft size={12} /></div>
                          <span className="text-xs font-bold uppercase">الدخل</span>
                      </div>
                      <p className="text-lg font-black text-white">{formatCurrency(totalIncome, settings.currency)}</p>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 text-rose-400 mb-1">
                          <div className="p-1 rounded-full bg-rose-500/20"><ArrowUpRight size={12} /></div>
                          <span className="text-xs font-bold uppercase">المصروف</span>
                      </div>
                      <p className="text-lg font-black text-white">{formatCurrency(totalExpense, settings.currency)}</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {categoryExpenses.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                           <PieChartIcon size={20} className="text-primary-500" />
                           توزيع المصروفات
                        </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                        <div className="w-full sm:w-1/2 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryExpenses}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryExpenses.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(val) => formatCurrency(Number(val), settings.currency)}
                                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: '12px', border: 'none', color: 'white' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full sm:w-1/2 grid grid-cols-1 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                             {categoryExpenses.map((cat, i) => (
                                 <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                         <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{cat.name}</span>
                                     </div>
                                     <span className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(cat.value, settings.currency)}</span>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">تحليل التدفقات</h3>
                </div>
                <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} barSize={50}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.2} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 12 }} 
                            tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val}
                        />
                        <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            borderRadius: '12px', 
                            border: 'none', 
                            padding: '12px', 
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="amount" radius={[8, 8, 8, 8]}>
                        {barChartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                className="opacity-90 hover:opacity-100 transition-opacity"
                            />
                        ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">أحدث العمليات</h3>
                </div>
                
                <div className="space-y-4">
                    {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <Calendar size={40} className="mb-3 opacity-20" />
                        <p className="text-sm">لا توجد عمليات مسجلة</p>
                    </div>
                    ) : (
                    filteredTransactions.slice(0, 5).map(t => {
                        const IconComponent = getCategoryIcon(t.category);
                        return (
                        <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm relative ${
                                t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                                }`}>
                                    <IconComponent size={20} />
                                    {t.isRecurring && (
                                        <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 border border-gray-200 dark:border-gray-700">
                                            <Repeat size={10} className="text-blue-500" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{t.category}</p>
                                <p className="text-xs text-gray-500 font-medium">{formatDate(t.date)}</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <span className={`block font-extrabold text-sm mb-1 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                                </span>
                                <button 
                                onClick={() => deleteTransaction(t.id)}
                                className="text-gray-300 hover:text-red-500 text-xs lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end ml-auto"
                                >
                                <Trash2 size={12} />
                                <span>حذف</span>
                                </button>
                            </div>
                        </div>
                    )})
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                        <AlertCircle size={16} className="text-amber-500" />
                        الميزانية الشهرية
                    </h3>
                </div>
                {budget.monthlyIncome > 0 ? (
                    <div>
                         <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-gray-500">تم صرف</span>
                            <span className={`text-sm font-extrabold ${monthlyExpenses > budget.monthlyIncome ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                {formatCurrency(monthlyExpenses, settings.currency)}
                            </span>
                         </div>
                         <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${monthlyExpenses > budget.monthlyIncome ? 'bg-red-500' : 'bg-primary-500'}`}
                                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                            />
                         </div>
                         <p className="text-[10px] text-gray-400 text-left">من أصل {formatCurrency(budget.monthlyIncome, settings.currency)}</p>
                    </div>
                ) : (
                    <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-400">لم يتم تحديد ميزانية</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title=" ">
        <div className="relative -mt-6">
             <div className="flex justify-center mb-6">
                 <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex w-full max-sm relative shadow-inner">
                     <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${!isExpense ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                     >
                         <ArrowDownLeft size={16} className={!isExpense ? "text-emerald-500" : ""} />
                         دخل
                     </button>
                     <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${isExpense ? 'bg-white dark:bg-gray-700 text-rose-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                     >
                         <ArrowUpRight size={16} className={isExpense ? "text-rose-500" : ""} />
                         مصروف
                     </button>
                 </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-5">
                 <div className={`relative p-6 rounded-3xl transition-colors duration-300 border ${accentBg} ${accentBorder}`}>
                     <label className={`block text-xs font-bold mb-1 uppercase tracking-wider text-center opacity-70 ${accentText}`}>
                         قيمة المبلغ
                     </label>
                     <div className="flex items-center justify-center gap-2">
                         <span className={`text-2xl font-bold opacity-50 mb-2 ${accentText}`}>{settings.currency}</span>
                         <input 
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className={`w-full max-w-[240px] bg-transparent text-center text-6xl font-black outline-none placeholder-gray-300 dark:placeholder-gray-600 transition-colors duration-300 ${accentText}`}
                         />
                     </div>
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-gray-500 mb-3 px-1">اختر التصنيف</label>
                     <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {categories.map(cat => {
                            const Icon = ICON_MAP[cat.iconName] || AlertCircle;
                            const isSelected = selectedCategory.id === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-200 relative group aspect-square ${
                                        isSelected 
                                        ? `${accentBg} ${accentBorder} ring-2 ring-offset-2 dark:ring-offset-gray-900 ${isExpense ? 'ring-rose-400' : 'ring-emerald-400'}` 
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${cat.bg} ${cat.text}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span className={`text-[10px] font-bold truncate w-full text-center ${isSelected ? accentText : 'text-gray-500 dark:text-gray-400'}`}>{cat.label}</span>
                                    {isSelected && <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${isExpense ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>}
                                </button>
                            )
                        })}
                     </div>
                 </div>

                 <div className="flex gap-3">
                     <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                         <Calendar size={18} className="text-gray-400" />
                         <div className="flex-1">
                             <label className="block text-[10px] font-bold text-gray-400">التاريخ</label>
                             <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent w-full text-sm font-bold text-gray-900 dark:text-white outline-none"
                             />
                         </div>
                     </div>

                     <div 
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`flex-1 p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${isRecurring ? `${accentBg} ${accentBorder}` : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700'}`}
                     >
                         <Repeat size={18} className={isRecurring ? accentText : 'text-gray-400'} />
                         <div className="flex-1">
                             <label className="block text-[10px] font-bold text-gray-400">التكرار</label>
                             <span className={`block text-xs font-bold ${isRecurring ? accentText : 'text-gray-500'}`}>
                                 {isRecurring ? 'مفعل' : 'مرة واحدة'}
                             </span>
                         </div>
                     </div>
                 </div>

                 {isRecurring && (
                     <div className="animate-[fadeIn_0.3s_ease-out] bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto">
                        {['daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                            <button
                                key={freq}
                                type="button"
                                onClick={() => setFrequency(freq as RecurringFrequency)}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                                    frequency === freq 
                                    ? `bg-white dark:bg-gray-700 ${accentText} ${accentBorder} shadow-sm ring-1 ${isExpense ? 'ring-rose-200' : 'ring-emerald-200'}` 
                                    : 'border-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {freq === 'daily' ? 'يومياً' : freq === 'weekly' ? 'أسبوعياً' : freq === 'monthly' ? 'شهرياً' : 'سنوياً'}
                            </button>
                        ))}
                     </div>
                 )}

                 <div className="relative">
                     <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                         <FileText size={18} />
                     </div>
                     <input 
                       type="text"
                       value={notes}
                       onChange={(e) => setNotes(e.target.value)}
                       placeholder="ملاحظات إضافية (اختياري)"
                       className="w-full pr-12 pl-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 transition-all text-sm"
                     />
                 </div>

                 <button 
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 ${isExpense ? 'bg-gradient-to-r from-rose-500 to-pink-600 shadow-rose-500/30' : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30'}`}
                 >
                    {isRecurring ? <Repeat size={20} /> : <Check size={20} />}
                    <span>{isRecurring ? 'تفعيل الاشتراك' : 'حفظ العملية'}</span>
                 </button>
             </form>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;