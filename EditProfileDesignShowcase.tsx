import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft,
  Camera,
  User as UserIcon,
  Phone,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  Heart,
  Save,
  CheckCircle2,
  Link as LinkIcon
} from 'lucide-react';
import { User } from '../types';

interface ShowcaseProps {
  user: User;
  onBack: () => void;
}

export const EditProfileDesignShowcase: React.FC<ShowcaseProps> = ({ user, onBack }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-white overflow-y-auto no-scrollbar">
      {/* Comparison Container */}
      <div className="flex flex-col lg:flex-row h-full min-h-screen">
        
        {/* LIGHT MODE PREVIEW */}
        <div className="flex-1 min-h-screen bg-mesh-purple-light p-4 lg:p-8 flex flex-col items-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-purple-200">
          <div className="z-10 w-full max-w-md">
            <header className="flex items-center gap-4 mb-8">
              <button onClick={onBack} className="p-3 bg-white/40 backdrop-blur-xl rounded-2xl shadow-sm text-purple-900">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-2xl font-black text-purple-900 tracking-tighter">إعدادات حساب رنة</h1>
            </header>
            <ProfileForm mode="light" user={user} />
          </div>
          <div className="absolute top-10 right-10 bg-white/80 backdrop-blur-lg px-4 py-2 rounded-full font-black text-[10px] text-purple-600 shadow-xl border border-purple-100 z-20">LIGHT MODE</div>
        </div>

        {/* DARK MODE PREVIEW */}
        <div className="flex-1 min-h-screen bg-mesh-purple-dark p-4 lg:p-8 flex flex-col items-center relative overflow-hidden">
          <div className="z-10 w-full max-w-md">
            <header className="flex items-center gap-4 mb-8">
              <button onClick={onBack} className="p-3 bg-purple-900/40 backdrop-blur-xl rounded-2xl shadow-sm text-lavender-100">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-2xl font-black text-white tracking-tighter">إعدادات حساب رنة</h1>
            </header>
            <ProfileForm mode="dark" user={user} />
          </div>
          <div className="absolute top-10 right-10 bg-purple-900/80 backdrop-blur-lg px-4 py-2 rounded-full font-black text-[10px] text-white shadow-xl border border-white/10 z-20 uppercase">Dark Mode</div>
        </div>

      </div>
    </div>
  );
};

