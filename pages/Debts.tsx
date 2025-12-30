import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../constants';
import { Modal } from '../components/ui/Modal';
import { Plus, User, ArrowUpRight, ArrowDownLeft, Trash2, Banknote, CheckCircle2, Calculator, Clock } from 'lucide-react';
import { DebtType, Person, DebtItem } from '../types';

export default function Debts() {
  const { people, addPerson, deletePerson, addDebtToPerson, updateDebt, addTransaction, settings } = useFinance();
  
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  const [paymentModalData, setPaymentModalData] = useState<{ personId: string, debt: DebtItem } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [personName, setPersonName] = useState('');
  const [relationType, setRelationType] = useState<DebtType>('owes_me');

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtDate, setNewDebtDate] = useState(getDefaultDueDate());
  const [newDebtNotes, setNewDebtNotes] = useState('');

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
    if (!selectedPerson || !newDebtAmount) return;
    const now = new Date();
    const recordingDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString();
    addDebtToPerson(selectedPerson.id, {
      amount: parseFloat(newDebtAmount),
      date: recordingDate, 
      dueDate: newDebtDate,
      notes: newDebtNotes,
    });
    setNewDebtAmount('');
    setNewDebtDate(getDefaultDueDate());
    setNewDebtNotes('');
  };
  
  const handleQuickPay = (e: React.MouseEvent, person: Person) => {
      e.stopPropagation(); 
      const debtToPay = person.debts.find(d => d.status !== 'paid');
      if (debtToPay) {
          setPaymentModalData({ personId: person.id, debt: debtToPay });
      } else {
          alert('جميع الديون مسددة لهذا الشخص!');
      }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!paymentModalData || !paymentAmount) return;
      const amountToAdd = parseFloat(paymentAmount);
      const remaining = paymentModalData.debt.amount - paymentModalData.debt.paidAmount;
      const finalAmountToAdd = Math.min(amountToAdd, remaining); 
      const newPaidTotal = paymentModalData.debt.paidAmount + finalAmountToAdd;
      
      updateDebt(paymentModalData.personId, paymentModalData.debt.id, {
          paidAmount: newPaidTotal,
      });

      const person = people.find(p => p.id === paymentModalData.personId);
      if (person) {
          const isIncome = person.relationType === 'owes_me'; 
          const now = new Date();
          const txDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString();
          addTransaction({
              amount: finalAmountToAdd,
              type: isIncome ? 'income' : 'expense',
              category: 'سداد ديون',
              date: txDate,
              notes: `سداد دفعة ${isIncome ? 'من' : 'إلى'} ${person.name}`
          });
      }
      setPaymentModalData(null);
      setPaymentAmount('');
  };

  const getPersonTotalDebt = (person: Person) => person.debts.reduce((sum, d) => sum + d.amount, 0);
  const getPersonPaid = (person: Person) => person.debts.reduce((sum, d) => sum + d.paidAmount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-end items-center">
        <button 
          onClick={() => setIsPersonModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>إضافة شخص</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">القائمة فارغة</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">أضف الأشخاص لتبدأ بتتبع الديون</p>
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
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-xl transition-all group overflow-hidden flex flex-col justify-between"
              >
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${
                                isOwesMe 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                            }`}>
                                {person.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{person.name}</h3>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    isOwesMe ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                                }`}>
                                    {isOwesMe ? 'يدين لي' : 'أدين له'}
                                </span>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deletePerson(person.id); }} className="p-2 text-slate-300 hover:text-red-500 rounded-lg">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-end">
                            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">المتبقي</span>
                            <span className={`font-black text-3xl ${isOwesMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(remaining, settings.currency)}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black">
                                <span className="text-slate-400 dark:text-slate-400">الإجمالي: {formatCurrency(total, settings.currency)}</span>
                                <span className="text-slate-500 dark:text-slate-300">تم سداد {Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${isOwesMe ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {hasUnpaidDebts && (
                    <button
                        onClick={(e) => handleQuickPay(e, person)}
                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
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
            <label className="block text-sm font-black mb-2 text-slate-900 dark:text-white">الاسم</label>
            <input required value={personName} onChange={(e) => setPersonName(e.target.value)} className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="اسم الشخص" />
          </div>
          <div>
            <label className="block text-sm font-black mb-2 text-slate-900 dark:text-white">نوع العلاقة</label>
            <div className="grid grid-cols-2 gap-4">
               <button type="button" onClick={() => setRelationType('owes_me')} className={`p-4 rounded-xl border text-sm font-black transition-all ${relationType === 'owes_me' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 dark:border-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'}`}>يدين لي</button>
               <button type="button" onClick={() => setRelationType('i_owe')} className={`p-4 rounded-xl border text-sm font-black transition-all ${relationType === 'i_owe' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 dark:border-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'}`}>أدين له</button>
            </div>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white font-black py-4 rounded-xl shadow-lg">حفظ ومتابعة</button>
        </form>
      </Modal>

      {/* Person Detail Modal */}
      {selectedPerson && (
        <Modal isOpen={!!selectedPerson} onClose={() => setSelectedPerson(null)} title={`تفاصيل: ${selectedPerson.name}`}>
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-black text-sm mb-4 text-slate-900 dark:text-white">إضافة دين جديد</h4>
              <form onSubmit={handleAddDebt} className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <input type="number" required placeholder="المبلغ" value={newDebtAmount} onChange={e => setNewDebtAmount(e.target.value)} className="p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                    <input type="date" value={newDebtDate} onChange={e => setNewDebtDate(e.target.value)} className="p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                 </div>
                 <input type="text" placeholder="ملاحظات..." value={newDebtNotes} onChange={e => setNewDebtNotes(e.target.value)} className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black py-3 rounded-xl">تسجيل الدين</button>
              </form>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <h4 className="font-black text-slate-900 dark:text-white px-1 text-sm">سجل العمليات</h4>
              {selectedPerson.debts.map(debt => (
                <div key={debt.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block font-black text-lg text-slate-900 dark:text-white">{formatCurrency(debt.amount - debt.paidAmount, settings.currency)}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">سُجل في: {formatDate(debt.date)}</p>
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 font-black mt-0.5">الاستحقاق: {formatDate(debt.dueDate)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${debt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {debt.status === 'paid' ? 'خالص' : 'متبقي'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {paymentModalData && (
        <Modal 
          isOpen={!!paymentModalData} 
          onClose={() => { setPaymentModalData(null); setPaymentAmount(''); }} 
          title={`تسديد دفعة إلى ${people.find(p => p.id === paymentModalData.personId)?.name}`}
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">المبلغ المتبقي من هذا الدين</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(paymentModalData.debt.amount - paymentModalData.debt.paidAmount, settings.currency)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-black mb-2 text-slate-900 dark:text-white">قيمة الدفعة</label>
              <input 
                type="number"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg" 
                placeholder="0.00"
                autoFocus
              />
            </div>
            <button type="submit" className="w-full bg-primary-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
              <Banknote size={18}/>
              تأكيد السداد
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}