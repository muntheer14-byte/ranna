import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, MoreHorizontal, ShieldCheck, TrendingUp, Users, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { db, safeGetDoc } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { User, Post } from '../types';

export const Feed = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'for_you' | 'following' | 'trending'>('for_you');
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'posts'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const postsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setPosts(postsData);
      
      // Resolve authors
      const authorIds = [...new Set(postsData.map(p => p.authorUid))];
      const newAuthors = { ...authors };
      
      const authorPromises = authorIds.map(async (id) => {
        if (!newAuthors[id]) {
          const uDoc = await safeGetDoc(doc(db, 'users', id));
          if (uDoc && uDoc.exists()) {
            newAuthors[id] = uDoc.data() as User;
          }
        }
      });
      
      await Promise.all(authorPromises);
      setAuthors(newAuthors);
      setLoading(false);
    }, (err) => {
      console.error("Feed error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab]);

  const tabs = [
    { id: 'for_you', label: t('for_you'), icon: Sparkles },
    { id: 'following', label: t('following'), icon: Users },
    { id: 'trending', label: t('trending'), icon: TrendingUp },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
      <div className="sticky top-0 z-20 px-8 py-4 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-white/20">
        <div className="flex gap-2 justify-between items-center max-w-2xl mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (navigator.vibrate) navigator.vibrate(20);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-8 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{t('explore')}</span>
          <div className="flex gap-2 items-center">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-500 tracking-widest">Live Updates</span>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] font-serif italic">Loading Insights...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center p-20 glass rounded-[3rem] border border-emerald-500/10">
               <Sparkles className="mx-auto mb-4 text-purple-600 animate-pulse" size={40} />
               <p className="text-sm font-serif italic text-slate-400">Your feed is waiting for inspiration...</p>
            </div>
          ) : posts.map((post, i) => {
            const author = authors[post.authorUid];
            const date = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="ranna-card-glass p-0 overflow-hidden group shadow-hover transition-all"
              >
                {/* Header */}
                <div className="p-6 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[1.4rem] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                         {author?.photoURL ? <img src={author.photoURL} className="w-full h-full object-cover" /> : <span className="font-serif italic font-bold uppercase">{author?.displayName?.[0] || 'U'}</span>}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{author?.displayName || 'User'}</h3>
                        {author?.verified && <ShieldCheck size={14} className="text-emerald-500" />}
                      </div>
                      <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">
                        {formatDistanceToNow(date)} ago
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-8 pb-6">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {post.content}
                  </p>
                </div>

                {/* Media */}
                {post.mediaURL && (
                  <div className="px-8 pb-6">
                    <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-white/50 dark:border-white/5 shadow-2xl relative">
                      <img src={post.mediaURL} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-5 bg-slate-50/50 dark:bg-white/5 border-t border-white/40 dark:border-white/5 flex justify-between items-center">
                  <div className="flex gap-8">
                    <button className="flex items-center gap-2.5 group/btn">
                      <div className="p-2.5 rounded-2xl group-hover/btn:bg-rose-500/10 group-hover/btn:text-rose-500 transition-all text-slate-400 bg-white dark:bg-slate-800 shadow-sm">
                        <Heart size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{post.likes?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-2.5 group/btn">
                      <div className="p-2.5 rounded-2xl group-hover/btn:bg-indigo-500/10 group-hover/btn:text-indigo-500 transition-all text-slate-400 bg-white dark:bg-slate-800 shadow-sm">
                        <MessageCircle size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{post.commentsCount || 0}</span>
                    </button>
                  </div>
                  <button className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all shadow-sm">
                    <Share2 size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
