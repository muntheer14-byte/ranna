import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db, safeGetDoc } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { User, Story } from '../types';

export const Stories = () => {
  const { t } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stories from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'stories'),
      where('createdAt', '>=', Timestamp.fromDate(yesterday)),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const storiesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Story));
      setStories(storiesData);
      
      const authorIds = [...new Set(storiesData.map(s => s.userId))];
      const newAuthors = { ...authors };
      
      await Promise.all(authorIds.map(async (id) => {
        if (!newAuthors[id]) {
          const uDoc = await safeGetDoc(doc(db, 'users', id));
          if (uDoc && uDoc.exists()) newAuthors[id] = uDoc.data() as User;
        }
      }));
      
      setAuthors(newAuthors);
      setLoading(false);
    }, (err) => {
      console.error("Stories error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar py-2 shrink-0">
      {/* Create Story */}
      <div className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer">
        <div className="w-14 h-14 rounded-[1.6rem] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all group-hover:border-ranna-accent group-hover:bg-ranna-accent/5">
          <Plus size={20} className="text-slate-400 group-hover:text-ranna-accent transition-colors" />
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('my_story')}</span>
      </div>

      {loading ? (
        Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
            <div className="w-14 h-14 rounded-[1.6rem] bg-slate-100 dark:bg-slate-800" />
            <div className="w-8 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        ))
      ) : stories.map((story) => {
        const user = authors[story.userId];
        return (
          <div key={story.id} className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer">
            <div className="w-14 h-14 rounded-[1.6rem] p-0.5 bg-gradient-to-tr from-ranna-accent to-indigo-600 transition-all group-hover:scale-105 group-hover:rotate-3 shadow-sm">
              <div className="w-full h-full rounded-[1.55rem] border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-900">
                <img 
                  src={story.mediaURL} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-800 dark:text-white truncate max-w-[56px]">
              {user?.displayName || 'User'}
            </span>
          </div>
        );
      })}
    </div>
  );
};
