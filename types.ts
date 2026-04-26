/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Page = 'chats' | 'explore' | 'notifications' | 'channels' | 'contacts' | 'settings' | 'chat-room' | 'edit-profile' | 'design-showcase';

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface User {
  id: string;
  username: string;
  displayName: string;
  photoURL?: string;
  backgroundPhotoURL?: string;
  bio?: string;
  status: UserStatus;
  lastSeen?: any; // Firestore Timestamp
  verified: boolean;
  phoneNumber?: string;
  email?: string;
  role: 'user' | 'admin' | 'moderator';
  badges: string[];
  onboardingComplete?: boolean;
  
  // Missing details from report
  isPrivate?: boolean;
  ghostMode?: boolean;
  settings?: any;
  blockedUsers?: string[];
  friends?: string[];
  friendRequests?: string[];
  folders?: any[];
  
  birthday?: any;
  birthDate?: string;
  residence?: string;
  jobPosition?: string;
  graduationYear?: string;
  location?: string;
  work?: string;
  education?: string;
  workplace?: string;
  jobTitle?: string;
  maritalStatus?: string;
  placeOfBirth?: string;
  gender?: 'Male' | 'Female';
  accentColor?: string;
  createdAt?: any;
}

export type ChatType = 'private' | 'group' | 'channel' | 'saved';

export interface Room {
  id: string;
  type: ChatType;
  name: string;
  description?: string;
  photoURL?: string;
  members: string[]; // User IDs
  admins: string[];
  lastMessage?: Message;
  createdAt: any;
  updatedAt: any;
  e2eEnabled: boolean;
  typingStatus?: Record<string, any>; // userId: Timestamp
  clearChatAt?: number;
  selfDestructTime?: number;
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'video_note' 
  | 'file' 
  | 'location' 
  | 'poll' 
  | 'sticker' 
  | 'contact' 
  | 'system_log'
  | 'call';

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderPhoto?: string;
  type: MessageType;
  content: string; // The text content or URL/ID of the media
  metadata?: any; // For polls, locations, file info, etc.
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
  reactions?: Record<string, string[]>; // emoji: userIds[]
  readBy: string[]; // User IDs
  deliveredBy: string[];
  createdAt: any;
  updatedAt?: any;
  isEdited: boolean;
  isSelfDestruct?: boolean;
  expiresAt?: any; // For self-destruct

  // Missing fields from report
  isPinned?: boolean;
  isDeleted?: boolean;
  deletedFor?: string[]; // User IDs for private deletion
  participants?: string[]; // For call messages
  isEncrypted?: boolean;
  scheduledFor?: any;
  threadId?: string;
  mediaGroup?: string;
  isSilent?: boolean;
  isSpoiler?: boolean;
  storagePath?: string;
}

export interface Story {
  id: string;
  userId: string;
  title?: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  createdAt: any;
  views: string[]; // User IDs
}

export interface Call {
  id: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended';
  callerId: string;
  receiverId: string;
  roomId?: string;
  duration?: number;
  createdAt: any;
  endedAt?: any;
  offer?: any;
  answer?: any;
}

export interface Post {
  id: string;
  authorUid: string;
  content: string;
  mediaURL?: string;
  isPublic: boolean;
  likes: string[]; // User IDs
  commentsCount: number;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'message' | 'call' | 'post_like' | 'post_comment' | 'system';
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: any;
}
