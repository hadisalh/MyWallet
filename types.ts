
export type TransactionType = 'income' | 'expense';
export type DebtType = 'i_owe' | 'owes_me'; // debts on me vs debts to me
export type DebtStatus = 'paid' | 'partial' | 'unpaid';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  label: string;
  iconName: string; // Storing string name to map to Lucide icons
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
  date: string; // ISO string
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
  date: string; // ISO String: Creation/Recording Date
  dueDate: string; // ISO String: Deadline
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

// New Dynamic Budget Structure
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