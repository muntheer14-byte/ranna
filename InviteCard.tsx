import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  RefreshCw,
  Gift,
  Shield,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { getSharableUrl, copyToClipboard } from '../lib/utils';

interface InviteCardProps {
  onClose: () => void;
  inviterName?: string;
  roomId?: string;
}

export const InviteCard: React.FC<InviteCardProps> = ({ onClose, inviterName, roomId }) => {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const originalOrigin = window.location.origin;
  const isDevUrl = originalOrigin.includes('ais-dev-');
  const [v, setV] = useState(Date.now()); // Unique version for each open
  const inviteUrl = getSharableUrl(roomId, inviterName).replace('&v=2', '') + '&v=' + v;

  const handleCopy = async () => {
    const success = await copyToClipboard(inviteUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setV(prev => prev + 1);
      setRegenerating(false);
    }, 1000);
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector('.qr-container svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 100, 100, 800, 800);
        
        const jpgUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = jpgUrl;
        downloadLink.download = 'ranna-invite-qr.png';
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-purple-500/20">
               <Zap size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">رابط دعوة جديد</h3>
            <p className="text-xs text-slate-400 font-medium px-4 leading-relaxed">
              شارك هذا الرمز أو الرابط مع أصدقائك للانضمام إلى شبكتك الآمنة على رنة.
            </p>

            {isDevUrl && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-xl flex items-start gap-3 text-right">
                <Shield className="text-amber-600 shrink-0 mt-0.5" size={14} />
                <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold leading-tight">
                  تنبيه: أنت تستخدم نسخة المطور. لقد قمنا بتعديل الرابط أدناه ليعمل عند أصدقائك بنجاح. لا تنسخ الرابط من شريط العنوان في المتصفح!
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 relative qr-container">
            <div className={`p-6 bg-white rounded-[2rem] shadow-inner border border-slate-100 flex items-center justify-center transition-opacity duration-300 ${regenerating ? 'opacity-20' : 'opacity-100'}`}>
               <QRCodeSVG 
                 value={inviteUrl} 
                 size={180} 
                 level="H"
                 includeMargin={false}
                 imageSettings={{
                    src: "https://cdn-icons-png.flaticon.com/512/3615/3615952.png",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                 }}
               />
            </div>
            
            {regenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw size={32} className="animate-spin text-purple-600" />
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
             <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-3">
               <div className="flex-1 truncate text-[10px] font-mono text-slate-400 ltr">
                 {inviteUrl}
               </div>
               <button 
                 onClick={handleCopy}
                 className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm border border-slate-200 dark:border-white/10'}`}
               >
                 {copied ? <Check size={18} /> : <Copy size={18} />}
               </button>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={handleDownloadQR}
                 className="h-12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
               >
                 <Download size={16} />
                 تحميل الرمز
               </button>
               <button 
                 onClick={handleRegenerate}
                 className="h-12 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
               >
                 <RefreshCw size={16} className={regenerating ? 'animate-spin' : ''} />
                 رابط جديد
               </button>
             </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center gap-4 px-2">
             <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-orange-600 flex items-center justify-center shrink-0">
                <Gift size={20} />
             </div>
             <div className="text-right">
               <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider">مكافأة الانضمام</p>
               <p className="text-[8px] text-slate-400 font-medium">سيحصل أصدقاؤك على وصول نيرول المميز</p>
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