const ProfileForm = ({ mode, user }: { mode: 'light' | 'dark', user: User }) => {
  const isDark = mode === 'dark';
  const cardBase = isDark 
    ? "bg-purple-900/30 backdrop-blur-2xl border border-white/5 shadow-inner" 
    : "bg-white/60 backdrop-blur-2xl border border-white/40 shadow-xl shadow-purple-900/5";
  
  const textTitle = isDark ? "text-white" : "text-purple-900";
  const textLabel = isDark ? "text-purple-300" : "text-purple-500";
  const textValue = isDark ? "text-lavender-100" : "text-purple-800";
  const inputBg = isDark ? "bg-purple-950/40" : "bg-white/40";
  const inputBorder = isDark ? "border-white/5" : "border-white/50";

  return (
    <div className="space-y-6 pb-20">
      {/* Images Section */}
      <div className={`relative rounded-[2.5rem] overflow-hidden ${cardBase}`}>
        {/* Cover */}
        <div className="h-32 w-full relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-sky-400 opacity-60" />
          <button className="absolute bottom-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white">
            <Camera size={18} />
          </button>
        </div>
        
        {/* Avatar */}
        <div className="relative h-20">
          <div className={`absolute -top-10 left-6 ring-4 ${isDark ? 'ring-purple-900/50' : 'ring-white/50'} rounded-3xl overflow-hidden shadow-2xl`}>
             <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} className="w-24 h-24 object-cover" />
             <button className="absolute bottom-1 right-1 p-2 bg-purple-600 text-white rounded-xl shadow-lg ring-2 ring-white/20">
               <Camera size={14} />
             </button>
          </div>
        </div>

        <div className="p-6 pt-0">
          <div className="space-y-4">
            <FormInput label="الاسم الكامل" value={user?.displayName} mode={mode} />
            <FormInput label="اللقب / العائلة" value={user?.username} mode={mode} description="معرف فريد ومميز" />
            <FormTextarea label="السيرة الذاتية" value={user?.bio || 'استكشاف آفاق جديدة...'} mode={mode} />
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className={`rounded-[2rem] p-6 space-y-4 ${cardBase}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Phone size={20} />
          </div>
          <h3 className={`font-black uppercase tracking-widest text-xs ${textTitle}`}>معلومات الاتصال</h3>
        </div>
        <div className={`p-4 rounded-2xl flex items-center justify-between ${inputBg} border ${inputBorder}`}>
          <div>
            <span className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${textLabel}`}>رقم الهاتف</span>
            <span className={`font-bold ${textValue}`}>+964 770 123 4567</span>
          </div>
          <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span className="text-[9px] font-black uppercase">موثق</span>
          </div>
        </div>
        <FormInput label="الروابط والشبكات" value="https://wasel.app/profile" mode={mode} icon={LinkIcon} />
      </div>

      {/* Career */}
      <div className={`rounded-[2rem] p-6 space-y-4 ${cardBase}`}>
        <div className="flex items-center gap-3 mb-2">
           <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-500">
             <Briefcase size={20} />
           </div>
           <h3 className={`font-black uppercase tracking-widest text-xs ${textTitle}`}>القسم المهني</h3>
        </div>
        <FormInput label="مكان العمل" value={user?.workplace} mode={mode} icon={Briefcase} />
        <FormInput label="التعليم" value={user?.education} mode={mode} icon={GraduationCap} />
      </div>

      {/* Personal */}
      <div className={`rounded-[2rem] p-6 space-y-4 ${cardBase}`}>
        <div className="flex items-center gap-3 mb-2">
           <div className="w-10 h-10 rounded-xl bg-magenta-lux/20 flex items-center justify-center text-magenta-lux">
             <Heart size={20} />
           </div>
           <h3 className={`font-black uppercase tracking-widest text-xs ${textTitle}`}>المعلومات الشخصية</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="المدينة الحالية" value={user?.location} mode={mode} icon={MapPin} />
          <FormInput label="مسقط الرأس" value={user?.placeOfBirth} mode={mode} icon={MapPin} />
        </div>
        <FormInput label="تاريخ الميلاد" value="1995-12-01" type="date" mode={mode} icon={Calendar} />
        
        <div className="space-y-4 pt-2">
           <span className={`block text-[10px] font-black uppercase tracking-widest text-right ${textLabel}`}>الجنس</span>
           <div className="flex gap-4">
              <button className={`flex-1 p-4 rounded-2xl flex items-center justify-between border ${isDark ? 'bg-purple-600 border-purple-500 text-white' : 'bg-purple-900 border-purple-800 text-white'} shadow-lg`}>
                <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span className="font-bold text-xs">ذكر</span>
              </button>
              <button className={`flex-1 p-4 rounded-2xl flex items-center justify-between border ${inputBorder} ${inputBg} ${textLabel}`}>
                <div className={`w-4 h-4 rounded-full border-2 ${isDark ? 'border-purple-800' : 'border-purple-200'}`} />
                <span className="font-bold text-xs opacity-60">أنثى</span>
              </button>
           </div>
        </div>
      </div>

      {/* System Footer */}
      <div className={`p-6 rounded-[2rem] opacity-60 flex justify-between items-center ${isDark ? 'bg-black/20 text-white' : 'bg-white/20 text-purple-900'}`}>
         <div className="text-right">
           <span className="block text-[8px] font-black uppercase tracking-tighter opacity-50">تاريخ إنشاء حساب رنة</span>
           <span className="text-[10px] font-bold">15 نوفمبر 2024</span>
         </div>
         <CheckCircle2 size={16} />
      </div>

      {/* Actions */}
      <div className="pt-6">
        <button className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-purple-900/30 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-3">
          <Save size={20} />
          حفظ التعديلات
        </button>
      </div>

    </div>
  );
};

const FormInput = ({ label, value, mode, description, icon: Icon, type = "text" }: any) => {
  const isDark = mode === 'dark';
  const textLabel = isDark ? "text-purple-300" : "text-purple-500";
  const textValue = isDark ? "text-white" : "text-purple-900";
  const inputBg = isDark ? "bg-purple-950/40" : "bg-white/40";
  const inputBorder = isDark ? "border-white/5" : "border-white/20";

  return (
    <div className="space-y-1.5 group">
      <label className={`block text-[9px] font-black uppercase tracking-widest text-right mb-1 ${textLabel}`}>{label}</label>
      <div className={`relative rounded-2xl border ${inputBorder} ${inputBg} p-4 transition-all focus-within:ring-2 focus-within:ring-purple-500/20`}>
        {Icon && <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-purple-700' : 'text-purple-200'}`} size={16} />}
        <input 
          type={type}
          defaultValue={value}
          className={`w-full bg-transparent border-none focus:ring-0 text-right font-bold text-sm ${textValue} placeholder:opacity-30`}
          placeholder={label}
        />
      </div>
      {description && <p className={`text-[8px] italic text-right opacity-50 ${textLabel}`}>{description}</p>}
    </div>
  );
};

const FormTextarea = ({ label, value, mode }: any) => {
  const isDark = mode === 'dark';
  const textLabel = isDark ? "text-purple-300" : "text-purple-500";
  const textValue = isDark ? "text-white" : "text-purple-900";
  const inputBg = isDark ? "bg-purple-950/40" : "bg-white/40";
  const inputBorder = isDark ? "border-white/5" : "border-white/20";

  return (
    <div className="space-y-1.5">
      <label className={`block text-[9px] font-black uppercase tracking-widest text-right mb-1 ${textLabel}`}>{label}</label>
      <textarea 
        defaultValue={value}
        rows={3}
        className={`w-full rounded-2xl border ${inputBorder} ${inputBg} p-4 focus:ring-2 focus:ring-purple-500/20 text-right font-bold text-sm ${textValue} resize-none`}
      />
    </div>
  );
};
