import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  // New Actions for Features 1 & 4
  addCategory: (c: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addRecurring: (r: Omit<RecurringTransaction, 'id' | 'nextRunDate' | 'active'>) => void;
  deleteRecurring: (id: string) => void;

  // Data Management
  exportData: () => void;
  importData: (file: File) => Promise<boolean>;
  resetData: () => void;
}

const defaultSettings: AppSettings = {
  currency: 'IQD',
  darkMode: false,
  notificationsEnabled: true,
};

const defaultBudget: BudgetConfig = {
  monthlyIncome: 0,
  needsRatio: 60,
  wantsRatio: 30,
  savingsRatio: 10,
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

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeLoad('transactions', []));
  const [people, setPeople] = useState<Person[]>(() => safeLoad('people', []));
  const [goals, setGoals] = useState<Goal[]>(() => safeLoad('goals', []));
  const [budget, setBudget] = useState<BudgetConfig>(() => safeLoad('budget', defaultBudget));
  const [settings, setSettings] = useState<AppSettings>(() => safeLoad('settings', defaultSettings));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // New State for Features 1 & 4
  const [categories, setCategories] = useState<Category[]>(() => safeLoad('categories', DEFAULT_CATEGORIES_DATA));
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => safeLoad('recurring', []));

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('people', JSON.stringify(people)); }, [people]);
  useEffect(() => { localStorage.setItem('goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('budget', JSON.stringify(budget)); }, [budget]);
  useEffect(() => { localStorage.setItem('settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('recurring', JSON.stringify(recurringTransactions)); }, [recurringTransactions]);

  useEffect(() => {
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.darkMode]);

  // --- RECURRING LOGIC PROCESSOR ---
  useEffect(() => {
    const processRecurring = () => {
        const today = new Date();
        const processedRecurring: RecurringTransaction[] = [];
        const newTransactions: Transaction[] = [];
        let hasChanges = false;

        recurringTransactions.forEach(rec => {
            let nextRun = parseISO(rec.nextRunDate);
            let modifiedRec = { ...rec };
            
            // If the next run date is today or in the past, generate transaction
            if (isSameDay(nextRun, today) || isAfter(today, nextRun)) {
                hasChanges = true;
                
                // Add Transaction
                newTransactions.push({
                    id: generateId(),
                    amount: rec.amount,
                    type: rec.type,
                    category: rec.category,
                    date: nextRun.toISOString(),
                    notes: `تلقائي: ${rec.notes || rec.category}`,
                    isRecurring: true
                });

                // Calculate next run date
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
            // Optionally add a notification
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

    const timer = setTimeout(processRecurring, 2000); // Small delay to ensure load
    return () => clearTimeout(timer);
  }, [recurringTransactions.length]); // Only re-bind if count changes, logic handles inner updates

  // --- ACTIONS ---
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

  // New Actions
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
          nextRunDate: r.startDate, // Initial run date matches start date
          active: true 
      }]);
  }, []);

  const deleteRecurring = useCallback((id: string) => {
      setRecurringTransactions(prev => prev.filter(r => r.id !== id));
  }, []);

  // --- DATA MANAGEMENT ---
  const exportData = useCallback(() => {
    const data = { transactions, people, goals, budget, settings, categories, recurringTransactions, version: "2.0" };
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
          setBudget(rawData.budget || defaultBudget);
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

  return (
    <FinanceContext.Provider value={{
      transactions, people, goals, budget, settings, notifications, categories, recurringTransactions,
      addTransaction, deleteTransaction, addPerson, deletePerson,
      addDebtToPerson, updateDebt, addGoal, updateGoal, deleteGoal,
      updateBudget, updateSettings, markNotificationRead,
      addCategory, deleteCategory, addRecurring, deleteRecurring,
      exportData, importData, resetData
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};