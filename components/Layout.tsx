import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Moon, Sun, Wallet, Calendar, Download, Share, PlusSquare, X, MonitorSmartphone, Monitor } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MENU_ITEMS } from '../constants';
import { Modal } from './ui/Modal';

export const Layout: React.FC = () => {
  const { settings, updateSettings, notifications, markNotificationRead } = useFinance();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500); 

    // التحقق مما إذا كان التطبيق مفتوحاً كـ PWA بالفعل
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // التحقق من وجود حدث التثبيت المخزن
    if (window.deferredPrompt) {
      setIsInstallable(true);
    }

    // الاستماع لحدث جاهزية التثبيت
    const handlePwaInstallable = () => setIsInstallable(true);
    window.addEventListener('pwa-installable', handlePwaInstallable);

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-installable', handlePwaInstallable);
      window.removeEventListener('appinstalled', handleAppInstalled);
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
    <div className="flex h-[100dvh] bg-[#f8fafc] dark:bg-[#020617] overflow-hidden font-sans relative selection:bg-primary-500 selection:text-white transition-colors duration-500">
      
      {/* Splash Screen */}
      <div className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white"></div>
         <div className="relative z-10 flex flex-col items-center justify-center h-full pb-10 w-full">
             <div className="mb-8 relative animate-float">
                 <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full"></div>
                 <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2.5rem] shadow-2xl flex items-center justify-center transform rotate-3 ring-4 ring-white">
                    <Wallet size={56} className="text-white drop-shadow-md" />
                 </div>
             </div>
             <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">محفظتي</h1>
             <p className="text-emerald-600 text-xs font-bold tracking-[0.4em] uppercase">Professional Finance</p>
         </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 m-4 rounded-[2.5rem] bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-2xl relative z-30 overflow-hidden">
        <div className="h-32 flex flex-col items-center justify-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                    <Wallet className="w-5 h-5" />
                </div>
                <div className="text-center">
                    <span className="block text-xl font-black text-gray-900 dark:text-white">محفظتي</span>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Desktop Pro</span>
                </div>
             </div>
        </div>

        <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <Icon size={20} strokeWidth={2} />
                <span className="text-sm font-bold">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-5 space-y-3">
           {isInstallable && (
             <button 
               onClick={handleInstallClick}
               className="w-full flex items-center gap-3 p-4 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all font-bold text-xs group relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                <Monitor size={18} className="relative z-10" />
                <span className="relative z-10">تثبيت تطبيق الحاسوب</span>
             </button>
           )}
           <div className="p-5 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl border border-white/10">
              <p className="text-sm font-bold">المستخدم المميز</p>
              <p className="text-[10px] text-gray-400">نظام سطح المكتب</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="z-40 sticky top-0 transition-all duration-300">
          <div className="mx-0 lg:mx-6 lg:mt-3 lg:rounded-2xl bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b lg:border border-white/20 dark:border-white/5 shadow-sm px-5 py-3 flex items-center justify-between">
            <div className="flex flex-col">
                <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">{getPageTitle()}</h1>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-1">{todayDate}</span>
            </div>

            <div className="flex items-center gap-2">
                {isInstallable && (
                  <button onClick={handleInstallClick} className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-600 bg-primary-50 dark:bg-primary-900/20 active:scale-95 animate-pulse" title="تثبيت التطبيق">
                      <Download size={18} />
                  </button>
                )}
                <button onClick={() => updateSettings({ darkMode: !settings.darkMode })} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={() => setShowNotifications(!showNotifications)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 relative">
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full"></span>}
                </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-12 pb-40 z-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2rem] lg:hidden z-40 shadow-2xl transition-all duration-300 ${isInputFocused ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex justify-evenly items-center p-2.5">
            {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => `relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${isActive ? 'bg-gray-900 text-white shadow-xl -translate-y-4 scale-110 ring-4 ring-white dark:ring-[#020617]' : 'text-gray-400'}`}>
                        <Icon size={22} strokeWidth={2} />
                    </NavLink>
                );
            })}
        </div>
      </nav>

      {/* Install Guide Modal */}
      <Modal isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} title="تثبيت محفظتي على جهازك">
        <div className="space-y-6 text-right">
            <div className="flex justify-center mb-6">
                 <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2rem] shadow-2xl flex items-center justify-center transform rotate-3 ring-4 ring-white">
                    <Wallet size={48} className="text-white" />
                 </div>
            </div>
            <h4 className="text-xl font-black text-center dark:text-white">تثبيت التطبيق على المتصفح</h4>
            <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h5 className="font-bold dark:text-white flex items-center gap-2 mb-3">
                        <Monitor size={18} className="text-primary-500" />
                        طريقة التثبيت على المتصفح:
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">1. ابحث عن أيقونة الشاشة في شريط العنوان (Address Bar) بالأعلى.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">2. اضغط على زر "تثبيت" (Install) ليظهر التطبيق في قائمة ابدأ أو سطح المكتب.</p>
                </div>
            </div>
            <button onClick={() => setShowInstallGuide(false)} className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl shadow-xl">فهمت، شكراً لك</button>
        </div>
      </Modal>

      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};