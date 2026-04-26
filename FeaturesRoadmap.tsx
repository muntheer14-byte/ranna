import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Shield, 
  MessageSquare, 
  Cpu, 
  Palette, 
  Activity, 
  Globe, 
  Zap, 
  Lock, 
  Clock,
  ChevronLeft,
  X
} from 'lucide-react';

const FEATURE_CATEGORIES = [
  {
    title: 'الذكاء الاصطناعي',
    icon: Sparkles,
    color: 'bg-indigo-600',
    features: [
      'تلخيص ذكي للمحادثات (مفعل)',
      'ردود ذكية مقترحة (مفعل)',
      'تحويل الصوت إلى نص (مفعل)',
      'ترجمة فورية للرسائل الواردة',
      'إنشاء صور بالـ AI في الشات',
      'استنساخ الصوت (Text-to-Voice)',
      'بحث ذكي بالمعنى والمحتوى',
      'تصحيح لغوي ومنسق رسائل للعمل',
      'مساعد ذكي مدمج للمهام',
      'تحليل مشاعر المحادثة'
    ]
  },
  {
    title: 'الخصوصية والأمان',
    icon: Shield,
    color: 'bg-emerald-600',
    features: [
      'التشفير العصبي الكامل (مفعل)',
      'تدمير الرسائل التلقائي (مفعل)',
      'قفل التطبيق ببصمة الوجه',
      'وضع منع لقطات الشاشة',
      'خزنة الرسائل السرية',
      'إخفاء الظهور عن أشخاص محددين',
      'مشاهدة الصور لمرة واحدة',
      'حماية IP في المكالمات',
      'سجل أمان الأجهزة المتصلة',
      'تسجيل الخروج عن بُعد'
    ]
  },
  {
    title: 'التواصل والوسائط',
    icon: MessageSquare,
    color: 'bg-blue-600',
    features: [
      'مكالمات فيديو وصوت HD (مفعل)',
      'رسائل الفيديو الدائرية (مفعل)',
      'مشاركة الشاشة في المكالمات',
      'مغير الصوت وعزل الضوضاء',
      'مكالمات جماعية ضخمة',
      'إرسال ملفات ضخمة (حتى 2GB)',
      'مشاركة الموقع الحي والمباشر',
      'مكتبة وسائط شاملة ومنظمة',
      'تحكم في سرعة تشغيل الصوت',
      'جدولة الرسائل للإرسال لاحقاً'
    ]
  },
  {
    title: 'التنظيم والإنتاجية',
    icon: Cpu,
    color: 'bg-purple-600',
    features: [
      'مجلدات الدردشة المخصصة (مفعل)',
      'تثبيت الرسائل والملفات (مفعل)',
      'منبه تذكير بالرسائل الهامة',
      'إدارة المهام داخل الدردشة',
      'محفظة مشتركة وتقسيم فواتير',
      'دعم عدة حسابات في هاتف واحد',
      'مساحة سحابية للملاحظات',
      'تصنيف جهات الاتصال لمجموعات',
      'بحث عالمي في كل الأرشيف',
      'أرشفة الدردشات غير النشطة'
    ]
  },
  {
    title: 'التفاعل والترفيه',
    icon: Zap,
    color: 'bg-amber-500',
    features: [
      'استطلاعات الرأي والقرار (مفعل)',
      'القصص واليوميات (مفعل)',
      'صانع ملصقات متحركة مخصص',
      'ألعاب جماعية داخل الشات',
      'تفاعلات إيموجي مخصصة',
      'قنوات بث (Channels) عامة',
      'لوحة رسم مشتركة ومباشرة',
      'عد تنازلي للمناسبات',
      'إرسال هدايا ورموز رقمية',
      'إضافة سريعة عبر كود QR'
    ]
  }
];

export const FeaturesRoadmap: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col items-center"
    >
      <div className="w-full max-w-md h-full flex flex-col bg-white dark:bg-black relative shadow-2xl">
        <header className="h-16 shrink-0 border-b border-slate-100 dark:border-white/5 flex items-center px-6 justify-between bg-white dark:bg-black/50 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                 <Sparkles size={20} />
              </div>
              <h2 className="text-lg font-black tracking-tight">خارطة الطريق (50 ميزة)</h2>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
              <X size={24} />
           </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
           <div className="bg-indigo-600/5 dark:bg-indigo-500/10 rounded-3xl p-6 border border-indigo-600/10">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed text-right">
                 أهلاً بك في مستقبل "رنة". لقد قمنا بتفعيل أهم الميزات المطلوبة، والآن نقترح عليك 50 ميزة إضافية لجعل التطبيق الأفضل عالمياً.
              </p>
           </div>

           {FEATURE_CATEGORIES.map((cat, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="space-y-4"
             >
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${cat.color} flex items-center justify-center text-white`}>
                     <cat.icon size={16} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest">{cat.title}</h3>
               </div>

               <div className="grid gap-2">
                  {cat.features.map((feat, fidx) => (
                    <div 
                      key={fidx}
                      className={`p-4 rounded-2xl border text-right transition-all hover:scale-[1.02] ${
                        feat.includes('(مفعل)') 
                          ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' 
                          : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-xs font-bold">{feat}</span>
                    </div>
                  ))}
               </div>
             </motion.div>
           ))}
        </div>
      </div>
    </motion.div>
  );
};
