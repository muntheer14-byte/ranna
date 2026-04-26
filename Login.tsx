import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  LogIn, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Mail, 
  Lock, 
  UserPlus, 
  ChevronRight, 
  Smartphone,
  Eye,
  EyeOff,
  MoreHorizontal,
  Gavel,
  Bell,
  MessageSquare
} from 'lucide-react';
import { 
  signInWithGoogle, 
  loginAnonymously, 
  loginWithEmail, 
  registerWithEmail, 
  resetPassword,
  devBypassLogin
} from '../lib/firebase';

interface LoginProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGuestOption, setShowGuestOption] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('ranna_demo_bypass', 'false');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول بجوجل');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = async () => {
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('ranna_demo_bypass', 'true');
      await devBypassLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('ranna_demo_bypass', 'false');
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await registerWithEmail(email, password);
      } else {
        await resetPassword(email);
        alert('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'خطأ في المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-purple-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto transition-colors duration-1000">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center my-auto"
      >
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <motion.div
            className="absolute -top-4 -left-2 z-20 text-purple-600 dark:text-purple-400"
            animate={{ rotate: [-30, 45, -30], x: [0, 5, 0], y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.2, 1], ease: "easeInOut" }}
          >
            <Gavel size={32} />
          </motion.div>
          
          <motion.div 
            className="w-20 h-20 bg-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative overflow-hidden ring-4 ring-white/20"
            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.15, 0.2, 0.25, 0.3, 0.4] }}
          >
            <Bell size={40} className="relative z-10" />
          </motion.div>

          <motion.div
            className="absolute z-30 text-rose-500"
            animate={{ opacity: [0, 1, 1, 0], y: [0, 50, 70], x: [0, 30, 40], scale: [0, 1.5, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.25, 0.6, 1] }}
          >
            <MessageSquare size={24} fill="currentColor" />
          </motion.div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">رنة</h1>
        <p className="text-sm text-slate-500 mb-8 font-medium italic">ranna messenger</p>

        <div className="w-full space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="البريد الإلكتروني" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-12 pl-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="كلمة المرور" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-12 pl-12 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <MoreHorizontal className="animate-pulse" /> : (mode === 'login' ? 'دخول' : mode === 'register' ? 'إنشاء حساب' : 'استعادة')}
            </button>
          </form>

          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs font-bold text-purple-600 w-full text-center"
          >
            {mode === 'login' ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخول'}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-purple-50 dark:bg-slate-950 px-2 text-slate-400 uppercase tracking-widest text-[10px]">أو</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={handleGoogleLogin}
               disabled={loading}
               className="h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
             >
               <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                 <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
               </div>
               التسجيل بواسطة Google
             </button>

             <button 
               onClick={handleDevBypass}
               disabled={loading}
               className="h-12 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
             >
               <Zap size={18} />
               Guest
             </button>
          </div>
        </div>

        {error && (
          <p className="mt-8 text-rose-500 text-[10px] font-bold bg-rose-50 dark:bg-rose-900/10 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800">{error}</p>
        )}
      </motion.div>
    </div>
  );
};
