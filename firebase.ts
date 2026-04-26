import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInAnonymously,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromCache,
  getDocFromServer,
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  limitToLast,
  initializeFirestore, 
  persistentLocalCache,
  deleteField,
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import CryptoJS from 'crypto-js';
import { mockDb } from './mockFirebase';
import { Room, Message, User } from '../types';

// Try to load configuration from the bootstrapped file first
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isConfigValid = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
);

if (!isConfigValid) {
  console.warn("Firebase configuration is incomplete. Add VITE_FIREBASE_* variables in Netlify environment settings.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true,
  ...(firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '' 
     ? { databaseId: firebaseConfig.firestoreDatabaseId } 
     : {})
});

// Explicitly handle offline/online state transitions
window.addEventListener('online', () => {
  console.log("Network online: Reconnecting Firestore...");
});
window.addEventListener('offline', () => {
  console.warn("Network offline: Using local cache...");
});

export const goOffline = () => {
    try {
        const { disableNetwork } = import.meta.env.PROD ? { disableNetwork: () => {} } : require('firebase/firestore');
        // Actually, db is initialized, so we can use:
        import('firebase/firestore').then(mod => mod.disableNetwork(db));
    } catch (e) {
        console.error("Failed to disable network", e);
    }
};

export const goOnline = () => {
    try {
        import('firebase/firestore').then(mod => mod.enableNetwork(db));
    } catch (e) {
        console.error("Failed to enable network", e);
    }
};

export { doc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, orderBy, limit, limitToLast, deleteField };

export const storage = getStorage(app);

export { isConfigValid };

export const googleProvider = new GoogleAuthProvider();

/**
 * Enhanced Google Sign In with fallback logic
 */
export const signInWithGoogle = async () => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error with Google Popup:", error.code);
    
    // Check for domain error - this is critical for AIS environment
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`Domain ${window.location.hostname} is not authorized in Firebase Console.`);
    }

    // Attempt redirect as fallback
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      console.error("Redirect fallback failed:", redirectError);
      throw error; // Throw the original error if redirect also fails
    }
  }
};

/**
 * Handles redirect result on page load
 */
export const getGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user;
  } catch (error) {
    console.error("Error getting redirect result:", error);
    return null;
  }
};

/**
 * Anonymous login helper
 */
export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    // Caller handles logging if needed
    throw error;
  }
};

/**
 * Developer Bypass: Login anonymously and auto-initialize a complete profile.
 * Improved to handle cases where Anonymous Auth is disabled in the console.
 */
export const devBypassLogin = async () => {
  try {
    let fbUser;
    
    try {
      fbUser = await loginAnonymously();
    } catch (authError: any) {
      console.warn("Real Anonymous Auth failed, falling back to Pure Mock User for design phase.", authError.message);
      // Create a mock user object that mimics Firebase Auth User using MOCK_USERS[0]
      fbUser = {
        uid: 'user-1', // Matches mockDb.MOCK_USERS[0].id
        displayName: 'منذر (وضع التصميم)',
        email: 'dev@ranna.app',
        isAnonymous: true,
        photoURL: 'https://ui-avatars.com/api/?name=Muntheer&background=0D9488&color=fff'
      };
    }

    const userDocRef = doc(db, 'users', fbUser.uid);
    
    // Use a try-catch for the getDoc in case rules are blocking it
    let snap;
    try {
      snap = await safeGetDoc(userDocRef);
    } catch (dbError) {
      console.warn("Firestore access restricted without auth. Designing with local mock data.");
      return {
        id: fbUser.uid,
        displayName: fbUser.displayName,
        username: 'dev_mock',
        photoURL: fbUser.photoURL,
        status: 'online',
        role: 'admin',
        isMock: true // Flag to indicate this is not persistent
      };
    }
    
    if (snap && !snap.exists()) {
      const devData = {
        id: fbUser.uid,
        displayName: fbUser.displayName || 'المطور (تجريبي)',
        username: 'dev_' + fbUser.uid.substring(0, 5),
        photoURL: fbUser.photoURL || `https://ui-avatars.com/api/?name=Developer&background=random`,
        email: 'dev@ranna.app',
        status: 'online',
        verified: true,
        role: 'admin',
        isPrivate: false,
        badges: ['developer', 'premium'],
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        onboardingComplete: true,
        settings: {
          privacy: 'public',
          notifications: true,
          fontSize: 16,
          theme: 'dark'
        }
      };
      
      try {
        await setDoc(userDocRef, devData);
      } catch (e) {
        console.error("Could not persist dev profile to Firestore:", e);
        return { ...devData, isMock: true };
      }
      return devData;
    }
    return snap?.data();
  } catch (error) {
    console.error("Comprehensive Dev bypass failed:", error);
    // Absolute fallback
    return {
      id: 'fallback_dev_id',
      displayName: 'مطور رنة (محاكي)',
      username: 'dev_fallback',
      status: 'online',
      role: 'admin',
      isMock: true
    };
  }
};

