import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Moon, Sun, Wallet, Calendar, Download, Info, Share, PlusSquare, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MENU_ITEMS } from '../constants';
import { Modal } from './ui/Modal';

export const Layout: React.FC = () => {
  const { settings, updateSettings, notifications, markNotificationRead } = useFinance();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const timer = setTimeout(() => {
        setShowSplash(false);
    }, 3500); 

    // منطق تثبيت التطبيق (PWA)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // إظهار دليل التثبيت اليدوي إذا لم يتوفر الدعم التلقائي
      setShowInstallGuide(true);
    }
  };

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsInputFocused(true);
      }
    };
    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

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
      <div 
        className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white"></div>
         <div className="absolute bottom-0 w-full h-1/2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="relative z-10 flex flex-col items-center justify-center h-full pb-10 w-full">
             <div className="mb-8 relative animate-float">
                 <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full"></div>
                 <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2.5rem] shadow-2xl shadow-emerald-500/30 flex items-center justify-center transform rotate-3 ring-4 ring-white">
                    <Wallet size={56} className="text-white drop-shadow-md" />
                 </div>
             </div>
             <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4 drop-shadow-sm">محفظتي</h1>
             <div className="flex items-center gap-4 mb-16">
                 <div className="h-[2px] w-12 bg-emerald-500 rounded-full"></div>
                 <p className="text-emerald-600 text-xs font-bold tracking-[0.4em] uppercase">Professional Finance</p>
                 <div className="h-[2px] w-12 bg-emerald-500 rounded-full"></div>
             </div>
             <div className="absolute bottom-16 w-full flex justify-center px-6 animate-[slideUp_1s_ease-out_0.5s_both]">
                 <div className="flex flex-col items-center">
                    <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-2">تمت البرمجة بواسطة</p>
                    <div className="relative group cursor-default">
                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                        <h2 className="relative text-2xl font-black text-gray-900 bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                            الاستاذ هادي الدليمي
                        </h2>
                    </div>
                 </div>
             </div>
         </div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 m-4 rounded-[2.5rem] bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 relative z-30 overflow-hidden">
        <div className="h-32 flex flex-col items-center justify-center relative">
             <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"></div>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 ring-2 ring-white dark:ring-primary-900">
                    <Wallet className="w-5 h-5" />
                </div>
                <div className="text-center">
                    <span className="block text-xl font-black text-gray-900 dark:text-white tracking-tight">محفظتي</span>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Pro Edition</span>
                </div>
             </div>
        </div>

        <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar py-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl shadow-gray-900/10 dark:shadow-white/5' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-sm font-bold">
                        {item.label}
                    </span>
                    {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-5 space-y-3">
           <button 
             onClick={handleInstallClick}
             className="w-full flex items-center gap-3 p-4 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all font-bold text-xs group"
           >
              <Download size={18} className="group-hover:bounce" />
              <span>تثبيت محفظتي</span>
           </button>
           
           <div className="relative p-5 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl overflow-hidden group border border-white/10">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl group-hover:bg-primary-500/30 transition-colors"></div>
              <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                     <span className="font-bold text-primary-300">HD</span>
                  </div>
                  <div>
                     <p className="text-sm font-bold">المستخدم المميز</p>
                     <p className="text-[10px] text-gray-400">الحساب الذهبي</p>
                  </div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/5 dark:to-transparent pointer-events-none"></div>

        <header className="z-40 sticky top-0 transition-all duration-300">
          <div className="mx-0 lg:mx-6 lg:mt-3 lg:rounded-2xl bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b lg:border border-white/20 dark:border-white/5 shadow-sm lg:shadow-md px-5 py-3 flex items-center justify-between">
            
            <div className="flex items-center gap-3">
               <div className="flex flex-col">
                   <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                      {getPageTitle()}
                   </h1>
                   <div className="flex items-center gap-1.5 mt-1">
                      <Calendar size={10} className="text-primary-500" />
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {todayDate}
                      </span>
                   </div>
               </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                onClick={handleInstallClick}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-primary-600 bg-primary-50 dark:bg-primary-900/20 active:scale-95"
                title="تثبيت التطبيق"
                >
                    <Download size={18} />
                </button>
                <button
                  onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95"
                  title="تغيير المظهر"
                >
                  {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400 transition-all active:scale-95 relative"
                    title="الإشعارات"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0f172a]"></span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                        <div className="absolute left-0 top-12 w-80 sm:w-96 bg-white dark:bg-[#0f172a] rounded-[2rem] shadow-2xl shadow-gray-300/50 dark:shadow-black/60 border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out] origin-top-left">
                          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 backdrop-blur-md">
                              <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
                              {unreadCount > 0 && <span className="bg-primary-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-lg shadow-primary-500/20">{unreadCount} جديد</span>}
                          </div>
                          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
                              {notifications.length === 0 ? (
                              <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
                                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-2">
                                     <Bell size={24} className="opacity-30" />
                                  </div>
                                  <p className="text-sm font-medium">كل شيء هادئ هنا</p>
                              </div>
                              ) : (
                              notifications.map(notification => (
                                  <div 
                                  key={notification.id} 
                                  onClick={() => markNotificationRead(notification.id)}
                                  className={`p-4 rounded-2xl cursor-pointer transition-all border border-transparent group ${!notification.read ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                  >
                                  <div className="flex justify-between items-start mb-1.5">
                                      <span className={`text-xs font-black ${notification.type === 'warning' ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                      {notification.title}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-medium bg-white dark:bg-black/20 px-2 py-0.5 rounded-full">
                                      {new Date(notification.date).toLocaleDateString('ar-IQ-u-nu-latn')}
                                      </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{notification.message}</p>
                                  </div>
                              ))
                              )}
                          </div>
                        </div>
                    </>
                  )}
                </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-12 pb-40 lg:pb-12 z-0 scroll-smooth">
          <div className="animate-[fadeIn_0.6s_ease-out]">
             <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2rem] lg:hidden z-40 shadow-2xl shadow-black/20 ring-1 ring-black/5 transition-all duration-300 ease-in-out ${isInputFocused ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <div className="flex justify-evenly items-center p-2.5">
            {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group
                            ${isActive ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/30 -translate-y-4 scale-110 ring-4 ring-white dark:ring-[#020617]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && <span className="absolute -bottom-6 text-[10px] font-bold text-gray-900 dark:text-white whitespace-nowrap animate-in fade-in slide-in-from-top-1 bg-white/80 dark:bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">{item.label}</span>}
                            </>
                        )}
                    </NavLink>
                );
            })}
        </div>
      </nav>

      {/* Install Guide Modal */}
      <Modal isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} title="تثبيت التطبيق على جهازك">
        <div className="space-y-6 text-right">
            <div className="flex justify-center mb-6">
                 <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-xl flex items-center justify-center">
                    <Wallet size={40} className="text-white" />
                 </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                استمتع بتجربة أفضل وتصفح أسرع من خلال تثبيت "محفظتي" كتطبيق على هاتفك أو حاسوبك:
            </p>

            <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <Share size={18} className="text-primary-500" />
                        لمستخدمي آيفون (Safari):
                    </h4>
                    <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside pr-2">
                        <li>اضغط على زر <span className="font-bold text-blue-500">المشاركة (Share)</span> في أسفل المتصفح.</li>
                        <li>اختر <span className="font-bold text-gray-900 dark:text-white">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.</li>
                        <li>اضغط على <span className="font-bold text-primary-600">إضافة</span> في الزاوية العلوية.</li>
                    </ol>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <PlusSquare size={18} className="text-primary-500" />
                        لمستخدمي أندرويد (Chrome):
                    </h4>
                    <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside pr-2">
                        <li>اضغط على <span className="font-bold text-gray-900 dark:text-white">النقاط الثلاث</span> في الزاوية العلوية.</li>
                        <li>اختر <span className="font-bold text-gray-900 dark:text-white">تثبيت التطبيق (Install App)</span>.</li>
                        <li>وافق على طلب التثبيت.</li>
                    </ol>
                </div>
            </div>

            <button 
                onClick={() => setShowInstallGuide(false)}
                className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-500/20"
            >
                فهمت ذلك
            </button>
        </div>
      </Modal>
      
      <style>{`
        @keyframes widthGrow { 0% { width: 0; opacity: 0; } 50% { opacity: 1; } 100% { width: 100%; opacity: 0; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { transform: translateX(-150%) skewX(-12deg); } 100% { transform: translateX(150%) skewX(-12deg); } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .group:hover .group-hover\:bounce { animation: bounce 1s infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};