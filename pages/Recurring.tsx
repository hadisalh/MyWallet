import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, ICON_MAP } from '../constants';
import { ArrowDownLeft, ArrowUpRight, Calendar, Trash2, Repeat, Clock, AlertCircle } from 'lucide-react';

const Recurring: React.FC = () => {
  const { recurringTransactions, deleteRecurring, categories, settings } = useFinance();

  const getFrequencyLabel = (freq: string) => {
      switch(freq) {
          case 'daily': return 'يومياً';
          case 'weekly': return 'أسبوعياً';
          case 'monthly': return 'شهرياً';
          case 'yearly': return 'سنوياً';
          default: return freq;
      }
  };

  const getCategoryIcon = (catLabel: string) => {
      const cat = categories.find(c => c.label === catLabel);
      if (cat && ICON_MAP[cat.iconName]) return ICON_MAP[cat.iconName];
      return AlertCircle;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
       <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
           {/* Controls could go here */}
       </div>

       {recurringTransactions.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
               <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 text-blue-500">
                   <Repeat size={40} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد عمليات متكررة</h3>
               <p className="text-gray-500 max-w-md">يمكنك إضافة اشتراكاتك الشهرية (مثل الإنترنت، الجيم) أو دخلك الثابت من خلال زر "إضافة عملية" في الرئيسية واختيار خيار التكرار.</p>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {recurringTransactions.map(rec => {
                   const Icon = getCategoryIcon(rec.category);
                   const isIncome = rec.type === 'income';
                   
                   return (
                       <div key={rec.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative group hover:shadow-lg transition-all">
                           <button 
                               onClick={() => deleteRecurring(rec.id)}
                               className="absolute top-4 left-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                               title="إلغاء التكرار"
                           >
                               <Trash2 size={18} />
                           </button>

                           <div className="flex items-center gap-4 mb-4">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                                   isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                               }`}>
                                   <Icon size={24} />
                               </div>
                               <div>
                                   <h3 className="font-bold text-lg text-gray-900 dark:text-white">{rec.category}</h3>
                                   <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md w-fit">
                                       <Repeat size={10} />
                                       <span>{getFrequencyLabel(rec.frequency)}</span>
                                   </div>
                               </div>
                           </div>

                           <div className="space-y-4">
                               <div className="flex justify-between items-end">
                                   <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">القيمة</span>
                                   <div className={`text-2xl font-black flex items-center gap-1 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                       {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                       {formatCurrency(rec.amount, settings.currency)}
                                   </div>
                               </div>

                               <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                                   <div className="flex items-center gap-1 text-gray-500">
                                       <Calendar size={12} />
                                       <span>بدأ: {formatDate(rec.startDate)}</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                       <Clock size={12} />
                                       <span>القادم: {formatDate(rec.nextRunDate)}</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   );
               })}
           </div>
       )}
    </div>
  );
};

export default Recurring;