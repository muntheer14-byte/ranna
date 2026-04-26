import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, X, ShieldAlert, Sparkles } from 'lucide-react';

interface ErrorSentinelProps {
  children: React.ReactNode;
}

export const ErrorSentinel: React.FC<ErrorSentinelProps> = ({ children }) => {
  const [error, setError] = useState<{ message: string; source?: string } | null>(null);

  const handleError = useCallback((event: ErrorEvent) => {
    console.error("Ranna Sentinel caught an error:", event.error);
    setError({
      message: event.message,
      source: event.filename ? event.filename.split('/').pop() : 'Unknown'
    });
  }, []);

  const handlePromiseError = useCallback((event: PromiseRejectionEvent) => {
    const reason = event.reason;
    let message = "فشل أحد العمليات الخلفية";
    
    if (reason) {
      if (typeof reason === 'string') message = reason;
      else if (reason.message) message = reason.message;
      else {
        try {
          message = JSON.stringify(reason);
        } catch (e) {
          message = reason.toString();
        }
      }
    }
    
    // Ignore handled specific errors that shouldn't alarm the user
    if (message.includes('auth/admin-restricted-operation') || 
        message.includes('quota-exceeded') || 
        message.includes('permission-denied') ||
        message.includes('Firebase: Error')) {
      console.warn("Sentinel ignoring handled error:", message);
      return;
    }

    console.error("Ranna Sentinel caught a promise rejection:", reason);
    setError({
      message: message.substring(0, 100),
      source: 'محرك البيانات (Firebase/Async)'
    });
  }, []);

  useEffect(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseError);
    };
  }, [handleError, handlePromiseError]);

  const handleFix = () => {
    // Basic fix: Refresh or clear state if needed
    window.location.reload();
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-x-0 bottom-10 z-[300] flex justify-center pointer-events-none">
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              className="pointer-events-auto bg-indigo-950/95 backdrop-blur-3xl border border-white/20 p-1.5 rounded-full flex items-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.3)] max-w-[95vw] min-w-[320px] ring-1 ring-white/10"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 animate-pulse shrink-0">
                <AlertCircle size={28} />
              </div>
              
              <div className="flex flex-col text-right flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                   <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300/80">نظام الإنذار الذكي</span>
                </div>
                <h6 className="text-white font-bold text-xs truncate">خلل في: {error.source}</h6>
                <p className="text-indigo-200/50 text-[9px] font-medium leading-tight truncate mt-0.5 underline decoration-rose-500/30">{error.message}</p>
              </div>

              <div className="flex items-center gap-1.5 pl-4 shrink-0">
                <button 
                  onClick={handleFix}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 border border-white/5"
                >
                  <RefreshCw size={14} className="text-emerald-400" />
                  <span>إصلاح</span>
                </button>
                
                <button 
                  onClick={() => setError(null)}
                  className="w-10 h-10 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all border border-rose-500/20"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
