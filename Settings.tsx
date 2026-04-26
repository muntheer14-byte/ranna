import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { storage, db, auth, updateUsername as updateFUsername, goOffline, goOnline } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User } from '../types';
import { 
  User as UserIcon, 
  Lock, 
  Bell, 
  Palette, 
  Database, 
  Globe, 
  ShieldCheck, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Camera,
  Star,
  Users,
  Shield,
  Phone,
  Cloud,
  Layers,
  HelpCircle,
  FolderLock,
  ExternalLink,
  Eye,
  CheckCircle2,
  PieChart,
  Folder,
  Battery,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  Monitor,
  Fingerprint,
  MessageSquare,
  Share2,
  Loader2,
  Sparkles,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';

type SettingsSectionId = 'main' | 'profile' | 'privacy' | 'blocked' | 'security' | 'notifications' | 'calls' | 'appearance' | 'backup' | 'data' | 'language' | 'devices' | 'help' | 'folders' | 'intelligence' | 'neural_shield' | 'purge' | 'focus_mode' | 'haptics' | 'theme_lab' | 'advanced_calls';

export const Settings = ({ onBack, user, onLogout, ...props }: { onBack: () => void, user: User, onLogout: () => void, [key: string]: any }) => {
  const { t, i18n } = useTranslation();

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black p-8">
        <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('loading_settings')}</span>
      </div>
    );
  }

  const isRTL = i18n.dir() === 'rtl';
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('main');
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    birthDate: user?.birthDate || '',
    jobPosition: user?.jobPosition || '',
    residence: user?.residence || '',
    graduationYear: user?.graduationYear || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  const updateProfileData = (updates: any) => {
    setProfileData(prev => ({ ...prev, ...updates }));
    setHasProfileChanges(true);
  };

  const [settings, setSettings] = useState(user?.settings || {
    privacy: { lastSeen: 'all', profilePhoto: 'all', readReceipts: true, showEmail: false, showPhone: true, showUsername: true },
    notifications: { doNotDisturb: false, showPreviews: true, soundEnabled: true, vibrateEnabled: true, ringtone: 'https://assets.mixkit.co/active_storage/sfx/1350/1350.wav' },
    calls: { ringtone: 'https://assets.mixkit.co/active_storage/sfx/1359/1359.wav', vibrate: true, lessData: false },
    intelligence: { smartReply: true, autoSummarize: true, spellCheck: false },
    neural: { blurLevel: 'mid', biometric: false, hideInNotifications: true },
    purge: { autoDelete: 'never', mediaDelete: false },
    focus: { zen: false, allowFrom: 'all' },
    haptics: { enabled: true, strength: 'light' },
    appearance: { color: '#9333ea', fontFamily: 'modern', glassEnabled: true },
    power: { mode: 'auto', disableAnimations: false },
    folders: [{ id: '1', name: 'العمل', icon: '💼' }, { id: '2', name: 'العائلة', icon: '🏠' }],
    devices: [
      { id: 'dev1', name: 'iPhone 15 Pro', location: 'الرياض، السعودية', status: 'نشط الآن' },
      { id: 'dev2', name: 'Chrome (Mac OS)', location: 'دبي، الإمارات', status: 'منذ ساعتين' }
    ],
    isPrivateAccount: false
  });
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSection = sessionStorage.getItem('settings_initial_section');
    if (savedSection) {
      setActiveSection(savedSection as SettingsSectionId);
      sessionStorage.removeItem('settings_initial_section');
    } else if (props.initialSection) {
      setActiveSection(props.initialSection as SettingsSectionId);
    }
  }, [props.initialSection]);

  const updateSettings = async (path: string, val: any) => {
    const keys = path.split('.');
    let newSettings: any = { ...settings };
    
    if (keys.length === 1) {
      newSettings[keys[0]] = val;
    } else {
      newSettings[keys[0]] = { ...newSettings[keys[0]] ?? {}, [keys[1]]: val };
    }
    
    setSettings(newSettings);
    
    // Apply immediate UI changes for specific settings
    if (path === 'appearance.color') {
       document.documentElement.style.setProperty('--ranna-accent', val);
    }
    if (path === 'appearance.fontFamily') {
      const fontMap: any = { 
        'modern': '"Outfit", sans-serif', 
        'classic': '"Cormorant Garamond", serif', 
        'hand': '"Cairo", sans-serif' 
      };
      document.documentElement.style.setProperty('--font-primary', fontMap[val] || fontMap.modern);
    }
    if (path === 'appearance.glassEnabled') {
      document.documentElement.classList.toggle('ranna-glass', val);
    }

    try {
      if (!user?.id) return;
      await updateDoc(doc(db, 'users', user.id), {
        settings: newSettings,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to save settings", e);
    }

    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      if (profileData.username !== user.username) {
        await updateFUsername(user.id, user.username || '', profileData.username);
      }
      await updateDoc(doc(db, 'users', user.id), {
        displayName: profileData.displayName,
        username: profileData.username,
        bio: profileData.bio,
        birthDate: profileData.birthDate,
        jobPosition: profileData.jobPosition,
        residence: profileData.residence,
        graduationYear: profileData.graduationYear
      });
      setHasProfileChanges(false);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    } catch (err) {
      console.error("Save error:", err);
      alert(t('save_error') || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { title: t('intelligence_neural'), items: [
      { id: 'intelligence', icon: Sparkles, label: t('ai_chat'), sub: t('ai_sub'), color: 'bg-indigo-600', onClick: () => setActiveSection('intelligence') },
      { id: 'neural_shield', icon: Shield, label: t('neural_shield'), sub: t('neural_shield_sub'), color: 'bg-indigo-900', onClick: () => setActiveSection('neural_shield') },
      { id: 'purge', icon: Trash2, label: t('self_destruct'), sub: t('self_destruct_sub'), color: 'bg-rose-600', onClick: () => setActiveSection('purge') },
      { id: 'focus_mode', icon: Zap, label: t('focus_mode'), sub: t('focus_mode_sub'), color: 'bg-emerald-600', onClick: () => setActiveSection('focus_mode') },
    ]},
    { title: t('interaction_haptics'), items: [
      { id: 'connectivity', icon: Wifi, label: t('connectivity_management'), sub: t('connectivity_sub'), color: 'bg-blue-500', onClick: () => setActiveSection('connectivity') },
      { id: 'notifications', icon: Bell, label: t('notifications_sounds'), sub: t('notifications_sub'), color: 'bg-rose-600', onClick: () => setActiveSection('notifications') },
      { id: 'haptics', icon: Fingerprint, label: t('haptics_sub'), sub: t('haptics_sub'), color: 'bg-orange-500', onClick: () => setActiveSection('haptics') },
      { id: 'theme_lab', icon: Star, label: t('theme_lab'), sub: t('theme_lab_sub'), color: 'bg-pink-600', onClick: () => setActiveSection('theme_lab') },
      { id: 'power_saving', icon: Battery, label: t('power_saving'), sub: t('power_saving_sub'), color: 'bg-emerald-500', onClick: () => setActiveSection('power_saving') },
    ]},
    { title: t('pro_edition'), items: [
      { id: 'folders', icon: Folder, label: t('chat_folders'), sub: t('folders_sub'), color: 'bg-indigo-600', onClick: () => setActiveSection('folders') },
      { id: 'devices', icon: Monitor, label: t('connected_devices'), sub: t('devices_sub'), color: 'bg-blue-600', onClick: () => setActiveSection('devices') },
      { id: 'data', icon: PieChart, label: t('data_storage'), sub: t('data_sub'), color: 'bg-sky-500', onClick: () => setActiveSection('data') },
      { id: 'advanced_calls', icon: Zap, label: t('advanced_calls'), sub: t('calls_quality_sub'), color: 'bg-purple-600', onClick: () => setActiveSection('advanced_calls') },
    ]},
    { title: t('basic_settings'), items: [
      { id: 'privacy', icon: Shield, label: t('privacy_security'), sub: t('privacy_sub'), color: 'bg-indigo-600', onClick: () => setActiveSection('privacy') },
      { id: 'blocked', icon: Users, label: t('blocked_users'), sub: t('blocked_sub'), color: 'bg-rose-500', onClick: () => setActiveSection('blocked') },
      { id: 'security', icon: Lock, label: t('security_password'), sub: t('security_sub'), color: 'bg-emerald-950/80', onClick: () => setActiveSection('security') },
      { id: 'notifications', icon: Bell, label: t('notifications_sounds'), sub: t('notifications_sounds_sub'), color: 'bg-rose-600', onClick: () => setActiveSection('notifications') },
      { id: 'calls', icon: Phone, label: t('calls_settings'), sub: t('calls_settings_sub'), color: 'bg-blue-600', onClick: () => setActiveSection('calls') },
    ]},
    { title: t('customization_data'), items: [
      { id: 'appearance', icon: Palette, label: t('appearance_themes'), sub: t('appearance_sub'), color: 'bg-emerald-500', onClick: () => setActiveSection('appearance') },
      { id: 'backup', icon: Cloud, label: t('backup_restore'), sub: t('backup_sub'), color: 'bg-indigo-600', onClick: () => setActiveSection('backup') },
      { id: 'data', icon: Database, label: t('data_storage'), sub: t('data_storage_sub'), color: 'bg-amber-600', onClick: () => setActiveSection('data') },
      { id: 'language', icon: Globe, label: t('system_language'), sub: i18n.language.toUpperCase(), color: 'bg-sky-500', onClick: () => setActiveSection('language') },
      { id: 'devices', icon: Layers, label: t('connected_devices'), sub: t('devices_active_sub'), color: 'bg-fuchsia-600', onClick: () => setActiveSection('devices') },
      { id: 'folders', icon: FolderLock, label: t('chat_folders'), sub: t('folders_organize_sub'), color: 'bg-indigo-700', onClick: () => alert(t('coming_soon')) },
      { id: 'help', icon: HelpCircle, label: t('help_support'), sub: t('help_sub'), color: 'bg-slate-700', onClick: () => setActiveSection('help') },
    ]}
  ];

  const handleShareApp = () => {
    // Shared App URL (Production/Invited View)
    const shareUrl = window.location.origin.replace('ais-dev', 'ais-pre');
    
    if (navigator.share) {
      navigator.share({ 
        title: t('pro_edition'), 
        text: t('invite_text') || 'انضم إلي في تطبيق رنة برو المتميز للدردشة والمكالمات المشفرة.', 
        url: shareUrl 
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(t('invitation_copied'));
    }
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (!user?.id) return;
      const storageRef = ref(storage, `avatars/${user.id}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.id), { photoURL: url });
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error("Avatar upload failed", err);
      alert("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const renderHeader = (title: string, onSave?: () => void) => (
    <div className="flex items-center gap-4 mb-6">
      <button onClick={() => setActiveSection('main')} className="p-2.5 glass rounded-xl text-slate-400 hover:text-purple-600 transition-all">
        {isRTL ? <ChevronLeft className="rotate-180" /> : <ChevronLeft />}
      </button>
      <h1 className="text-2xl font-serif italic text-purple-600 flex-1">{title}</h1>
      {onSave && (
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {isSaving ? t('saving') || 'جاري الحفظ...' : t('save') || 'حفظ'}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-ranna-bg">
      <AnimatePresence>
        {activeSection === 'profile' && hasProfileChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 inset-x-0 flex justify-center z-[130] pointer-events-none"
          >
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="pointer-events-auto bg-purple-600 text-white pl-6 pr-4 py-4 rounded-full shadow-2xl shadow-purple-500/50 flex items-center gap-4 group active:scale-90 transition-transform"
            >
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-purple-200">{t('update_identity')}</span>
                <span className="text-sm font-bold leading-none">{t('confirm_changes')}</span>
              </div>
              <div className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center relative overflow-hidden`}>
                {isSaving ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Star size={20} className="fill-white" />
                  </motion.div>
                )}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeSection === 'main' ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-y-auto no-scrollbar pb-40"
          >
            <div className="max-w-xl mx-auto w-full p-6 flex flex-col gap-6">
              <div className="flex justify-center mt-4">
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-500/20 px-6 py-2 rounded-full flex items-center gap-2 shadow-sm">
                  <span className="text-[10px] font-black text-purple-700 dark:text-purple-400">{t('elite_version')}</span>
                  <Star size={12} className="text-purple-500 fill-purple-500" />
                </div>
              </div>

              <div className="bg-ranna-bg rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center gap-6 border border-white/5">
                <div className="relative">
                  <div className="w-40 h-40 rounded-[3.5rem] bg-slate-200 overflow-hidden ring-8 ring-ranna-bg shadow-2xl relative">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Profile" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-white/5 active:scale-90 transition-transform disabled:opacity-50"
                  >
                    <Camera size={20} className="text-purple-700" />
                  </button>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{user.displayName}</h2>
                  <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-purple-500/10">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-500">@{user.username}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button 
                    onClick={() => {
                      if (confirm(t('confirm_logout') || 'هل أنت متأكد من تسجيل الخروج؟')) {
                        onLogout();
                      }
                    }} 
                    className="col-span-2 flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-900/10 text-rose-600 font-bold py-4 rounded-3xl active:scale-95 transition-all text-sm"
                  >
                    {t('logout')} <LogOut size={18} />
                  </button>
                  <button 
                    onClick={() => setActiveSection('profile')} 
                    className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-3xl shadow-lg active:scale-95 transition-all text-sm mt-2 flex items-center justify-center gap-2"
                  >
                    <UserIcon size={18} /> {t('edit_profile_full')}
                  </button>
                </div>
              </div>

              <button onClick={handleShareApp} className="bg-ranna-bg rounded-[2.5rem] p-6 shadow-sm border border-ranna-accent/10 flex items-center justify-between group">
                <div className="w-12 h-12 rounded-2xl bg-ranna-accent/10 text-ranna-accent flex items-center justify-center group-hover:bg-ranna-accent group-hover:text-white transition-all">
                  <Share2 size={24} />
                </div>
                <div className="text-right flex-1 px-4">
                  <h4 className="font-bold text-ranna-text">{t('invite_friend')}</h4>
                  <p className="text-[10px] text-slate-400">{t('share_ranna_hint')}</p>
                </div>
                <ChevronLeft size={18} className="text-slate-300" />
              </button>

              {menuItems.map((section, idx) => (
                <div key={`section-${idx}`} className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-6">{section.title}</h3>
                  <div className="bg-ranna-bg rounded-[3rem] overflow-hidden shadow-sm border border-ranna-accent/10">
                    {section.items.map((item, iIdx) => (
                      <button 
                        key={`${idx}-${item.id}-${iIdx}`} onClick={item.onClick}
                        className={`w-full p-6 flex items-center gap-6 hover:bg-ranna-accent/5 transition-colors active:bg-slate-100/50 ${iIdx !== section.items.length - 1 ? 'border-b border-ranna-accent/5' : ''}`}
                      >
                        <ChevronLeft size={16} className="text-slate-300" />
                        <div className="flex-1 text-right">
                          <h4 className="font-bold text-ranna-text text-sm">{item.label}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-[1.2rem] ${item.color} flex items-center justify-center text-white shadow-lg`}><item.icon size={22} /></div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="text-center py-8">
                 <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">{t('version')}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key={activeSection}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto no-scrollbar p-8 pb-40"
          >
            <div className="max-w-xl mx-auto w-full px-2">
              {activeSection === 'connectivity' && (
                <>
                  {renderHeader(t('connectivity_management'))}
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-500/10 rounded-[2rem] flex flex-col gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <Wifi size={24} />
                       </div>
                       <div className="text-right">
                         <h4 className="font-bold text-lg text-blue-900 dark:text-blue-400">{t('connectivity_management')}</h4>
                         <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{t('connectivity_desc')}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">{t('privacy_security')}</h4>
                      
                      <ToggleBox 
                        label={t('stealth_mode')} 
                        value={settings.privacy?.stealthMode ?? false} 
                        onChange={(v: boolean) => updateSettings('privacy.stealthMode', v)} 
                        description={t('stealth_mode_desc')} 
                        isRTL={isRTL}
                      />

                      <div className="h-px bg-slate-100 dark:bg-white/5 mx-4" />

                      <ToggleBox 
                        label={t('work_offline')} 
                        value={settings.connectivity?.workOffline ?? false} 
                        onChange={(v: boolean) => {
                          updateSettings('connectivity.workOffline', v);
                          if (v) goOffline(); else goOnline();
                        }} 
                        description={t('work_offline_desc')} 
                        isRTL={isRTL}
                      />
                    </div>

                    <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-[2rem] border border-rose-500/10">
                       <div className="flex gap-4">
                          <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                            {t('offline_warning')}
                          </p>
                       </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'profile' && (
                <>
                  {renderHeader(t('profile'))}
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-4 mb-6">
                       <div className="relative">
                         <div className="w-28 h-28 rounded-2xl bg-slate-200 overflow-hidden ring-4 ring-white shadow-xl">
                            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-full h-full object-cover" alt="Profile" />
                          </div>
                          <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Camera size={16} /></button>
                        </div>
                     </div>
                     <InputBox label={t('full_name')} value={profileData.displayName} onChange={(v: string) => updateProfileData({ displayName: v })} />
                     <InputBox label={t('username')} value={profileData.username} onChange={(v: string) => updateProfileData({ username: v.toLowerCase().trim() })} />
                     <InputBox label={t('bio')} value={profileData.bio} onChange={(v: string) => updateProfileData({ bio: v })} />
                     <InputBox label={t('birth_date')} type="date" value={profileData.birthDate} onChange={(v: string) => updateProfileData({ birthDate: v })} />
                     <InputBox label={t('job_position')} value={profileData.jobPosition} onChange={(v: string) => updateProfileData({ jobPosition: v })} />
                     <InputBox label={t('residence')} value={profileData.residence} onChange={(v: string) => updateProfileData({ residence: v })} />
                     <InputBox label={t('graduation_year')} value={profileData.graduationYear} onChange={(v: string) => updateProfileData({ graduationYear: v })} />
                     <div className="h-px bg-slate-100 dark:bg-white/10 my-2" />
                     <ToggleBox label={t('show_profile_all')} value={true} onChange={() => {}} isRTL={isRTL} />
                  </div>
                </>
              )}

              {activeSection === 'intelligence' && (
                <>
                  {renderHeader(t('ai_chat'))}
                  <div className="space-y-6">
                    <div className="p-6 bg-indigo-600/5 dark:bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles size={24} />
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-lg text-indigo-900 dark:text-indigo-400">{t('ai_engine')}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{t('ai_engine_desc')}</p>
                      </div>
                    </div>
                    <ToggleBox 
                      label={t('smart_replies')} 
                      value={settings.intelligence?.smartReply ?? true} 
                      onChange={(v: boolean) => updateSettings('intelligence.smartReply', v)} 
                      description={t('smart_replies_desc')} 
                      isRTL={isRTL}
                    />
                    <ToggleBox 
                      label={t('auto_summarize')} 
                      value={settings.intelligence?.autoSummarize ?? true} 
                      onChange={(v: boolean) => updateSettings('intelligence.autoSummarize', v)} 
                      description={t('auto_summarize_desc')} 
                      isRTL={isRTL}
                    />
                    <ToggleBox 
                      label={t('smart_spellcheck')} 
                      value={settings.intelligence?.spellCheck ?? false} 
                      onChange={(v: boolean) => updateSettings('intelligence.spellCheck', v)} 
                      description={t('smart_spellcheck_desc')} 
                      isRTL={isRTL}
                    />
                  </div>
                </>
              )}

              {activeSection === 'neural_shield' && (
                <>
                  {renderHeader(t('neural_shield'))}
                  <div className="space-y-6">
                     <div className="p-6 bg-purple-600/5 dark:bg-purple-500/5 border border-purple-500/10 rounded-[2rem] flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-lg">
                        <Lock size={24} strokeWidth={2.5} />
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-lg text-purple-900 dark:text-purple-400">{t('absolute_privacy')}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{t('neural_shield_desc')}</p>
                      </div>
                    </div>
                    <SelectBox 
                      label={t('blur_level')} 
                      value={settings.neural?.blurLevel ?? 'mid'} 
                      options={[{id:'low',l:t('blur_low')},{id:'mid',l:t('blur_mid')},{id:'high',l:t('blur_high')}]} 
                      onChange={(v: string) => updateSettings('neural.blurLevel', v)} 
                    />
                    <ToggleBox 
                      label={t('biometric_unlock')} 
                      value={settings.neural?.biometric ?? false} 
                      onChange={(v: boolean) => updateSettings('neural.biometric', v)} 
                      description={t('biometric_desc')} 
                      isRTL={isRTL}
                    />
                    <ToggleBox 
                      label={t('hide_in_notifications') || 'إخفاء من الإشعارات'} 
                      value={settings.neural?.hideInNotifications ?? true} 
                      onChange={(v: boolean) => updateSettings('neural.hideInNotifications', v)} 
                      description={t('hide_notif_desc')} 
                      isRTL={isRTL}
                    />
                  </div>
                </>
              )}

              {activeSection === 'purge' && (
                <>
                  {renderHeader(t('self_destruct'))}
                  <div className="space-y-6 text-right">
                    <p className="text-sm text-slate-500 font-medium px-4">{t('purge_desc')}</p>
                    <SelectBox 
                      label={t('auto_delete_msgs')} 
                      value={settings.purge?.autoDelete ?? 'never'} 
                      options={[{id:'1h',l:t('purge_1h')},{id:'24h',l:t('purge_24h')},{id:'1w',l:t('purge_1w')},{id:'never',l:t('purge_never')}]} 
                      onChange={(v: string) => updateSettings('purge.autoDelete', v)} 
                    />
                    <ToggleBox 
                      label={t('delete_media')} 
                      value={settings.purge?.mediaDelete ?? false} 
                      onChange={(v: boolean) => updateSettings('purge.mediaDelete', v)} 
                      description={t('delete_media_desc')} 
                      isRTL={isRTL}
                    />
                  </div>
                </>
              )}

              {activeSection === 'focus_mode' && (
                <>
                  {renderHeader(t('focus_mode'))}
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-600/5 border border-emerald-500/10 rounded-[2rem] flex flex-col gap-4">
                      <Zap className="text-emerald-600" size={32} />
                      <div className="text-right">
                        <h4 className="font-bold text-lg text-emerald-900">{t('digital_calm')}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{t('focus_desc')}</p>
                      </div>
                    </div>
                    <ToggleBox 
                      label={t('smart_zen_mode')} 
                      value={settings.focus?.zen ?? false} 
                      onChange={(v: boolean) => updateSettings('focus.zen', v)} 
                      description={t('zen_desc')} 
                      isRTL={isRTL}
                    />
                    <SelectBox 
                      label={t('allow_notif_from')} 
                      value={settings.focus?.allowFrom ?? 'all'} 
                      options={[{id:'all',l:t('allow_all')},{id:'contacts',l:t('allow_contacts')},{id:'fav',l:t('allow_favs')}]} 
                      onChange={(v: string) => updateSettings('focus.allowFrom', v)} 
                    />
                  </div>
                </>
              )}

              {activeSection === 'haptics' && (
                <>
                  {renderHeader(t('haptics_sub'))}
                  <div className="space-y-6">
                    <ToggleBox 
                      label={t('haptic_vibration')} 
                      value={settings.haptics?.enabled ?? true} 
                      onChange={(v: boolean) => updateSettings('haptics.enabled', v)} 
                      description={t('haptic_desc')} 
                      isRTL={isRTL}
                    />
                    <SelectBox 
                      label={t('vibration_strength')} 
                      value={settings.haptics?.strength ?? 'light'} 
                      options={[{id:'light',l:t('vib_light')},{id:'mid',l:t('vib_mid')},{id:'heavy',l:t('vib_high')}]} 
                      onChange={(v: string) => updateSettings('haptics.strength', v)} 
                    />
                  </div>
                </>
              )}

              {activeSection === 'theme_lab' && (
                <>
                  {renderHeader(t('theme_lab'))}
                  <div className="space-y-6">
                    <div className="p-6 bg-pink-600/5 border border-pink-500/10 rounded-[2rem] flex flex-col gap-4">
                      <Star className="text-pink-600" size={32} />
                      <div className="text-right">
                        <h4 className="font-bold text-lg text-pink-900">{t('design_identity')}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{t('theme_desc')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 px-4 justify-center">
                      {['#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#000000', '#9333ea', '#db2777'].map(c => (
                        <button 
                          key={c} 
                          style={{ backgroundColor: c }} 
                          onClick={() => updateSettings('appearance.color', c)}
                          className={`w-10 h-10 rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center ${settings.appearance?.color === c ? 'ring-4 ring-white' : ''}`} 
                        >
                          {settings.appearance?.color === c && <CheckCircle2 size={16} className="text-white" />}
                        </button>
                      ))}
                    </div>
                    <SelectBox 
                      label={t('font_type')} 
                      value={settings.appearance?.fontFamily ?? 'modern'} 
                      options={[{id:'modern',l:t('font_modern')},{id:'classic',l:t('font_classic')},{id:'hand',l:t('font_hand')}]} 
                      onChange={(v: string) => updateSettings('appearance.fontFamily', v)} 
                    />
                    <ToggleBox 
                      label={t('glass_ui')} 
                      value={settings.appearance?.glassEnabled ?? true} 
                      onChange={(v: boolean) => updateSettings('appearance.glassEnabled', v)} 
                      description={t('glass_desc')} 
                      isRTL={isRTL}
                    />
                  </div>
                </>
              )}

              {activeSection === 'folders' && (
                <>
                  {renderHeader(t('chat_folders'))}
                  <div className="space-y-6">
                    <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] flex flex-col gap-2">
                       <Folder className="text-indigo-600" size={32} />
                       <h4 className="font-bold text-lg text-indigo-900">{t('organize_everything')}</h4>
                       <p className="text-xs text-slate-500 font-medium">{t('folders_desc')}</p>
                    </div>
                    <div className="space-y-3">
                      {settings.folders?.map((f: any) => (
                        <div key={f.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{f.icon}</span>
                            <span className="font-bold text-sm text-slate-700">{f.name}</span>
                          </div>
                          <ChevronLeft size={16} className="text-slate-300" />
                        </div>
                      ))}
                      <button className="w-full p-4 rounded-2xl border-2 border-dashed border-indigo-500/20 text-indigo-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
                        <Star size={16} /> {t('add_folder')}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'devices' && (
                <>
                  {renderHeader(t('connected_devices'))}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      {settings.devices?.map((d: any) => (
                        <div key={d.id} className="glass p-5 rounded-[2rem] flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${d.status.includes('نشط') ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <Monitor size={24} />
                          </div>
                          <div className="flex-1 text-right">
                            <h5 className="font-bold text-sm text-slate-800">{d.name}</h5>
                            <p className="text-[10px] text-slate-400 font-medium">{d.location} • {d.status === 'نشط الآن' ? t('active_now') : d.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full p-4 text-rose-600 font-bold text-xs bg-rose-50 rounded-2xl">
                      {t('terminate_all_sessions')}
                    </button>
                  </div>
                </>
              )}

              {activeSection === 'power_saving' && (
                <>
                  {renderHeader(t('power_saving'))}
                  <div className="space-y-6">
                    <SelectBox 
                      label={t('battery_saving_mode')} 
                      value={settings.power?.mode ?? 'auto'} 
                      options={[{id:'always',l:t('battery_always')},{id:'auto',l:t('battery_auto')},{id:'never',l:t('battery_never')}]} 
                      onChange={(v: string) => updateSettings('power.mode', v)} 
                    />
                    <ToggleBox 
                      label={t('disable_immersive_animations')} 
                      value={settings.power?.disableAnimations ?? false} 
                      onChange={(v: boolean) => updateSettings('power.disableAnimations', v)} 
                      description={t('disable_animations_desc')} 
                      isRTL={isRTL}
                    />
                  </div>
                </>
              )}

              {activeSection === 'data' && (
                <>
                  {renderHeader(t('data_storage'))}
                  <div className="space-y-6">
                    <div className="glass p-6 rounded-[2rem] text-center space-y-2">
                       <PieChart className="mx-auto text-sky-500" size={32} />
                       <h4 className="font-bold text-slate-800">{t('storage_analysis')}</h4>
                       <p className="text-xl font-black text-indigo-600">1.2 GB</p>
                       <button className="px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold">{t('clear_cache')}</button>
                    </div>
                    <ToggleBox label={t('auto_load_media')} value={true} onChange={() => {}} isRTL={isRTL} />
                    <SelectBox 
                      label={t('upload_quality')} 
                      value={'high'} 
                      options={[{id:'low',l:t('data_save')},{id:'high',l:t('high_def')}]} 
                      onChange={() => {}} 
                    />
                  </div>
                </>
              )}

              {activeSection === 'blocked' && (
                <>
                  {renderHeader(t('blocked_users'))}
                  <div className="space-y-4">
                    <div className="text-center py-20 opacity-30">
                       <Shield size={64} strokeWidth={1} className="mx-auto mb-4" />
                       <p className="font-serif italic">{t('blocked_empty')}</p>
                    </div>
                    <ActionButton icon={UserIcon} label={t('block_new_user')} onClick={() => setActiveSection('main')} />
                  </div>
                </>
              )}

              {activeSection === 'appearance' && (
                <>
                  {renderHeader(t('appearance_themes'))}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 mb-2">{t('accent_label')}</h4>
                    <div className="flex flex-wrap gap-3 px-4 justify-center">
                      {['#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#000000', '#9333ea', '#db2777'].map(c => (
                        <button 
                          key={c} 
                          style={{ backgroundColor: c }} 
                          onClick={() => updateSettings('appearance.color', c)}
                          className={`w-10 h-10 rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center ${settings.appearance?.color === c ? 'ring-4 ring-white' : ''}`} 
                        >
                          {settings.appearance?.color === c && <CheckCircle2 size={16} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'privacy' && (
                <>
                  {renderHeader(t('privacy'))}
                  <div className="space-y-6">
                    <ToggleBox 
                      label="وضع التخفي (Ghost Mode)" 
                      value={settings.privacy?.stealthMode ?? false} 
                      onChange={(v: boolean) => updateSettings('privacy.stealthMode', v)} 
                      description="ستظهر دائماً كـ 'غير متصل' للآخرين" 
                      isRTL={isRTL}
                    />
                    <SelectBox label="آخر ظهور" value={settings.privacy?.lastSeen ?? 'all'} options={[{id:'all',l:'الكل'},{id:'contacts',l:'جهات الاتصال'},{id:'none',l:'لا أحد'}]} onChange={(v: string) => updateSettings('privacy.lastSeen', v)} />
                    <SelectBox label="صورة الملف" value={settings.privacy?.profilePhoto ?? 'all'} options={[{id:'all',l:'الكل'},{id:'contacts',l:'جهات الاتصال'},{id:'none',l:'لا أحد'}]} onChange={(v: string) => updateSettings('privacy.profilePhoto', v)} />
                    <ToggleBox label="إيصالات القراءة" value={settings.privacy?.readReceipts ?? true} onChange={(v: boolean) => updateSettings('privacy.readReceipts', v)} isRTL={isRTL} />
                    <ToggleBox label="إظهار البريد" value={settings.privacy?.showEmail ?? false} onChange={(v: boolean) => updateSettings('privacy.showEmail', v)} isRTL={isRTL} />
                    <ToggleBox label="إظهار الهاتف" value={settings.privacy?.showPhone ?? true} onChange={(v: boolean) => updateSettings('privacy.showPhone', v)} isRTL={isRTL} />
                    <ToggleBox label="إظهار اسم المستخدم" value={settings.privacy?.showUsername ?? true} onChange={(v: boolean) => updateSettings('privacy.showUsername', v)} isRTL={isRTL} />
                    <ToggleBox label="حساب خاص" value={settings.isPrivateAccount ?? false} onChange={(v: boolean) => updateSettings('isPrivateAccount', v)} description="لن يرى محتواك إلا المتابعون المعتمدون" isRTL={isRTL} />
                  </div>
                </>
              )}

              {activeSection === 'notifications' && (
                <>
                  {renderHeader(t('notifications'))}
                  <div className="space-y-6">
                      <ToggleBox label="عدم الإزعاج" value={settings.notifications?.doNotDisturb ?? false} onChange={(v: boolean) => updateSettings('notifications.doNotDisturb', v)} isRTL={isRTL} />
                    <ToggleBox label="إظهار المعاينات" value={settings.notifications?.showPreviews ?? true} onChange={(v: boolean) => updateSettings('notifications.showPreviews', v)} isRTL={isRTL} />
                    <ToggleBox label="الأصوات" value={settings.notifications?.soundEnabled ?? true} onChange={(v: boolean) => updateSettings('notifications.soundEnabled', v)} isRTL={isRTL} />
                    <ToggleBox label="الاهتزاز" value={settings.notifications?.vibrateEnabled ?? true} onChange={(v: boolean) => updateSettings('notifications.vibrateEnabled', v)} isRTL={isRTL} />
                    
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">نغمة الرسائل</h4>
                      <div className="space-y-2">
                        {[
                          { id: 'https://assets.mixkit.co/active_storage/sfx/2358/2358.wav', label: 'رنة كلاسيكية' },
                          { id: 'https://assets.mixkit.co/active_storage/sfx/1350/1350.wav', label: 'تنبيه ناعم' },
                          { id: 'https://cdn.pixabay.com/audio/2022/03/15/audio_735c026ca3.mp3', label: 'إيقاع عصري' }
                        ].map((tone) => (
                          <button 
                            key={tone.id}
                            onClick={() => {
                              updateSettings('notifications.ringtone', tone.id);
                              new Audio(tone.id).play().catch(() => {});
                            }}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${settings.notifications?.ringtone === tone.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600'}`}
                          >
                             <span className="font-bold text-xs">{tone.label}</span>
                             {settings.notifications?.ringtone === tone.id && <CheckCircle2 size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'calls' && (
                <>
                  {renderHeader(t('calls_settings'))}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">نغمة الرنين</h4>
                      <div className="space-y-2">
                        {[
                          { id: 'https://assets.mixkit.co/active_storage/sfx/1359/1359.wav', label: 'الافتراضية' },
                          { id: 'https://cdn.pixabay.com/audio/2021/11/25/audio_91b1385499.mp3', label: 'رنة قديمة' },
                          { id: 'https://cdn.pixabay.com/audio/2022/03/24/audio_349d747d7c.mp3', label: 'نغمة هادئة' }
                        ].map((tone) => (
                          <button 
                            key={tone.id}
                            onClick={() => {
                              updateSettings('calls.ringtone', tone.id);
                              new Audio(tone.id).play().catch(() => {});
                            }}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${settings.calls?.ringtone === tone.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600'}`}
                          >
                             <span className="font-bold text-xs">{tone.label}</span>
                             {settings.calls?.ringtone === tone.id && <CheckCircle2 size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ToggleBox label="الاهتزاز" value={settings.calls?.vibrate ?? true} onChange={(v: boolean) => updateSettings('calls.vibrate', v)} isRTL={isRTL} />
                    <ToggleBox label="استخدام بيانات أقل" value={settings.calls?.lessData ?? false} onChange={(v: boolean) => updateSettings('calls.lessData', v)} isRTL={isRTL} />
                  </div>
                </>
              )}

              {activeSection === 'backup' && (
                <>
                  {renderHeader(t('backup_restore'))}
                  <div className="grid grid-cols-1 gap-4">
                    <ActionButton icon={Download} label="تصدير رسائلي" onClick={() => alert('Exporting...')} />
                    <ActionButton icon={Cloud} label="نسخ احتياطي كامل" onClick={() => alert('Full Backup Started')} />
                    <ActionButton icon={Upload} label="استعادة نسخة" onClick={() => alert('Select backup file')} />
                    <ActionButton icon={Trash2} label="مسح جميع المحادثات" danger onClick={() => {
                      if (confirm('هل أنت متأكد من مسح جميع المحادثات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                         alert('تم مسح المحادثات');
                      }
                    }} />
                  </div>
                </>
              )}

              {activeSection === 'security' && (
                <>
                  {renderHeader(t('security_password'))}
                  <div className="space-y-4">
                    <div className="p-6 bg-emerald-600/5 border border-emerald-500/10 rounded-[2rem] flex flex-col gap-4">
                       <Lock size={32} className="text-emerald-600" />
                       <div className="text-right">
                         <h4 className="font-bold text-lg text-emerald-900">أمان التطبيق</h4>
                         <p className="text-xs text-slate-500 font-medium">قم بتعيين رمز مرور لحماية محادثاتك من المتطفلين عند فتح التطبيق.</p>
                       </div>
                    </div>
                    
                    {localStorage.getItem('app_lock_pin') ? (
                      <ActionButton 
                        icon={Trash2} 
                        label="إزالة قفل التطبيق" 
                        danger 
                        onClick={() => {
                          if (confirm('هل أنت متأكد من إزالة قفل التطبيق؟')) {
                            localStorage.removeItem('app_lock_pin');
                            window.location.reload();
                          }
                        }} 
                      />
                    ) : (
                      <ActionButton 
                        icon={Lock} 
                        label="تعيين رمز مرور جديد" 
                        onClick={() => {
                          const p = prompt('أدخل رمز مرور جديد (4 أرقام):');
                          if (p && /^\d{4}$/.test(p)) {
                            localStorage.setItem('app_lock_pin', p);
                            alert('تم تعيين رمز المرور بنجاح!');
                            window.location.reload();
                          } else if (p) {
                            alert('يجب أن يتكون الرمز من 4 أرقام فقط.');
                          }
                        }} 
                      />
                    )}
                    
                    <div className="h-px bg-slate-100 dark:bg-white/10 my-4" />
                    
                    <ActionButton icon={ShieldCheck} label="التحقق بخطوتين (2FA)" onClick={() => alert('هذه الميزة تتطلب إعداد البريد الإلكتروني أولاً.')} />
                  </div>
                </>
              )}

              {activeSection === 'advanced_calls' && (
                <>
                  {renderHeader("جودة المكالمات وتحسين النطاق")}
                  <div className="space-y-6">
                    <div className="p-6 bg-purple-600/5 border border-purple-500/10 rounded-[2rem] flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        <Zap size={24} />
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-lg text-purple-900">محرك الاتصال المتقدم</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">تقنيات تجاوز الحجب وتحسين جودة الصوت في ظروف الشبكة الصعبة.</p>
                      </div>
                    </div>
                    
                    <ToggleBox 
                      label="استخدام خوادم TURN" 
                      value={true} 
                      onChange={() => {}} 
                      description="يسمح بالاتصال عندما تكون الشبكات محمية بجدران نارية قوية" 
                      isRTL={isRTL}
                    />
                    
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl space-y-2">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 font-mono">الخوادم النشطة</h5>
                       <div className="flex items-center justify-between px-2">
                          <span className="text-xs font-bold text-slate-600">STUN (Google Relay)</span>
                          <div className="flex items-center gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[9px] font-bold text-emerald-600">متصل</span>
                          </div>
                       </div>
                    </div>

                    <SelectBox 
                      label="جودة تشفير الصوت" 
                      value={'opus_high'} 
                      options={[{id:'opus_low',l:'توفير بيانات'},{id:'opus_high',l:'Opus High Definition'}]} 
                      onChange={() => {}} 
                    />
                  </div>
                </>
              )}

              {activeSection === 'language' && (
                <>
                  {renderHeader("فهارس اللغات والترجمة")}
                  <div className="space-y-6 px-4">
                    <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                       <Globe className="text-blue-600 mb-2" size={24} />
                       <h4 className="text-sm font-bold text-blue-900">ترجمة واصل الفورية</h4>
                       <p className="text-[10px] text-slate-500 leading-relaxed">يدعم رنة الآن أكثر من 12 فهرس لغوي مع ترجمة تلقائية مدعومة بذكاء Gemini.</p>
                    </div>

                    <div className="space-y-2">
                      {[
                        { id: 'ar', name: 'العربية (Index Main)', progress: 100 },
                        { id: 'ku', name: 'Kurdî (Sorani/Badini)', progress: 100 },
                        { id: 'en', name: 'English (US & UK)', progress: 100 },
                        { id: 'fa', name: 'فارسی (Persian)', progress: 40 },
                        { id: 'tr', name: 'Türkçe', progress: 85 }
                      ].map(lng => (
                        <button 
                          key={lng.id} 
                          onClick={() => { 
                            i18n.changeLanguage(lng.id); 
                            if(navigator.vibrate) navigator.vibrate(50); 
                          }} 
                          className={`p-6 rounded-[2rem] flex items-center justify-between transition-all duration-300 border-2 ${
                            i18n.language === lng.id 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-900/20' 
                              : 'glass border-transparent hover:border-blue-500/20 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                             <span className="text-sm font-bold tracking-tight">{lng.name}</span>
                          </div>
                          {lng.progress < 100 ? (
                            <span className="text-[8px] font-black text-rose-500 px-2 py-0.5 bg-rose-50 rounded-md">ناقص ({lng.progress}%)</span>
                          ) : (
                            <CheckCircle2 size={16} className={i18n.language === lng.id ? 'text-white' : 'text-emerald-500'} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'help' && (
                <>
                  {renderHeader('المساعدة')}
                  <div className="space-y-4">
                    <ActionButton icon={HelpCircle} label="الأسئلة الشائعة" onClick={() => window.open('#faq')} />
                    <ActionButton icon={ShieldCheck} label="سياسة الخصوصية" onClick={() => window.open('#privacy')} />
                    <ActionButton icon={ExternalLink} label="الشروط والأحكام" onClick={() => window.open('#terms')} />
                    <ActionButton icon={MessageSquare} label="الدعم الفني" onClick={() => window.open('#support')} />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputBox = ({ label, value, onChange }: any) => (
  <div className="glass p-4 rounded-2xl space-y-1.5">
    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">{label}</span>
    <input 
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full bg-transparent border-none focus:ring-0 font-bold text-right text-ranna-text text-sm"
    />
  </div>
);

const ToggleBox = ({ label, value, onChange, description, isRTL }: any) => (
  <div className="glass p-4 rounded-2xl flex flex-col gap-1.5 cursor-pointer" onClick={() => onChange(!value)}>
    <div className="flex items-center justify-between">
    <div className={`w-10 h-6 rounded-full transition-all relative ${value ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-slate-300'}`} onClick={(e) => { e.stopPropagation(); onChange(!value); }}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? (isRTL ? 'left-1' : 'right-1') : (isRTL ? 'left-5' : 'right-5')}`} />
      </div>
      <span className="font-bold text-ranna-text text-sm">{label}</span>
    </div>
    {description && <p className="text-[10px] text-slate-400 text-right leading-relaxed font-medium">{description}</p>}
  </div>
);

const SelectBox = ({ label, value, options, onChange }: any) => (
  <div className="glass p-4 rounded-2xl">
    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest text-right mb-3">{label}</span>
    <div className="flex gap-2">
      {options.map((opt: any) => (
        <button key={opt.id} onClick={() => onChange(opt.id)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${value === opt.id ? 'bg-ranna-accent text-white shadow-lg' : 'bg-ranna-bg/50 text-slate-400'}`}>
          {opt.l}
        </button>
      ))}
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick, danger }: any) => (
  <button onClick={onClick} className={`w-full p-4 flex items-center justify-between glass rounded-2xl group transition-all hover:scale-[1.01] active:scale-[0.99] ${danger ? 'text-rose-500' : ''}`}>
    <ChevronLeft size={16} className={`${danger ? 'text-rose-300' : 'text-slate-300'}`} />
    <span className="font-bold text-sm">{label}</span>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-500' : 'bg-ranna-accent/10 text-ranna-accent'}`}>
      <Icon size={16} />
    </div>
  </button>
);
