import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { UserPlus, Search, UserCheck, ChevronLeft } from 'lucide-react';
import { db, getOrCreateRoom } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { User } from '../types';
import { getSharableUrl } from '../lib/utils';

interface ContactsProps {
  userId: string;
  onNavigate: (roomId: string) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ userId, onNavigate }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newUserId, setNewUserId] = useState('');

  const fetchInitialUsers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'), 
        orderBy('displayName', 'asc'),
        limit(30)
      );
      const snap = await getDocs(q);
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(u => u.id !== userId);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialUsers();
  }, [userId]);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (!val.trim()) {
      fetchInitialUsers();
      return;
    }
    
    setLoading(true);
    try {
      const cleanVal = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      // Try exact username search first
      const qUsername = query(
        collection(db, 'users'),
        where('username', '==', cleanVal),
        limit(1)
      );
      
      const snapUsername = await getDocs(qUsername);
      let foundUsers = snapUsername.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

      // Fuzzy search by username
      const qFuzzy = query(
        collection(db, 'users'),
        where('username', '>=', cleanVal),
        where('username', '<=', cleanVal + '\uf8ff'),
        limit(10)
      );
      
      const snapFuzzy = await getDocs(qFuzzy);
      const fuzzyData = snapFuzzy.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      const combined = [...foundUsers, ...fuzzyData];
      const unique = combined.reduce((acc, curr) => {
        if (!acc.find(u => u.id === curr.id)) acc.push(curr);
        return acc;
      }, [] as User[]);

      setUsers(unique.filter(u => u.id !== userId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setLoading(true);
    try {
      // Search by exact username
      const q = query(collection(db, 'users'), where('username', '==', newUserId.trim().toLowerCase()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert('المستخدم غير موجود. تأكد من كتابة المعرف بشكل صحيح.');
      } else {
        const found = { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
        await startChat(found.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (otherId: string) => {
    const roomId = await getOrCreateRoom(userId, otherId);
    onNavigate(roomId);
  };

  const inviteLink = getSharableUrl();
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    if (navigator.share) {
      navigator.share({
        title: 'انضم إلي على رنة',
        text: 'رنة - تطبيق المراسلة الأكثر أماناً وقوة. انضم إلي الآن!',
        url: inviteLink
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-8 py-4 shrink-0 flex flex-col gap-4">
        <div className="p-4 glass rounded-[2.5rem] bg-white/40 dark:bg-slate-800/20 border-white/50 flex items-center px-8 transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-sm">
          <Search size={18} className="text-emerald-deep/40 dark:text-emerald-500/40" />
          <input 
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('search')} 
            className="bg-transparent border-none outline-none text-sm px-4 flex-1 text-slate-800 dark:text-white placeholder:text-slate-400 font-medium"
          />
        </div>

        <button 
          onClick={copyInvite}
          className="flex items-center justify-between p-4 glass rounded-3xl bg-indigo-600/10 border-indigo-600/20 group hover:bg-indigo-600 transition-all border shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
              <UserPlus size={18} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 group-hover:text-white">دعوة الأصدقاء</p>
              <p className="text-[8px] font-bold text-slate-400 group-hover:text-indigo-100">انسخ رابط رنة وشاركه مع أحبابك</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-indigo-600 group-hover:text-white bg-white/40 group-hover:bg-indigo-700 px-3 py-1.5 rounded-full">
            {copied ? "تم النسخ ✓" : "نسخ الرابط"}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 flex flex-col gap-4 py-4 pb-32">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{t('contacts')}</span>
          <button 
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:opacity-70"
          >
            <UserPlus size={14} />
            {isAddingNew ? 'إغلاق' : 'إضافة مستخدم'}
          </button>
        </div>

        {isAddingNew && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            onSubmit={handleAddById}
            className="p-5 glass rounded-3xl bg-emerald-500/5 border-emerald-500/20 border mb-2"
          >
            <p className="text-[10px] font-black uppercase text-emerald-600 mb-3 tracking-widest text-right">إضافة بواسطة المعرف (Username)</p>
            <div className="flex gap-2">
              <input 
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="أدخل المعرف @username"
              />
              <button 
                type="submit"
                disabled={loading}
                className="px-6 bg-emerald-600 text-white rounded-2xl font-bold active:scale-95 transition-all text-sm"
              >
                {loading ? 'جاري البحث...' : 'إضافة'}
              </button>
            </div>
          </motion.form>
        )}

        {users.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, x: 4 }}
            className="flex items-center justify-between p-5 luxury-card group backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.8rem] bg-gradient-to-br from-emerald-600 to-indigo-600 flex items-center justify-center font-serif italic text-white relative text-xl shadow-md overflow-hidden">
                {user.photoURL ? <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : user.displayName[0]}
                {user.status === 'online' && (
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-white font-serif italic">{user.displayName}</h3>
                  {user.verified && <UserCheck size={14} className="text-emerald-500" />}
                </div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">@{user.username}</p>
              </div>
            </div>
            <button 
              onClick={() => startChat(user.id)}
              className="px-6 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-emerald-deep hover:text-white transition-all border border-white/50 dark:border-white/5"
            >
              {t('chats')}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
