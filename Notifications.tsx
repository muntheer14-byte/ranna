import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Heart, MessageSquare, Phone, ShieldCheck, Mail, Info, ChevronLeft, Trash2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { AppNotification } from '../types';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onBack?: () => void;
  onDelete?: (id: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onBack, onDelete }) => {
  const { t, i18n } = useTranslation();

  const handleMarkAllRead = () => {
    // This could also be a prop, but for now we'll just vibrate
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleDelete = (id: string) => {
    if (onDelete) onDelete(id);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post_like': return { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' };
      case 'post_comment': return { icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
      case 'message': return { icon: Mail, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'call': return { icon: Phone, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default: return { icon: Info, color: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
      <div className="p-8 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
           {onBack && (
             <button onClick={onBack} className="p-3 glass rounded-2xl text-slate-400 hover:text-emerald-600 transition-all">
               {i18n.dir() === 'rtl' ? <ChevronLeft className="rotate-180" /> : <ChevronLeft />}
             </button>
           )}
           <h1 className="text-3xl font-serif italic text-emerald-deep">{t('notifications')}</h1>
        </div>

        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{t('recent_activity')}</span>
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-500 tracking-widest hover:opacity-70 transition-opacity"
          >
            <CheckCircle2 size={12} />
            {t('mark_all_read')}
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          {notifications.map((notif, i) => {
            const { icon: Icon, color, bg } = getIcon(notif.type);
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-5 p-6 ranna-card-glass group relative ${!notif.isRead ? 'border-l-4 border-l-emerald-500' : 'border-white/10'}`}
              >
                <div className={`p-4 rounded-[1.5rem] ${bg} ${color} transition-all group-hover:scale-110 shrink-0`}>
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{notif.title}</h3>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 shrink-0 ml-2">
                      {formatDistanceToNow(notif.createdAt)} ago
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed truncate opacity-70">
                    {notif.body}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                   <button 
                     onClick={() => handleDelete(notif.id)}
                     className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>

                {!notif.isRead && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
             <div className="w-24 h-24 rounded-[3rem] bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-deep/20 mb-6 border border-emerald-deep/5">
                <Bell size={48} strokeWidth={1} />
             </div>
             <p className="text-sm font-serif italic text-emerald-deep">{t('silence_golden')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
