

export type TransactionType = 'income' | 'expense';
export type DebtType = 'i_owe' | 'owes_me';
export type DebtStatus = 'paid' | 'partial' | 'unpaid';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  label: string;
  iconName: string;
  color: string;
  bg: string;
  text: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  notes?: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextRunDate: string;
  active: boolean;
}

export interface DebtItem {
  id: string;
  amount: number;
  paidAmount: number;
  date: string;
  dueDate: string;
  status: DebtStatus;
  notes?: string;
}

export interface Person {
  id: string;
  name: string;
  relationType: DebtType;
  debts: DebtItem[];
  phone?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
}

export interface BudgetSegment {
  id: string;
  name: string;
  ratio: number;
  color: string;
}

export interface BudgetConfig {
  monthlyIncome: number;
  segments: BudgetSegment[];
}

export interface AppSettings {
  currency: string;
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'warning' | 'info' | 'success';
}

// Fixed: Made the 'aistudio' property optional to resolve the "identical modifiers" error.
// This ensures compatibility with the host environment's existing global declarations.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export {};