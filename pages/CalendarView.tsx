import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, ICON_MAP } from '../constants';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, parseISO } from 'date-fns';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, AlertCircle, Clock, User, ArrowUpRight, ArrowDownLeft, Wallet, CalendarPlus } from 'lucide-react';

const CalendarView: React.FC = () => {
  const { transactions, settings, categories, people } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);
  
  // Calculate padding days for the grid (assuming Sunday start)
  const startDay = getDay(monthStart); // 0 is Sunday
  const paddingDays = useMemo(() => Array(startDay).fill(null), [startDay]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // --- Data Processing ---

  // 1. Transactions by Date
  const transactionsByDate = useMemo(() => {
      const map = new Map<string, typeof transactions>();
      transactions.forEach(t => {
          const dateKey = t.date.split('T')[0];
          if (!map.has(dateKey)) map.set(dateKey, []);
          map.get(dateKey)?.push(t);
      });
      return map;
  }, [transactions]);

  // 2. Map Debts by CREATION Date (Recorded) AND DUE Date
  const debtEventsByDate = useMemo(() => {
      // Structure: date -> [{ type: 'created' | 'due', data: debtItem, person: personName, relation: relationType }]
      const map = new Map<string, Array<{ eventType: 'created' | 'due', personName: string, relationType: 'i_owe' | 'owes_me', debt: any }>>();
      
      people.forEach(person => {
          person.debts.forEach(debt => {
              if (debt.status === 'paid') return; // Skip paid debts
              
              // 1. Recorded Date (Creation) - Show when I borrowed/lent
              const createdDateKey = (debt.date || new Date().toISOString()).split('T')[0];
              if (!map.has(createdDateKey)) map.set(createdDateKey, []);
              map.get(createdDateKey)?.push({
                  eventType: 'created',
                  personName: person.name,
                  relationType: person.relationType,
                  debt: debt
              });

              // 2. Due Date - Show deadline
              const dueDateKey = debt.dueDate.split('T')[0];
              if (!map.has(dueDateKey)) map.set(dueDateKey, []);
              map.get(dueDateKey)?.push({
                  eventType: 'due',
                  personName: person.name,
                  relationType: person.relationType,
                  debt: debt
              });
          });
      });
      return map;
  }, [people]);

  // 3. Get Summary for a specific day
  const getDayHighlights = (date: Date) => {
      const dateKey = date.toISOString().split('T')[0];
      const txs = transactionsByDate.get(dateKey) || [];
      const debtEvents = debtEventsByDate.get(dateKey) || [];
      
      const hasIncome = txs.some(t => t.type === 'income');
      const hasExpense = txs.some(t => t.type === 'expense');
      
      // Check for specific debt events
      const hasDebtCreated = debtEvents.some(d => d.eventType === 'created');
      const hasDebtDue = debtEvents.some(d => d.eventType === 'due');
      
      return { hasIncome, hasExpense, hasDebtCreated, hasDebtDue, txs, debtEvents };
  };

  const selectedDayData = useMemo(() => {
      if (!selectedDate) return { txs: [], debtEvents: [] };
      const highlights = getDayHighlights(selectedDate);
      return { txs: highlights.txs, debtEvents: highlights.debtEvents };
  }, [selectedDate, transactionsByDate, debtEventsByDate]);

  const getCategoryIcon = (catLabel: string) => {
    const cat = categories.find(c => c.label === catLabel);
    if (cat && ICON_MAP[cat.iconName]) return ICON_MAP[cat.iconName];
    return AlertCircle;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 h-auto lg:h-[calc(100vh-8rem)] pb-20 lg:pb-0">
        
        {/* Left: Calendar Grid */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-700 flex flex-col overflow-hidden backdrop-blur-sm relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            {/* Calendar Header */}
            <div className="p-6 md:p-8 flex justify-between items-center z-10">
                <button onClick={prevMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all active:scale-95 group">
                    <ChevronRight size={22} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { month: 'long', year: 'numeric' }).format(currentDate)}
                    </h2>
                </div>
                <button onClick={nextMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all active:scale-95 group">
                    <ChevronLeft size={22} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                </button>
            </div>

            {/* Days Grid */}
            <div className="flex-1 px-4 pb-4 md:px-8 md:pb-8 flex flex-col">
                <div className="grid grid-cols-7 mb-4 text-center">
                    {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
                        <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 md:gap-3 flex-1">
                    {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                    {daysInMonth.map((day, i) => {
                        const { hasIncome, hasExpense, hasDebtCreated, hasDebtDue } = getDayHighlights(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    relative rounded-2xl flex flex-col items-center justify-start py-2 md:py-3 transition-all duration-300 group
                                    ${isSelected 
                                        ? 'bg-gray-900 text-white shadow-lg scale-105 z-10' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-transparent'
                                    }
                                    ${isToday && !isSelected ? 'bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800' : ''}
                                `}
                            >
                                <span className={`text-sm md:text-base font-bold mb-1.5 ${isToday && !isSelected ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                                    {format(day, 'd')}
                                </span>
                                
                                {/* Dots Indicators */}
                                <div className="flex gap-1 flex-wrap justify-center px-1">
                                    {hasIncome && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>}
                                    {hasExpense && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-400' : 'bg-rose-500'}`}></div>}
                                    {hasDebtCreated && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-amber-500'}`}></div>}
                                    {hasDebtDue && <div className={`w-1.5 h-1.5 border-[1.5px] rounded-full box-border ${isSelected ? 'border-red-400' : 'border-red-500'}`}></div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Legend */}
            <div className="px-8 pb-4 flex flex-wrap items-center justify-center gap-4 text-[10px] md:text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span>دخل</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span>مصروف</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span>تسجيل دين</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-red-500"></div><span>استحقاق</span></div>
            </div>
        </div>

        {/* Right: Details Sidebar */}
        <div className="w-full lg:w-[24rem] bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-700 flex flex-col overflow-hidden relative">
            <div className="p-6 md:p-8 bg-gray-50/80 dark:bg-gray-700/20 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                    {selectedDate ? new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate) : 'اختر يوماً'}
                </h3>
                {selectedDate && (selectedDayData.txs.length > 0 || selectedDayData.debtEvents.length > 0) ? (
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        لديك {selectedDayData.txs.length + selectedDayData.debtEvents.length} أحداث في هذا اليوم
                    </p>
                ) : (
                    <p className="text-xs text-gray-400 font-medium mt-1">لا توجد أحداث مسجلة</p>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
                {(selectedDayData.txs.length === 0 && selectedDayData.debtEvents.length === 0) && (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-center opacity-60">
                        <CalendarIcon size={48} className="mb-3 stroke-1" />
                        <p className="text-sm font-medium">اليوم فارغ</p>
                    </div>
                )}

                {/* Section 1: Debt Events (Priority) */}
                {selectedDayData.debtEvents.length > 0 && (
                    <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-2">
                             <User size={12} className="text-amber-500" />
                             الديون والالتزامات
                        </h4>
                        {selectedDayData.debtEvents.map((item, idx) => {
                            const isOwesMe = item.relationType === 'owes_me';
                            const remaining = item.debt.amount - item.debt.paidAmount;
                            const isCreated = item.eventType === 'created';
                            
                            return (
                                <div key={`debt-${idx}`} className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden group ${
                                    isCreated 
                                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                                    : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-white dark:bg-gray-800 ${isCreated ? 'text-amber-500' : 'text-red-500'}`}>
                                                {isCreated ? <CalendarPlus size={18} /> : <Clock size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">{item.personName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isCreated ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                        {isCreated ? 'تسجيل دين جديد' : 'موعد استحقاق'}
                                                     </span>
                                                     <span className={`text-[9px] font-bold flex items-center gap-1 ${isOwesMe ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isOwesMe ? <ArrowDownLeft size={8} /> : <ArrowUpRight size={8} />}
                                                        {isOwesMe ? 'مستحق لك' : 'واجب الدفع'}
                                                     </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-sm text-gray-900 dark:text-white">{formatCurrency(item.debt.amount, settings.currency)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Section 2: Transactions */}
                {selectedDayData.txs.length > 0 && (
                    <div className="space-y-3 animate-[fadeIn_0.4s_ease-out]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-2">
                            <Wallet size={12} className="text-primary-500" />
                            عمليات مالية
                        </h4>
                        {selectedDayData.txs.map(t => {
                            const Icon = getCategoryIcon(t.category);
                            return (
                                <div key={t.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{t.category}</p>
                                            <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{t.notes || 'بدون ملاحظات'}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
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