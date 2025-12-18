import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, ICON_MAP } from '../constants';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, Smartphone, Download, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from 'recharts';
import { Modal } from '../components/ui/Modal';
import { TransactionType, RecurringFrequency, Category } from '../types';
import { isSameMonth, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const { transactions, settings, addTransaction, addRecurring, deleteTransaction, categories } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'month'>('all');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]); 
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');

  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isPWA) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update category when type changes to ensure logical selection
  useEffect(() => {
    const filtered = categories.filter(c => type === 'income' ? c.id === 'salary' : c.id !== 'salary');
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
    setAmount(''); setNotes('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-0">
      
      {showInstallPrompt && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
               <Smartphone size={32} />
            </div>
            <div>
               <h4 className="text-xl font-black">ثبّت "محفظتي" الآن!</h4>
               <p className="text-primary-100 text-sm opacity-90">احصل على تجربة أسرع، وصول فوري، وعمل بدون إنترنت.</p>
            </div>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new Event('triggerInstall'))}
            className="bg-white text-primary-700 px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg"
          >
            <Download size={18} />
            تثبيت التطبيق
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex w-full sm:w-auto">
            <button onClick={() => setFilter('all')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>الكل</button>
            <button onClick={() => setFilter('month')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'month' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>هذا الشهر</button>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg w-full sm:w-auto justify-center hover:bg-primary-700 active:scale-95 transition-all">
          <Plus size={18} /><span>عملية جديدة</span>
        </button>
      </div>

      <div 
        style={{ backgroundColor: '#0f172a' }} 
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 text-white shadow-2xl"
      >
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                  <p className="text-gray-400 text-sm font-bold mb-1">الرصيد المتوفر</p>
                  <h3 className="text-4xl md:text-5xl font-black mb-2">{formatCurrency(balance, settings.currency)}</h3>
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold w-fit">
                      {savingsRate.toFixed(1)}% معدل الادخار
                  </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                  <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                      <p className="text-emerald-400 text-xs font-bold mb-1">الدخل</p>
                      <p className="text-xl font-black">{formatCurrency(totalIncome, settings.currency)}</p>
                  </div>
                  <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                      <p className="text-rose-400 text-xs font-bold mb-1">المصروف</p>
                      <p className="text-xl font-black">{formatCurrency(totalExpense, settings.currency)}</p>
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
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
                      <label className="text-xs font-bold text-gray-400">تاريخ العملية</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-700 dark:text-white outline-none focus:border-primary-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">ملاحظات</label>
                      <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثلاً: غداء مع العائلة" className="w-full p-4 rounded-xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-700 dark:text-white outline-none focus:border-primary-500 transition-all text-sm" />
                  </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-5 h-5 rounded-lg border-2 border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">جعلها عملية متكررة (اشتراك)</span>
                  </label>
                  {isRecurring && (
                      <div className="mt-4 animate-fadeIn">
                          <select value={frequency} onChange={e => setFrequency(e.target.value as RecurringFrequency)} className="w-full p-3 rounded-xl border-2 border-gray-50 dark:border-gray-800 dark:bg-gray-700 dark:text-white outline-none focus:border-primary-500 transition-all text-sm">
                              <option value="daily">يومياً</option>
                              <option value="weekly">أسبوعياً</option>
                              <option value="monthly">شهرياً</option>
                              <option value="yearly">سنوياً</option>
                          </select>
                      </div>
                  )}
              </div>

              <button type="submit" className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span>إضافة العملية</span>
                  <Plus size={20} />
              </button>
          </form>
      </Modal>
    </div>
  );
};

export default Dashboard;