/**
 * Email/Password Helpers
 */
export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

/**
 * Safe version of getDoc that handles offline errors by checking cache
 */
export const safeGetDoc = async (docRef: any, retries = 1) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Firestore request timed out')), 20000)
  );

  try {
    return await Promise.race([getDoc(docRef), timeoutPromise]) as any;
  } catch (error: any) {
    const isOffline = error.message?.toLowerCase().includes('offline') || 
                      error.message?.toLowerCase().includes('timed out') ||
                      error.code === 'unavailable' || 
                      error.code === 'network-request-failed';
    
    if (isOffline) {
      if (retries > 0) {
        console.warn(`Retrying fetch for ${docRef.path} (${retries} left)`);
        return safeGetDoc(docRef, retries - 1);
      }
      
      console.warn("Client offline or timeout, attempting cache for", docRef.path);
      try {
        const cacheSnap = await getDocFromCache(docRef);
        if (cacheSnap.exists()) return cacheSnap;
      } catch (cacheError) {
        console.warn("Doc not in cache and client is offline", docRef.path);
        // Return a mock snapshot that indicates the document wasn't found in cache while offline
        return {
          exists: () => false,
          data: () => undefined,
          id: docRef.id,
          ref: docRef,
          metadata: { fromCache: true, hasPendingWrites: false }
        } as any;
      }
    }
    throw error;
  }
};

/**
 * Default profile creation for NEW users
 */
export const initializeUserProfile = async (fbUser: any) => {
  const userDocRef = doc(db, 'users', fbUser.uid);
  
  // Only create if it doesn't exist
  let snapshot;
  try {
    snapshot = await safeGetDoc(userDocRef);
  } catch (e) {
    console.error("Initialization check failed", e);
    return null;
  }

  if (!snapshot.exists()) {
    const defaultData = {
      id: fbUser.uid,
      displayName: fbUser.displayName || 'مستخدم رنة',
      photoURL: fbUser.photoURL || '',
      email: fbUser.email || '',
      status: 'online',
      verified: false,
      role: 'user',
      isPrivate: false,
      badges: [],
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      onboardingComplete: false,
      settings: {
        privacy: 'public',
        notifications: true,
        fontSize: 16,
        theme: 'light'
      }
    };
    try {
      await setDoc(userDocRef, defaultData);
    } catch (e) {
      console.error("Failed to create user profile while offline", e);
    }
    return defaultData;
  }
  return snapshot.data();
};

const generateUniqueUsername = async (base: string): Promise<string> => {
  let username = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (username.length < 3) username = 'user' + username;
  
  let isUnique = false;
  let counter = 0;
  
  while (!isUnique) {
    const candidate = counter === 0 ? username : `${username}${counter}`;
    try {
      const nameDoc = await safeGetDoc(doc(db, 'usernames', candidate));
      if (nameDoc && !nameDoc.exists()) {
        return candidate;
      }
    } catch (e) {
      console.error("Username check failed", e);
      return candidate + Math.floor(Math.random() * 1000);
    }
    counter++;
    if (counter > 20) break; // Safety break
  }
  return username + Math.floor(Math.random() * 1000);
};

