import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, generateId } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Edit2, Check, AlertCircle, TrendingUp, Plus, Trash2, Palette } from 'lucide-react';
import { BudgetConfig, BudgetSegment } from '../types';

const COLORS_PRESETS = [
  '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f97316'
];

export default function Budget() {
  const { budget, updateBudget, settings, transactions } = useFinance();
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing
  const [tempBudget, setTempBudget] = useState<BudgetConfig>(JSON.parse(JSON.stringify(budget)));
  
  // New Segment State
  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentRatio, setNewSegmentRatio] = useState(0);
  const [newSegmentColor, setNewSegmentColor] = useState(COLORS_PRESETS[0]);

  // Calculate Spendings (Current Month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  // Prepare Chart Data
  const activeBudget = isEditing ? tempBudget : budget;
  
  const chartData = activeBudget.segments.map(seg => ({
      name: seg.name,
      value: (activeBudget.monthlyIncome * seg.ratio) / 100,
      color: seg.color,
      ratio: seg.ratio
  }));

  const totalRatio = activeBudget.segments.reduce((acc, seg) => acc + seg.ratio, 0);

  const handleSave = () => {
    if (totalRatio === 100) {
      updateBudget(tempBudget);
      setIsEditing(false);
    } else {
      alert(`مجموع النسب هو ${totalRatio}%، يجب أن يكون 100% تماماً.`);
    }
  };

  const handleCancel = () => {
    setTempBudget(JSON.parse(JSON.stringify(budget)));
    setIsEditing(false);
    setIsAddingSegment(false);
  };

  const deleteSegment = (id: string) => {
    setTempBudget(prev => ({
        ...prev,
        segments: prev.segments.filter(s => s.id !== id)
    }));
  };

  const updateSegment = (id: string, field: keyof BudgetSegment, value: any) => {
      setTempBudget(prev => ({
          ...prev,
          segments: prev.segments.map(s => s.id === id ? { ...s, [field]: value } : s)
      }));
  };

  const addNewSegment = () => {
      if(!newSegmentName) return;
      const newSeg: BudgetSegment = {
          id: generateId(),
          name: newSegmentName,
          ratio: newSegmentRatio,
          color: newSegmentColor
      };
      setTempBudget(prev => ({
          ...prev,
          segments: [...prev.segments, newSeg]
      }));
      setNewSegmentName('');
      setNewSegmentRatio(0);
      setIsAddingSegment(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        {isEditing ? (
            <div className="flex gap-2 w-full md:w-auto">
                 <button 
                    onClick={handleSave}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-white ${totalRatio === 100 ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    <Check size={18} />
                    <span>حفظ التعديلات</span>
                </button>
                <button 
                    onClick={handleCancel}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold bg-white dark:bg-gray-800 text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                    إلغاء
                </button>
            </div>
        ) : (
            <button 
            onClick={() => { setTempBudget(JSON.parse(JSON.stringify(budget))); setIsEditing(true); }}
            className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
            <Edit2 size={18} />
            <span>تعديل الخطة</span>
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor / List Section */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          {/* Income Input */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">الدخل الشهري المتوقع</label>
            <div className="relative group">
              <input 
                type="number"
                disabled={!isEditing}
                value={activeBudget.monthlyIncome}
                onChange={(e) => isEditing && setTempBudget({ ...tempBudget, monthlyIncome: parseFloat(e.target.value) || 0 })}
                className="w-full p-4 pl-12 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 dark:text-white font-extrabold text-2xl focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-80 disabled:cursor-not-allowed transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-hover:text-primary-500 transition-colors">{settings.currency}</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary-500" />
                    تقسيم الميزانية
                </h4>
                {isEditing && (
                    <button 
                        onClick={() => setIsAddingSegment(true)}
                        className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {activeBudget.segments.map((seg) => (
                <div key={seg.id} className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 relative group">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }}></div>
                            {isEditing ? (
                                <input 
                                    type="text"
                                    value={seg.name}
                                    onChange={(e) => updateSegment(seg.id, 'name', e.target.value)}
                                    className="bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-bold w-24 outline-none focus:border-primary-500"
                                />
                            ) : (
                                <span className={`text-sm font-bold text-gray-700 dark:text-gray-200`}>{seg.name}</span>
                            )}
                        </div>
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg shadow-sm">
                            {seg.ratio}%
                        </span>
                    </div>
                    
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        disabled={!isEditing}
                        value={seg.ratio}
                        onChange={(e) => updateSegment(seg.id, 'ratio', parseInt(e.target.value) || 0)}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-primary-600 disabled:cursor-default"
                        style={{ accentColor: seg.color }}
                    />
                    
                    {isEditing && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600/50">
                             <div className="flex gap-1">
                                {COLORS_PRESETS.slice(0, 5).map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => updateSegment(seg.id, 'color', c)}
                                        className={`w-4 h-4 rounded-full ${seg.color === c ? 'ring-2 ring-gray-400' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                             </div>
                             <button 
                                onClick={() => deleteSegment(seg.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                             >
                                 <Trash2 size={14} />
                             </button>
                        </div>
                    )}
                </div>
                ))}

                {/* New Segment Form */}
                {isAddingSegment && isEditing && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border-2 border-dashed border-primary-300 dark:border-primary-700 animate-[fadeIn_0.3s]">
                        <input 
                             type="text"
                             placeholder="اسم القسم (مثلاً: طوارئ)"
                             value={newSegmentName}
                             onChange={(e) => setNewSegmentName(e.target.value)}
                             className="w-full text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2 outline-none border border-transparent focus:border-primary-500"
                             autoFocus
                        />
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">النسبة:</span>
                            <input 
                                type="number"
                                value={newSegmentRatio}
                                onChange={(e) => setNewSegmentRatio(parseInt(e.target.value) || 0)}
                                className="w-16 text-sm p-1 bg-gray-50 dark:bg-gray-800 rounded-lg outline-none text-center font-bold"
                            />
                            <span className="text-xs font-bold">%</span>
                        </div>
                        <div className="flex gap-1 mb-3 flex-wrap">
                            {COLORS_PRESETS.map(c => (
                                <button 
                                    key={c} 
                                    onClick={() => setNewSegmentColor(c)}
                                    className={`w-5 h-5 rounded-full ${newSegmentColor === c ? 'ring-2 ring-gray-400 scale-110' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={addNewSegment} className="flex-1 bg-primary-600 text-white text-xs font-bold py-1.5 rounded-lg">إضافة</button>
                            <button onClick={() => setIsAddingSegment(false)} className="flex-1 bg-gray-100 text-gray-500 text-xs font-bold py-1.5 rounded-lg">إلغاء</button>
                        </div>
                    </div>
                )}
            </div>

            <div className={`text-sm font-bold text-center py-3 rounded-xl transition-colors ${totalRatio === 100 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                 المجموع: {totalRatio}% 
                 {totalRatio !== 100 && <span className="block text-xs font-normal opacity-80 mt-1">يجب أن يساوي 100% للحفظ</span>}
            </div>
          </div>
        </div>

        {/* Visualization Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-start relative overflow-hidden min-h-[500px]">
             {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -z-0 opacity-50"></div>

            {activeBudget.monthlyIncome === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 z-10">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p>الرجاء إدخال الراتب الشهري لعرض المخطط</p>
                </div>
            ) : (
                <>
                    <div className="w-full h-[350px] relative z-10">
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
                            <div className="font-extrabold text-2xl text-gray-900 dark:text-white mt-1">{formatCurrency(activeBudget.monthlyIncome, settings.currency)}</div>
                        </div>
                    </div>

                    <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 z-10">
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <h5 className="text-xs font-bold text-gray-500 mb-1">المصروف الفعلي (هذا الشهر)</h5>
                            <p className={`text-xl font-black ${monthExpenses > activeBudget.monthlyIncome ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                {formatCurrency(monthExpenses, settings.currency)}
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${monthExpenses > activeBudget.monthlyIncome ? 'bg-red-500' : 'bg-primary-500'}`}
                                    style={{ width: `${Math.min((monthExpenses / activeBudget.monthlyIncome) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                         
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col justify-center">
                             <div className="flex items-center gap-2 mb-2">
                                 <AlertCircle size={16} className={monthExpenses > activeBudget.monthlyIncome ? "text-red-500" : "text-green-500"} />
                                 <span className="text-xs font-bold text-gray-500">الحالة المالية</span>
                             </div>
                             <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                 {monthExpenses > activeBudget.monthlyIncome 
                                    ? 'لقد تجاوزت الحد المسموح به للميزانية الشهرية.' 
                                    : `أنت في وضع آمن، متبقي ${formatCurrency(activeBudget.monthlyIncome - monthExpenses, settings.currency)}.`}
                             </p>
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
}