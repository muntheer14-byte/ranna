import React, { useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Bookmark, 
  ShieldCheck, 
  Palette, 
  LogOut,
  MessageSquare,
  Users,
  Compass,
  Bell,
  Settings as SettingsIcon,
  HelpCircle,
  FolderLock,
  Zap,
  QrCode,
  ChevronDown,
  Plus,
  Check,
  Phone,
  User as UserIcon,
  UserPlus
} from 'lucide-react';
import { User, Page } from '../types';
import { getOrCreateSavedMessagesRoom } from '../lib/firebase';
import { getSharableUrl, copyToClipboard } from '../lib/utils';
import { InviteCard } from './InviteCard';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose, onNavigate, onLogout }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [showAccounts, setShowAccounts] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);

  // Parallax Effect for Profile Image
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseY, [-50, 50], [10, -10]);
  const rotateY = useTransform(mouseX, [-50, 50], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleQrClick = () => {
    setShowInvite(true);
  };

  const handleLogout = () => {
    if (window.confirm('بعد تسجيل الخروج، ستحتاج للموافقة مرة أخرى للدخول. هل أنت متأكد؟')) {
      onLogout();
    }
  };

  const menuGroups = [
    { title: 'رنة PRO', items: [
      { id: 'chats', icon: MessageSquare, label: 'المحادثات' },
      { id: 'saved', icon: Bookmark, label: 'الرسائل المحفوظة', isRoom: true },
      { id: 'add_contact', icon: UserPlus, label: 'إضافة جهة اتصال', onClick: () => {
        const username = window.prompt('أدخل اسم المستخدم (بدون @):');
        if (username) {
          window.dispatchEvent(new CustomEvent('add-contact-by-username', { detail: username }));
        }
      }},
      { id: 'contacts', icon: Users, label: 'جهات الاتصال' },
      { id: 'profile', icon: UserIcon, label: 'تعديل الملف الشخصي' },
      { id: 'calls', icon: Phone, label: 'المكالمات' },
    ]},
    { title: 'الإعدادات والمميزات', items: [
      { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' },
      { id: 'folders', icon: FolderLock, label: 'مجلدات المحادثة' },
      { id: 'features', icon: ShieldCheck, label: 'مميزات رنة' },
    ]},
    { title: 'أخرى', items: [
      { id: 'help', icon: HelpCircle, label: 'المساعدة والدعم' },
    ]}
  ];

  const handleNavigate = async (item: any) => {
    if (item.onClick) {
      item.onClick();
      onClose();
      return;
    }
    if (item.isRoom && item.id === 'saved' && user?.id) {
      try {
        const roomId = await getOrCreateSavedMessagesRoom(user.id);
        onNavigate('chat-room');
        // We need a way to tell the parent to select this chat. 
        // For now, we'll assume the parent handles it if we navigate to chat-room and use a custom event or similar.
        // Actually, the App component handles selectedChat.
        // I'll emit a custom event.
        window.dispatchEvent(new CustomEvent('select-chat', { detail: roomId }));
        onClose();
      } catch (err) {
        console.error("Failed to navigate to saved messages:", err);
      }
      return;
    }
    onNavigate(item.id as Page);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-purple-950/20 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: isRTL ? '-100%' : '-100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: isRTL ? '-100%' : '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'left-0'} w-80 bg-white dark:bg-black z-[110] shadow-[0_0_80px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col p-4`}
          >
            <div className="dot-pattern" />
            <div className="relative z-10 flex flex-col h-full bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/5 p-6 shadow-2xl overflow-y-auto no-scrollbar">
              
              <div className="flex items-center justify-between mb-8 px-2">
                 <button onClick={onClose} className="p-3 glass rounded-2xl text-slate-400 hover:text-purple-600 transition-all active:scale-90">
                   {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                 </button>
                 <button onClick={handleQrClick} className="p-3 glass rounded-2xl text-slate-400 hover:text-purple-600 transition-all active:scale-90">
                    <QrCode size={20} />
                 </button>
              </div>

              {/* Profile Card with Parallax */}
              <div className="relative mb-8 group">
                <motion.div 
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                  className="relative cursor-pointer" 
                  onClick={() => setShowAccounts(!showAccounts)}
                >
                  <div className="absolute inset-0 bg-indigo-600/10 rounded-[2.5rem] blur-2xl group-hover:opacity-100 opacity-40 transition-opacity" />
                    <div className="relative ranna-glass p-5 rounded-[2.5rem] border-white/10 flex items-center gap-4 hover:border-indigo-600/30 transition-all shadow-xl group/card">
                      <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 z-20">
                        <ShieldCheck size={10} fill="currentColor" className="text-white" />
                        {t('pro_edition')}
                      </div>
                      
                      <motion.div 
                        style={{ translateZ: 50 }}
                        className="w-16 h-16 rounded-[1.8rem] bg-purple-600 overflow-hidden shadow-2xl ring-4 ring-white/20 shrink-0 group-hover/card:scale-105 transition-transform duration-500"
                      >
                        {user?.photoURL ? (
                          <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Profile" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-serif italic text-white uppercase">
                            {user?.displayName?.[0]}
                          </div>
                        )}
                      </motion.div>
  
                      <div className="flex-1 min-w-0 text-left" style={{ transform: "translateZ(30px)" }}>
                        <h2 className="text-base font-serif italic text-slate-800 dark:text-white truncate">
                          {user?.displayName}
                        </h2>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] font-black tracking-widest text-purple-600 uppercase truncate">@{user?.username}</p>
                          <ChevronDown size={12} className={`text-slate-400 transition-transform duration-300 ${showAccounts ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                  {showAccounts && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white/20 dark:bg-black/20 rounded-3xl mt-4 border border-white/10"
                    >
                      <div className="p-4 space-y-3">
                         <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-600/10 border border-purple-500/10">
                            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-serif italic">
                               {user?.displayName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-bold truncate">{user?.displayName}</p>
                               <p className="text-[8px] font-black text-purple-600 uppercase">Active</p>
                            </div>
                            <Check size={12} className="text-purple-600" />
                         </div>
                         <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors text-slate-400">
                            <Plus size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Add Account</span>
                         </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-8">
                {menuGroups.map((group, gIdx) => (
                  <div key={gIdx} className="flex flex-col gap-2">
                    <span className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-60 mb-2">{group.title}</span>
                    <div className="flex flex-col gap-1.5">
                      {group.items.map((item) => (
                        <SidebarItem key={item.id} icon={item.icon} label={item.label} onClick={() => handleNavigate(item)} isRTL={isRTL} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8 px-2 space-y-4">
                <button 
                   onClick={handleQrClick}
                   className="w-full p-4 glass rounded-2xl flex items-center justify-center gap-3 text-purple-600 hover:bg-purple-600 hover:text-white transition-all group"
                 >
                    <Users size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">دعوة صديق للانضمام</span>
                 </button>

                <div className="flex items-center justify-between border-t border-emerald-900/5 dark:border-white/5 pt-4">
                  <div className="flex gap-2">
                    <button onClick={handleLogout} className="p-4 glass rounded-2xl text-rose-500 shadow-sm border-white/50 hover:bg-rose-50 transition-colors flex items-center gap-2">
                      <LogOut size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('logout')}</span>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-600 mb-1">Ranna Messenger</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">v2.5.0 Elite</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      <AnimatePresence>
        {showInvite && <InviteCard inviterName={user.displayName} onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </AnimatePresence>
  );
};

const SidebarItem = ({ icon: Icon, label, onClick, isRTL }: any) => (
  <div 
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    className="w-full p-4 flex items-center justify-between glass dark:bg-white/5 rounded-2xl hover:bg-purple-600 dark:hover:bg-purple-600 hover:text-white transition-all group active:scale-95 duration-300 shadow-sm border-white/10 cursor-pointer outline-none focus:ring-2 focus:ring-purple-500/50"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
        <Icon size={18} className="group-hover:scale-110 transition-transform" />
      </div>
      <span className="text-xs font-bold tracking-tight">{label}</span>
    </div>
    <ChevronRight size={14} className={`opacity-20 group-hover:opacity-100 transition-all ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
  </div>
);
