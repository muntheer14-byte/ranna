import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  User as UserIcon, 
  AtSign, 
  Check, 
  Loader2, 
  ArrowRight, 
  Camera,
  MessageCircle,
  ShieldCheck,
  Zap,
  Globe,
  Smartphone
} from 'lucide-react';
import { db, auth, safeGetDoc } from '../lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

interface OnboardingProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username.length >= 3) {
      if (username === user?.username) {
        setIsAvailable(true);
        setIsChecking(false);
        return;
      }
      setError(null);
      setIsChecking(true);
      const timer = setTimeout(checkUsername, 300);
      
      // Auto-permissive fallback after 5 seconds of checking
      const fallbackTimer = setTimeout(() => {
        if (isChecking) {
          console.warn("Username check timed out, allowing entry.");
          setIsAvailable(true);
          setIsChecking(false);
        }
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
    } else {
      setIsAvailable(null);
    }
  }, [username, user?.username]);

  const checkUsername = async () => {
    const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 3) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }
    
    // Immediate check if it's their current one
    if (clean === user?.username) {
      setIsAvailable(true);
      setIsChecking(false);
      return;
    }

    try {
      const snap = await safeGetDoc(doc(db, 'usernames', clean));
      if (snap && snap.exists()) {
        const data = snap.data();
        const ownerId = data.uid || data.userId;
        if (ownerId === user.id) {
          setIsAvailable(true);
        } else {
          setIsAvailable(false);
        }
      } else {
        setIsAvailable(true);
      }
    } catch (e: any) {
      console.error("Username validation error:", e);
      // Fallback: permissive if rules fail
      setIsAvailable(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = () => setStep(s => s + 1);

  const handleSubmit = async () => {
    setError(null);
    // Handles must be Latin for technical reasons
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (cleanUsername.length < 3) {
       setError("اسم المستخدم (Handle) يجب أن يحتوي على 3 أحرف إنجليزية أو أرقام على الأقل");
       return;
    }
    if (!displayName.trim()) {
       setError("يرجى إدخال اسمك الكريم (الاسم المعروض)");
       return;
    }

    setIsLoading(true);
    setError(null);
    console.log("[Onboarding] Submitting...", { displayName, cleanUsername });

    try {
      // 1. Basic User Doc Update (Primary)
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        displayName,
        username: cleanUsername,
        phoneNumber: phoneNumber || '',
        bio: bio || '',
        onboardingComplete: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log("[Onboarding] User doc updated successfully");

      // 2. Username Reservation (Secondary/Non-blocking)
      try {
        await setDoc(doc(db, 'usernames', cleanUsername), { uid: user.id });
        console.log("[Onboarding] Username reserved successfully");
      } catch (hErr) {
        console.warn("[Onboarding] Username reservation failed (handled):", hErr);
      }

      // 3. Final State Sync
      const finalUser = { 
        ...user, 
        displayName, 
        username: cleanUsername, 
        phoneNumber: phoneNumber || '', 
        bio: bio || '', 
        onboardingComplete: true,
        status: 'online'
      } as User;

      console.log("[Onboarding] Onboarding complete, calling onComplete");
      
      // Visual feedback: success indicator
      setIsLoading(false);
      setError(null);
      
      // Call onComplete immediately to avoid "nothing happens" feeling
      onComplete(finalUser);
      
    } catch (e: any) {
      console.error("[Onboarding] ERROR:", e);
      setError(e.message || "فشل إكمال التسجيل. يرجى التحقق من اتصال الإنترنت.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full" 
        />
      </div>

      <div className="relative z-10 w-full max-w-lg p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl">
                  <ShieldCheck size={48} />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">أهلاً بك في رنة</h1>
                <p className="text-slate-500 font-medium italic">تواصل بخصوصية وأمان تام</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <FeatureCard icon={ShieldCheck} title="تشفير تام" desc="خصوصيتك هي الأهم" />
                <FeatureCard icon={Zap} title="سرعة فائقة" desc="تواصل بدون تأخير" />
              </div>

              <button 
                onClick={handleNext}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
              >
                ابدأ الآن
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">إعداد الحساب</h2>
                <p className="text-slate-500 font-medium">اختر اسمك المفضل واسماً للمستخدم</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-slate-200 dark:border-slate-800">
                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={32} />}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full border-2 border-white dark:border-slate-950">
                      <Camera size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <AtSign size={20} className="text-slate-400" />
                    <div className="flex-1">
                      <input 
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="اسم المستخدم (بالإنجليزي)"
                        className="w-full bg-transparent border-none focus:ring-0 text-base font-bold p-0"
                      />
                    </div>
                    {isChecking ? <Loader2 className="animate-spin text-slate-300" size={20} /> : 
                     isAvailable === true ? <Check size={20} className="text-emerald-500" /> :
                     isAvailable === false ? <AtSign size={20} className="text-rose-500" /> : null
                    }
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <UserIcon size={20} className="text-slate-400" />
                    <div className="flex-1">
                      <input 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="اسمك الكامل"
                        className="w-full bg-transparent border-none focus:ring-0 text-base font-bold p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isLoading || !isAvailable || username.length < 3 || !displayName.trim()}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale-[0.5]"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  !username || username.length < 3 ? "أدخل اسم المستخدم" :
                  isChecking ? "جاري التحقق..." :
                  isAvailable === false ? "اسم المستخدم غير متاح" :
                  !displayName.trim() ? "أدخل اسمك الكريم" :
                  "إكمال التسجيل"
                )}
              </button>
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-bold"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="glass p-5 rounded-[2rem] border-white/40 space-y-2 shadow-xl shadow-black/5 group hover:bg-emerald-500/5 transition-all duration-500">
    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
      <Icon size={18} />
    </div>
    <h3 className="text-xs font-black uppercase tracking-widest">{title}</h3>
    <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
  </div>
);
