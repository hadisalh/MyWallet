import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun, Download, Share, PlusSquare, Monitor, Smartphone, Apple, ShieldCheck } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MENU_ITEMS } from '../constants';
import { Modal } from './ui/Modal';
import { BrandWalletIcon } from './BrandWalletIcon';

export const Layout: React.FC = () => {
  const { settings, updateSettings, notifications } = useFinance();
  const [showSplash, setShowSplash] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showAutoInstallPopup, setShowAutoInstallPopup] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (!standalone) {
          setShowAutoInstallPopup(true);
        }
      }, 1500);
    }, 4000);

    const isIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIphone);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    if (window.deferredPrompt) {
      setIsInstallable(true);
    }

    const handlePwaInstallable = () => setIsInstallable(true);
    window.addEventListener('pwa-installable', handlePwaInstallable);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('pwa-installable', handlePwaInstallable);
    };
  }, []);

  const handleInstallNow = async () => {
    const promptEvent = window.deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
        setIsInstallable(false);
        setShowAutoInstallPopup(false);
      }
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
      
      {/* Splash Screen with Custom Icon */}
      <div className={`fixed inset-0 z-[100] bg-white dark:bg-[#020617] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
             <div className="relative mb-8">
                 <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                 <BrandWalletIcon size={120} className="relative z-10 drop-shadow-2xl animate-[bounce_2s_infinite]" />
             </div>
             <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2">محفظتي</h1>
             <p className="text-primary-600 text-sm font-bold tracking-[0.3em] uppercase mb-12">الإدارة المالية الذكية</p>
             
             <div className="mt-10 animate-fadeIn delay-700">
                <div className="h-[1px] w-20 bg-gray-200 dark:bg-gray-800 mx-auto mb-6"></div>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-widest">تطوير وإشراف</p>
                <h2 className="text-xl font-black text-gray-800 dark:text-gray-200">أ. هادي الدليمي</h2>
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
            <BrandWalletIcon size={40} className="drop-shadow-md" />
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
        
        <div className="p-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-widest">المطور:</p>
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

      {/* Automatic Install Modal with Brand Icon */}
      <Modal isOpen={showAutoInstallPopup} onClose={() => setShowAutoInstallPopup(false)} title="ثبّت التطبيق الآن">
        <div className="space-y-6 text-center py-2">
            <div className="flex justify-center relative">
                 <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-[10px] font-black px-2 py-1 rounded-full animate-bounce shadow-md z-20">توصية هادي</div>
                 <div className="relative">
                    <div className="absolute inset-0 bg-primary-500/10 blur-2xl rounded-full scale-125"></div>
                    <BrandWalletIcon size={100} className="relative z-10 drop-shadow-xl transform rotate-3" />
                 </div>
            </div>
            
            <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">تجربة أفضل بانتظارك!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed px-4">
                    قم بتثبيت تطبيق <b>"محفظتي"</b> على شاشتك الرئيسية للوصول السريع والعمل بدون إنترنت.
                </p>
            </div>

            <div className="space-y-4">
                {isIOS ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-800/50 text-right animate-fadeIn">
                        <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
                             <Apple size={20} />
                             <span className="font-bold text-sm">لمستخدمي آيفون:</span>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                                <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0">1</span>
                                <span>اضغط على أيقونة <Share className="inline text-blue-500" size={14} /> (مشاركة) في Safari</span>
                            </li>
                            <li className="flex items-center gap-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                                <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm shrink-0">2</span>
                                <span>اختر <PlusSquare className="inline text-emerald-500" size={14} /> "إضافة للشاشة الرئيسية"</span>
                            </li>
                        </ul>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                         <div className="flex items-center justify-center gap-4 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="flex items-center gap-1"><Smartphone size={12} /> Android</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="flex items-center gap-1"><Monitor size={12} /> Desktop</span>
                        </div>
                        <button 
                            onClick={handleInstallNow}
                            className="w-full bg-primary-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            <Download size={22} />
                            <span>تثبيت التطبيق مجاناً</span>
                        </button>
                    </div>
                )}
            </div>

            <button 
                onClick={() => setShowAutoInstallPopup(false)} 
                className="text-gray-400 hover:text-gray-600 text-xs font-bold py-2 underline underline-offset-4"
            >
                سأفعل ذلك لاحقاً
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