export const updateUsername = async (uid: string, oldUsername: string | undefined, newUsername: string) => {
  const cleanUsername = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
  
  if (oldUsername && oldUsername !== cleanUsername) {
     // Check global uniqueness
     try {
       const nameDoc = await safeGetDoc(doc(db, 'usernames', cleanUsername));
       if (nameDoc && nameDoc.exists()) {
         throw new Error('اسم المستخدم محجوز بالفعل');
       }
     } catch (e: any) {
       if (e.message?.includes('offline')) throw new Error('لا يمكن تغيير اسم المستخدم حالياً لأنك غير متصل بالإنترنت');
       throw e;
     }
     
     // Delete old
     await updateDoc(doc(db, 'users', uid), { username: deleteField() });
  }
  
  // Reserve and Update
  await setDoc(doc(db, 'usernames', cleanUsername), { uid });
  await updateDoc(doc(db, 'users', uid), { 
    username: cleanUsername,
    onboardingComplete: true,
    updatedAt: serverTimestamp()
  });
};

export const updateFUsername = updateUsername;

export const testFirebaseConnection = async () => {
  try {
    const { getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
       // This is fine, connection works but we can't read the test doc
       return;
    }
    if (error.message?.includes('offline') || error.code === 'unavailable') {
      console.warn("Firestore connection check: App is offline or Firebase is unreachable.");
    }
  }
};

// Initial connection test as required by integration guidelines
testFirebaseConnection().catch(e => console.warn("Initial Firebase connection check failed:", e));

const MASTER_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

if (!MASTER_KEY && import.meta.env.PROD) {
  throw new Error("VITE_ENCRYPTION_KEY is required in production. Check your environment variables.");
}

const ROOM_ENCRYPTION_SECRET = MASTER_KEY || 'ranna-dev-secret-key-2026';

/**
 * Derives a unique key for each room using HMAC-SHA256 of the master key and room ID
 */
const deriveRoomKey = (roomId: string) => {
  return CryptoJS.HmacSHA256(roomId, ROOM_ENCRYPTION_SECRET).toString();
};

export const encryptMessage = (text: string, roomId: string) => {
  const roomKey = deriveRoomKey(roomId);
  return CryptoJS.AES.encrypt(text, roomKey).toString();
};

export const decryptMessage = (ciphertext: string, roomId: string) => {
  try {
    const roomKey = deriveRoomKey(roomId);
    const bytes = CryptoJS.AES.decrypt(ciphertext, roomKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) return ciphertext; // Fallback for unencrypted old messages
    return originalText;
  } catch (e) {
    return ciphertext; // Fallback
  }
};

export const updatePresence = async (uid: string, isOnline: boolean) => {
  try {
    if (uid.startsWith('user-')) return; // Don't update mock presence in DB
    await updateDoc(doc(db, 'users', uid), {
      status: isOnline ? 'online' : 'offline',
      lastSeen: serverTimestamp()
    });
  } catch (e) {
    console.error("Presence update failed", e);
  }
};

/**
 * Universal Room Subscription Wrapper
 * Switches between real Firestore and Mock data based on provided mock flag
 */
export const subscribeToRooms = (
  userId: string, 
  isMock: boolean, 
  callback: (rooms: Room[]) => void,
  errorHandler: (err: any) => void
) => {
  if (isMock || userId.startsWith('user-')) {
    const mockRooms = mockDb.getRooms(userId);
    callback(mockRooms);
    return () => {}; // No-op cleanup
  }

  const q = query(
    collection(db, 'rooms'),
    where('members', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    callback(roomsData);
  }, errorHandler);
};

/**
 * Universal Message Subscription Wrapper
 */
