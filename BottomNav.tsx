import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Users, Compass, Smartphone, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Page = 'chats' | 'explore' | 'notifications' | 'channels' | 'contacts' | 'settings' | 'chat-room';

interface BottomNavProps {
  current: Page;
  onChange: (page: Page) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ current, onChange }) => {
  const { t } = useTranslation();
  const navItems: { id: Page, icon: any, key: string }[] = [
    { id: 'chats', icon: MessageSquare, key: 'chats' },
    { id: 'explore', icon: Compass, key: 'explore' },
    { id: 'contacts', icon: Users, key: 'contacts' },
    { id: 'channels', icon: Smartphone, key: 'channels' },
    { id: 'settings', icon: SettingsIcon, key: 'settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 bg-gradient-to-t from-white/90 dark:from-black/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="flex items-center justify-around h-16 ranna-card-glass bg-white/60 dark:bg-black/60 shadow-2xl shadow-indigo-500/10 px-4">
          {navItems.map(item => {
            const isActive = current === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (isActive) {
                    window.dispatchEvent(new CustomEvent('focus-search'));
                  } else {
                    if (navigator.vibrate) navigator.vibrate(15);
                    onChange(item.id);
                  }
                }}
                className={`flex flex-col items-center gap-1 transition-all flex-1 relative ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-black uppercase tracking-tighter">
                  {t(item.key)}
                </span>
                {isActive && (
                  <motion.span 
                    layoutId="nav-pill" 
                    className="absolute -top-3 w-8 h-1 rounded-full bg-indigo-600"
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
