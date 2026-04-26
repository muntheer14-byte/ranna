import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Room, User } from '../types';
import { ShieldCheck, Star, Bookmark } from 'lucide-react';
import { db, safeGetDoc } from '../lib/firebase';
import { doc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface ChatListItemProps {
  room: Room;
  userId: string;
  onClick: () => void;
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void;
  isActive?: boolean;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ 
  room, 
  userId, 
  onClick, 
  onLongPress,
  isActive 
}) => {
  const { t } = useTranslation();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const lastMsg = room.lastMessage;
  const timeStr = lastMsg?.createdAt ? new Date((lastMsg.createdAt as any).seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  useEffect(() => {
    if (room.type === 'private') {
      const otherId = room.members.find(id => id !== userId);
      if (otherId) {
        safeGetDoc(doc(db, 'users', otherId))
          .then(snap => {
            if (snap && snap.exists()) setOtherUser(snap.data() as User);
          })
          .catch(err => console.warn("ChatListItem: failed to fetch other user", err));
      }
    }
  }, [room.id, userId]);

  const displayName = room.type === 'saved' 
    ? 'الرسائل المحفوظة' 
    : (room.type === 'private' ? (otherUser?.displayName || '...') : (room.name || 'Room'));
  const photoURL = room.type === 'saved' 
    ? null 
    : (room.type === 'private' ? otherUser?.photoURL : room.photoURL);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onContextMenu={(e) => { 
        e.preventDefault(); 
        if (navigator.vibrate) navigator.vibrate(50);
        onLongPress(e); 
      }}
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate([40]);
        onClick();
      }}
      className={`flex items-center gap-4 p-5 ranna-card-glass group text-left w-full border-white/5 hover:border-indigo-500/20 transition-all duration-500 mb-4 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50 ${
        isActive ? 'bg-indigo-600/10 border-indigo-600/20 ring-1 ring-indigo-600/30 shadow-indigo-500/10' : ''
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-2xl font-serif italic text-white shadow-2xl overflow-hidden ring-4 ring-white/10 group-hover:scale-105 transition-transform duration-500 ${
          room.type === 'saved' ? 'bg-gradient-to-br from-indigo-600 to-ranna-accent' : 'bg-gradient-to-br from-ranna-accent to-emerald-light'
        }`}>
          {photoURL ? (
            <img src={photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={displayName} />
          ) : (
            room.type === 'saved' ? <Bookmark size={28} /> : (displayName?.[0] || 'R')
          )}
        </div>
        {room.type === 'saved' ? (
           <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-ranna-accent border-2 border-white dark:border-slate-800 flex items-center justify-center text-white">
             <Star size={10} fill="currentColor" />
           </div>
        ) : room.id === 'room-ai' ? (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-ranna-accent border-2 border-white dark:border-slate-800 flex items-center justify-center">
            <Star size={10} className="text-white fill-white" />
          </div>
        ) : (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-ranna-accent border-2 border-white dark:border-slate-800 shadow-lg" />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-serif italic text-lg text-ranna-text truncate group-hover:text-ranna-accent transition-colors">
              {displayName}
            </h3>
            {room.e2eEnabled && <ShieldCheck size={14} className="text-ranna-accent shrink-0" />}
          </div>
          <span className="font-modern text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] shrink-0">
            {timeStr}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-ranna-text truncate opacity-70 flex-1 font-bold">
            {lastMsg?.content || (room.id === 'room-ai' ? t('ai_chat_ready') : t('welcome_message', { name: 'رنة' }))}
          </p>
          {room.id === 'room-ai' && (
            <div className="w-1.5 h-1.5 rounded-full bg-ranna-accent animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
