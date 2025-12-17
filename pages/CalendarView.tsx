import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, ICON_MAP } from '../constants';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

const CalendarView: React.FC = () => {
  const { transactions, settings, categories } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding days for the grid (assuming Sunday start)
  const startDay = getDay(monthStart); // 0 is Sunday
  const paddingDays = Array(startDay).fill(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getTransactionsForDay = (date: Date) => {
      return transactions.filter(t => isSameDay(new Date(t.date), date));
  };

  const getDaySummary = (date: Date) => {
      const txs = getTransactionsForDay(date);
      const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { income, expense, hasTx: txs.length > 0 };
  };

  const selectedDayTransactions = selectedDate ? getTransactionsForDay(selectedDate) : [];

  const getCategoryIcon = (catLabel: string) => {
    const cat = categories.find(c => c.label === catLabel);
    if (cat && ICON_MAP[cat.iconName]) return ICON_MAP[cat.iconName];
    return AlertCircle;
};

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Calendar Column */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <ChevronRight size={20} />
                </button>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Days Grid */}
            <div className="flex-1 p-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
                        <div key={day} className="text-xs font-bold text-gray-400 py-2">{day}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 h-full auto-rows-fr">
                    {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                    {daysInMonth.map((day, i) => {
                        const summary = getDaySummary(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    relative rounded-xl flex flex-col items-center justify-start py-2 transition-all border
                                    ${isSelected 
                                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 ring-1 ring-primary-500' 
                                        : 'bg-gray-50 dark:bg-gray-700/30 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                                    }
                                    ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {format(day, 'd')}
                                </span>
                                {summary.hasTx && (
                                    <div className="flex gap-1">
                                        {summary.income > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                                        {summary.expense > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Details Column */}
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    {selectedDate ? formatDate(selectedDate.toISOString()) : 'اختر يوماً'}
                </h3>
                {selectedDate && (
                    <div className="flex gap-4 text-xs font-bold mt-2">
                         <div className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">
                             +{formatCurrency(getDaySummary(selectedDate).income, settings.currency)}
                         </div>
                         <div className="text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-lg">
                             -{formatCurrency(getDaySummary(selectedDate).expense, settings.currency)}
                         </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {selectedDayTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                        <CalendarIcon size={40} className="mb-2 opacity-20" />
                        <p className="text-sm">لا توجد عمليات في هذا اليوم</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedDayTransactions.map(t => {
                            const Icon = getCategoryIcon(t.category);
                            return (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{t.category}</p>
                                            <p className="text-xs text-gray-500">{t.notes || 'بدون ملاحظات'}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(t.amount, settings.currency)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default CalendarView;