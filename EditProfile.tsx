import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Save, 
  User as UserIcon, 
  Info, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Calendar, 
  Heart, 
  Phone, 
  Link as LinkIcon,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COUNTRY_CODES } from '../constants';

interface EditProfileProps {
  user: User;
  onBack: () => void;
  onUpdate: (updated: User) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, onBack, onUpdate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  // Find initial country code
  const initialCountry = COUNTRY_CODES.find(c => user?.phoneNumber?.startsWith(c.code)) || COUNTRY_CODES[0];
  const initialPhone = user?.phoneNumber?.replace(initialCountry.code, '') || '';

  const [formData, setFormData] = useState<Partial<User>>({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    phoneNumber: user?.phoneNumber || '',
    workplace: user?.workplace || '',
    jobPosition: user?.jobPosition || '',
    education: user?.education || '',
    location: user?.location || '',
    residence: user?.residence || '',
    birthDate: user?.birthDate || '',
    graduationYear: user?.graduationYear || '',
    maritalStatus: user?.maritalStatus || 'Single',
    gender: user?.gender || 'Male'
  });

  const [phoneValue, setPhoneValue] = useState(initialPhone);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateFormData = (updates: Partial<User>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const fullPhone = `${selectedCountry.code}${phoneValue.trim()}`;
      await updateDoc(doc(db, 'users', user.id), {
        ...formData,
        phoneNumber: fullPhone,
        updatedAt: new Date()
      });
      onUpdate({ ...user, ...formData, phoneNumber: fullPhone } as User);
      setHasChanges(false);
      // Optional: don't auto-back to show success? No, onBack is fine if user expects it.
      onBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: isRTL ? '-100%' : '100%' }}
      animate={{ x: 0 }}
      exit={{ x: isRTL ? '-100%' : '100%' }}
      className="fixed inset-0 z-[110] bg-[#f8fafc] dark:bg-black flex flex-col h-screen overflow-hidden"
    >
      {/* Header */}
      <header className="shrink-0 p-6 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-[120] border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 glass rounded-2xl hover:bg-slate-50 transition-all text-slate-500">
            {isRTL ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          </button>
          <h1 className="text-xl font-bold font-serif italic text-purple-600 dark:text-purple-400">ملف رنة الشخصي</h1>
        </div>
      </header>

      {/* Floating Save Pill */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 inset-x-0 flex justify-center z-[130] pointer-events-none"
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="pointer-events-auto bg-indigo-600 text-white pl-6 pr-4 py-4 rounded-full shadow-2xl shadow-indigo-500/50 flex items-center gap-4 group active:scale-90 transition-transform"
            >
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-indigo-200">تزامن البيانات</span>
                <span className="text-sm font-bold leading-none">حفظ التغييرات الآن</span>
              </div>
              <div className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center relative overflow-hidden`}>
                {isSaving ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Save size={20} />
                  </motion.div>
                )}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Cover & Profile Images */}
        <div className="relative mb-20">
          <div className="h-48 w-full bg-gradient-to-br from-indigo-900 to-indigo-700 relative overflow-hidden">
            {user.backgroundPhotoURL ? (
              <img src={user.backgroundPhotoURL} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-10 dot-pattern" />
            )}
            <button className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all shadow-xl">
              <Camera size={20} />
            </button>
          </div>

          <div className="absolute -bottom-16 left-6 ring-8 ring-[#f8fafc] dark:ring-black rounded-[2.5rem] shadow-2xl relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-200 overflow-hidden">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                className="w-full h-full object-cover" 
              />
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">
              <Camera size={20} />
            </button>
          </div>
        </div>

        {/* Sections Wrapper */}
        <div className="px-6 space-y-6">
          {/* Main Section */}
          <SectionCard title="المعلومات الأساسية" icon={UserIcon}>
            <FormInput 
              label="الاسم الكامل" 
              value={formData.displayName} 
              onChange={(v: string) => updateFormData({ displayName: v })} 
            />
            <FormInput 
              label="اللقب / العائلة" 
              value={formData.username} 
              onChange={(v: string) => updateFormData({ username: v.toLowerCase().replace(/\s/g, '') })} 
              description="سيتم استخدامه كمعرف فريد لحسابك"
            />
            <FormTextarea 
              label="السيرة الذاتية (Bio)" 
              value={formData.bio} 
              onChange={(v: string) => updateFormData({ bio: v })} 
              placeholder="اكتب شيئاً عن نفسك..."
            />
          </SectionCard>

          {/* Contact Section */}
          <SectionCard title="معلومات الاتصال" icon={Phone}>
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">رقم الهاتف</label>
              <div className="flex gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowCountryCodes(!showCountryCodes)}
                    className="h-full px-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center gap-2 border border-slate-100 dark:border-white/5 hover:border-emerald-500/20 transition-all outline-none"
                  >
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span className="text-sm font-bold">{selectedCountry.code}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {showCountryCodes && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-72 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 z-[210] border border-slate-100 dark:border-white/5 no-scrollbar"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <button
                            key={c.code + c.country}
                            onClick={() => {
                              setSelectedCountry(c);
                              setShowCountryCodes(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-right"
                          >
                            <span className="text-xl">{c.flag}</span>
                            <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                            <span className="text-xs font-black text-emerald-600">{c.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex-1 group">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                   <input 
                     value={phoneValue} 
                     onChange={(e) => {
                       setPhoneValue(e.target.value.replace(/\D/g, ''));
                       setHasChanges(true);
                     }}
                     className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm" 
                     placeholder="5xxxxxxxx"
                   />
                </div>
              </div>
            </div>

            <FormInput 
              label="الروابط الاجتماعية" 
              icon={LinkIcon}
              value={''} 
              placeholder="https://example.com"
              onChange={(v: string) => {}} 
            />
          </SectionCard>

          {/* Career & Education */}
          <SectionCard title="المسار المهني والتعليمي" icon={Briefcase}>
            <FormInput 
              label="مكان العمل / الشركة" 
              icon={Briefcase}
              value={formData.workplace} 
              onChange={(v: string) => updateFormData({ workplace: v })} 
            />
            <FormInput 
              label="المسمى الوظيفي" 
              icon={Briefcase}
              value={formData.jobPosition} 
              onChange={(v: string) => updateFormData({ jobPosition: v })} 
            />
            <FormInput 
              label="التعليم / الجامعة" 
              icon={GraduationCap}
              value={formData.education} 
              onChange={(v: string) => updateFormData({ education: v })} 
            />
            <FormInput 
              label="سنة التخرج" 
              icon={Calendar}
              value={formData.graduationYear} 
              onChange={(v: string) => updateFormData({ graduationYear: v })} 
              placeholder="مثال: 2024"
            />
          </SectionCard>

          {/* Personal Info */}
          <SectionCard title="المعلومات الشخصية" icon={Info}>
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                label="المدينة الحالية" 
                icon={MapPin}
                value={formData.location} 
                onChange={(v: string) => updateFormData({ location: v })} 
              />
              <FormInput 
                label="مكان الإقامة" 
                icon={MapPin}
                value={formData.residence} 
                onChange={(v: string) => updateFormData({ residence: v })} 
              />
            </div>
            
            <FormInput 
              label="تاريخ الميلاد" 
              type="date"
              icon={Calendar}
              value={formData.birthDate} 
              onChange={(v: string) => updateFormData({ birthDate: v })} 
            />

            <FormSelect 
              label="الحالة الاجتماعية" 
              icon={Heart}
              value={formData.maritalStatus}
              options={[
                { value: 'Single', label: 'أعزب' },
                { value: 'Married', label: 'متزوج' },
                { value: 'Engaged', label: 'خاطب' },
                { value: 'Separated', label: 'منفصل' }
              ]}
              onChange={(v: string) => updateFormData({ maritalStatus: v })}
            />

            <div className="space-y-4">
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">الجنس</span>
              <div className="flex gap-4">
                <RadioGroup 
                  label="ذكر" 
                  value="Male" 
                  selected={formData.gender === 'Male'} 
                  onSelect={() => updateFormData({ gender: 'Male' } as any)} 
                />
                <RadioGroup 
                  label="أنثى" 
                  value="Female" 
                  selected={formData.gender === 'Female'} 
                  onSelect={() => updateFormData({ gender: 'Female' } as any)} 
                />
              </div>
            </div>
          </SectionCard>

          {/* System Info */}
          <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-3xl opacity-60">
            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">تاريخ إنشاء حساب رنة</span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '2024 نوفمبر 15'}
            </span>
          </div>

          <div className="h-20" />
        </div>
      </div>


    </motion.div>
  );
};

// Helper Components
const SectionCard = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-white/5 flex flex-col gap-5">
    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-white/5 pb-4">
      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-tighter">{title}</h3>
    </div>
    {children}
  </div>
);

const FormInput = ({ label, value, onChange, placeholder, type = "text", description, icon: Icon }: any) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />}
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm ${Icon ? 'pl-12' : ''}`}
      />
    </div>
    {description && <p className="text-[10px] text-slate-400 italic text-right">{description}</p>}
  </div>
);

const FormTextarea = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">{label}</label>
    <textarea 
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm resize-none"
    />
  </div>
);

const FormSelect = ({ label, value, options, onChange, icon: Icon }: any) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />}
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm appearance-none ${Icon ? 'pl-12' : ''}`}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
);

const RadioGroup = ({ label, selected, onSelect }: any) => (
  <button 
    onClick={onSelect}
    className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all ${selected ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}
  >
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-white' : 'border-slate-300'}`}>
      {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
    </div>
    <span className="font-bold text-sm uppercase tracking-widest">{label}</span>
  </button>
);
