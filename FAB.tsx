import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Compass, User as UserIcon } from 'lucide-react';

interface FABProps {
  onNavigate: (page: any) => void;
}

export const FAB: React.FC<FABProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-32 right-8 z-50 flex flex-col gap-4 items-end">
       <AnimatePresence>
         {isOpen && (
           <div className="flex flex-col gap-3 items-end mb-2">
              <FABItem icon={Users} label="Group" color="bg-indigo-600" onClick={() => onNavigate('create-group')} />
              <FABItem icon={Compass} label="Channel" color="bg-purple-600" onClick={() => onNavigate('create-channel')} />
              <FABItem icon={UserIcon} label="Contacts" color="bg-emerald-600" onClick={() => onNavigate('contacts')} />
           </div>
         )}
       </AnimatePresence>
       <motion.button 
          whileHover={{ scale: 1.1, rotate: isOpen ? 45 : 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 ${isOpen ? 'bg-rose-500' : 'bg-emerald-900'}`}
       >
          <Plus size={32} />
       </motion.button>
    </div>
  );
};

const FABItem = ({ icon: Icon, label, color, onClick }: any) => (
  <motion.button 
    initial={{ opacity: 0, scale: 0.5, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.5, y: 20 }}
    whileHover={{ scale: 1.05 }}
    onClick={onClick}
    className="flex items-center gap-3 group"
  >
    <span className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
      {label}
    </span>
    <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg border-2 border-white/20`}>
      <Icon size={20} />
    </div>
  </motion.button>
);
