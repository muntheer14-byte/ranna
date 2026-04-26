import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  MessageSquare, 
  Users, 
  Bell, 
  Settings as SettingsIcon,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  Camera,
  Phone,
  Video,
  Compass,
  MoreVertical,
  ShieldCheck,
  CheckCheck,
  Menu,
  Palette,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Star,
  Trash2,
  Check,
  User as UserIcon,
  Shield,
  Send,
  ChevronDown,
  Loader2,
  BellRing,
  UserMinus,
  LogIn,
  Gavel
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './i18n';
import { User, Room, Message, Call, Post, AppNotification } from './types';
import { mockDb } from './lib/mockFirebase';
import { rannaAI } from './lib/gemini';
import { Sidebar } from './components/Sidebar';
import { ProfileSetup } from './components/ProfileSetup';
import { ChatList } from './components/ChatList';
import { ChatRoom } from './components/ChatRoom';
import { FAB } from './components/FAB';
import { Contacts } from './components/Contacts';
import { NearbyRadar } from './components/Nearby';
import { MessageInput } from './components/MessageInput';
import { CallOverlay } from './components/CallOverlay';
import { Feed } from './components/Feed';
import { NotificationsView } from './components/Notifications';
import { Stories } from './components/Stories';
import { Settings } from './components/Settings';
import { MainHeader } from './components/MainHeader';
import { BottomNav } from './components/BottomNav';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { EditProfile } from './components/EditProfile';
import { EditProfileDesignShowcase } from './components/EditProfileDesignShowcase';
import { LockScreen } from './components/LockScreen';
import { 
  auth, 
  db, 
  testFirebaseConnection, 
  isConfigValid, 
  updatePresence,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  serverTimestamp,
  safeGetDoc,
  getOrCreateRoom,
  getDocs
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

type Page = 'chats' | 'explore' | 'notifications' | 'channels' | 'contacts' | 'settings' | 'chat-room' | 'create-group' | 'create-channel';

// --- Sub-components moved to /src/components ---

// --- Main App Component ---

import { useRannaDesign, DesignState } from './lib/designBypass';

import { ErrorSentinel } from './components/ErrorSentinel';

export default function App() {
  const { t, i18n } = useTranslation();
  const { isGhostMode, isNeuralGuardActive, encryptionLevel, updateState } = useRannaDesign();
  
  const [currentPage, setCurrentPage] = useState<Page>('chats');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [fbUser, setFbUser] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [remoteCallUser, setRemoteCallUser] = useState<User | null>(null);
  const [isNeuroChecking, setIsNeuroChecking] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [appPin, setAppPin] = useState(localStorage.getItem('app_lock_pin') || '');

  const unsubProfileRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (appPin) {
      setIsLocked(true);
    }
  }, [appPin]);

  // --- AUTH SYSTEM (MODIFIED FOR DESIGN & REAL PHASE) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      // Cleanup previous profile listener if any
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }

      if (!fbUser) {
        // No real user, check for forced demo or show login
        const isDemo = localStorage.getItem('ranna_demo_bypass') === 'true';
        
        if (isDemo) {
          try {
            const { devBypassLogin } = await import('./lib/firebase');
            const mockUser = await devBypassLogin() as User;
            setUser(mockUser);
            setFbUser({ uid: mockUser.id, isAnonymous: true } as any);
          } catch (e) { 
            console.error("Demo bypass error:", e);
            setLoading(false);
            setIsAuthReady(true);
          }
          setIsAuthReady(true);
          setLoading(false);
          setTimeout(() => setIsNeuroChecking(false), 1500);
        } else {
          setUser(null);
          setFbUser(null);
          setIsAuthReady(true);
          setLoading(false);
          setIsNeuroChecking(false);
        }
        return;
      }

      // real fbUser
      setFbUser(fbUser);
      setLoading(true);

      // Listener for user profile
      const userRef = doc(db, 'users', fbUser.uid);
      const unsubProfile = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const userData = snap.data() as User;
          setUser(userData);
          if (userData.settings?.theme) setTheme(userData.settings.theme);
        } else {
          // Initialize skeleton user if it doesn't exist yet
          const newUser: User = {
            id: fbUser.uid,
            displayName: fbUser.displayName || t('default_user_name'),
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'U')}`,
            status: 'online',
            lastSeen: Date.now(),
            onboardingComplete: false,
            settings: {
              theme: 'light',
              privacy: { readReceipts: true, lastSeen: 'all', profilePhoto: 'all', showEmail: false, showPhone: true, showUsername: true },
              notifications: { soundEnabled: true, ringtone: 'default' }
            }
          } as any;
          
          setUser(newUser);

          const initUser = async () => {
            try {
              await setDoc(userRef, newUser);
            } catch (err) {
              console.warn("Could not save initial user doc", err);
            }
          };
          initUser().catch(e => console.warn("initUser unhandled:", e)); 
        }
        setIsAuthReady(true);
        setLoading(false);
        setIsNeuroChecking(false);
      }, (err) => {
        console.error("Profile snapshot error:", err);
        setIsAuthReady(true);
        setLoading(false);
        setIsNeuroChecking(false);
      });

      unsubProfileRef.current = unsubProfile;
    });

    return () => {
      unsubscribe();
      if (unsubProfileRef.current) unsubProfileRef.current();
    };
  }, [t]);

  // Deep Link & Invite System
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room') || params.get('join') || params.get('invite');
    
    // Store invite link in localStorage to survive restarts/onboarding
    if (roomId) {
      localStorage.setItem('pending_invite_room', roomId);
      // Clean URL without refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const checkPendingInvite = async () => {
      const pendingRoomId = localStorage.getItem('pending_invite_room');
      const isProfileDone = user?.onboardingComplete || user?.username;
      
      if (pendingRoomId && user?.id && isProfileDone) {
        try {
          const { arrayUnion, updateDoc, doc, getDoc } = await import('firebase/firestore');
          const roomRef = doc(db, 'rooms', pendingRoomId);
          const roomSnap = await getDoc(roomRef);
          
          if (roomSnap.exists()) {
            const roomData = roomSnap.data();
            if (!roomData.members?.includes(user.id)) {
              await updateDoc(roomRef, {
                members: arrayUnion(user.id)
              });
            }
            setSelectedChat(pendingRoomId);
            setCurrentPage('chat-room');
          } else {
             console.error("Invite room not found");
          }
        } catch (err) {
          console.warn("Invite join error:", err);
        } finally {
          localStorage.removeItem('pending_invite_room'); // Clear it once handled
        }
      }
    };
    
    checkPendingInvite();
  }, [user?.id, user?.onboardingComplete, user?.username]);

  // Presence System
  useEffect(() => {
    if (!user) return;
    const isStealth = user.settings?.privacy?.stealthMode;

    updatePresence(user.id, isStealth ? false : true);

    const handleVisibilityChange = () => {
      if (user?.id) {
        updatePresence(user.id, isStealth ? false : document.visibilityState === 'visible');
      }
    };

    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible' && user?.id) {
        updatePresence(user.id, isStealth ? false : true);
      }
    }, 30000);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (user?.id) {
        updatePresence(user.id, false);
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
    };
  }, [user?.id, user?.settings?.privacy?.stealthMode]);

  // Real-time Notifications & Signaling
  useEffect(() => {
    if (!user) return;
    
    // Notifications listener
    const nq = query(collection(db, 'notifications'), where('userId', '==', user.id), orderBy('createdAt', 'desc'), limit(10));
    const unsubNotifs = onSnapshot(nq, (snapshot) => {
      if (!user?.id) return;
      const newNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(newNotifs);
      
      const latest = newNotifs[0];
      if (latest && !latest.isRead) {
        new Audio('https://assets.mixkit.co/active_storage/sfx/1350/1350.wav').play().catch(() => {});
      }
    });

    return () => {
      unsubNotifs();
    };
  }, [user?.id]);

  // Listener for incoming calls
  useEffect(() => {
    if (!user?.id || !isAuthReady) return;

    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.id),
      where('status', '==', 'ringing'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        const callData = callDoc.data();
        
        // Don't trigger if we already have an active call
        if (activeCall) return;

        // Get caller info
        const callerSnap = await safeGetDoc(doc(db, 'users', callData.callerId));
        if (callerSnap && callerSnap.exists()) {
          const caller = callerSnap.data() as User;
          const callObj = {
             type: callData.type,
             status: 'ringing',
             remoteUser: { ...caller, currentCallId: callDoc.id }
          };
          setRemoteCallUser(caller);
          setActiveCall(callObj);
          
          // Ringtone logic
          const ringtone = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359.wav');
          ringtone.loop = true;
          ringtone.play().catch(e => console.warn("Ringtone play failed:", e));
          (window as any).incomingRingtone = ringtone;

          // Vibrate for incoming call
          if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id, isAuthReady, activeCall]);

  // Listen for custom navigation events
  useEffect(() => {
    const handleSelectChat = (e: any) => {
      const roomId = e.detail;
      setSelectedChat(roomId);
      setCurrentPage('chat-room');
    };
    window.addEventListener('select-chat', handleSelectChat);

    const handleAddContact = async (e: any) => {
      const username = e.detail;
      try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const snap = await getDocs(q);
        if (snap.empty) {
          alert(t('user_not_found'));
          return;
        }
        const targetUser = { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
        if (user && targetUser.id !== user.id) {
          const roomId = await getOrCreateRoom(user.id, targetUser.id);
          setSelectedChat(roomId);
          setCurrentPage('chat-room');
        }
      } catch (err) {
        console.error("Error adding contact:", err);
      }
    };
    window.addEventListener('add-contact-by-username', handleAddContact);

    return () => {
      window.removeEventListener('select-chat', handleSelectChat);
      window.removeEventListener('add-contact-by-username', handleAddContact);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (user?.id) updatePresence(user.id, false);
      await signOut(auth);
      setFbUser(null);
      setUser(null);
      setShowSidebar(false);
      setCurrentPage('chats');
      setSelectedChat(null);
      localStorage.removeItem('ranna_demo_bypass');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (!isConfigValid) {
    return (
      <div className="fixed inset-0 glass flex flex-col items-center justify-center bg-ivory-warm dark:bg-black p-8 text-center">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
           <LogIn size={40} />
        </div>
        <h1 className="text-2xl font-serif italic mb-4">{t('firebase_config_incomplete')}</h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-8 font-bold uppercase tracking-widest text-[10px]">
          {t('firebase_config_desc')}
        </p>
      </div>
    );
  }

  // Emergency auth timeout to prevent infinite loading
  useEffect(() => {
    let timer: any;
    if (fbUser && !user && loading) {
      timer = setTimeout(() => {
        if (!user && fbUser) {
          console.warn("Auth timeout - forced cleanup");
          signOut(auth);
        }
      }, 25000); // 25 seconds
    }
    return () => clearTimeout(timer);
  }, [fbUser, user, loading]);

  const [loadingProgress, setLoadingProgress] = useState(0);

  // Apply Theme & Settings
  useEffect(() => {
    if (user?.settings) {
      const s = user.settings;
      if (s.appearance?.color) {
        document.documentElement.style.setProperty('--ranna-accent', s.appearance.color);
      }
      if (s.appearance?.fontFamily) {
        const fontMap: Record<string, string> = {
          'modern': '"Outfit", sans-serif',
          'classic': '"Cormorant Garamond", serif',
          'hand': '"Cairo", sans-serif'
        };
        document.documentElement.style.setProperty('--font-primary', fontMap[s.appearance.fontFamily] || fontMap.modern);
      }
      if (s.appearance?.glassEnabled) {
        document.documentElement.classList.toggle('ranna-glass', s.appearance.glassEnabled);
      }
    }
  }, [user?.settings]);

  // Loading progress simulation (faster and smarter)
  useEffect(() => {
    if (!isAuthReady && loading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90 && !isAuthReady) return 90; // Stall at 90% until ready
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setLoading(false);
              setIsAuthReady(true);
            }, 100);
            return 100;
          }
          return prev + 5;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isAuthReady, loading]);

  useEffect(() => {
    if (isAuthReady) setLoadingProgress(100);
  }, [isAuthReady]);

  const isRTL = i18n.dir() === 'rtl';

  if (!user && isAuthReady && fbUser) {
     // Rendering specific loading for profile sync state
  }

  const handleAcceptCall = async () => {
    if (!activeCall?.remoteUser?.currentCallId) return;
    try {
      if ((window as any).incomingRingtone) {
        (window as any).incomingRingtone.pause();
        (window as any).incomingRingtone = null;
      }
      await updateDoc(doc(db, 'calls', activeCall.remoteUser.currentCallId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      setActiveCall({ ...activeCall, status: 'accepted' });
    } catch (err) {
      console.error("Accept call error:", err);
    }
  };

  const handleEndCall = async () => {
    if ((window as any).incomingRingtone) {
      (window as any).incomingRingtone.pause();
      (window as any).incomingRingtone = null;
    }
    if (!activeCall?.remoteUser?.currentCallId) {
      setActiveCall(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'calls', activeCall.remoteUser.currentCallId), {
        status: 'ended',
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveCall(null);
    } catch (err) {
      console.error("End call error:", err);
      setActiveCall(null);
    }
  };

  // Stage 1: Auth Initial Load (Splash)
  if (!isAuthReady && loading) {
    return (
      <ErrorSentinel>
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-purple-600 z-[1000] overflow-hidden">
        <div className="relative flex flex-col items-center">
          {/* Hammer and Bell at the top */}
          <div className="relative mb-24 scale-150">
            {/* Hammer (Gavel) - Hits the bell */}
            <motion.div
              className="absolute -top-12 -left-6 z-20 text-white"
              animate={{ 
                rotate: [45, -15, 45],
                x: [-10, 5, -10],
                y: [-10, 10, -10],
              }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
            >
              <Gavel size={48} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </motion.div>
            
            {/* Bell - Shakes after being hit */}
            <motion.div
              className="bg-amber-400 p-4 rounded-2xl relative shadow-2xl"
              animate={{ 
                rotate: [0, 15, -15, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.8, 
                times: [0, 0.2, 0.4, 0.6, 0.8, 1]
              }}
            >
              <Bell size={48} className="text-white" />
              
              {/* Red Message popping out from the bell */}
              <motion.div
                className="absolute z-30 text-rose-500"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [0, 100, 120],
                  x: [-20, -10, 0],
                  scale: [0, 1.2, 1, 0],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  times: [0, 0.1, 0.8, 1],
                }}
              >
                <div className="relative">
                  <MessageSquare size={32} fill="currentColor" />
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">R</div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Mario-like character catching the message at the bottom */}
          <div className="absolute inset-x-0 bottom-[-150px] h-32 pointer-events-none">
            <motion.div
              className="absolute flex flex-col items-center"
              initial={{ x: '-20%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              {/* Mario Body (Simple Shapes) */}
              <div className="relative">
                <div className="w-10 h-10 bg-red-600 rounded-full" /> {/* Hat */}
                <div className="w-8 h-8 bg-amber-200 rounded-full -mt-2 mx-auto" /> {/* Face */}
                <div className="w-12 h-14 bg-blue-600 rounded-t-xl -mt-2" /> {/* Overalls */}
                {/* Legs animation */}
                <div className="flex gap-2">
                   <motion.div key="mario-leg-l" className="w-4 h-6 bg-slate-800 rounded-lg" animate={{ rotate: [0, 30, -30, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} />
                   <motion.div key="mario-leg-r" className="w-4 h-6 bg-slate-800 rounded-lg" animate={{ rotate: [0, -30, 30, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} />
                </div>
                {/* Arms catching the message */}
                <motion.div 
                   className="absolute -top-4 w-12 h-4 bg-amber-200 rounded-full"
                   animate={{ y: [0, -10, 0] }}
                   transition={{ repeat: Infinity, duration: 0.5 }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Horseshoe Progress Bar */}
        <div className="mt-20 relative flex flex-col items-center">
          <div className="relative w-40 h-40">
            {/* Horseshoe Shape (SVG) */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeOpacity="0.2"
                strokeDasharray="188.5 251.3" // Roughly 3/4 circle
                strokeLinecap="round"
              />
              <motion.circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="8"
                strokeDasharray="188.5 251.3"
                strokeLinecap="round"
                strokeDashoffset={188.5 - (188.5 * loadingProgress) / 100}
                transition={{ duration: 0.1 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-white font-black text-2xl">{loadingProgress}%</span>
               <span className="text-white/60 text-[8px] uppercase tracking-[0.2em] font-black">{t('loading_app')}</span>
            </div>
          </div>
          <h1 className="mt-8 text-white font-bold text-4xl tracking-widest font-serif italic text-shadow-lg">{t('app_name')}</h1>
          <p className="mt-2 text-white/50 text-[10px] font-black uppercase tracking-[0.6em]">{t('app_tagline')}</p>
        </div>
      </div>
      </ErrorSentinel>
    );
  }

  // Stage 2: Not Logged In
  if (!fbUser && isAuthReady) {
    return (
      <ErrorSentinel>
        <Login onLogin={() => {}} />
      </ErrorSentinel>
    );
  }

  // Stage 3: Loading Profile
  if (!user && fbUser) {
    return (
      <ErrorSentinel>
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-black p-6 text-center">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
        <p className="text-slate-500 text-sm animate-pulse">{t('syncing_data')}</p>
        
        {/* Anti-lock emergency hatch */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 8 }}
          className="mt-8 flex flex-col items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-8"
        >
          <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed uppercase tracking-widest">
            {t('slow_connection_hint')}
          </p>
          <button 
            onClick={() => setUser({
              id: fbUser.uid,
              displayName: fbUser.displayName || t('default_user_name'),
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || '',
              status: 'online',
              isOffline: true,
              onboardingComplete: false
            } as any)}
            className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl text-xs font-bold shadow-sm"
          >
            {t('continue_anyway')}
          </button>
          
          <button onClick={() => signOut(auth)} className="text-[10px] text-rose-500 font-bold uppercase underline">
            {t('logout_and_restart')}
          </button>
        </motion.div>
      </div>
      </ErrorSentinel>
    );
  }

  // Stage 4: Onboarding
  if (user && (!user.username || !user.onboardingComplete)) {
    return (
      <ErrorSentinel>
        <Onboarding user={user} onComplete={(updated) => setUser(updated)} />
      </ErrorSentinel>
    );
  }

  if (!user) return null; // Safety catch

  return (
    <ErrorSentinel>
      <div className={`h-[100dvh] w-screen overflow-hidden flex flex-col relative bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      <AnimatePresence>
        {isLocked && (
          <LockScreen 
            onUnlock={() => setIsLocked(false)} 
            correctPin={appPin} 
          />
        )}
      </AnimatePresence>
      <div className="flex h-full w-full overflow-hidden relative">
        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div 
            key="main-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`h-full flex flex-col flex-1 overflow-hidden transition-all duration-500 ${selectedChat ? 'hidden lg:flex' : 'flex'}`}
          >
            <MainHeader 
              theme={theme}
              onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onMenuClick={() => setShowSidebar(true)} 
              currentPage={currentPage} 
              onNavigate={async (p: any) => {
                if (p === 'saved') {
                   if (!user) return;
                   try {
                     const roomId = await getOrCreateRoom(user.id, user.id);
                     setSelectedChat(roomId);
                     setCurrentPage('chat-room');
                   } catch (e) {
                     console.error("Navigation to saved failed", e);
                     setCurrentPage('chats');
                   }
                   return;
                }
                setCurrentPage(p);
              }} 
            />
            
            <main className="flex-1 flex flex-col overflow-hidden relative">
              <AnimatePresence mode="wait">
                {currentPage === 'chats' && (
                  <div key="chats-tab" className="flex-1 flex flex-col overflow-hidden relative">
                    <ChatList 
                      onNavigate={setCurrentPage} 
                      onChatSelect={(id) => {
                        setSelectedChat(id);
                        setCurrentPage('chat-room');
                      }} 
                      userId={user?.id || ''}
                    />
                  </div>
                )}

                {currentPage === 'explore' && <Feed key="explore-tab" />}
                {currentPage === 'notifications' && (
                  <NotificationsView 
                    key="notifications-tab" 
                    notifications={notifications}
                    onBack={() => setCurrentPage('chats')} 
                    onDelete={async (id) => {
                      const { deleteDoc, doc } = await import('firebase/firestore');
                      try {
                        await deleteDoc(doc(db, 'notifications', id));
                      } catch (e) {
                        console.error("Failed to delete notification", e);
                      }
                    }}
                  />
                )}
                
                {currentPage === 'channels' && (
                  <motion.div key="channels-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black">
                    <div className="w-20 h-20 rounded-2xl bg-purple-50 dark:bg-slate-900 flex items-center justify-center text-purple-600 mb-6 border border-purple-600/10">
                      <Compass size={40} strokeWidth={1} />
                    </div>
                    <h3 className="font-serif italic text-xl text-purple-600 mb-2">{t('channels')}</h3>
                    <p className="uppercase tracking-[0.3em] text-[9px] font-black text-slate-400">قنوات رنة الرسمية قادمة قريباً</p>
                  </motion.div>
                )}

                {currentPage === 'calls' && (
                  <motion.div key="calls-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black">
                    <div className="w-20 h-20 rounded-2xl bg-purple-50 dark:bg-slate-900 flex items-center justify-center text-purple-600 mb-6 border border-purple-600/10">
                      <Phone size={40} strokeWidth={1} />
                    </div>
                    <h3 className="font-serif italic text-xl text-purple-600 mb-2">المكالمات</h3>
                    <p className="uppercase tracking-[0.3em] text-[11px] font-black text-slate-400">سجل مكالماتك الآمنة سيظهر هنا قريباً</p>
                  </motion.div>
                )}

                {currentPage === 'contacts' && (
                  <Contacts 
                    key="contacts-tab" 
                    userId={user?.id || ''} 
                    onNavigate={(roomId) => {
                      setSelectedChat(roomId);
                      setCurrentPage('chat-room');
                    }} 
                  />
                )}
                {currentPage === 'create-group' && (
                  <motion.div key="group-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-white dark:bg-black">
                     <header className="p-6 flex items-center gap-4">
                        <button onClick={() => setCurrentPage('chats')} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl"><ChevronLeft className={isRTL ? 'rotate-180' : ''} /></button>
                        <h1 className="text-2xl font-serif italic text-purple-600">إنشاء مجموعة</h1>
                     </header>
                     <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6">
                           <Users size={40} />
                        </div>
                        <h3 className="font-bold text-xl mb-4">إنشاء مجموعة جديدة</h3>
                        <p className="text-slate-500 mb-8 max-w-xs">يمكنك الآن إنشاء مجموعات آمنة ومشفرة للتواصل مع أصدقائك.</p>
                        <button onClick={() => alert('قريباً: اختيار جهات الاتصال')} className="px-12 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:scale-105 transition-transform">بدء الاختيار</button>
                     </div>
                  </motion.div>
                )}

                {currentPage === 'create-channel' && (
                  <motion.div key="channel-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-white dark:bg-black">
                     <header className="p-6 flex items-center gap-4">
                        <button onClick={() => setCurrentPage('chats')} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl"><ChevronLeft className={isRTL ? 'rotate-180' : ''} /></button>
                        <h1 className="text-2xl font-serif italic text-purple-600">إنشاء قناة</h1>
                     </header>
                     <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mb-6">
                           <Compass size={40} />
                        </div>
                        <h3 className="font-bold text-xl mb-4">إنشاء قناة عامة</h3>
                        <p className="text-slate-500 mb-8 max-w-xs">شارك المحتوى الخاص بك مع جمهور واسع بطريقة آمنة ومميزة.</p>
                        <button onClick={() => alert('قريباً: إعدادات القناة')} className="px-12 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:scale-105 transition-transform">متابعة</button>
                     </div>
                  </motion.div>
                )}

                {currentPage === 'settings' && user && (
                  <Settings 
                    key="settings-tab" 
                    user={user} 
                    onLogout={handleLogout} 
                    onBack={() => setCurrentPage('chats')} 
                    onEditProfile={() => setCurrentPage('edit-profile')} 
                    initialSection={sessionStorage.getItem('settings_initial_section') || 'main'} 
                  />
                )}
                {currentPage === 'settings' && !user && (
                   <div key="settings-loading" className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                     <Loader2 className="animate-spin text-purple-600 mb-4" size={32} />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">جاري تحميل الإعدادات الآمنة...</p>
                   </div>
                )}
                {currentPage === 'edit-profile' && <EditProfile key="edit-profile-tab" user={user} onBack={() => setCurrentPage('settings')} onUpdate={(u) => setUser(u)} />}
                {currentPage === 'chat-room' && !selectedChat && (
                  <div key="chat-room-empty" className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
                    <MessageSquare size={40} className="mb-4" />
                    <p className="font-black text-[10px] uppercase tracking-widest">تحديد محادثة للبدء</p>
                    <button onClick={() => setCurrentPage('chats')} className="mt-4 text-emerald-600 font-black text-[10px] underline">العودة للرئيسية</button>
                  </div>
                )}
              </AnimatePresence>
            </main>

            {!selectedChat && (
              <BottomNav current={currentPage} onChange={(p) => {
                setCurrentPage(p);
                if (p !== 'chat-room') setSelectedChat(null);
              }} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Chat Room Side Panel / Overlay */}
        <AnimatePresence mode="wait">
          {selectedChat && (
            <motion.div 
              key="chat-room-container"
              initial={{ x: isRTL ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-0 lg:relative lg:w-[450px] lg:shrink-0 lg:mx-auto z-[100] lg:z-10 bg-white dark:bg-black shadow-2xl lg:shadow-[0_0_50px_rgba(0,0,0,0.1)] h-full overflow-hidden`}
            >
              <ChatRoom 
                roomId={selectedChat} 
                userId={user?.id || ''}
                user={user}
                onBack={() => {
                  setSelectedChat(null);
                  setCurrentPage('chats');
                }} 
                onStartCall={(type, remoteUser) => {
                  setRemoteCallUser(remoteUser);
                  setActiveCall({
                    id: remoteUser.currentCallId || ('temp-' + Date.now()),
                    type,
                    status: 'ringing',
                    callerId: user?.id || '',
                    receiverId: remoteUser.id,
                    createdAt: new Date(),
                  });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supernatural Control Panel (Design Mode Only) */}
        {user?.id && (userId => userId.startsWith('user-') || userId === 'fallback_dev_id')(user.id) && (
          <div className="fixed bottom-24 right-4 z-[200]">
             <motion.button
               whileHover={{ scale: 1.1, rotate: 90 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => updateState({ isNeuralGuardActive: !isNeuralGuardActive })}
               className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all border ${isNeuralGuardActive ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900/80 border-white/10 text-emerald-500'}`}
             >
                <Shield size={24} />
             </motion.button>
             
             <AnimatePresence>
                {isNeuralGuardActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    className="absolute bottom-16 right-0 w-64 glass p-6 rounded-[2.5rem] border-white/20 shadow-2xl space-y-4"
                  >
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Neural Status</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     </div>
                     <button 
                       onClick={() => updateState({ isGhostMode: !isGhostMode })}
                       className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 ${isGhostMode ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                     >
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Ghost Mode: {isGhostMode ? 'Active' : 'Off'}</span>
                     </button>
                     <div className="pt-2">
                        <div className="flex justify-between mb-2">
                           <span className="text-[9px] font-bold text-slate-500 uppercase">Encryption Strength</span>
                           <span className="text-[9px] font-bold text-emerald-500">{encryptionLevel}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             animate={{ width: `${encryptionLevel}%` }}
                             className="h-full bg-emerald-500"
                           />
                        </div>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeCall && remoteCallUser && user && (
          <CallOverlay 
            call={activeCall} 
            currentUser={user}
            remoteUser={remoteCallUser} 
            onEnd={handleEndCall}
            onAccept={handleAcceptCall}
          />
        )}
      </AnimatePresence>

      <Sidebar 
        user={user}
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
        onNavigate={(p) => {
          if (p === 'profile') {
            setCurrentPage('settings');
            // A simple way to signal Settings to open profile
            sessionStorage.setItem('settings_initial_section', 'profile');
            return;
          }
          const validPages = ['chats', 'explore', 'notifications', 'channels', 'contacts', 'settings', 'chat-room'];
          if (validPages.includes(p)) {
            setCurrentPage(p as Page);
            if (p !== 'chat-room') setSelectedChat(null);
          } else {
            setSelectedChat(p);
            setCurrentPage('chat-room');
          }
        }} 
        onLogout={handleLogout}
      />
    </div>
    </ErrorSentinel>
  );
}

