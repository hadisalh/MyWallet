import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Edit2, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { BudgetConfig } from '../types';

export default function Budget() {
  const { budget, updateBudget, settings, transactions } = useFinance();
  const [isEditing, setIsEditing] = useState(false);
  
  const [tempBudget, setTempBudget] = useState<BudgetConfig>(budget);

  // Calculate Spendings
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const calculatedNeeds = (budget.monthlyIncome * budget.needsRatio) / 100;
  const calculatedWants = (budget.monthlyIncome * budget.wantsRatio) / 100;
  const calculatedSavings = (budget.monthlyIncome * budget.savingsRatio) / 100;

  const chartData = [
    { name: 'حاجات أساسية', value: calculatedNeeds, color: '#3b82f6' }, // Blue
    { name: 'رغبات ثانوية', value: calculatedWants, color: '#f59e0b' }, // Amber
    { name: 'ادخار واستثمار', value: calculatedSavings, color: '#10b981' }, // Green
  ];

  const handleSave = () => {
    // Validate ratios sum to 100
    const sum = Number(tempBudget.needsRatio) + Number(tempBudget.wantsRatio) + Number(tempBudget.savingsRatio);
    if (sum === 100) {
      updateBudget(tempBudget);
      setIsEditing(false);
    } else {
      alert('يجب أن يكون مجموع النسب 100%');
    }
  };

  const categories = [
    { label: 'حاجات أساسية', key: 'needsRatio' as keyof BudgetConfig, color: 'text-blue-600', bg: 'bg-blue-600', rangeColor: 'accent-blue-600' },
    { label: 'رغبات ثانوية', key: 'wantsRatio' as keyof BudgetConfig, color: 'text-amber-500', bg: 'bg-amber-500', rangeColor: 'accent-amber-500' },
    { label: 'ادخار واستثمار', key: 'savingsRatio' as keyof BudgetConfig, color: 'text-emerald-600', bg: 'bg-emerald-600', rangeColor: 'accent-emerald-600' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Removed - Only Controls */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 ${
            isEditing 
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
          <span>{isEditing ? 'حفظ التعديلات' : 'تعديل الخطة'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8 h-full">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">الدخل الشهري المتوقع</label>
            <div className="relative group">
              <input 
                type="number"
                disabled={!isEditing}
                value={isEditing ? tempBudget.monthlyIncome : budget.monthlyIncome}
                onChange={(e) => setTempBudget({ ...tempBudget, monthlyIncome: parseFloat(e.target.value) || 0 })}
                className="w-full p-4 pl-12 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 dark:text-white font-extrabold text-2xl focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-80 disabled:cursor-not-allowed transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-hover:text-primary-500 transition-colors">{settings.currency}</span>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-gray-800 dark:text-white border-b pb-4 dark:border-gray-700 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-500" />
                توزيع النسب (%)
            </h4>
            {categories.map((item) => (
              <div key={item.key} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl">
                <div className="flex justify-between mb-3">
                  <span className={`text-sm font-bold ${item.color}`}>{item.label}</span>
                  <span className="text-lg font-extrabold text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-0.5 rounded-lg shadow-sm">
                    {isEditing ? tempBudget[item.key] : budget[item.key]}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  disabled={!isEditing}
                  value={isEditing ? (tempBudget[item.key] as number) : (budget[item.key] as number)}
                  onChange={(e) => setTempBudget({ ...tempBudget, [item.key]: parseInt(e.target.value) || 0 })}
                  className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 ${item.rangeColor} disabled:cursor-default`}
                />
              </div>
            ))}
            {isEditing && (
              <div className={`text-sm font-bold text-center py-2 rounded-xl ${Number(tempBudget.needsRatio) + Number(tempBudget.wantsRatio) + Number(tempBudget.savingsRatio) === 100 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                 المجموع: {Number(tempBudget.needsRatio) + Number(tempBudget.wantsRatio) + Number(tempBudget.savingsRatio)}%
              </div>
            )}
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
             {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -z-0 opacity-50"></div>

            {budget.monthlyIncome === 0 ? (
                <div className="text-center text-gray-400 z-10">
                    <p>الرجاء إدخال الراتب الشهري لعرض المخطط</p>
                </div>
            ) : (
                <div className="w-full h-[320px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius={90}
                                outerRadius={130}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value, settings.currency)}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle" 
                                iconSize={10}
                                formatter={(value, entry: any) => <span className="text-gray-600 dark:text-gray-300 font-medium mr-2">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-6 text-center pointer-events-none">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي الميزانية</span>
                        <div className="font-extrabold text-2xl text-gray-900 dark:text-white mt-1">{formatCurrency(budget.monthlyIncome, settings.currency)}</div>
                    </div>
                </div>
            )}
            
            <div className="w-full mt-8 bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl z-10">
                 <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-white font-bold text-lg">
                    <AlertCircle size={24} className="text-primary-500" />
                    <h3>مراقبة الصرف</h3>
                 </div>
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-500">المصروف الفعلي هذا الشهر</span>
                    <span className={`font-extrabold text-lg ${monthExpenses > budget.monthlyIncome ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(monthExpenses, settings.currency)}
                    </span>
                 </div>
                 <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${monthExpenses > budget.monthlyIncome ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-primary-500 to-primary-600'}`}
                        style={{ width: `${Math.min((monthExpenses / (budget.monthlyIncome || 1)) * 100, 100)}%` }}
                    />
                 </div>
                 <div className="flex justify-between items-center mt-3">
                     <p className="text-xs font-medium text-gray-500">
                        {monthExpenses > budget.monthlyIncome ? '⚠️ تنبيه: تجاوزت الحد المسموح' : '✅ وضعك المالي ممتاز'}
                     </p>
                     <span className="text-xs font-bold text-gray-400">{((monthExpenses / (budget.monthlyIncome || 1)) * 100).toFixed(1)}% مستخدم</span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}