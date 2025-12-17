import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, COLORS, formatDate } from '../constants';
import { Modal } from '../components/ui/Modal';
import { Plus, Target, Trash2, Trophy, Clock } from 'lucide-react';

const Goals: React.FC = () => {
  const { goals, addGoal, deleteGoal, updateGoal, settings } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal({
      name,
      targetAmount: parseFloat(target),
      currentAmount: parseFloat(current) || 0,
      deadline,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setTarget('');
    setCurrent('');
    setDeadline('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Removed - Only Controls */}
      <div className="flex justify-end items-center">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>هدف جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
           <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
             <div className="w-20 h-20 bg-primary-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-primary-500">
                <Trophy className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">ابدأ رحلة الادخار</h3>
             <p className="text-gray-500 max-w-md">قم بإضافة هدف مالي مثل "شراء سيارة" أو "صندوق طوارئ" وابدأ في تتبع تقدمك.</p>
           </div>
        ) : (
          goals.map(goal => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 group relative hover:shadow-xl transition-all duration-300">
                 <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="absolute top-4 left-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg transform group-hover:scale-110 transition-transform" style={{ backgroundColor: goal.color, boxShadow: `0 10px 15px -3px ${goal.color}40` }}>
                    {goal.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate">{goal.name}</h3>
                    {goal.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock size={12} />
                            <span>{formatDate(goal.deadline)}</span>
                        </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-500">المبلغ الحالي</span>
                      <span className="font-extrabold text-lg text-gray-900 dark:text-white">{formatCurrency(goal.currentAmount, settings.currency)}</span>
                    </div>
                    
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md">
                                    {progress.toFixed(0)}%
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-gray-400">
                                   من {formatCurrency(goal.targetAmount, settings.currency)}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-100 dark:bg-gray-700">
                            <div style={{ width: `${progress}%`, backgroundColor: goal.color }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Add funds input */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="relative">
                        <input 
                        type="number" 
                        placeholder="إضافة مبلغ للهدف..."
                        className="w-full text-sm pl-4 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (val) {
                                updateGoal(goal.id, goal.currentAmount + val);
                                (e.target as HTMLInputElement).value = '';
                            }
                            }
                        }}
                        />
                        <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200 dark:bg-gray-600 p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-primary-500 hover:text-white transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة هدف جديد">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">اسم الهدف</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="مثال: شراء لابتوب" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">المبلغ المستهدف</label>
            <input type="number" required value={target} onChange={e => setTarget(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">المبلغ الحالي (اختياري)</label>
            <input type="number" value={current} onChange={e => setCurrent(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">تاريخ التحقيق (اختياري)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all">حفظ الهدف</button>
        </form>
      </Modal>
    </div>
  );
};

export default Goals;