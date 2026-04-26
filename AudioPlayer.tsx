import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, Wand2, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transcribeAudio } from '../services/aiService';

interface AudioPlayerProps {
  url: string;
  isMe: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isLoading) return;
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTranscribe = async () => {
    if (transcription) {
      setShowTranscription(!showTranscription);
      return;
    }
    setIsTranscribing(true);
    const result = await transcribeAudio(url);
    setTranscription(result || null);
    setShowTranscription(true);
    setIsTranscribing(false);
  };

  return (
    <div className={`flex flex-col gap-2 min-w-[220px]`}>
      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
        isMe ? 'bg-white/10 border-white/20' : 'bg-purple-600/5 border-purple-500/10 shadow-sm'
      }`}>
        <audio ref={audioRef} src={url} className="hidden" />
        
        <button 
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
            isMe ? 'bg-white text-purple-600 shadow-lg' : 'bg-purple-600 text-white shadow-purple-600/20 shadow-md'
          }`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div className="flex-1 space-y-1.5">
          <div className="h-6 flex items-center gap-[2px] px-1 relative">
            {/* Mock Waveform with actual progress coloring */}
            {Array(20).fill(0).map((_, i) => {
              const h = 20 + Math.sin(i * 0.8) * 15;
              const isActive = (i / 20) * 100 <= progress;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-colors duration-300 ${
                    isActive 
                      ? (isMe ? 'bg-white' : 'bg-purple-600') 
                      : (isMe ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/5')
                  }`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center px-0.5">
            <p className={`text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-white/40' : 'text-purple-600/40'}`}>
              {formatTime(currentTime)}
            </p>
            <p className={`text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-white/40' : 'text-purple-600/40'}`}>
              {formatTime(duration)}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleTranscribe}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isMe ? 'hover:bg-white/10 text-white/60' : 'hover:bg-purple-600/10 text-purple-600/60'
          }`}
          title="تحويل إلى نص"
        >
          {isTranscribing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Languages size={14} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showTranscription && transcription && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`p-3 rounded-xl text-[10px] items-start gap-2 border font-medium leading-relaxed overflow-hidden ${
              isMe ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 opacity-50">
               <Wand2 size={10} />
               <span className="text-[8px] font-black uppercase tracking-widest">تحويل ذكي</span>
            </div>
            {transcription}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
