import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Image, 
  BellOff, 
  Trash2, 
  Shield, 
  Sparkles, 
  Clock, 
  Lock,
  ChevronLeft,
  Settings2,
  Share2,
  Languages,
  Zap,
  Volume2,
  Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { User, Room } from '../types';

interface ChatConfigProps {
  onClose: () => void;
  room: Room;
  otherUser: User | null;
  user: User | null;
  onUpdateRoom: (updates: any) => void;
}

export const ChatConfig: React.FC<ChatConfigProps> = ({ onClose, room, otherUser, user, onUpdateRoom }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const ConfigItem = ({ icon: Icon, label, sub, onClick, color = "bg-indigo-500", rightElement }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group border-b border-slate-100 dark:border-white/5 last:border-none"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 text-right">
        <h5 className="font-bold text-sm text-slate-800 dark:text-white">{label}</h5>
        {sub && <p className="text-[10px] text-slate-400 font-medium">{sub}</p>}
      </div>
      {rightElement || (isRTL ? <ChevronLeft size={16} className="text-slate-300" /> : <ChevronLeft size={16} className="text-slate-300 rotate-180" />)}
    </button>
  );

  const [showSelfDestruct, setShowSelfDestruct] = useState(false);
  const [selfDestructTime, setSelfDestructTime] = useState(room.selfDestructTime || 0);

  const handleToggleSelfDestruct = (seconds: number) => {
    setSelfDestructTime(seconds);
    onUpdateRoom({ selfDestructTime: seconds });
  };

  const handleClearMessages = async () => {
    if (!window.confirm('هل أنت متأكد من مسح جميع الرسائل في هذه المحادثة؟')) return;
    onUpdateRoom({ clearChatAt: Date.now() }); // Use a timestamp to hide old messages
    onClose();
  };

  return (
    <motion.div 
      initial={{ x: isRTL ? '-100%' : '100%' }}
      animate={{ x: 0 }}
      exit={{ x: isRTL ? '-100%' : '100%' }}
      className="fixed inset-0 z-[150] bg-white dark:bg-black flex flex-col md:relative md:inset-auto md:w-96 md:border-r md:border-slate-100 dark:md:border-white/5 shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
          <X size={20} />
        </button>
        <span className="font-serif italic text-lg text-purple-600">إعدادات المحادثة</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Profile Card */}
        <div className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-[2.5rem] bg-slate-200 overflow-hidden ring-4 ring-purple-500/10 shadow-2xl transition-transform group-hover:scale-105 duration-500">
              <img 
                src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName || 'Chat'}`} 
                className="w-full h-full object-cover" 
                alt="Profile"
              />
            </div>
            {otherUser?.isOnline && (
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-black rounded-full shadow-lg" />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{otherUser?.displayName || room.name}</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full">
               <div className={`w-2 h-2 rounded-full ${otherUser?.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{otherUser?.status || (otherUser?.isOnline ? 'نشط الآن' : 'غير متصل حالياً')}</p>
            </div>
          </div>
        </div>

        {/* Section 1: Visuals */}
        <div className="px-6 py-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">المظهر والوسائط</h4>
          <div className="bg-slate-50/50 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-white/5">
            <ConfigItem icon={Image} label="خلفية المحادثة" sub="اختر صورة أو تدرج لوني" color="bg-emerald-500" onClick={() => alert('ميزة تغيير الخلفية قادمة قريباً')} />
            <ConfigItem icon={Layers} label="تنسيق الفقاعات" sub="نمط عرض الرسائل" color="bg-indigo-500" />
            <ConfigItem icon={Volume2} label="أصوات مخصصة" sub="رنين خاص لهذا الشخص" color="bg-orange-500" />
          </div>
        </div>

        {/* Section 2: Privacy */}
        <div className="px-6 py-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">الخصوصية والأمان</h4>
          <div className="bg-slate-50/50 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-white/5">
            <ConfigItem icon={Shield} label="الدرع العصبي" sub="مستوى التمويه لهذه المحادثة" color="bg-purple-600" />
            <ConfigItem 
              icon={Clock} 
              label="الرسائل المختفية" 
              sub={selfDestructTime > 0 ? `تختفي بعد ${selfDestructTime} ثانية` : "معطلة"} 
              color="bg-rose-500" 
              onClick={() => setShowSelfDestruct(!showSelfDestruct)}
            />
            <AnimatePresence>
              {showSelfDestruct && (
                <motion.div 
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden bg-white dark:bg-black/20 p-4 border-t border-slate-100 dark:border-white/5"
                >
                  <div className="flex gap-2 flex-wrap">
                    {[0, 5, 10, 30, 60, 3600].map(s => (
                      <button 
                        key={s} 
                        onClick={() => handleToggleSelfDestruct(s)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${selfDestructTime === s ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500'}`}
                      >
                        {s === 0 ? 'إيقاف' : (s < 60 ? `${s} ث` : (s < 3600 ? 'دقيقة' : 'ساعة'))}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <ConfigItem icon={Lock} label="قفل المحادثة" sub="طلب بصمة للدخول" color="bg-emerald-700" />
          </div>
        </div>

        {/* Section 3: AI Tools */}
        <div className="px-6 py-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">أدوات الذكاء الاصطناعي</h4>
          <div className="bg-slate-50/50 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-white/5">
            <ConfigItem icon={Sparkles} label="تحليل النبرة" sub="مساعد المشاعر الذكي" color="bg-indigo-600" />
            <ConfigItem icon={Languages} label="ترجمة فورية" sub="ترجمة الرسائل الواردة" color="bg-sky-500" />
            <ConfigItem icon={Zap} label="التلخيص الذكي" sub="ملخص أسبوعي للمحادثة" color="bg-amber-500" />
          </div>
        </div>

        {/* Section 4: Actions */}
        <div className="px-6 py-4 mb-10">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">إجراءات إضافية</h4>
          <div className="bg-slate-50/50 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-white/5">
            <ConfigItem icon={BellOff} label="كتم الإشعارات" sub="إيقاف التنبيهات مؤقتاً" color="bg-slate-400" />
            <ConfigItem icon={Share2} label="مشاركة جهة الاتصال" color="bg-blue-600" />
            <ConfigItem icon={Trash2} label="مسح المحادثة" color="bg-rose-600" danger onClick={handleClearMessages} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
