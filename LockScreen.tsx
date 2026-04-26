import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Fingerprint, ChevronLeft, Delete } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  correctPin: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, correctPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col items-center justify-center p-8"
    >
      <div className="flex flex-col items-center gap-6 mb-12">
        <motion.div 
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-colors ${error ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
        >
          <Lock size={32} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">رنة مغلق</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">أدخل رمز الدخول للمتابعة</p>
        </div>
        
        <div className="flex gap-4 mt-4">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i 
                  ? (error ? 'bg-rose-500 border-rose-500 scale-125' : 'bg-indigo-600 border-indigo-600 scale-125') 
                  : 'border-slate-200 dark:border-white/10'
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-xs w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button 
            key={num} 
            onClick={() => handleKeyPress(num)}
            className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors active:scale-90"
          >
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{num}</span>
          </button>
        ))}
        <div />
        <button 
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors active:scale-90"
        >
          <span className="text-2xl font-bold text-slate-800 dark:text-white">0</span>
        </button>
        <button 
          onClick={handleDelete}
          className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors active:scale-90"
        >
          <Delete size={24} />
        </button>
      </div>
      
      <button className="mt-12 flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
        <Fingerprint size={20} />
        <span>استخدام البصمة</span>
      </button>
    </motion.div>
  );
};