export const subscribeToMessages = (
  roomId: string,
  isMock: boolean,
  callback: (msgs: Message[]) => void
) => {
  if (isMock || roomId.startsWith('room-')) {
    return mockDb.onMessages(roomId, callback);
  }

  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limitToLast(100)
  );

  return onSnapshot(q, async (snapshot) => {
    try {
      // Get room data for clearedAt
      const roomSnap = await safeGetDoc(doc(db, 'rooms', roomId));
      const clearedAt = roomSnap?.exists() ? roomSnap.data().clearedAt?.toMillis() || 0 : 0;

      const msgs = snapshot.docs
        .map(doc => {
          const data = doc.data() as Message;
          const msgTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0);
          
          if (clearedAt && msgTime && msgTime <= clearedAt) return null;

          if (data.type === 'text') {
            data.content = decryptMessage(data.content, roomId);
          }
          return { id: doc.id, ...data } as Message;
        })
        .filter(m => m !== null) as Message[];
    
      callback(msgs);
    } catch (err) {
      console.warn("Error processing messages snapshot:", err);
    }
  }, (err) => {
    console.error("Messages subscription error:", err);
  });
};

/**
 * Creates an in-app notification for a user
 */
export const sendNotification = async (userId: string, title: string, body: string, type: string, extraData: any = {}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      body,
      type,
      data: extraData,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
};

/**
 * Get or create a "Saved Messages" private room for the user
 */
export const getOrCreateSavedMessagesRoom = async (userId: string) => {
  const q = query(
    collection(db, 'rooms'),
    where('members', 'array-contains', userId),
    where('type', '==', 'saved')
  );
  
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;
  
  const newRoomRef = await addDoc(collection(db, 'rooms'), {
    type: 'saved',
    name: 'الرسائل المحفوظة',
    members: [userId],
    admins: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: {
      content: 'خانتك الخاصة لحفظ الرسائل والوسائط',
      senderId: 'system',
      type: 'text',
      createdAt: serverTimestamp()
    },
    e2eEnabled: true
  });
  
  return newRoomRef.id;
};

/**
 * Creates or gets an existing room between two users
 */
export const getOrCreateRoom = async (currentUserId: string, otherUserId: string) => {
  // Check if it's a "Saved Messages" room (self-chat)
  const isSaved = currentUserId === otherUserId;
  
  const q = query(
    collection(db, 'rooms'),
    where('members', 'array-contains', currentUserId),
    where('type', '==', isSaved ? 'saved' : 'private')
  );
  
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const members = d.data().members as string[];
    return isSaved ? (members.length === 1) : members.includes(otherUserId);
  });
  
  if (existing) return existing.id;
  
  // Create new
  const roomData: any = {
    type: isSaved ? 'saved' : 'private',
    members: isSaved ? [currentUserId] : [currentUserId, otherUserId],
    admins: [currentUserId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    e2eEnabled: true,
    lastMessage: {
      content: isSaved ? 'مساحتك الخاصة لحفظ الرسائل والوسائط' : 'بدء محادثة جديدة',
      senderId: 'system',
      type: 'text',
      createdAt: serverTimestamp()
    }
  };

  if (!isSaved) roomData.admins.push(otherUserId);

  const newRoomRef = await addDoc(collection(db, 'rooms'), roomData);
  return newRoomRef.id;
};

export const updateTypingStatus = async (roomId: string, userId: string, isTyping: boolean) => {
  try {
    if (roomId.startsWith('room-') || userId.startsWith('user-')) return;
    await updateDoc(doc(db, 'rooms', roomId), {
      [`typingStatus.${userId}`]: isTyping ? serverTimestamp() : deleteField()
    });
  } catch (e) {
    console.warn("Typing status update failed", e);
  }
};

export const subscribeToRoom = (roomId: string, callback: (room: Room) => void) => {
  if (roomId.startsWith('room-')) return () => {};
  return onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Room);
    }
  });
};

export const subscribeToUserPresence = (userId: string, callback: (user: Partial<User>) => void) => {
  if (userId.startsWith('user-')) return () => {};
  return onSnapshot(doc(db, 'users', userId), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({ 
        status: data.status, 
        lastSeen: data.lastSeen,
        displayName: data.displayName,
        photoURL: data.photoURL
      });
    }
  });
};
