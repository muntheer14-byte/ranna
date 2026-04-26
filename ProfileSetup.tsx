import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, Camera, Phone, Check, ChevronDown } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { db, safeGetDoc } from '../lib/firebase';
import { doc, writeBatch, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { COUNTRY_CODES } from '../constants';

interface ProfileSetupProps {
  user: FirebaseUser;
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onComplete }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]); // Default to SA
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  // Auto-generate username from email if available
  useEffect(() => {
    if (user.email && !username) {
      const base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setUsername(base);
    }
  }, [user.email]);

  const handleSave = async () => {
    const cleanUsername = username.toLowerCase().trim();
    if (!displayName.trim() || !cleanUsername) {
      setError('يرجى ملء الاسم واسم المستخدم');
      return;
    }
    setLoading(true);
    setError('');
    setIsOffline(false);

    try {
      // Try to reach server first to ensure uniqueness
      // If we are strictly offline, Firestore will throw or wait.
      // Using a timeout-like behavior for getDocFromServer
      const uniquenessCheck = async () => {
        try {
          return await getDocFromServer(doc(db, 'usernames', cleanUsername));
        } catch (e: any) {
          console.warn("Server check failed, falling back to standard fetch", e.message);
          return await safeGetDoc(doc(db, 'usernames', cleanUsername));
        }
      };

      const nameDoc = await uniquenessCheck();
      
      const nameData = nameDoc?.data() as { uid: string } | undefined;
      if (nameDoc?.exists() && nameData?.uid !== user.uid) {
        throw new Error('اسم المستخدم هذا مستخدم بالفعل من قبل شخص آخر');
      }

      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', user.uid);
      const usernameDocRef = doc(db, 'usernames', cleanUsername);

      const userData = {
        id: user.uid,
        displayName: displayName.trim(),
        username: cleanUsername,
        photoURL: user.photoURL || '',
        phoneNumber: `${countryCode.code}${phone.trim()}`,
        status: 'online' as const,
        verified: false,
        role: 'user' as const,
        badges: [],
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        onboardingComplete: true
      };

      batch.set(userDocRef, userData, { merge: true });
      batch.set(usernameDocRef, { uid: user.uid });

      await batch.commit();
      onComplete();
    } catch (err: any) {
      console.error("Setup error:", err);
      if (err.message?.includes('offline') || err.code === 'unavailable') {
        setIsOffline(true);
        setError('تعذر الاتصال بقاعدة البيانات. تأكد من أنك قمت بإنشاء قاعدة بيانات (Firestore) في لوحة تحكم Firebase واختيار "Test Mode".');
      } else {
        setError(err.message || 'حدث خطأ أثناء الحفظ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto overflow-hidden-x flex flex-col items-center py-12 px-6">
      <div className="noise-overlay" />
      
      {/* Design Elements */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md flex flex-col items-center gap-8"
      >
        {/* Welcome Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-900 flex items-center justify-center text-white mb-2 shadow-2xl">
            <UserIcon size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-serif italic text-slate-900 dark:text-white">أهلاً بك في رنة</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 opacity-60">لنقم بإعداد ملف الملف الشخصي المتميز</p>
        </div>

        {/* Profile Photo */}
        <div className="relative group">
           <div className="w-32 h-32 rounded-[3.5rem] bg-slate-100 dark:bg-slate-800 overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-2xl">
              {user.photoURL ? (
                <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-emerald-600 font-serif italic">
                  {displayName[0] || 'R'}
                </div>
              )}
           </div>
           <button className="absolute bottom-1 right-1 w-10 h-10 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-xl border-2 border-white dark:border-slate-900 active:scale-90 transition-transform">
              <Camera size={18} />
           </button>
           <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max text-[9px] font-black uppercase tracking-widest text-emerald-600">أضف صورتك الشخصية</p>
        </div>

        {/* Form Fields */}
        <div className="w-full mt-8 space-y-6">
           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4 block text-right">الاسم الذي يظهر للآخرين</label>
             <div className="relative">
                <input 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  dir="rtl"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-[1.8rem] p-5 pr-14 text-sm font-bold text-slate-800 dark:text-white border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none" 
                  placeholder="الاسم"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                  <UserIcon size={18} />
                </div>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4 block text-right">اسم المستخدم (المعرف الفريد)</label>
             <div className="relative">
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-[1.8rem] p-5 pr-14 text-sm font-bold text-slate-800 dark:text-white border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none" 
                  placeholder="username"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">@</div>
                <p className="px-4 mt-2 text-[9px] text-slate-400 text-right">سيتمكن الآخرون من العثور عليك باستخدام هذا المعرف.</p>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4 block text-right">رقم الهاتف</label>
             <div className="relative flex gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowCountryCodes(!showCountryCodes)}
                    className="h-full px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center gap-2 border-2 border-transparent hover:border-emerald-500/20 transition-all outline-none"
                  >
                    <span className="text-xl">{countryCode.flag}</span>
                    <span className="text-sm font-bold">{countryCode.code}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {showCountryCodes && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-72 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 z-[210] border border-slate-100 dark:border-white/5 no-scrollbar"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <button
                            key={c.code + c.country}
                            onClick={() => {
                              setCountryCode(c);
                              setShowCountryCodes(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-right"
                          >
                            <span className="text-xl">{c.flag}</span>
                            <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                            <span className="text-xs font-black text-emerald-600">{c.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex-1">
                   <input 
                     value={phone} 
                     onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                     className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 pr-14 text-sm font-bold text-slate-800 dark:text-white border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none" 
                     placeholder="5xxxxxxxx"
                   />
                   <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                     <Phone size={18} />
                   </div>
                </div>
             </div>
           </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/20 px-4 py-2 rounded-lg">
            {error}
          </motion.p>
        )}

        <div className="w-full mt-4">
           <button 
             onClick={handleSave}
             disabled={loading}
             className="w-full h-16 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[1.8rem] text-white flex items-center justify-center gap-3 shadow-2xl shadow-emerald-900/20 disabled:opacity-50 active:scale-95 transition-all group"
           >
             {loading ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <span className="font-black uppercase tracking-[0.3em] text-sm">إبدأ رحلتك المتميزة</span>
                 <Check size={20} className="group-hover:translate-x-1 transition-transform" />
               </>
             )}
           </button>
        </div>
      </motion.div>
    </div>
  );
};
