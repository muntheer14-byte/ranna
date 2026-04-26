import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, User } from '../types';
import { 
  ShieldCheck, 
  CheckCheck, 
  Check,
  Clock,
  MapPin, 
  FileText, 
  Reply as ReplyIcon, 
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  X,
  Info,
  BarChart2,
  Languages,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AudioPlayer } from './AudioPlayer';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { sensoryClick } from '../lib/haptics';

interface MessageListProps {
  messages: Message[];
  userId: string;
  user?: User | null;
  onLongPress: (msg: Message, e: React.MouseEvent | React.TouchEvent) => void;
  onPin?: (msg: Message) => void;
  onForward?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onVote?: (msgId: string, optionIndex: number) => void;
  detailedMsgId: string | null;
  setDetailedMsgId: (id: string | null) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  userId, 
  user, 
  onLongPress, 
  onPin, 
  onForward, 
  onDelete,
  onVote,
  detailedMsgId,
  setDetailedMsgId
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [revealedIds, setRevealedIds] = React.useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    sensoryClick(user?.settings);
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getExactTime = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : (date instanceof Date ? date : new Date(date.seconds * 1000 || date));
      return format(d, 'yyyy/MM/dd - HH:mm:ss', { locale: isRTL ? ar : undefined });
    } catch (e) {
      return '';
    }
  };

  const getMessageStatus = (msg: any) => {
    if (msg.isOptimistic) return { text: t('status_sending') || 'جارِ الإرسال...', icon: Clock, color: 'text-slate-400' };
    if (msg.readBy?.length > 0) return { text: t('status_read') || 'تمت القراءة', icon: CheckCheck, color: 'text-blue-400' };
    if (msg.deliveredBy?.length > 0) return { text: t('status_delivered') || 'تم التسليم', icon: CheckCheck, color: 'text-slate-400' };
    return { text: t('status_sent') || 'تم الإرسال', icon: Check, color: 'text-slate-400' };
  };

  return (
    <div className="flex flex-col p-6 space-y-4">
      {/* Encryption Hint */}
      <div className="flex flex-col items-center gap-2 opacity-50 mb-16 mt-6 text-ranna-accent">
        <div className="p-3 wasel-card bg-white/50 dark:bg-white/5 rounded-2xl border-ranna-accent/10 shadow-lg">
          <ShieldCheck size={24} className="opacity-80" />
        </div>
        <div className="text-center">
          <p className="text-[9px] uppercase font-black tracking-[0.3em] mb-1">{t('encrypted_hint')}</p>
          <p className="text-[8px] font-medium opacity-60 max-w-[200px] leading-relaxed">
            Only participants in this chat can read these messages.
          </p>
        </div>
      </div>

      {messages.map((msg) => {
        const isMe = msg.senderId === userId;
        
        let timeStr = '';
        if (msg.createdAt) {
          try {
            const date = (msg.createdAt as any).toDate ? (msg.createdAt as any).toDate() : (msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt.seconds * 1000 || Date.now()));
            timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch (e) {
            timeStr = '...';
          }
        } else if (msg.isOptimistic) {
          timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            key={msg.id}
            className={`flex flex-col mb-8 ${isMe ? 'items-end' : 'items-start'} relative`}
            onContextMenu={(e) => { e.preventDefault(); onLongPress(msg, e); }}
            onDoubleClick={(e) => { onLongPress(msg, e); }}
          >
            {/* Neural Mode Indicator */}
            {msg.isSecret && (
              <div className={`flex items-center gap-1 mb-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest ${isMe ? 'mr-4' : 'ml-4'}`}>
                <Lock size={10} />
                <span>الدرع العصبي</span>
              </div>
            )}

            <div 
              onClick={() => {
                if (detailedMsgId === msg.id) setDetailedMsgId(null);
                else setDetailedMsgId(msg.id);
              }}
              className={`max-w-[85%] p-5 shadow-2xl relative group/msg transition-all duration-500 hover:shadow-ranna-accent/20 cursor-pointer ${
                isMe 
                  ? `${msg.isSecret ? 'bg-indigo-600 shadow-indigo-600/30' : 'bg-emerald-600 shadow-emerald-500/10'} text-white rounded-[2rem] rounded-br-[0.5rem]` 
                  : `wasel-card ${msg.isSecret ? 'bg-indigo-900/10 dark:bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5' : 'bg-white/80 dark:bg-white/5 border-slate-100 dark:border-white/5'} text-slate-800 dark:text-white rounded-[2rem] rounded-bl-[0.5rem] shadow-xl backdrop-blur-sm`
              } ${msg.isDeleted ? 'opacity-40 italic' : ''} ${msg.isSecret && !revealedIds.has(msg.id) ? 'overflow-hidden' : ''} ${detailedMsgId === msg.id ? 'ring-2 ring-emerald-400' : ''}`}
            >
              {/* Neural Shield Blur Effect */}
              {msg.isSecret && !revealedIds.has(msg.id) && !msg.isDeleted && (
                <div 
                  onClick={() => toggleReveal(msg.id)}
                  className={`absolute inset-0 z-10 bg-white/10 dark:bg-black/10 flex items-center justify-center cursor-pointer group-hover/msg:backdrop-blur-sm transition-all ${
                    user?.settings?.neural?.blurLevel === 'low' ? 'backdrop-blur-md' :
                    user?.settings?.neural?.blurLevel === 'high' ? 'backdrop-blur-3xl' :
                    'backdrop-blur-xl'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-white dark:text-white">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                      <Eye size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full text-white">انقر للكشف</span>
                  </div>
                </div>
              )}

              {/* Reply Preview */}
              {msg.replyTo && (
                <div 
                  onClick={() => {
                    // Logic to scroll to msg.replyTo.id would go here
                  }}
                  className={`mb-3 p-3 rounded-2xl border-l-[6px] overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all ${
                  isMe ? 'bg-white/10 border-white/60' : 'bg-ranna-accent/5 border-ranna-accent/40'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <ReplyIcon size={12} className="opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-ranna-accent">
                      {msg.replyTo.senderId === userId ? t('you') : 'Participant'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium leading-tight line-clamp-1 opacity-70">
                    {msg.replyTo.content}
                  </p>
                </div>
              )}

              {msg.isDeleted ? (
                <p className="text-[13px] opacity-60 flex items-center gap-2 font-medium italic"><Trash2 size={14} /> {t('message_deleted') || 'تم حذف الرسالة'}</p>
              ) : (
                <>
                  {msg.type === 'text' && (
                    <div className="flex flex-col gap-2">
                       <p className="text-[15px] font-serif font-medium tracking-tight leading-relaxed select-text whitespace-pre-wrap">{msg.content}</p>
                       {msg.metadata?.translatedText && (
                         <div className={`mt-2 pt-2 border-t border-dotted border-white/20 dark:border-black/20 italic`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] mb-1 opacity-50 flex items-center gap-1">
                               <Languages size={10} /> {t('translation')}
                            </p>
                            <p className="text-[13px] opacity-90">{msg.metadata.translatedText}</p>
                         </div>
                       )}
                    </div>
                  )}
                  {msg.type === 'image' && (
                    <div className="rounded-3xl overflow-hidden mb-2 shadow-2xl border-4 border-white/10 group-hover/msg:scale-[1.02] transition-transform duration-500">
                       <img src={msg.content} alt="Media" className="w-full object-cover max-h-[500px] cursor-pointer" />
                    </div>
                  )}
                  {msg.type === 'video' && (
                    <div className="rounded-3xl overflow-hidden mb-2 relative group-hover/msg:scale-[1.02] transition-transform duration-500 border-4 border-white/10">
                       <video src={msg.content} className="w-full max-h-[500px] object-cover" controls />
                    </div>
                  )}
                  {msg.type === 'audio' && (
                    <div className="flex flex-col gap-2">
                      <AudioPlayer url={msg.content} isMe={isMe} />
                      {msg.metadata?.transcription ? (
                        <div className="mt-2 p-3 bg-white/10 rounded-2xl border border-white/10">
                           <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1">
                              <Sparkles size={10} /> نص صوتي ذكي
                           </p>
                           <p className="text-xs opacity-80 leading-relaxed italic">{msg.metadata.transcription}</p>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Logic will be handled in parent or here
                            // For now, let's assume parent passes a function or we handle it in ChatRoom
                          }}
                          className="self-start text-[8px] font-black uppercase tracking-wider text-white/50 hover:text-emerald-400 mt-1 px-3 py-1 bg-white/5 rounded-full border border-white/10 transition-colors"
                        >
                          تحويل إلى نص بالذكاء الاصطناعي
                        </button>
                      )}
                    </div>
                  )}
                  {msg.type === 'location' && (
                    <div className="rounded-2xl overflow-hidden mb-2 border border-ranna-accent/10 space-y-2">
                       <div className="h-32 bg-ranna-accent/10 flex items-center justify-center">
                          <div className="text-ranna-accent flex flex-col items-center gap-1">
                             <MapPin size={24} className="animate-bounce" />
                             <span className="text-[8px] font-black uppercase tracking-widest">Live Location</span>
                          </div>
                       </div>
                    </div>
                  )}
                  {msg.type === 'file' && (
                    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isMe ? 'bg-white/10 border-white/20' : 'bg-ranna-accent/5 border-ranna-accent/10'}`}>
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20 text-white' : 'bg-ranna-accent/10 text-ranna-accent'}`}>
                          <FileText size={20} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate tracking-tight">{msg.metadata?.fileName || 'Document.pdf'}</p>
                          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">{msg.metadata?.fileSize || '2.4 MB'}</p>
                       </div>
                    </div>
                  )}
                  {msg.type === 'video_note' && (
                     <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-ranna-accent shadow-2xl ring-8 ring-ranna-accent/5">
                        <video src={msg.content} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                     </div>
                  )}
                  {msg.type === 'system_log' && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-center opacity-40 w-full">{msg.content}</p>
                  )}
                  {msg.type === 'poll' && (
                    <div className={`w-[260px] md:w-[300px] flex flex-col gap-4 p-2`}>
                      <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4">
                         <div className="w-10 h-10 rounded-xl bg-orange-600 shadow-lg flex items-center justify-center text-white">
                            <BarChart2 size={20} />
                         </div>
                         <h4 className="text-[14px] font-black leading-tight">{msg.content}</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {msg.metadata?.options?.map((opt: any, idx: number) => {
                          const totalVotes = msg.metadata.options.reduce((acc: number, curr: any) => acc + (curr.votes?.length || 0), 0);
                          const myVote = opt.votes?.includes(userId);
                          const percentage = totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;
                          
                          return (
                            <button 
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                onVote?.(msg.id, idx);
                              }}
                              className={`w-full group/opt relative h-12 rounded-2xl overflow-hidden border transition-all active:scale-[0.98] ${
                                myVote 
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-500/50' 
                                  : 'bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10'
                              }`}
                            >
                              <div 
                                className={`absolute inset-0 z-0 transition-all duration-1000 ${myVote ? 'bg-emerald-500/10' : 'bg-black/10 dark:bg-white/10'}`}
                                style={{ width: `${percentage}%` }}
                              />
                              <div className="relative z-10 flex items-center justify-between px-4 h-full">
                                <div className="flex items-center gap-3">
                                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${myVote ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-white/20'}`}>
                                      {myVote && <Check size={10} className="text-white" />}
                                   </div>
                                   <span className="text-xs font-bold">{opt.text}</span>
                                </div>
                                <span className="text-[9px] font-black opacity-40">{percentage}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                          {msg.metadata?.options?.reduce((acc: number, curr: any) => acc + (curr.votes?.length || 0), 0)} أصوات
                        </span>
                        {msg.metadata?.isAnonymous && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">مجهول</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="mt-3 flex justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                  <span className={`font-modern text-[10px] font-black uppercase tracking-[0.2em] ${isMe ? 'text-white/40' : 'text-slate-400'}`}>
                    {timeStr}
                  </span>
                  {msg.isEdited && !msg.isDeleted && (
                    <span className={`text-[7px] font-bold uppercase tracking-widest ${isMe ? 'text-white/30' : 'text-slate-300'}`}>
                      {t('edited') || 'تم تعديلها'}
                    </span>
                  )}
                </div>
                {isMe && !msg.isDeleted && (
                  <div className="flex items-center gap-1">
                    {msg.isOptimistic ? (
                      <Clock size={10} className="text-white/40 animate-pulse" />
                    ) : (
                      <>
                        {user?.settings?.privacy?.readReceipts !== false && msg.readBy?.length > 0 ? (
                           <CheckCheck size={12} className="text-blue-200" />
                        ) : (user?.settings?.privacy?.readReceipts !== false && msg.deliveredBy?.length > 0) ? (
                           <CheckCheck size={12} className="text-white/40" />
                        ) : (
                           <Check size={12} className="text-white/40" />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Detailed Info View */}
              <AnimatePresence>
                {detailedMsgId === msg.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`mt-4 pt-4 border-t ${isMe ? 'border-white/10' : 'border-slate-100 dark:border-white/5'} flex flex-col gap-3 overflow-hidden`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="opacity-40" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">وقت الإرسال</span>
                      </div>
                      <span className="text-[9px] font-bold opacity-70 ltr">{getExactTime(msg.createdAt || new Date())}</span>
                    </div>

                    {msg.deliveredBy && msg.deliveredBy.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCheck size={12} className="opacity-40" />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">تم التسليم</span>
                        </div>
                        <span className="text-[9px] font-bold opacity-70 ltr">
                          {msg.metadata?.deliveredAt ? getExactTime(msg.metadata.deliveredAt) : '---'}
                        </span>
                      </div>
                    )}

                    {msg.readBy && msg.readBy.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye size={12} className="text-blue-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">تمت القراءة</span>
                        </div>
                        <span className="text-[9px] font-bold text-blue-400 ltr">
                          {msg.metadata?.readAt ? getExactTime(msg.metadata.readAt) : '---'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <Info size={12} className={getMessageStatus(msg).color} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${getMessageStatus(msg).color}`}>
                          {getMessageStatus(msg).text}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDetailedMsgId(null); }}
                        className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100"
                      >
                        إغلاق التفاصيل
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Reactions Display */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className={`absolute -bottom-3 ${isMe ? 'right-4' : 'left-4'} flex items-center gap-1 bg-white dark:bg-black shadow-lg rounded-full px-2 py-0.5 border border-white/20`}>
                   {Object.entries(msg.reactions as Record<string, string[]>).map(([emoji, uids]) => (
                     <span key={emoji} className="text-[10px] flex items-center gap-1">
                       {emoji} <span className="opacity-50">{(uids as string[]).length}</span>
                     </span>
                   ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
