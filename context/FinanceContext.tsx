import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AppSettings, BudgetConfig, Goal, Person, Transaction, Notification, DebtItem, Category, RecurringTransaction } from '../types';
import { generateId, DEFAULT_CATEGORIES_DATA } from '../constants';
import { addDays, addWeeks, addMonths, addYears, isSameDay, isAfter, parseISO } from 'date-fns';

interface FinanceContextType {
  transactions: Transaction[];
  people: Person[];
  goals: Goal[];
  budget: BudgetConfig;
  settings: AppSettings;
  notifications: Notification[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  
  // Actions
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  addPerson: (p: Omit<Person, 'id' | 'debts'>) => void;
  deletePerson: (id: string) => void;
  
  addDebtToPerson: (personId: string, debt: Omit<DebtItem, 'id' | 'paidAmount' | 'status'>) => void;
  updateDebt: (personId: string, debtId: string, updates: Partial<DebtItem>) => void;
  
  addGoal: (g: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  
  updateBudget: (config: BudgetConfig) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  markNotificationRead: (id: string) => void;

  addCategory: (c: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addRecurring: (r: Omit<RecurringTransaction, 'id' | 'nextRunDate' | 'active'>) => void;
  deleteRecurring: (id: string) => void;

  exportData: () => void;
  importData: (file: File) => Promise<boolean>;
  resetData: () => void;
}

const defaultSettings: AppSettings = {
  currency: 'IQD',
  darkMode: false,
  notificationsEnabled: true,
};

// Default budget with segments
const defaultBudget: BudgetConfig = {
  monthlyIncome: 0,
  segments: [
    { id: '1', name: 'حاجات أساسية', ratio: 50, color: '#3b82f6' },
    { id: '2', name: 'رغبات ثانوية', ratio: 30, color: '#f59e0b' },
    { id: '3', name: 'ادخار واستثمار', ratio: 20, color: '#10b981' }
  ]
};

const safeLoad = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined" || item === "null") return fallback;
    const parsed = JSON.parse(item);
    return parsed === null ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
};

const loadBudgetWithMigration = (): BudgetConfig => {
    try {
        const item = localStorage.getItem('budget');
        if (!item) return defaultBudget;
        const parsed = JSON.parse(item);
        
        // Migrate old format to new segment format
        if ('needsRatio' in parsed && !('segments' in parsed)) {
            return {
                monthlyIncome: parsed.monthlyIncome || 0,
                segments: [
                    { id: generateId(), name: 'حاجات أساسية', ratio: parsed.needsRatio || 50, color: '#3b82f6' },
                    { id: generateId(), name: 'رغبات ثانوية', ratio: parsed.wantsRatio || 30, color: '#f59e0b' },
                    { id: generateId(), name: 'ادخار واستثمار', ratio: parsed.savingsRatio || 20, color: '#10b981' }
                ]
            };
        }
        return parsed.segments ? parsed : defaultBudget;
    } catch (e) {
        return defaultBudget;
    }
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeLoad('transactions', []));
  const [people, setPeople] = useState<Person[]>(() => safeLoad('people', []));
  const [goals, setGoals] = useState<Goal[]>(() => safeLoad('goals', []));
  const [budget, setBudget] = useState<BudgetConfig>(() => loadBudgetWithMigration());
  const [settings, setSettings] = useState<AppSettings>(() => safeLoad('settings', defaultSettings));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => safeLoad('categories', DEFAULT_CATEGORIES_DATA));
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => safeLoad('recurring', []));

  useEffect(() => {
    const handler = setTimeout(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, 500);
    return () => clearTimeout(handler);
  }, [transactions]);

  useEffect(() => {
    const handler = setTimeout(() => { localStorage.setItem('people', JSON.stringify(people)); }, 500);
    return () => clearTimeout(handler);
  }, [people]);

  useEffect(() => {
    const handler = setTimeout(() => { localStorage.setItem('goals', JSON.stringify(goals)); }, 500);
    return () => clearTimeout(handler);
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('budget', JSON.stringify(budget));
  }, [budget]); 

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings]);

  useEffect(() => {
    const handler = setTimeout(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, 500);
    return () => clearTimeout(handler);
  }, [categories]);

  useEffect(() => {
    const handler = setTimeout(() => { localStorage.setItem('recurring', JSON.stringify(recurringTransactions)); }, 500);
    return () => clearTimeout(handler);
  }, [recurringTransactions]);


  useEffect(() => {
    const processRecurring = () => {
        const today = new Date();
        const processedRecurring: RecurringTransaction[] = [];
        const newTransactions: Transaction[] = [];
        let hasChanges = false;

        recurringTransactions.forEach(rec => {
            let nextRun = parseISO(rec.nextRunDate);
            let modifiedRec = { ...rec };
            
            if (isSameDay(nextRun, today) || isAfter(today, nextRun)) {
                hasChanges = true;
                newTransactions.push({
                    id: generateId(),
                    amount: rec.amount,
                    type: rec.type,
                    category: rec.category,
                    date: nextRun.toISOString(),
                    notes: `تلقائي: ${rec.notes || rec.category}`,
                    isRecurring: true
                });

                let nextDate = nextRun;
                switch (rec.frequency) {
                    case 'daily': nextDate = addDays(nextRun, 1); break;
                    case 'weekly': nextDate = addWeeks(nextRun, 1); break;
                    case 'monthly': nextDate = addMonths(nextRun, 1); break;
                    case 'yearly': nextDate = addYears(nextRun, 1); break;
                }
                modifiedRec.nextRunDate = nextDate.toISOString();
            }
            processedRecurring.push(modifiedRec);
        });

        if (hasChanges) {
            setTransactions(prev => [...newTransactions, ...prev]);
            setRecurringTransactions(processedRecurring);
            if(newTransactions.length > 0) {
                 const newNotif: Notification = {
                     id: generateId(),
                     title: 'عمليات تلقائية',
                     message: `تم تنفيذ ${newTransactions.length} عملية متكررة بنجاح`,
                     date: new Date().toISOString(),
                     read: false,
                     type: 'info'
                 };
                 setNotifications(prev => [newNotif, ...prev]);
            }
        }
    };

    const timer = setTimeout(processRecurring, 2000); 
    return () => clearTimeout(timer);
  }, [recurringTransactions.length]); 

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => { setTransactions(prev => [{ ...t, id: generateId() }, ...prev]); }, []);
  const deleteTransaction = useCallback((id: string) => { setTransactions(prev => prev.filter(t => t.id !== id)); }, []);
  const addPerson = useCallback((p: Omit<Person, 'id' | 'debts'>) => { setPeople(prev => [{ ...p, id: generateId(), debts: [] }, ...prev]); }, []);
  const deletePerson = useCallback((id: string) => { setPeople(prev => prev.filter(p => p.id !== id)); }, []);
  
  const addDebtToPerson = useCallback((personId: string, debt: Omit<DebtItem, 'id' | 'paidAmount' | 'status'>) => {
    setPeople(prev => prev.map(p => p.id === personId ? { ...p, debts: [...p.debts, { ...debt, id: generateId(), paidAmount: 0, status: 'unpaid' }] } : p));
  }, []);

  const updateDebt = useCallback((personId: string, debtId: string, updates: Partial<DebtItem>) => {
    setPeople(prev => prev.map(p => p.id === personId ? {
      ...p,
      debts: p.debts.map(d => d.id === debtId ? { ...d, ...updates, status: (updates.paidAmount ?? d.paidAmount) >= (updates.amount ?? d.amount) ? 'paid' : (updates.paidAmount ?? d.paidAmount) > 0 ? 'partial' : 'unpaid' } : d)
    } : p));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, 'id'>) => { setGoals(prev => [...prev, { ...g, id: generateId() }]); }, []);
  const updateGoal = useCallback((id: string, amount: number) => { setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: amount } : g)); }, []);
  const deleteGoal = useCallback((id: string) => { setGoals(prev => prev.filter(g => g.id !== id)); }, []);
  const updateBudget = useCallback((config: BudgetConfig) => setBudget(config), []);
  const updateSettings = useCallback((s: Partial<AppSettings>) => setSettings(prev => ({ ...prev, ...s })), []);
  const markNotificationRead = useCallback((id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
      setCategories(prev => [...prev, { ...c, id: generateId(), isCustom: true }]);
  }, []);

  const deleteCategory = useCallback((id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const addRecurring = useCallback((r: Omit<RecurringTransaction, 'id' | 'nextRunDate' | 'active'>) => {
      setRecurringTransactions(prev => [...prev, { 
          ...r, 
          id: generateId(), 
          nextRunDate: r.startDate, 
          active: true 
      }]);
  }, []);

  const deleteRecurring = useCallback((id: string) => {
      setRecurringTransactions(prev => prev.filter(r => r.id !== id));
  }, []);

  const exportData = useCallback(() => {
    const data = { transactions, people, goals, budget, settings, categories, recurringTransactions, version: "2.1" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mywallet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions, people, goals, budget, settings, categories, recurringTransactions]);

  const importData = useCallback(async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const rawData = JSON.parse(content);
          if (!rawData || typeof rawData !== 'object') throw new Error("Invalid file");

          setTransactions(rawData.transactions || []);
          setPeople(rawData.people || []);
          setGoals(rawData.goals || []);
          
          if (rawData.budget) {
              if (rawData.budget.segments) {
                  setBudget(rawData.budget);
              } else if (rawData.budget.needsRatio !== undefined) {
                   setBudget({
                        monthlyIncome: rawData.budget.monthlyIncome || 0,
                        segments: [
                            { id: generateId(), name: 'حاجات أساسية', ratio: rawData.budget.needsRatio || 50, color: '#3b82f6' },
                            { id: generateId(), name: 'رغبات ثانوية', ratio: rawData.budget.wantsRatio || 30, color: '#f59e0b' },
                            { id: generateId(), name: 'ادخار واستثمار', ratio: rawData.budget.savingsRatio || 20, color: '#10b981' }
                        ]
                   });
              } else {
                  setBudget(defaultBudget);
              }
          } else {
              setBudget(defaultBudget);
          }
          
          setSettings(rawData.settings || defaultSettings);
          setCategories(rawData.categories || DEFAULT_CATEGORIES_DATA);
          setRecurringTransactions(rawData.recurringTransactions || []);

          resolve(true);
        } catch (e) {
          console.error("Import Error:", e);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const resetData = useCallback(() => {
    localStorage.clear();
    setTransactions([]);
    setPeople([]);
    setGoals([]);
    setBudget(defaultBudget);
    setCategories(DEFAULT_CATEGORIES_DATA);
    setRecurringTransactions([]);
  }, []);

  const contextValue = useMemo(() => ({
    transactions, people, goals, budget, settings, notifications, categories, recurringTransactions,
    addTransaction, deleteTransaction, addPerson, deletePerson,
    addDebtToPerson, updateDebt, addGoal, updateGoal, deleteGoal,
    updateBudget, updateSettings, markNotificationRead,
    addCategory, deleteCategory, addRecurring, deleteRecurring,
    exportData, importData, resetData
  }), [
    transactions, people, goals, budget, settings, notifications, categories, recurringTransactions,
    addTransaction, deleteTransaction, addPerson, deletePerson,
    addDebtToPerson, updateDebt, addGoal, updateGoal, deleteGoal,
    updateBudget, updateSettings, markNotificationRead,
    addCategory, deleteCategory, addRecurring, deleteRecurring,
    exportData, importData, resetData
  ]);

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};