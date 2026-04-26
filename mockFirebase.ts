/**
 * Mock Firebase implementation for Ranna App
 * Used because of provisioning errors in the local environment.
 */
import { User, Room, Message, Story, Call, Post, AppNotification } from '../types';

const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'muntheer',
    displayName: 'Muntheer',
    status: 'online',
    verified: true,
    role: 'admin',
    badges: ['🚀', '🛡️'],
    bio: 'Software Engineer and Creator of Ranna.',
  },
  {
    id: 'user-2',
    username: 'ranna_ai',
    displayName: 'Ranna AI',
    status: 'online',
    verified: true,
    role: 'moderator',
    badges: ['🤖'],
    bio: 'Your smart companion.',
  },
  {
    id: 'user-3',
    username: 'ahmed',
    displayName: 'احمد',
    status: 'online',
    verified: false,
    role: 'user',
    badges: [],
  }
];

const MOCK_ROOMS: Room[] = [
  {
    id: 'room-1',
    type: 'private',
    name: 'Ahmed',
    members: ['user-1', 'user-3'],
    admins: ['user-1', 'user-3'],
    createdAt: new Date(),
    updatedAt: new Date(),
    e2eEnabled: true,
  },
  {
    id: 'room-ai',
    type: 'private',
    name: 'Ranna AI',
    members: ['user-1', 'user-2'],
    admins: ['user-1', 'user-2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    e2eEnabled: false,
  }
];

const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    authorUid: 'user-3',
    content: 'Just started using Ranna! The encryption feels super safe. 🛡️',
    isPublic: true,
    likes: ['user-1'],
    commentsCount: 2,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'post-2',
    authorUid: 'user-1',
    content: 'The new Artistic Flair design is coming together. What do you think? ✨',
    isPublic: true,
    likes: ['user-3'],
    commentsCount: 5,
    createdAt: new Date(Date.now() - 43200000),
  }
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'message',
    title: 'New Message',
    body: 'Ahmed sent you a message',
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'post_like',
    title: 'Post Liked',
    body: 'Ahmed liked your post',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000),
  }
];

const MOCK_STORIES: Story[] = [
  {
    id: 'story-1',
    userId: 'user-3',
    mediaURL: 'https://picsum.photos/seed/story1/400/800',
    mediaType: 'image',
    createdAt: new Date(),
    views: ['user-1'],
  }
];

let messages: Message[] = [
  {
    id: 'msg-1',
    roomId: 'room-1',
    senderId: 'user-3',
    type: 'text',
    content: 'مرحباً، كيف حالك؟',
    createdAt: new Date(Date.now() - 3600000),
    readBy: ['user-1'],
    deliveredBy: ['user-1'],
    isEdited: false,
  },
  {
    id: 'msg-2',
    roomId: 'room-1',
    senderId: 'user-1',
    type: 'text',
    content: 'أنا بخير، شكراً لك! ماذا عنك؟',
    createdAt: new Date(Date.now() - 3000000),
    readBy: ['user-3'],
    deliveredBy: ['user-3'],
    isEdited: false,
  }
];

const listeners: Record<string, ((data: any) => void)[]> = {};

const notify = (channel: string, data: any) => {
  if (listeners[channel]) {
    listeners[channel].forEach(cb => cb(data));
  }
};

export const mockDb = {
  getUsers: () => MOCK_USERS,
  getUser: (id: string) => MOCK_USERS.find(u => u.id === id),
  getRooms: (userId: string) => MOCK_ROOMS.filter(r => r.members.includes(userId)),
  getMessages: (roomId: string) => messages.filter(m => m.roomId === roomId),
  getPosts: () => MOCK_POSTS,
  getStories: () => MOCK_STORIES,
  getNotifications: (userId: string) => MOCK_NOTIFICATIONS.filter(n => n.userId === userId),
  
  sendMessage: (msg: Partial<Message>) => {
    const newMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      readBy: [],
      deliveredBy: [],
      isEdited: false,
      ...msg
    } as Message;
    messages.push(newMsg);
    notify(`room-${newMsg.roomId}`, messages.filter(m => m.roomId === newMsg.roomId));
    return newMsg;
  },
  
  onMessages: (roomId: string, callback: (msgs: Message[]) => void) => {
    const channel = `room-${roomId}`;
    if (!listeners[channel]) listeners[channel] = [];
    listeners[channel].push(callback);
    callback(messages.filter(m => m.roomId === roomId));
    return () => {
      listeners[channel] = listeners[channel].filter(cb => cb !== callback);
    };
  }
};
