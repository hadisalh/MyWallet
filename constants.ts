import { PieChart, Home, Wallet, Users, Target, Settings, Bell, Bot, ShoppingBag, Car, Utensils, Zap, HeartPulse, GraduationCap, Plane, Gamepad2, Gift, Briefcase, Smartphone, Coffee, Repeat, CalendarDays } from 'lucide-react';
import { Category } from './types';

export const MENU_ITEMS = [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/calendar', label: 'التقويم', icon: CalendarDays },
  { path: '/recurring', label: 'المتكررة', icon: Repeat },
  { path: '/budget', label: 'الخطة المالية', icon: PieChart },
  { path: '/debts', label: 'إدارة الديون', icon: Users },
  { path: '/goals', label: 'الأهداف', icon: Target },
  { path: '/advisor', label: 'المستشار الذكي', icon: Bot },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
];

export const CURRENCIES = ['IQD', 'SAR', 'USD', 'EGP', 'AED', 'KWD', 'EUR'];

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Mapping string names to actual Icon components for dynamic rendering
export const ICON_MAP: Record<string, any> = {
    Utensils, Car, ShoppingBag, Home, Zap, HeartPulse, GraduationCap, Plane, Gamepad2, Briefcase, Gift, Smartphone, Coffee, Wallet, Target, Repeat, Bell
};

export const DEFAULT_CATEGORIES_DATA: Category[] = [
  { id: 'food', label: 'طعام وشرب', iconName: 'Utensils', color: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-600' },
  { id: 'transport', label: 'نقل ومواصلات', iconName: 'Car', color: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-600' },
  { id: 'shopping', label: 'تسوّق', iconName: 'ShoppingBag', color: '#ec4899', bg: 'bg-pink-100', text: 'text-pink-600' },
  { id: 'housing', label: 'سكن وفواتير', iconName: 'Home', color: '#6366f1', bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { id: 'bills', label: 'كهرباء وإنترنت', iconName: 'Zap', color: '#eab308', bg: 'bg-yellow-100', text: 'text-yellow-600' },
  { id: 'health', label: 'صحة وعلاج', iconName: 'HeartPulse', color: '#ef4444', bg: 'bg-red-100', text: 'text-red-600' },
  { id: 'education', label: 'تعليم', iconName: 'GraduationCap', color: '#8b5cf6', bg: 'bg-violet-100', text: 'text-violet-600' },
  { id: 'travel', label: 'سفر وسياحة', iconName: 'Plane', color: '#06b6d4', bg: 'bg-cyan-100', text: 'text-cyan-600' },
  { id: 'entertainment', label: 'ترفيه', iconName: 'Gamepad2', color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { id: 'salary', label: 'راتب ودخل', iconName: 'Briefcase', color: '#059669', bg: 'bg-green-100', text: 'text-green-700' }, 
  { id: 'gift', label: 'هدايا', iconName: 'Gift', color: '#f43f5e', bg: 'bg-rose-100', text: 'text-rose-600' },
  { id: 'mobile', label: 'اتصالات', iconName: 'Smartphone', color: '#64748b', bg: 'bg-slate-100', text: 'text-slate-600' },
  { id: 'other', label: 'أخرى', iconName: 'Coffee', color: '#9ca3af', bg: 'bg-gray-100', text: 'text-gray-600' },
];

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatCurrency = (amount: number, currency: string) => {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('ar-IQ-u-nu-latn', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0, 
  }).format(safeAmount);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  try {
    return new Intl.DateTimeFormat('ar-IQ-u-nu-latn', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    }).format(date);
  } catch (e) {
    return '';
  }
};