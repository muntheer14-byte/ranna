import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Reply, 
  Copy, 
  Edit2, 
  Trash2, 
  Languages, 
  Pin, 
  Smile, 
  Forward 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MessageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onForward: () => void;
  onTranslate: () => void;
  onPin: () => void;
  onInfo?: () => void;
  x: number;
  y: number;
  isMe: boolean;
}

export const MessageMenu: React.FC<MessageMenuProps> = ({
  isOpen,
  onClose,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onForward,
  onTranslate,
  onPin,
  onInfo,
  x,
  y,
  isMe
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-0 z-[101] pointer-events-none flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass rounded-[2.5rem] p-4 shadow-2xl border-white/40 overflow-hidden pointer-events-auto"
            >
              <div className="flex justify-around p-4 border-b border-white/10 mb-2">
                 {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                   <button key={emoji} className="text-2xl hover:scale-125 transition-transform active:scale-95">{emoji}</button>
                 ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <MenuButton icon={Reply} label={t('reply') || 'رد'} onClick={() => { onReply(); onClose(); }} />
                <MenuButton icon={Copy} label={t('copy') || 'نسخ'} onClick={() => { onCopy(); onClose(); }} />
                {isMe && onEdit && <MenuButton icon={Edit2} label={t('edit') || 'تعديل'} onClick={() => { onEdit(); onClose(); }} />}
                <MenuButton icon={Forward} label={t('forward') || 'تحويل'} onClick={() => { onForward(); onClose(); }} />
                {onInfo && <MenuButton icon={Smile} label={t('info') || 'معلومات'} onClick={() => { onInfo(); onClose(); }} />}
                <MenuButton icon={Languages} label={t('translate') || 'ترجمة'} onClick={() => { onTranslate(); onClose(); }} />
                <MenuButton icon={Pin} label={t('pin') || 'تثبيت'} onClick={() => { onPin(); onClose(); }} />
              </div>
              
              <div className="mt-4 pt-2 border-t border-white/10">
                <MenuButton icon={Trash2} label={t('delete') || 'حذف'} onClick={() => { onDelete(); onClose(); }} danger />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const MenuButton = ({ icon: Icon, label, onClick, danger }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3.5 hover:bg-white/10 transition-colors group rounded-2xl ${danger ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}
  >
    <Icon size={16} className={danger ? 'text-rose-400' : 'text-slate-400 group-hover:text-emerald-500'} />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
