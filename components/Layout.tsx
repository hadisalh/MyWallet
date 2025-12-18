import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Moon, Sun, Wallet, Download, Share, PlusSquare, X, Monitor, Smartphone, Apple, ShieldCheck } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MENU_ITEMS } from '../constants';
import { Modal } from './ui/Modal';

export const Layout: React.FC = () => {
  const { settings, updateSettings, notifications } = useFinance();
  const [showSplash, setShowSplash] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // زيادة مدة شاشة الترحيب قليلاً لإظهار اسم المطور بوضوح
    const timer = setTimeout(() => setShowSplash(false), 4000);

    // التحقق من نوع الجهاز والبيئة
    const isIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIphone);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // تفعيل إمكانية التثبيت بناءً على الحدث الملتقط في index.tsx
    if (window.deferredPrompt) {
      setIsInstallable(true);
    }

    const handlePwaInstallable = () => setIsInstallable(true);
    window.addEventListener('pwa-installable', handlePwaInstallable);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-installable', handlePwaInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
        setIsInstallable(false);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') setIsInputFocused(true);
    };
    const handleFocusOut = () => setIsInputFocused(false);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const getPageTitle = () => {
    const item = MENU_ITEMS.find(i => i.path === location.pathname);
    return item ? item.label : 'محفظتي';
  };

  const todayDate = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).format(new Date());

  return (
    <div className="flex h-[100dvh] bg-[#f8fafc] dark:bg-[#020617] overflow-hidden font-sans relative transition-colors duration-500">
      
      {/* Splash Screen مع رسالة التطوير */}
      <div className={`fixed inset-0 z-[100] bg-white dark:bg-[#020617] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
             <div className="w-28 h-28 bg-primary-600 rounded-[2.5rem] shadow-2xl flex items-center justify-center animate-[bounce_2s_infinite] mb-8 ring-8 ring-primary-50 dark:ring-primary-900/20">
                <Wallet size={56} className="text-white" />
             </div>
             <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2">محفظتي</h1>
             <p className="text-primary-600 text-sm font-bold tracking-[0.3em] uppercase mb-12">الجيل الجديد من الإدارة المالية</p>
             
             <div className="mt-10 animate-fadeIn delay-700">
                <div className="h-[1px] w-20 bg-gray-200 dark:bg-gray-800 mx-auto mb-6"></div>
                <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mb-2">بإشراف وبرمجة</p>
                <h2 className="text-xl font-black text-gray-800 dark:text-gray-200">الأستاذ هادي الدليمي</h2>
                <div className="flex items-center justify-center gap-2 mt-3 text-emerald-500">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">المطور المعتمد</span>
                </div>
             </div>
         </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 m-4 rounded-[2.5rem] bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 shadow-xl relative z-30">
        <div className="h-28 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xl font-black dark:text-white">محفظتي</span>
        </div>

        <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${isActive ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <Icon size={20} strokeWidth={2} />
                <span className="text-sm font-bold">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 space-y-3">
            {!isStandalone && (
                <button 
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                    <Download size={18} />
                    <span>تثبيت تطبيق أندرويد</span>
                </button>
            )}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-bold mb-1">المطور:</p>
                <p className="text-xs font-black dark:text-white">أ. هادي الدليمي</p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="z-40 sticky top-0 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b dark:border-white/5 px-5 py-4 flex items-center justify-between">
            <div className="flex flex-col">
                <h1 className="text-xl font-black dark:text-white leading-none">{getPageTitle()}</h1>
                <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase">{todayDate}</span>
            </div>

            <div className="flex items-center gap-2">
                {!isStandalone && (
                  <button onClick={handleInstallClick} className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-50 dark:bg-primary-900/20 text-primary-600 transition-all animate-pulse" title="تثبيت التطبيق">
                      <Download size={20} />
                  </button>
                )}
                <button onClick={() => updateSettings({ darkMode: !settings.darkMode })} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 pb-32 z-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border dark:border-white/10 rounded-[2rem] lg:hidden z-40 shadow-2xl transition-all duration-300 ${isInputFocused ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex justify-evenly items-center p-2.5">
            {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${isActive ? 'bg-primary-600 text-white shadow-xl -translate-y-3 scale-110' : 'text-gray-400'}`}>
                        <Icon size={22} strokeWidth={2} />
                    </NavLink>
                );
            })}
        </div>
      </nav>

      {/* Enhanced Install Guide Modal */}
      <Modal isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} title="تثبيت محفظتي">
        <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
                 <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                    <Wallet size={40} className="text-white" />
                 </div>
            </div>
            
            <div className="space-y-4">
                {isIOS ? (
                    <div className="space-y-4 animate-fadeIn">
                        <p className="text-gray-600 dark:text-gray-400 font-medium">لتثبيت التطبيق على جهاز iPhone الخاص بك:</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <Share size={18} />
                                </div>
                                <p className="text-sm font-bold text-right flex-1">1. اضغط على زر "مشاركة" في متصفح Safari</p>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                    <PlusSquare size={18} />
                                </div>
                                <p className="text-sm font-bold text-right flex-1">2. اختر "إضافة للشاشة الرئيسية" (Add to Home Screen)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fadeIn">
                        <p className="text-gray-600 dark:text-gray-400 font-medium">تثبيت تطبيق أندرويد:</p>
                        <div className="bg-primary-50 dark:bg-primary-900/20 p-5 rounded-2xl border border-primary-100 dark:border-primary-800/50">
                            <Smartphone className="mx-auto text-primary-600 mb-3" size={32} />
                            <p className="text-sm font-bold text-primary-800 dark:text-primary-300">اضغط على زر التثبيت الذي سيظهر في المتصفح أو اختر "تثبيت التطبيق" من القائمة الجانبية.</p>
                        </div>
                    </div>
                )}
            </div>

            <button onClick={() => setShowInstallGuide(false)} className="w-full bg-primary-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95">
                فهمت ذلك
            </button>
        </div>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};