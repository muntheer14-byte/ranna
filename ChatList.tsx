import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Palette, 
  MessageSquare, 
  Users, 
  Compass, 
  User as UserIcon, 
  Plus, 
  Bookmark, 
  Trash2, 
  Pin, 
  BellOff, 
  ShieldCheck, 
  Zap,
  FolderPlus,
  Settings2,
  Sparkles,
  Wand2,
  MessageCircle
} from 'lucide-react';
import { ChatListItem } from './ChatListItem';
import { Stories } from './Stories';
import { FeaturesRoadmap } from './FeaturesRoadmap';
import { Room, Page, User } from '../types';
import { db, getOrCreateRoom, subscribeToRooms } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { mockDb } from '../lib/mockFirebase';

interface ChatListProps {
  onNavigate: (page: Page) => void;
  onChatSelect: (roomId: string) => void;
  userId: string;
}

const NavButton = ({ icon: Icon, active, onClick, count }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl relative transition-all duration-300 ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    {count > 0 && (
      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-black">
        {count}
      </span>
    )}
  </button>
);

const ContextMenuItem = ({ icon: Icon, label, onClick, danger }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right justify-between ${
      danger 
        ? 'hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-500' 
        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
    }`}
  >
    <Icon size={18} className={danger ? 'text-rose-500' : 'text-slate-400'} />
    <span className="text-sm font-bold">{label}</span>
  </button>
);

export const ChatList: React.FC<ChatListProps> = ({ onNavigate, onChatSelect, userId }) => {
  const { t, i18n } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showFABItems, setShowFABItems] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<'all' | 'personal' | 'groups' | 'channels'>('all');
  const [folders, setFolders] = useState<{id: string, name: string}[]>([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [search, setSearch] = useState('');
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, roomId: '', type: '' });

  // Filter labels for translation mapping
  const filters = [
    { id: 'all', label: t('all') },
    { id: 'personal', label: t('personal') },
    { id: 'groups', label: t('groups') },
    { id: 'channels', label: t('channels') }
  ];

  useEffect(() => {
    const handleFocus = () => searchInputRef.current?.focus();
    window.addEventListener('focus-search', handleFocus);
    return () => window.removeEventListener('focus-search', handleFocus);
  }, []);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    
    if (val.length < 3) return;
    
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', val.toLowerCase()),
        where('username', '<=', val.toLowerCase() + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data(), isUser: true })));
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const startChat = async (otherId: string) => {
    try {
      const roomId = await getOrCreateRoom(userId, otherId);
      onChatSelect(roomId);
      onNavigate('chat-room');
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert(t('chat_start_error'));
    }
  };

  const openSavedMessages = async () => {
    if (!userId) return;
    try {
      const roomId = await getOrCreateRoom(userId, userId);
      onChatSelect(roomId);
      onNavigate('chat-room');
    } catch (err) {
      console.error("Failed to open saved messages:", err);
    }
  };

  const handleDeleteChat = async (roomId: string) => {
    if (!window.confirm(t('confirm_delete_chat'))) return;
    
    // Design Phase: Mock Data Fallback
    const isMock = userId.startsWith('user-') || userId === 'fallback_dev_id';
    
    try {
      if (isMock) {
        setRooms(prev => prev.filter(r => r.id !== roomId));
      } else {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'rooms', roomId));
      }
      setContextMenu({ ...contextMenu, isOpen: false });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (err) {
      console.error("Delete room error:", err);
      alert(t('chat_delete_error'));
    }
  };

  const handleJoinByCode = async () => {
    const code = window.prompt(t('enter_invite_code'));
    if (!code) return;
    
    try {
      const { doc, getDoc, arrayUnion, updateDoc } = await import('firebase/firestore');
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        await updateDoc(roomRef, {
          members: arrayUnion(userId)
        });
        onChatSelect(code);
        onNavigate('chat-room');
      } else {
        alert(t('invalid_invite_code'));
      }
    } catch (err) {
      console.error("Join by code error:", err);
      alert(t('join_failed'));
    }
  };

  const handleAddFolder = () => {
    const name = window.prompt(t('enter_folder_name'));
    if (name) {
      const newFolder = { id: Date.now().toString(), name };
      setFolders([...folders, newFolder]);
      // Save to local storage for now
      localStorage.setItem(`folders_${userId}`, JSON.stringify([...folders, newFolder]));
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(`folders_${userId}`);
    if (saved) setFolders(JSON.parse(saved));
  }, [userId]);

  // Real Firestore Listener for Rooms (or Mock for Design Phase)
  useEffect(() => {
    if (!userId) return;

    // Design Phase: Detect if user is a mock user from devBypassLogin
    const isMock = userId.startsWith('user-') || userId === 'fallback_dev_id';

    const unsubscribe = subscribeToRooms(
      userId,
      isMock,
      (roomsData) => {
        let filteredData = roomsData.filter(r => {
          // Filter out the "Saved Messages" room (type: 'saved' or private room with self) 
          // because we have a static button for it at the top
          const isSavedMsgRoom = r.type === 'saved' || (r.type === 'private' && r.members.length === 1 && r.members[0] === userId);
          return !isSavedMsgRoom;
        });

        if (filter !== 'all') {
          const typeMap: Record<string, string> = { personal: 'private', groups: 'group', channels: 'channel' };
          filteredData = filteredData.filter(r => r.type === typeMap[filter]);
        }
        setRooms(filteredData);
      },
      (error) => console.error("Error fetching rooms:", error)
    );

    return () => unsubscribe();
  }, [userId, filter]);

  const handleToggleFolderRoom = (folderId: string, roomId: string) => {
    const updated = folders.map(f => {
      if (f.id === folderId) {
        const roomIds = (f as any).roomIds || [];
        const index = roomIds.indexOf(roomId);
        const newRoomIds = index > -1 
          ? roomIds.filter((id: string) => id !== roomId) 
          : [...roomIds, roomId];
        return { ...f, roomIds: newRoomIds };
      }
      return f;
    });
    setFolders(updated);
    localStorage.setItem(`folders_${userId}`, JSON.stringify(updated));
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const roomsToDisplay = rooms.filter(room => {
    if (search) {
      return room.name?.toLowerCase().includes(search.toLowerCase()) || 
             room.lastMessage?.content?.toLowerCase().includes(search.toLowerCase());
    }
    
    // Folder filtering
    if (activeFolderId !== 'all') {
      const folder = folders.find(f => f.id === activeFolderId);
      if (folder) {
        const folderRoomIds = (folder as any).roomIds || [];
        return folderRoomIds.includes(room.id);
      }
    }

    if (filter === 'all') return true;
    const typeMap: Record<string, string> = { personal: 'private', groups: 'group', channels: 'channel' };
    return room.type === typeMap[filter];
  });

  return (
    <motion.div 
      key="chats-tab" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      <div className="px-4 pt-2 pb-4">
         <div className="bg-white dark:bg-black border border-slate-200 dark:border-white/5 p-1.5 flex items-center gap-3 rounded-2xl shadow-sm focus-within:border-indigo-500 transition-all">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
               <Search size={20} />
            </div>
            <input 
              ref={searchInputRef}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('search')} 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-slate-400"
            />
            <button 
              onClick={() => setShowRoadmap(true)}
              className="p-2.5 text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all group"
              title={t('roadmap')}
            >
               <motion.div
                 whileHover={{ rotate: -15, scale: 1.1 }}
                 whileTap={{ rotate: 5, scale: 0.9 }}
               >
                 <Wand2 size={20} className="rotate-[-45deg] text-orange-500" />
               </motion.div>
            </button>
         </div>
         {searchResults.length > 0 && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-4 p-3 bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl space-y-2 shadow-2xl relative z-50"
           >
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">{t('search_results')}</h4>
             {searchResults.map(res => (
               <button 
                 key={res.id} 
                 onClick={() => startChat(res.id)}
                 className="w-full flex items-center gap-4 p-3 hover:bg-indigo-500/10 rounded-2xl transition-all group"
               >
                 <div className="relative">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold border border-white/20">
                     {res.photoURL ? <img src={res.photoURL} className="w-full h-full object-cover rounded-2xl" /> : res.displayName[0]}
                   </div>
                   {res.status === 'online' && (
                     <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-black" />
                   )}
                 </div>
                 <div className="flex-1 text-right">
                   <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     {res.displayName}
                     {res.verified && <ShieldCheck size={14} className="text-indigo-500" />}
                   </p>
                   <p className="text-xs text-slate-400 font-medium">@{res.username}</p>
                 </div>
                 <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Plus size={18} />
                 </div>
               </button>
             ))}
           </motion.div>
         )}
         <div className="flex gap-2 overflow-x-auto no-scrollbar mt-6">
             {filters.map(f => (
               <button 
                 key={f.id} 
                 onClick={() => setFilter(f.id as any)}
                 className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                   filter === f.id ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-500 bg-slate-100 dark:bg-black'
                 }`}
               >
                 {f.label}
               </button>
             ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4 space-y-4 pt-4">
        {(activeFolderId === 'all' && filter === 'all') && (
          <div 
            role="button"
            tabIndex={0}
            onClick={openSavedMessages}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openSavedMessages();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (navigator.vibrate) navigator.vibrate(50);
              setContextMenu({ 
                isOpen: true, 
                x: e.clientX, 
                y: e.clientY, 
                roomId: 'saved',
                type: 'saved'
              });
            }}
            className="w-full group cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-[2.5rem]"
          >
            <div className="p-4 glass rounded-[2.5rem] bg-indigo-600/10 border-indigo-600/20 hover:bg-indigo-600 transition-all flex items-center gap-4 group/item border">
              <div className="w-14 h-14 rounded-[1.8rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Bookmark size={24} />
              </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 dark:text-white group-hover:text-white transition-colors">{t('saved_messages')}</span>
                    <span className="text-[10px] font-black uppercase text-indigo-600 group-hover:text-white/80 transition-colors">{t('my_cloud')}</span>
                  </div>
                  <p className="text-xs text-slate-400 group-hover:text-indigo-100 transition-colors truncate text-right">{t('saved_messages_desc')}</p>
                </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{t('recent_chats')}</span>
          <div className="w-10 h-0.5 bg-emerald-deep/10 rounded-full" />
        </div>

        {roomsToDisplay.length > 0 ? (
          roomsToDisplay.map(room => (
            <ChatListItem 
              key={room.id} 
              room={room} 
              userId={userId}
              onClick={() => {
                onChatSelect(room.id);
                onNavigate('chat-room');
              }} 
              onLongPress={(e) => {
                const x = e.clientX || (e as any).touches?.[0]?.clientX || 0;
                const y = e.clientY || (e as any).touches?.[0]?.clientY || 0;
                setContextMenu({ 
                  isOpen: true, 
                  x, 
                  y, 
                  roomId: room.id,
                  type: 'room'
                });
              }}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-20 opacity-30">
            <MessageSquare size={40} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">{t('no_active_conversations') || 'No Active Conversations'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showRoadmap && <FeaturesRoadmap onClose={() => setShowRoadmap(false)} />}
        {contextMenu.isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu({ ...contextMenu, isOpen: false })} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ 
                top: contextMenu.y, 
                left: i18n.dir() === 'rtl' ? Math.max(16, contextMenu.x - 192) : Math.min(contextMenu.x, window.innerWidth - 208) 
              }}
              className="fixed z-[110] w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl p-1 overflow-hidden"
            >
              <div className="p-2 border-b border-slate-50 dark:border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">{t('add_to_folder')}</p>
                <div className="flex flex-wrap gap-1 px-1">
                  {folders.map(f => {
                    const isInFolder = ((f as any).roomIds || []).includes(contextMenu.roomId);
                    return (
                      <button 
                        key={f.id}
                        onClick={() => handleToggleFolderRoom(f.id, contextMenu.roomId)}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${
                          isInFolder 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500'
                        }`}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                  <button onClick={handleAddFolder} className="p-1 px-2 text-indigo-600 rounded-md bg-indigo-50 dark:bg-indigo-900/20"><Plus size={10} /></button>
                </div>
              </div>

              <ContextMenuItem icon={Pin} label={t('pin_chat')} onClick={() => {}} />
              <ContextMenuItem icon={BellOff} label={t('mute')} onClick={() => {}} />
              <ContextMenuItem 
                icon={Trash2} 
                label={t('delete')} 
                danger 
                onClick={() => handleDeleteChat(contextMenu.roomId)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-black dark:via-black/95 dark:to-transparent border-t border-slate-100 dark:border-white/5 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4 p-2 bg-slate-100/80 dark:bg-black/80 backdrop-blur-2xl rounded-full border border-slate-200 dark:border-white/10 shadow-2xl relative pointer-events-auto">
          <NavButton icon={MessageCircle} active={filter === 'all'} onClick={() => setFilter('all')} count={rooms.length} />
          <NavButton icon={Bookmark} active={filter === 'personal'} onClick={openSavedMessages} />
          
          <div className="relative">
            <button 
              onClick={() => setShowFABItems(!showFABItems)}
              className={`w-14 h-14 -mt-10 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 border-4 border-white dark:border-black ring-8 ring-indigo-600/10 ${showFABItems ? 'bg-rose-500 rotate-[135deg]' : 'bg-indigo-600'}`}
            >
              <Plus size={32} />
            </button>

            <AnimatePresence>
              {showFABItems && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, x: '-50%', scale: 0.8 }}
                  animate={{ opacity: 1, y: -20, x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.8 }}
                  className="absolute bottom-20 left-1/2 flex flex-col gap-6 items-center"
                >
                  <FABItem icon={Users} label={t('new_group')} color="bg-indigo-600" onClick={() => onNavigate('create-group')} />
                  <FABItem icon={Zap} label={t('join_by_code')} color="bg-amber-500" onClick={handleJoinByCode} />
                  <FABItem icon={MessageSquare} label={t('new_chat')} color="bg-emerald-600" onClick={() => { setShowFABItems(false); searchInputRef.current?.focus(); }} />
                  <div className="w-1 h-12 bg-gradient-to-b from-indigo-600 to-transparent rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavButton icon={Users} active={filter === 'groups'} onClick={() => setFilter('groups')} />
          <NavButton icon={Settings2} active={false} onClick={() => onNavigate('settings')} />
        </div>
      </div>

    </motion.div>
  );
};

const FABItem = ({ icon: Icon, label, color, onClick }: any) => (
  <motion.button 
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 group"
  >
    <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-xl border-4 border-white dark:border-black`}>
      <Icon size={22} />
    </div>
    <span className="bg-slate-900 dark:bg-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-white dark:text-black shadow-lg border border-white/10 whitespace-nowrap">
      {label}
    </span>
  </motion.button>
);
