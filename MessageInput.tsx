import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Paperclip, 
  Smile, 
  Send, 
  Mic, 
  Film, 
  X, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  Check, 
  Loader2,
  Trash2,
  PenLine,
  Video as VideoIcon,
  Flame,
  Clock,
  Square,
  Reply as ReplyIcon,
  Sparkles,
  History as HistoryIcon,
  BarChart2,
  Plus,
  Trash
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User } from '../types';

interface MessageInputProps {
  onSend: (content: string, type: string, extra?: any) => void;
  onTyping?: (isTyping: boolean) => void;
  isEditing?: boolean;
  user?: User | null;
  editContent?: string;
  onCancelEdit?: () => void;
  replyMsg?: any;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  onTyping,
  isEditing, 
  user,
  editContent, 
  onCancelEdit,
  replyMsg,
  onCancelReply
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState(editContent || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'audio' | 'video'>('audio');
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  const [destructDuration, setDestructDuration] = useState(60); // Default 1 minute
  const [showDestructMenu, setShowDestructMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);
  const [tone, setTone] = useState<string | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const slideOffset = useMotionValue(0);
  const opacity = useTransform(slideOffset, [0, -150], [1, 0]);
  const touchStartX = useRef(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = () => {
    longPressTimeoutRef.current = setTimeout(() => {
      setShowLongPressMenu(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
  };

  useEffect(() => {
    if (editContent) setInput(editContent);
  }, [editContent]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
      return () => clearInterval(interval);
    } else {
      setRecordingTime(0);
    }
  }, [isRecording]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

    // Tone analysis simulation
    if (user?.settings?.intelligence?.smartReply && val.length > 5) {
      if (val.includes('؟')) setTone('سؤال');
      else if (val.includes('!') || val.length > 50) setTone('متحمس');
      else setTone('هادئ');
    } else {
      setTone(null);
    }

    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setAttachments(prev => [...prev, ...files]);
    files.forEach((file: File) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreviews(prev => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => [...prev, 'file']);
      }
    });
    setShowAttachments(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    
    setIsUploading(true);
    const extra = isSelfDestruct ? { isSelfDestruct: true, expiresAt: Date.now() + destructDuration * 1000 } : {};

    try {
      if (attachments.length > 0) {
        // Upload all attachments to Firebase Storage
        const uploadPromises = attachments.map(async (file) => {
          const path = `uploads/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return { url, file };
        });

        const urlsWithFiles = await Promise.all(uploadPromises);
        
        // If there's text, send it first
        if (input.trim()) {
          onSend(input, 'text', extra);
        }

        // Send each attachment as a message
        urlsWithFiles.forEach((item) => {
          const file = item.file;
          const url = item.url;
          
          let type = 'file';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';
          else if (file.type.startsWith('audio/')) type = 'audio';
          
          onSend(url, type, extra);
        });
      } else {
        onSend(input, 'text', extra);
      }
      
      setInput('');
      setAttachments([]);
      setPreviews([]);
      setIsSelfDestruct(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendPoll = () => {
    const validOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) return;
    
    onSend(pollQuestion, 'poll', {
      options: validOptions.map(text => ({ text, votes: [] })),
      isMultipleChoice: false,
      isAnonymous: false
    });
    
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  };

  const handleRecordStart = async (e: React.PointerEvent) => {
    e.preventDefault();
    touchStartX.current = e.clientX;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) return; // Ignore very short recordings

        setIsUploading(true);
        try {
          const path = `audio/${Date.now()}.webm`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, audioBlob);
          const url = await getDownloadURL(storageRef);
          onSend(url, 'audio');
        } catch (err) {
          console.error("Voice upload failed", err);
        } finally {
          setIsUploading(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access required for voice notes");
    }
  };

  const handleRecordEnd = (e: React.PointerEvent) => {
    const offset = e.clientX - touchStartX.current;
    const cancelled = Math.abs(offset) > 150;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    slideOffset.set(0);
    
    if (cancelled) {
      audioChunksRef.current = [];
      if (navigator.vibrate) navigator.vibrate([20, 20]);
    }
  };

  const handleTouchMove = (e: React.PointerEvent) => {
    if (!isRecording) return;
    const offset = e.clientX - touchStartX.current;
    if (offset < 0) {
      slideOffset.set(offset);
      if (Math.abs(offset) > 150 && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  };

  return (
    <div className="shrink-0 relative z-40 w-full bg-ranna-bg/95 backdrop-blur-3xl border-t border-ranna-accent/10 pb-safe">
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-8 py-3 bg-ranna-accent/10 border-b border-ranna-accent/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <PenLine size={14} className="text-ranna-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ranna-accent">{t('edit')}</span>
            </div>
            <button onClick={onCancelEdit} className="p-1.5 hover:bg-ranna-accent/20 rounded-full transition-colors">
              <X size={14} className="text-ranna-accent" />
            </button>
          </motion.div>
        )}
        {replyMsg && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-8 py-3 bg-ranna-accent/5 border-b border-ranna-accent/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 border-l-4 border-ranna-accent pl-4">
              <ReplyIcon size={14} className="text-ranna-accent shrink-0" />
              <div className="flex flex-col min-w-0">
                 <span className="text-[9px] font-black uppercase tracking-widest text-ranna-accent">Replying to msg</span>
                 <p className="text-[11px] font-serif italic line-clamp-1 text-slate-500">{replyMsg.content}</p>
              </div>
            </div>
            <button onClick={onCancelReply} className="p-1.5 hover:bg-ranna-accent/20 rounded-full transition-colors">
              <X size={14} className="text-ranna-accent" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickReplies && !input.trim() && !replyMsg && !isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar mask-fade-right"
          >
            {[
              { text: 'تمام', icon: Check },
              { text: 'وصلت', icon: MapPin },
              { text: 'أنا بالاجتماع', icon: Clock },
              { text: 'رائع!', icon: Sparkles },
              { text: 'سأعاود الاتصال', icon: HistoryIcon }
            ].map((reply) => (
              <motion.button
                key={reply.text}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSend(reply.text, 'text')}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-ranna-accent/30 transition-all group"
              >
                <reply.icon size={12} className="text-ranna-accent" />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-ranna-accent transition-colors">{reply.text}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-6 max-w-md mx-auto">
        <div className="flex items-end gap-3 md:gap-4">
          <div className="flex-1 flex items-end ranna-card bg-ranna-bg/40 rounded-[2.2rem] px-3 py-1.5 border-ranna-accent/10 shadow-2xl shadow-ranna-accent/5 group focus-within:border-ranna-accent/30 transition-all duration-500">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setShowAttachments(!showAttachments)}
              className={`p-3.5 rounded-2xl transition-all duration-500 cursor-pointer ${showAttachments ? 'bg-ranna-accent text-white shadow-lg rotate-45' : 'text-slate-400 hover:text-ranna-accent hover:bg-ranna-accent/5'}`}
            >
              <Paperclip size={20} strokeWidth={2.5} />
            </div>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextChange}
              placeholder={t('type_message')}
              className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 py-3.5 px-3 text-sm font-bold tracking-tight resize-none max-h-40 text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-medium no-scrollbar"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <AnimatePresence>
              {tone && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-8 right-16 px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5"
                >
                  <Sparkles size={10} />
                  <span>نبرة: {tone}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div 
              role="button"
              tabIndex={0}
              onClick={() => setShowDestructMenu(!showDestructMenu)}
              className={`p-3.5 transition-all duration-500 relative cursor-pointer ${isSelfDestruct ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'}`}
            >
              <Flame size={20} className={isSelfDestruct ? 'animate-pulse' : ''} />
              <AnimatePresence>
                {showDestructMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 wasel-card bg-ranna-bg p-2 rounded-2xl shadow-2xl border border-ranna-accent/10 min-w-[120px] flex flex-col gap-1"
                  >
                    {[5, 10, 60, 3600, 86400].map((d) => (
                      <button
                        key={d}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDestructDuration(d);
                          setIsSelfDestruct(true);
                          setShowDestructMenu(false);
                        }}
                        className={`p-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors ${destructDuration === d && isSelfDestruct ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                      >
                        {d < 60 ? `${d}s` : d < 3600 ? `${d / 60}m` : d < 86400 ? `${d / 3600}h` : '1d'}
                      </button>
                    ))}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSelfDestruct(false); 
                        setShowDestructMenu(false); 
                      }}
                      className="p-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl"
                    >
                      Disable
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="p-3.5 text-slate-300 hover:text-amber-500 hover:bg-amber-500/5 rounded-2xl transition-all duration-500">
              <Smile size={20} />
            </button>
          </div>

          <div className="flex shrink-0 relative">
            {input.trim() || attachments.length > 0 || isUploading ? (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                onPointerDown={handleLongPressStart}
                onPointerUp={handleLongPressEnd}
                onPointerLeave={handleLongPressEnd}
                onClick={handleSend}
                disabled={isUploading}
                className="w-12 h-12 md:w-14 md:h-14 bg-ranna-accent text-white shadow-2xl shadow-ranna-accent/20 rounded-2xl md:rounded-[1.6rem] flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  isEditing ? <Check size={24} /> : <Send size={20} className="ml-0.5" />
                )}
              </motion.button>
            ) : (
              <div className="relative">
                <motion.button
                  onPointerDown={handleRecordStart}
                  onPointerUp={handleRecordEnd}
                  onPointerMove={handleTouchMove}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    if (!isRecording) {
                      setRecordingMode(m => m === 'audio' ? 'video' : 'audio');
                      if (navigator.vibrate) navigator.vibrate(20);
                    }
                  }}
                  animate={{ 
                    scale: isRecording ? 1.4 : 1,
                    backgroundColor: isRecording ? (recordingMode === 'audio' ? '#be123c' : '#4338ca') : 'var(--accent)'
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[1.6rem] flex items-center justify-center text-white shadow-xl touch-none select-none transition-all duration-300 disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : isRecording ? (
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity }}>
                      {recordingMode === 'audio' ? <Square size={24} fill="currentColor" /> : <VideoIcon size={24} />}
                    </motion.div>
                  ) : (
                    recordingMode === 'audio' ? <Mic size={24} /> : <VideoIcon size={24} />
                  )}
                </motion.button>
              </div>
            )}

            <AnimatePresence>
              {showLongPressMenu && (
                <>
                  <div className="fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-sm" onClick={() => setShowLongPressMenu(false)} />
                  <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="w-full max-w-sm glass rounded-[2.5rem] p-6 shadow-2xl border-white/40 pointer-events-auto"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-10 h-10 rounded-2xl bg-ranna-accent/10 flex items-center justify-center text-ranna-accent">
                             <PenLine size={20} />
                           </div>
                           <h3 className="font-bold">تعديل النص</h3>
                        </div>
                        <textarea 
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                           className="w-full bg-white/10 border-none rounded-2xl p-4 text-sm font-bold min-h-[120px] focus:ring-2 focus:ring-ranna-accent no-scrollbar resize-none"
                        />
                        <button 
                          onClick={() => setShowLongPressMenu(false)}
                          className="w-full py-4 bg-ranna-accent text-white rounded-2xl font-bold text-sm shadow-xl"
                        >
                          إغلاق
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAttachments && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAttachments(false)} className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm" />
            <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }} className="absolute bottom-full left-0 right-0 z-50 p-6 px-4">
              <div className="max-w-5xl mx-auto wasel-card p-8 rounded-[2.5rem] shadow-2xl grid grid-cols-4 gap-6 bg-ranna-bg/95 backdrop-blur-xl border-ranna-accent/10">
                <AttachIcon icon={ImageIcon} label={t('gallery')} color="emerald" onClick={() => fileInputRef.current?.click()} />
                <AttachIcon icon={Film} label="Video" color="emerald" onClick={() => videoInputRef.current?.click()} />
                <AttachIcon icon={FileText} label={t('file')} color="emerald" onClick={() => docInputRef.current?.click()} />
                <AttachIcon icon={BarChart2} label="Poll" color="emerald" onClick={() => setShowPollModal(true)} />
                <AttachIcon icon={MapPin} label={t('location')} color="emerald" onClick={() => {}} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPollModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">إنشاء استطلاع</h3>
                  <button onClick={() => setShowPollModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                
                <input 
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="اسأل سؤالاً..."
                  className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold mb-6 focus:ring-2 focus:ring-indigo-500"
                />

                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                  {pollOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                       <input 
                         value={option}
                         onChange={e => {
                           const newOptions = [...pollOptions];
                           newOptions[idx] = e.target.value;
                           setPollOptions(newOptions);
                         }}
                         placeholder={`خيار ${idx + 1}`}
                         className="flex-1 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                       />
                       {idx > 1 && (
                         <button 
                           onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                           className="w-12 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 flex items-center justify-center"
                         >
                           <Trash size={18} />
                         </button>
                       )}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setPollOptions(prev => [...prev, ''])}
                  className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500 px-2"
                >
                  <Plus size={14} />
                  إضافة خيار
                </button>
              </div>

              <div className="p-8 pt-4">
                <button 
                  onClick={handleSendPoll}
                  disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                  className="w-full py-4 bg-ranna-accent text-white rounded-2xl font-black text-sm shadow-xl shadow-ranna-accent/20 disabled:opacity-50"
                >
                  إنشاء الاستطلاع
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" multiple onChange={handleFileSelect} />
      <input type="file" ref={docInputRef} className="hidden" multiple onChange={handleFileSelect} />
    </div>
  );
};

const AttachIcon = ({ icon: Icon, label, color, onClick }: any) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-ranna-accent/10 text-ranna-accent',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <motion.button whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }} onClick={onClick} className="flex flex-col items-center gap-3 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase">{label}</span>
    </motion.button>
  );
};
