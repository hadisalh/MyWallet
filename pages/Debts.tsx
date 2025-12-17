import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../constants';
import { Modal } from '../components/ui/Modal';
import { Plus, User, ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Banknote, CheckCircle2, Calculator, Clock, AlertCircle } from 'lucide-react';
import { DebtType, Person, DebtItem } from '../types';

export default function Debts() {
  const { people, addPerson, deletePerson, addDebtToPerson, updateDebt, addTransaction, settings } = useFinance();
  
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  // Payment Modal State
  const [paymentModalData, setPaymentModalData] = useState<{ personId: string, debt: DebtItem } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // New Person Form
  const [personName, setPersonName] = useState('');
  const [relationType, setRelationType] = useState<DebtType>('owes_me');

  // Helper: Get Date after 30 days
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // New Debt Form
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtDate, setNewDebtDate] = useState(getDefaultDueDate());
  const [newDebtNotes, setNewDebtNotes] = useState('');

  // Reset form when opening a person details modal
  useEffect(() => {
    if (selectedPerson) {
        setNewDebtAmount('');
        setNewDebtDate(getDefaultDueDate());
        setNewDebtNotes('');
    }
  }, [selectedPerson]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    addPerson({ name: personName, relationType });
    setIsPersonModalOpen(false);
    setPersonName('');
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;
    
    addDebtToPerson(selectedPerson.id, {
      amount: parseFloat(newDebtAmount),
      dueDate: newDebtDate,
      notes: newDebtNotes,
    });

    setNewDebtAmount('');
    setNewDebtDate(getDefaultDueDate());
    setNewDebtNotes('');
  };
  
  // Logic to find a debt to pay when clicking the Quick Pay button on the card
  const handleQuickPay = (e: React.MouseEvent, person: Person) => {
      e.stopPropagation(); // Stop opening details modal
      
      // Find the first unpaid or partial debt
      const debtToPay = person.debts.find(d => d.status !== 'paid');
      
      if (debtToPay) {
          setPaymentModalData({ personId: person.id, debt: debtToPay });
      } else {
          // If all paid, maybe create a new alert or just open details
          // For now, let's open details if no debt to pay, or just do nothing
          if (person.debts.length > 0) {
              alert('جميع الديون مسددة لهذا الشخص!');
          } else {
              alert('لا توجد ديون مسجلة لتسديدها.');
          }
      }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!paymentModalData || !paymentAmount) return;
      
      const amountToAdd = parseFloat(paymentAmount);
      if(isNaN(amountToAdd) || amountToAdd <= 0) return;
      
      const remaining = paymentModalData.debt.amount - paymentModalData.debt.paidAmount;
      const finalAmountToAdd = Math.min(amountToAdd, remaining); 

      const newPaidTotal = paymentModalData.debt.paidAmount + finalAmountToAdd;
      
      // Reset reminder timer
      const extendedDueDate = new Date();
      extendedDueDate.setDate(extendedDueDate.getDate() + 30);
      const newDueDateStr = extendedDueDate.toISOString().split('T')[0];
      
      updateDebt(paymentModalData.personId, paymentModalData.debt.id, {
          paidAmount: newPaidTotal,
          dueDate: newDueDateStr 
      });

      // Add Transaction Record
      const person = people.find(p => p.id === paymentModalData.personId);
      if (person) {
          const isIncome = person.relationType === 'owes_me'; 
          
          addTransaction({
              amount: finalAmountToAdd,
              type: isIncome ? 'income' : 'expense',
              category: 'سداد ديون',
              date: new Date().toISOString(),
              notes: `سداد دفعة ${isIncome ? 'من' : 'إلى'} ${person.name} (المتبقي: ${formatCurrency(remaining - finalAmountToAdd, settings.currency)})`
          });
      }
      
      setPaymentModalData(null);
      setPaymentAmount('');
  };

  const getPersonTotalDebt = (person: Person) => {
    return person.debts.reduce((sum, d) => sum + d.amount, 0);
  };

  const getPersonPaid = (person: Person) => {
    return person.debts.reduce((sum, d) => sum + d.paidAmount, 0);
  };

  // Calculations for Modal
  const debtTotal = paymentModalData ? paymentModalData.debt.amount : 0;
  const debtPaid = paymentModalData ? paymentModalData.debt.paidAmount : 0;
  const debtRemaining = debtTotal - debtPaid;
  const currentPayValue = parseFloat(paymentAmount) || 0;
  const newRemaining = Math.max(0, debtRemaining - currentPayValue);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Removed - Only Controls */}
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        <button 
          onClick={() => setIsPersonModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>إضافة شخص</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">القائمة فارغة</h3>
            <p className="text-gray-500 text-sm mt-1">أضف الأشخاص لتبدأ بتتبع الديون والمستحقات</p>
          </div>
        ) : (
          people.map(person => {
            const total = getPersonTotalDebt(person);
            const paid = getPersonPaid(person);
            const remaining = total - paid;
            const isOwesMe = person.relationType === 'owes_me';
            const progress = total > 0 ? (paid / total) * 100 : 0;
            const hasUnpaidDebts = person.debts.some(d => d.status !== 'paid');

            return (
              <div 
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Indicator of Debt Type */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${isOwesMe ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent rounded-bl-[4rem]`}></div>

                <div>
                    <div className="flex justify-between items-start mb-6 relative">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md ${
                                isOwesMe 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                            }`}>
                                {person.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{person.name}</h3>
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                                    isOwesMe ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                                }`}>
                                    {isOwesMe ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                    {isOwesMe ? 'يدين لي' : 'أدين له'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deletePerson(person.id); }}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-end">
                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">المتبقي</span>
                        <span className={`font-extrabold text-3xl ${isOwesMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatCurrency(remaining, settings.currency)}
                        </span>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-400">الإجمالي: {formatCurrency(total, settings.currency)}</span>
                            <span className="text-gray-500">تم سداد {Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isOwesMe ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    </div>
                </div>

                {/* Separate Payment Action Button */}
                {hasUnpaidDebts && (
                    <button
                        onClick={(e) => handleQuickPay(e, person)}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            isOwesMe 
                            ? 'bg-gray-900 text-white hover:bg-emerald-600' 
                            : 'bg-gray-900 text-white hover:bg-rose-600'
                        }`}
                    >
                        <Banknote size={18} />
                        <span>تسديد دفعة</span>
                    </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Person Modal */}
      <Modal isOpen={isPersonModalOpen} onClose={() => setIsPersonModalOpen(false)} title="إضافة شخص جديد">
        <form onSubmit={handleAddPerson} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">الاسم</label>
            <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full pr-11 pl-4 py-3.5 border border-gray-200 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="اسم الشخص"
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">نوع العلاقة</label>
            <div className="grid grid-cols-2 gap-4">
               <button
                type="button"
                onClick={() => setRelationType('owes_me')}
                className={`p-4 rounded-xl border text-sm font-bold transition-all ${relationType === 'owes_me' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800'}`}
               >
                 <div className="flex flex-col items-center gap-2">
                    <ArrowDownLeft className={relationType === 'owes_me' ? 'text-emerald-600' : 'text-gray-400'} />
                    <span>ديون لي (يدين لي)</span>
                 </div>
               </button>
               <button
                type="button"
                onClick={() => setRelationType('i_owe')}
                className={`p-4 rounded-xl border text-sm font-bold transition-all ${relationType === 'i_owe' ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800'}`}
               >
                  <div className="flex flex-col items-center gap-2">
                    <ArrowUpRight className={relationType === 'i_owe' ? 'text-rose-600' : 'text-gray-400'} />
                    <span>ديون علي (أدين له)</span>
                 </div>
               </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 transition-all">حفظ ومتابعة</button>
        </form>
      </Modal>

      {/* Person Detail Modal (Manage Debts) */}
      {selectedPerson && (
        <Modal 
          isOpen={!!selectedPerson} 
          onClose={() => setSelectedPerson(null)} 
          title={`تفاصيل الديون: ${selectedPerson.name}`}
        >
          <div className="space-y-6">
            {/* Add New Debt Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-2">
                 <Plus size={16} className="text-primary-500" />
                 إضافة دين جديد
              </h4>
              <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <input 
                    type="number" 
                    placeholder="المبلغ" 
                    value={newDebtAmount}
                    onChange={e => setNewDebtAmount(e.target.value)}
                    className="p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <div className="relative">
                        <input 
                        type="date" 
                        value={newDebtDate}
                        onChange={e => setNewDebtDate(e.target.value)}
                        className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded font-bold pointer-events-none">
                            تنبيه بعد 30 يوم
                        </span>
                    </div>
                 </div>
                 <input 
                    type="text" 
                    placeholder="ملاحظات حول الدين..." 
                    value={newDebtNotes}
                    onChange={e => setNewDebtNotes(e.target.value)}
                    className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                <button 
                    onClick={handleAddDebt}
                    disabled={!newDebtAmount || !newDebtDate}
                    className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    إضافة للقائمة
                </button>
              </div>
            </div>

            {/* List of Debts */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 px-1">سجل الديون</h4>
              {selectedPerson.debts.length === 0 && (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      لا توجد ديون مسجلة.
                  </div>
              )}
              {selectedPerson.debts.map(debt => {
                 const currentRemaining = debt.amount - debt.paidAmount;
                 return (
                <div key={debt.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {/* Debt Info */}
                      <span className="block font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        {formatCurrency(currentRemaining, settings.currency)} 
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">متبقي</span>
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="line-through opacity-50">{formatCurrency(debt.amount, settings.currency)}</span>
                          <span className="text-gray-300">|</span>
                          <Clock size={12} className={new Date(debt.dueDate) < new Date() && debt.status !== 'paid' ? 'text-red-500' : ''} />
                          <span className={new Date(debt.dueDate) < new Date() && debt.status !== 'paid' ? 'text-red-500 font-bold' : ''}>
                             تنبيه: {formatDate(debt.dueDate)}
                          </span>
                      </div>
                      {debt.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg inline-block">{debt.notes}</p>}
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      debt.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      debt.status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {debt.status === 'paid' ? 'خالص' : debt.status === 'partial' ? 'جاري السداد' : 'غير مدفوع'}
                    </span>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="mt-3">
                     <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                        <span>تم سداد: {formatCurrency(debt.paidAmount, settings.currency)}</span>
                        <span>{Math.round((debt.paidAmount / debt.amount) * 100)}%</span>
                     </div>
                     <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                           className={`h-full rounded-full transition-all duration-500 ${debt.status === 'paid' ? 'bg-green-500' : 'bg-primary-500'}`}
                           style={{ width: `${(debt.paidAmount / debt.amount) * 100}%` }}
                        ></div>
                     </div>
                  </div>
                  
                   {/* Payment Button inside modal (Still available if needed, but distinct) */}
                   {debt.status !== 'paid' && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                      <button 
                         onClick={() => setPaymentModalData({ personId: selectedPerson.id, debt })}
                         className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                         <Banknote size={14} />
                         <span>تسديد هذه الدفعة</span>
                      </button>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      <Modal 
        isOpen={!!paymentModalData} 
        onClose={() => { setPaymentModalData(null); setPaymentAmount(''); }} 
        title="تسديد دفعة"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>قيمة الدين الأصلي</span>
                    <span className="line-through">{formatCurrency(debtTotal, settings.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white text-lg">
                    <span>المتبقي للدفع</span>
                    <span>{formatCurrency(debtRemaining, settings.currency)}</span>
                </div>
                
                {/* Due Date Extension Note */}
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg flex items-center gap-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    <Clock size={12} />
                    <span>سيتم خصم الدفعة وتمديد الاستحقاق 30 يوماً تلقائياً</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold mb-2 dark:text-gray-300">قيمة الدفعة</label>
                <div className="relative">
                    <input 
                        type="number"
                        required
                        min="1"
                        max={debtRemaining}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-4 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-lg"
                        placeholder="0.00"
                    />
                </div>
                {currentPayValue > 0 && (
                     <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                         <Calculator size={14} />
                         <span>المتبقي الجديد: {formatCurrency(newRemaining, settings.currency)}</span>
                     </div>
                )}
            </div>

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={20} />
                <span>تأكيد الخصم وتمديد الوقت</span>
            </button>
        </form>
      </Modal>
    </div>
  );
}