import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MessageSquare, 
  Bell, 
  ShieldCheck, 
  Palette, 
  MoreVertical, 
  Menu,
  LogOut,
  Search,
  Gavel,
  PhoneCall,
  Sun,
  Moon,
  WifiOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

type Page = 'chats' | 'explore' | 'notifications' | 'channels' | 'contacts' | 'settings' | 'chat-room';

interface MainHeaderProps {
  onMenuClick: () => void;
  currentPage: string;
  onNavigate: (p: Page) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ onMenuClick, currentPage, onNavigate, theme, onThemeToggle }) => {
  const { t, i18n } = useTranslation();
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  const quickItems = [
    { id: 'contacts', icon: Users, label: t('contacts') },
    { id: 'chat-room', icon: MessageSquare, label: t('saved_messages'), onClick: () => onNavigate('saved' as any) },
    { id: 'notifications', icon: Bell, label: t('notifications'), onClick: () => onNavigate('notifications') },
    { id: 'settings', icon: ShieldCheck, label: t('privacy_security'), onClick: () => onNavigate('settings') },
    { id: 'appearance', icon: Palette, label: t('appearance_themes'), onClick: () => onNavigate('settings') },
  ];

  return (
    <header className="p-4 sticky top-0 z-[60] bg-white dark:bg-black border-b border-slate-100 dark:border-white/10">
      <div className="flex justify-between items-center max-w-5xl mx-auto flex-row">
        {/* Right Side (Positioned Left in RTL): Three Dots (Quick Menu) and Theme Toggle */}
        <div className="flex items-center gap-2">
           <AnimatePresence>
             {!isOnline && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.5 }}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
               >
                 <WifiOff size={12} />
                 <span>{t('status_offline')}</span>
               </motion.div>
             )}
           </AnimatePresence>
           <div className="relative">
             <button 
               onClick={() => setShowQuickMenu(!showQuickMenu)}
               className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
             >
               <MoreVertical size={20} />
             </button>
             <AnimatePresence>
               {showQuickMenu && (
                 <>
                   <div 
                     onClick={() => setShowQuickMenu(false)}
                     className="fixed inset-0 z-[100]"
                   />
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className={`absolute top-14 ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'} w-52 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-1 shadow-2xl z-[101]`}
                   >
                     {quickItems.map((item) => (
                       <button 
                         key={item.id}
                         onClick={() => {
                           item.onClick?.() || onNavigate(item.id as Page);
                           setShowQuickMenu(false);
                         }}
                         className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium text-sm transition-all"
                       >
                          <item.icon size={18} className="text-slate-400" />
                          {item.label}
                       </button>
                     ))}
                     <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2" />
                     <button onClick={() => { signOut(auth).catch(e => console.warn("SignOut error:", e)); setShowQuickMenu(false); }} className="flex items-center gap-3 w-full p-3 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-500 rounded-xl font-medium text-sm transition-all">
                       <LogOut size={18} />
                       {t('logout')}
                     </button>
                   </motion.div>
                 </>
               )}
             </AnimatePresence>
           </div>
           
           <button 
             onClick={onThemeToggle}
             className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 shadow-sm"
           >
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        </div>

        {/* Center: Logo with Custom Animation */}
        <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => onNavigate('chats')}>
              <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Hammer Animation */}
                <motion.div
                  className="absolute -top-4 -left-2 z-20 text-purple-600 dark:text-purple-400"
                  animate={{
                    rotate: [-30, 45, -30],
                    x: [0, 5, 0],
                    y: [0, 8, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    times: [0, 0.2, 1],
                    ease: "easeInOut"
                  }}
                >
                  <Gavel size={20} />
                </motion.div>

                {/* Bell Animation */}
                <motion.div
                  className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-900/40 relative overflow-hidden"
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    times: [0, 0.15, 0.2, 0.25, 0.3, 0.4],
                  }}
                >
                  <Bell size={22} className="relative z-10" />
                </motion.div>

                {/* Red Message Animation */}
                <motion.div
                  className="absolute z-30 text-rose-500"
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: [0, 25, 30],
                    x: [0, 15, 20],
                    scale: [0, 1.2, 1, 0.8],
                    rotate: [0, 15, 30]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    times: [0, 0.25, 0.6, 1],
                  }}
                >
                  <MessageSquare size={16} fill="currentColor" />
                </motion.div>
              </div>

              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-slate-800 dark:text-white flex items-center gap-1">
                  {t('app_name')}
                  <span className="text-[8px] bg-purple-600/10 text-purple-600 px-1.5 py-0.5 rounded-md border border-purple-600/20">PRO</span>
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('version')}</span>
              </div>
            </div>
        </div>

        {/* Left Side (Positioned Right in RTL): Menu Trigger */}
        <div className="flex gap-2">
           <button 
             onClick={onMenuClick} 
             className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
           >
             <Menu size={20} />
           </button>
        </div>
      </div>
    </header>
  );
};
