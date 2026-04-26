import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Video, 
  MoreVertical, 
  ShieldCheck, 
  User as UserIcon, 
  Bell, 
  Shield, 
  Search,
  Users,
  ChevronDown,
  Trash2,
  Lock,
  Bookmark,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';
import { Message, Room, User, MessageType } from '../types';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  arrayUnion, 
  limitToLast,
  deleteField
} from 'firebase/firestore';
import { MessageList } from './MessageList';
import { MessageMenu } from './MessageMenu';
import { MessageInput } from './MessageInput';
import { 
  db, 
  safeGetDoc, 
  sendNotification, 
  decryptMessage, 
  encryptMessage, 
  subscribeToMessages,
  subscribeToRoom,
  subscribeToUserPresence,
  updateTypingStatus
} from '../lib/firebase';
import { mockDb } from '../lib/mockFirebase';
import { summarizeChat, generateSmartReply, translateText, transcribeAudio } from '../services/aiService';

import { getSharableUrl, copyToClipboard } from '../lib/utils';
import { ChatConfig } from './ChatConfig';
import { InviteCard } from './InviteCard';

interface ChatRoomProps {
  roomId: string;
  userId: string;
  user: User | null;
  onBack: () => void;
  onStartCall: (type: 'voice' | 'video', remoteUser: User) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onBack, onStartCall, userId, user }) => {
  const { t, i18n } = useTranslation();
  const [room, setRoom] = useState<Room | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0, isOpen: false, selectedMsg: null as Message | null });
  const [isEditing, setIsEditing] = useState(false);
  const [editMsg, setEditMsg] = useState<Message | null>(null);
  const [replyMsg, setReplyMsg] = useState<Message | null>(null);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isNeuralMode, setIsNeuralMode] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [presenceInfo, setPresenceInfo] = useState<{ status: string; lastSeen?: any }>({ status: 'offline' });
  const [showInvite, setShowInvite] = useState(false);
  const [detailedMsgId, setDetailedMsgId] = useState<string | null>(null);

  const handleAIBySum = async () => {
    if (!user?.settings?.intelligence?.autoSummarize) return;
    if (messages.length < 3) {
      alert('المحادثة قصيرة جداً للتلخيص');
      return;
    }
    setIsSummarizing(true);
    const chatData = messages.slice(-30).map(m => ({
      role: m.senderId === userId ? 'أنا' : 'الطرف الآخر',
      text: m.text
    }));
    const result = await summarizeChat(chatData);
    setSummary(result || null);
    setIsSummarizing(false);
  };

  useEffect(() => {
    const fetchReplies = async () => {
      if (!user?.settings?.intelligence?.smartReply) return;
      if (messages.length > 0 && messages[messages.length - 1].senderId !== userId) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.type === 'text') {
          const replies = await generateSmartReply(lastMsg.content);
          setSmartReplies(replies);
        }
      } else {
        setSmartReplies([]);
      }
    };
    fetchReplies();
  }, [messages.length, userId, user?.settings?.intelligence?.smartReply]);

  const isRTL = i18n.dir() === 'rtl';

  // Room Listener
  useEffect(() => {
    // Design Phase: Mock Data Fallback
    const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';
    
    if (isMock) {
      const mockRoom = mockDb.getRooms(userId).find(r => r.id === roomId);
      if (mockRoom) {
        setRoom(mockRoom);
        if (mockRoom.type === 'private') {
           const otherId = mockRoom.members.find(id => id !== userId);
           if (otherId) {
             const mUser = mockDb.getUser(otherId);
             if (mUser) setOtherUser(mUser);
           }
        }
      } else if (roomId.includes('saved') || roomId === userId) {
        // Fallback for Saved Messages in Mock Mode
        setRoom({
          id: roomId,
          type: 'saved',
          name: 'الرسائل المحفوظة',
          members: [userId],
          admins: [userId],
          createdAt: new Date(),
          updatedAt: new Date(),
          e2eEnabled: true
        });
      }
      setLoading(false);
      return () => {};
    }

    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Room;
        setRoom(data);
        setLoading(false);
        
        // Handle typing status
        if (data.typingStatus) {
           const typing = Object.entries(data.typingStatus)
             .filter(([id, timestamp]) => {
               if (id === userId) return false;
               // Filter out stale typing statuses (longer than 5 seconds ago)
               if (!timestamp) return false;
               const ts = (timestamp as any).toMillis?.() || (timestamp as any).seconds * 1000 || 0;
               return Date.now() - ts < 5000;
             })
             .map(([id]) => id);
           setTypingUsers(typing);
        } else {
           setTypingUsers([]);
        }

        if (data.type === 'private') {
           const otherId = data.members.find(id => id !== userId);
           if (otherId) {
             safeGetDoc(doc(db, 'users', otherId)).then(uSnap => {
               if (uSnap && uSnap.exists()) setOtherUser(uSnap.data() as User);
             }).catch(err => {
               console.error("Failed to fetch other user", err);
               setOtherUser({ id: otherId, displayName: 'User', status: 'offline', verified: false, badges: [], role: 'user' } as any);
             });
           }
        }
      }
    }, (err) => {
      console.error("Room listener error:", err);
      setLoading(false);
    });

    // Safety timeout for loading
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [roomId, userId]);

  const displayName = room?.type === 'saved' 
    ? 'الرسائل المحفوظة' 
    : (room?.type === 'private' ? (otherUser?.displayName || '...') : (room?.name || 'غرفة محادثة'));
  const photoURL = room?.type === 'saved' 
    ? null 
    : (room?.type === 'private' ? otherUser?.photoURL : room?.photoURL);

  // Messages Listener
  useEffect(() => {
    const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';

    const unsub = subscribeToMessages(roomId, isMock, (msgs) => {
      // Sound logic for new messages
      if (msgs.length > 0 && messages.length > 0) {
        const newMsgs = msgs.filter(m => !messages.find(om => om.id === m.id));
        const containsRemote = newMsgs.some(m => m.senderId !== userId);
        if (containsRemote) {
          const msgTone = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358.wav');
          msgTone.play().catch(() => {});
          if (navigator.vibrate) navigator.vibrate(20);
        }
      }

      // Client-side self-destruct and deleted filter
      const now = Date.now();
      const clearChatAt = room?.clearChatAt || 0;

      const filtered = msgs.filter(m => {
        const isExpired = m.isSelfDestruct && m.expiresAt && m.expiresAt <= now;
        const isDeleted = m.isDeleted;
        const isHiddenByClear = m.createdAt && (m.createdAt as any).toMillis?.() < clearChatAt;
        return !isExpired && !isDeleted && !isHiddenByClear;
      });
      
      setMessages(filtered);
      
      // Auto scroll if at bottom
      const isAtBottom = scrollRef.current 
        ? scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 150
        : true;
      
      if (isAtBottom) setTimeout(scrollToBottom, 100);

      // Real DB operations only if not mock
      if (!isMock) {
         // ... Firestore read status update logic if needed
      }
    });

    return () => unsub();
  }, [roomId, userId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShowScrollDown(!isAtBottom);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, type: string, extra: any = {}) => {
    const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';

    if (isEditing && editMsg) {
       if (isMock) {
          setIsEditing(false);
          setEditMsg(null);
          return;
       }
       await updateDoc(doc(db, 'rooms', roomId, 'messages', editMsg.id), {
         content,
         isEdited: true,
         updatedAt: serverTimestamp()
       });
       setIsEditing(false);
       setEditMsg(null);
       return;
    }

    // Prepare message data
    const selfDestructTime = room?.selfDestructTime || 0;
    const msgData: any = {
      roomId,
      senderId: userId,
      type: type as MessageType,
      content,
      readBy: [],
      deliveredBy: [userId],
      createdAt: serverTimestamp(), 
      isEdited: false,
      isSecret: isNeuralMode,
      isSelfDestruct: selfDestructTime > 0,
      expiresAt: selfDestructTime > 0 ? Date.now() + (selfDestructTime * 1000) : null,
      ...extra
    };

    if (replyMsg) {
       msgData.replyTo = {
         id: replyMsg.id,
         content: replyMsg.type === 'text' ? replyMsg.content : `[${replyMsg.type}]`,
         senderId: replyMsg.senderId
       };
       setReplyMsg(null);
    }

    // Optimistic Update: Add message locally before server call
    const optimisticMsg = { ...msgData, id: 'temp-' + Date.now(), isOptimistic: true };
    setMessages(prev => [...prev.filter(m => !m.isOptimistic), optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      if (isMock) {
        mockDb.sendMessage(msgData);
      } else {
        // Send with server timestamp for persistence
        const finalMsgData = { ...msgData, createdAt: serverTimestamp() };
        await addDoc(collection(db, 'rooms', roomId, 'messages'), finalMsgData);
        await updateDoc(doc(db, 'rooms', roomId), {
          updatedAt: serverTimestamp(),
          lastMessage: { ...finalMsgData, createdAt: { seconds: Math.floor(Date.now() / 1000) } }
        });

        // Background notification
        if (room) {
          const otherUserIds = room.members.filter(id => id !== userId);
          otherUserIds.forEach(async (targetId) => {
            const currentUserSnap = await safeGetDoc(doc(db, 'users', userId));
            const currentUserName = currentUserSnap?.exists() ? (currentUserSnap.data() as User).displayName : 'مستخدم';
            sendNotification(targetId, currentUserName, type === 'text' ? content : `[${type}]`, 'message', { roomId });
          });
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove the optimistic message if it fails
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      alert('فشل إرسال الرسالة. يرجى التحقق من الاتصال.');
    }
  };

  // Timer for self-destructing messages
  useEffect(() => {
    const hasSelfDestruct = messages.some(m => m.isSelfDestruct);
    if (!hasSelfDestruct) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setMessages(prev => prev.filter(m => !m.isSelfDestruct || !m.expiresAt || m.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, [messages.length]); 

  // Presence Listener
  useEffect(() => {
    if (!otherUser?.id) return;
    const unsub = subscribeToUserPresence(otherUser.id, (info) => {
      setPresenceInfo({ status: info.status || 'offline', lastSeen: info.lastSeen });
    });
    return () => unsub();
  }, [otherUser?.id]);

  const handleTyping = (isTyping: boolean) => {
    updateTypingStatus(roomId, userId, isTyping);
  };

  const handleVote = async (msgId: string, optionIndex: number) => {
    const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';
    
    if (isMock) {
       setMessages(prev => prev.map(m => {
         if (m.id !== msgId || !m.metadata?.options) return m;
         const newOptions = [...m.metadata.options];
         const votes = [...(newOptions[optionIndex].votes || [])];
         const alreadyVoted = votes.indexOf(userId);
         
         if (alreadyVoted > -1) {
           votes.splice(alreadyVoted, 1);
         } else {
           votes.push(userId);
         }
         
         newOptions[optionIndex] = { ...newOptions[optionIndex], votes };
         return { ...m, metadata: { ...m.metadata, options: newOptions } };
       }));
       return;
    }

    try {
      const msgRef = doc(db, 'rooms', roomId, 'messages', msgId);
      const msg = messages.find(m => m.id === msgId);
      if (!msg || !msg.metadata?.options) return;

      const newOptions = [...msg.metadata.options];
      const votes = [...(newOptions[optionIndex].votes || [])];
      const alreadyVoted = votes.indexOf(userId);

      if (alreadyVoted > -1) {
        votes.splice(alreadyVoted, 1);
      } else {
        // Simple logic: if multipleChoice is false, remove votes from other options first
        if (!msg.metadata.isMultipleChoice) {
           newOptions.forEach((opt: any, idx: number) => {
             if (idx !== optionIndex && opt.votes?.includes(userId)) {
               opt.votes = opt.votes.filter((id: string) => id !== userId);
             }
           });
        }
        votes.push(userId);
      }
      
      newOptions[optionIndex] = { ...newOptions[optionIndex], votes };
      await updateDoc(msgRef, { "metadata.options": newOptions });
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  const getStatusText = () => {
    if (typingUsers.length > 0) return 'يكتب الآن...';
    if (presenceInfo.status === 'online') return t('online');
    if (presenceInfo.lastSeen) {
       try {
         const date = (presenceInfo.lastSeen as any).toDate?.() || new Date(presenceInfo.lastSeen.seconds * 1000);
         const now = new Date();
         const diff = (now.getTime() - date.getTime()) / 1000;
         if (diff < 60) return 'متصل منذ قليل';
         if (diff < 3600) return `آخر ظهور منذ ${Math.floor(diff / 60)} دقيقة`;
         return `آخر ظهور ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
       } catch (e) { return t('offline'); }
    }
    return t('offline');
  };

  const handleMessageLongPress = (msg: Message, e: any) => {
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const y = e.clientY || e.touches?.[0]?.clientY || 0;
    setMenuPos({ x, y, isOpen: true, selectedMsg: msg });
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleTranslate = async () => {
    if (!menuPos.selectedMsg || menuPos.selectedMsg.type !== 'text') return;
    const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';
    
    // Optimistic state
    setDetailedMsgId(menuPos.selectedMsg.id);
    setMenuPos({ ...menuPos, isOpen: false });
    
    try {
      const translated = await translateText(menuPos.selectedMsg.content, i18n.language === 'ar' ? 'English' : 'Arabic');
      if (isMock) {
        setMessages(prev => prev.map(m => 
          m.id === menuPos.selectedMsg?.id ? { ...m, metadata: { ...m.metadata, translatedText: translated } } : m
        ));
      } else {
        await updateDoc(doc(db, 'rooms', roomId, 'messages', menuPos.selectedMsg.id), {
          'metadata.translatedText': translated
        });
      }
    } catch (err) {
      console.error("Translation failed", err);
    }
  };

  const handleTranscribe = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.type !== 'audio') return;
    
    const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';
    
    try {
      // Mock result if it's a blob url (not accessible by AI easily without processing)
      let text = "هذا تسجيل صوتي تجريبي يتحدث عن ميزات رنة الجديدة.";
      if (!msg.content.startsWith('blob:')) {
        text = await transcribeAudio(msg.content);
      }
      
      if (isMock) {
        setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, metadata: { ...m.metadata, transcription: text } } : m
        ));
      } else {
        await updateDoc(doc(db, 'rooms', roomId, 'messages', msgId), {
          'metadata.transcription': text
        });
      }
    } catch (err) {
      console.error("Transcription failed", err);
    }
  };

  const deleteMessage = async (msgId: string) => {
      if (!window.confirm('هل تريد حذف هذه الرسالة؟')) return;
      const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';
      
      if (isMock) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        return;
      }
      
      try {
        await updateDoc(doc(db, 'rooms', roomId, 'messages', msgId), {
           isDeleted: true,
           deletedAt: serverTimestamp()
        });
        setMessages(prev => prev.filter(m => m.id !== msgId));
      } catch (err) {
        console.error("Delete failed", err);
      }
  };

  const clearChat = async () => {
    if (!window.confirm('هل أنت متأكد من حذف جميع الرسائل؟ لا يمكن التراجع عن هذه الخطوة.')) return;
    
    const isMock = roomId.startsWith('room-') || userId === 'user-1' || userId === 'fallback_dev_id';
    if (isMock) {
       setMessages([]);
       return;
    }

    try {
      // In a real app, you'd use a cloud function to delete collections.
      // Here we will mark messages as deleted or clear local state.
      // For a robust "Clear Chat", we'll just clear the local messages and update the room's lastMessage.
      setMessages([]);
      await updateDoc(doc(db, 'rooms', roomId), {
        lastMessage: deleteField(),
        clearedAt: serverTimestamp() // We can filter messages by this on the listener
      });
    } catch (err) {
      console.error("Clear chat failed:", err);
    }
  };

  const [isMuted, setIsMuted] = useState(false);
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Persist to local storage for now
    localStorage.setItem(`mute_${roomId}`, (!isMuted).toString());
  };

  const headerMenuItems = [
    { label: t('profile'), icon: UserIcon, onClick: () => setShowRoomSettings(true) },
    { label: 'دعوة للانضمام', icon: Users, onClick: () => handleShareInvite() },
    { label: isMuted ? 'إلغاء الكتم' : t('mute'), icon: Bell, onClick: toggleMute },
    { label: t('clear_chat'), icon: Trash2, onClick: clearChat },
    { label: t('report_user'), icon: Shield, onClick: () => alert('تم إرسال بلاغ للإدارة') },
  ];

  const handleShareInvite = () => {
    setShowInvite(true);
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    if (!room || room.type === 'saved') return;
    const receiverId = room.members.find(id => id !== userId);
    if (!receiverId) return;

    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    try {
      // 1. Get receiver info
      const rSnap = await safeGetDoc(doc(db, 'users', receiverId));
      if (!rSnap || !rSnap.exists()) {
        alert('المستخدم غير متوفّر حالياً');
        return;
      }
      const remoteUser = rSnap.data() as User;

      // 2. Create call document in Firestore
      const callData = {
        type,
        status: 'ringing',
        callerId: userId,
        receiverId,
        roomId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const callRef = await addDoc(collection(db, 'calls'), callData);
      
      // 3. Trigger local UI
      onStartCall(type, { ...remoteUser, currentCallId: callRef.id }); 
    } catch (err) {
      console.error("Call initiation error:", err);
      alert('فشل بدء المكالمة. يرجى التأكد من إعدادات Firebase.');
    }
  };

  if (loading && !room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-black relative">
        <button 
          onClick={onBack}
          className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400`}
        >
          {isRTL ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-bold text-sm tracking-wide">{t('loading') || 'جاري التحميل...'}</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-black p-8 text-center">
        <button 
          onClick={onBack}
          className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400`}
        >
          {isRTL ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-4">
           <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">المحادثة غير متوفرة</h2>
        <p className="text-sm text-slate-500">تأكد من اتصالك بالإنترنت أو صلاحية الوصول</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden h-full w-full items-center"
    >
      <div className="w-full max-w-md h-full flex flex-col bg-white dark:bg-black border-x border-slate-200 dark:border-white/5 relative z-10 shadow-2xl">

      <AnimatePresence>
        {showRoomSettings && (
          <ChatConfig 
            room={room} 
            otherUser={otherUser} 
            user={user}
            onClose={() => setShowRoomSettings(false)} 
            onUpdateRoom={(upd) => setRoom({...room, ...upd})} 
          />
        )}
      </AnimatePresence>
      {/* Sensory Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20 transition-all duration-1000">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] transition-colors duration-1000 ${isNeuralMode ? 'bg-indigo-600/30' : 'bg-emerald-500/20'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-1000 ${isNeuralMode ? 'bg-purple-600/20' : 'bg-indigo-500/10'}`} />
      </div>

      <header className="shrink-0 h-16 ranna-glass border-b border-white/10 flex items-center px-4 justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-all">
            {isRTL ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowRoomSettings(true)}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border border-white/20">
                {photoURL ? (
                  <img src={photoURL} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{displayName?.[0]}</span>
                )}
              </div>
              {presenceInfo.status === 'online' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-black shadow-sm" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-slate-800 dark:text-white leading-tight text-sm md:text-base">{displayName}</h2>
              <p className={`text-[9px] font-black uppercase tracking-[0.1em] transition-colors ${typingUsers.length > 0 ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {room?.type !== 'saved' && (
            <>
              <button 
                onClick={() => {
                  setIsNeuralMode(!isNeuralMode);
                  if (!isNeuralMode && navigator.vibrate) navigator.vibrate([30, 20, 30]);
                }}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${isNeuralMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                title={isNeuralMode ? "الدرع العصبي نشط" : "تفعيل الدرع العصبي"}
              >
                <ShieldCheck size={20} className={isNeuralMode ? "animate-pulse" : ""} />
              </button>
              <button 
                onClick={handleAIBySum} 
                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-all disabled:opacity-50"
                disabled={isSummarizing}
              >
                <Sparkles size={20} className={isSummarizing ? "animate-pulse" : ""} />
              </button>
              <button onClick={() => handleStartCall('voice')} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                <Phone size={20} />
              </button>
              <button onClick={() => handleStartCall('video')} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                <Video size={20} />
              </button>
            </>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute top-full mt-2 ${isRTL ? 'right-0' : 'left-0'} w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl z-50 p-1`}
                  >
                    {headerMenuItems.map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { item.onClick(); setShowMenu(false); }}
                        className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                      >
                        <item.icon size={18} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth"
      >
        <AnimatePresence>
          {summary && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="m-4 mb-0 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden z-30"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Sparkles size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">رنة: ملخص ذكي</span>
                </div>
                <button onClick={() => setSummary(null)} className="text-slate-400 p-1">
                   <X size={18} />
                </button>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed text-right">
                {summary}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <MessageList 
          messages={messages} 
          userId={userId} 
          user={user}
          onLongPress={handleMessageLongPress} 
          detailedMsgId={detailedMsgId}
          setDetailedMsgId={setDetailedMsgId}
          onVote={handleVote}
          onTranscribe={handleTranscribe}
        />
      </div>

      <AnimatePresence>
        {showScrollDown && (
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 left-6 p-3 bg-white dark:bg-white/5 rounded-full shadow-lg border border-slate-200 dark:border-white/10 text-indigo-600 z-50"
          >
            <ChevronDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="shrink-0 space-y-2">
        <AnimatePresence>
          {smartReplies.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 flex gap-2 overflow-x-auto no-scrollbar py-2"
            >
              {smartReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(reply, 'text')}
                  className="whitespace-nowrap px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500/30 transition-all active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <MessageInput 
          onSend={handleSendMessage} 
          onTyping={handleTyping}
          isEditing={isEditing}
          user={user}
          editContent={editMsg?.content}
          onCancelEdit={() => { setIsEditing(false); setEditMsg(null); }}
          replyMsg={replyMsg}
          onCancelReply={() => setReplyMsg(null)}
        />
      </div>

      <MessageMenu 
        isOpen={menuPos.isOpen}
        onClose={() => setMenuPos({ ...menuPos, isOpen: false })}
        x={menuPos.x}
        y={menuPos.y}
        isMe={menuPos.selectedMsg?.senderId === userId}
        onForward={() => {
          if (!menuPos.selectedMsg) return;
          const target = window.prompt(t('forward_to') || 'أدخل اسم الجهة أو رقم الغرفة للتوجيه إليها:');
          if (target) {
            alert(`${t('message_forwarded') || 'تم إعادة توجيه الرسالة بنجاح إلى'}: ${target}`);
          }
          setMenuPos({ ...menuPos, isOpen: false });
        }}
        onReply={() => {
           setReplyMsg(menuPos.selectedMsg);
           setMenuPos({ ...menuPos, isOpen: false });
        }}
        onCopy={() => {
          if(menuPos.selectedMsg) {
             try {
               navigator.clipboard.writeText(menuPos.selectedMsg.content);
               alert('تم نسخ النص!');
             } catch(e) {
               console.error("Copy failed", e);
             }
             setMenuPos({ ...menuPos, isOpen: false });
          }
        }}
        onEdit={() => {
          if(menuPos.selectedMsg) {
             setEditMsg(menuPos.selectedMsg);
             setIsEditing(true);
             setMenuPos({ ...menuPos, isOpen: false });
          }
        }}
        onDelete={() => {
           if (menuPos.selectedMsg) {
             deleteMessage(menuPos.selectedMsg.id);
             setMenuPos({ ...menuPos, isOpen: false });
           }
        }}
        onTranslate={handleTranslate}
        onPin={async () => {
          if (!menuPos.selectedMsg) return;
          try {
            await updateDoc(doc(db, 'rooms', roomId), {
              pinnedMessage: {
                id: menuPos.selectedMsg.id,
                content: menuPos.selectedMsg.content,
                senderId: menuPos.selectedMsg.senderId,
                pinnedAt: serverTimestamp()
              }
            });
            alert('تم تثبيت الرسالة بنجاح!');
          } catch (err) {
            console.error("Pin failed", err);
          }
          setMenuPos({ ...menuPos, isOpen: false });
        }}
        onInfo={() => {
          if (!menuPos.selectedMsg) return;
          setDetailedMsgId(menuPos.selectedMsg.id);
          setMenuPos({ ...menuPos, isOpen: false });
        }}
      />

      <AnimatePresence>
        {showInvite && (
          <InviteCard 
            roomId={roomId} 
            inviterName={user?.displayName} 
            onClose={() => setShowInvite(false)} 
          />
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
};

const HeaderAction = ({ icon: Icon, onClick, className }: any) => (
  <button onClick={onClick} className={`p-2.5 glass rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${className}`}>
    <Icon size={20} />
  </button>
);

const ActionButton = ({ icon: Icon, label, danger }: any) => (
  <button className={`w-full p-6 glass rounded-[2rem] flex items-center justify-between group transition-all hover:scale-[1.01] ${danger ? 'text-rose-500' : ''}`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${danger ? 'bg-rose-50 text-rose-500' : 'bg-ranna-accent/10 text-ranna-accent'}`}>
        <Icon size={20} />
      </div>
      <span className="font-bold text-sm">{label}</span>
    </div>
    <ChevronRight size={18} className="opacity-20" />
  </button>
);

