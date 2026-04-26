import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  Maximize2, 
  ChevronDown, 
  ShieldCheck, 
  MessageSquare, 
  UserPlus,
  Volume2,
  VolumeX,
  Volume1,
  Monitor,
  Bluetooth,
  Camera,
  Signal,
  Wifi,
  Radio,
  CircleStop,
  Disc,
  Clock3,
  Flame,
  Zap,
  History as HistoryIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { User, Call } from '../types';

import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CallOverlayProps {
  call: Call;
  currentUser: User;
  remoteUser: User;
  onEnd: (status?: string) => void;
  onAccept?: () => void;
}

const servers: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.voxgratia.org' },
    // TURN server for restricted networks (Stone & Turn)
    {
      urls: import.meta.env.VITE_TURN_URL || 'turn:openrelay.metered.ca:80',
      username: import.meta.env.VITE_TURN_USER || 'openrelayproject',
      credential: import.meta.env.VITE_TURN_PASS || 'openrelayproject',
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
};

const mediaConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
  },
  video: {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user'
  }
};

export const CallOverlay: React.FC<CallOverlayProps> = ({
  call,
  currentUser,
  remoteUser,
  onEnd,
  onAccept
}) => {
  const { t } = useTranslation();
  const [audioLevel, setAudioLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(call.type === 'voice');
  const [speakerMode, setSpeakerMode] = useState<'speaker' | 'earpiece' | 'bluetooth'>('speaker');
  
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [signalStrength, setSignalStrength] = useState(4); // 1-5
  const [recordingTime, setRecordingTime] = useState(0);
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [outgoingTone, setOutgoingTone] = useState<HTMLAudioElement | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

  const isCaller = currentUser?.id === call.callerId;

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPhase, setConnectingPhase] = useState('initializing'); // 'initializing', 'handshake', 'optimizing', 'securing'

  useEffect(() => {
    if (isConnecting) {
      const phases = ['handshake', 'optimizing', 'securing'];
      let i = 0;
      const interval = setInterval(() => {
        setConnectingPhase(phases[i % phases.length]);
        i++;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isConnecting]);

  const getConnectingText = () => {
    switch (connectingPhase) {
      case 'handshake': return 'مصافحة رقمية...';
      case 'optimizing': return 'تحسين جودة المسار...';
      case 'securing': return 'تأمين القناة بطبقة P2P...';
      case 'initializing': return 'تهيئة العدسات والميكروفونات...';
      default: return 'جاري الاتصال...';
    }
  };

  // Recording Timer
  useEffect(() => {
    let recInterval: NodeJS.Timeout;
    if (isRecording) {
      recInterval = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(recInterval);
  }, [isRecording]);

  // Signal Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalStrength(prev => {
        const delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(2, Math.min(5, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Outgoing Ringtone Logic
  useEffect(() => {
    if (isCaller && call.status === 'ringing') {
      const tone = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359.wav');
      tone.loop = true;
      tone.play().catch(e => console.warn("Outgoing tone failed:", e));
      setOutgoingTone(tone);
    }
    
    // Stop tone when accepted or ended
    return () => {
      if (outgoingTone) {
        outgoingTone.pause();
        setOutgoingTone(null);
      }
    };
  }, [isCaller, call.status]);

  useEffect(() => {
    if (call.status === 'accepted' && outgoingTone) {
      outgoingTone.pause();
      setOutgoingTone(null);
    }
  }, [call.status, outgoingTone]);

  // Initial WebRTC
  useEffect(() => {
    const peerConnection = new RTCPeerConnection(servers);
    setPc(peerConnection);

    // Timers
    let durationInterval: NodeJS.Timeout;
    if (call.status === 'accepted') {
      durationInterval = setInterval(() => setCallDuration(d => d + 1), 1000);
    }

    const setupMedia = async () => {
      setIsConnecting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: mediaConstraints.audio,
          video: call.type === 'video' ? mediaConstraints.video : false,
        });
        setLocalStream(stream);
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsConnecting(false);
      } catch (e: any) {
        console.error("Media error:", e);
        setErrorMessage(`تعذر الوصول إلى الكاميرا أو الميكروفون. يرجى تفعيل الأذونات.`);
        setTimeout(() => onEnd('ended'), 4000);
        setIsConnecting(false);
      }
    };

    setupMedia();

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    // ICE Candidates Signaling
    const candidatesCol = collection(db, 'calls', call.id, 'iceCandidates');
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && currentUser?.id) {
        addDoc(candidatesCol, { ...event.candidate.toJSON(), senderId: currentUser.id })
          .catch(e => console.warn("ICE candidate addDoc failed:", e));
      }
    };

    const unsubCandidates = onSnapshot(candidatesCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (currentUser?.id && data.senderId !== currentUser.id) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data)).catch(e => console.warn("addIceCandidate error:", e));
          }
        }
      });
    }, (err) => console.error("Candidates signaling error:", err));

    // Signaling listener
    const callRef = doc(db, 'calls', call.id);
    const unsubCall = onSnapshot(callRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      try {
        if (!isCaller && data.offer && !peerConnection.currentRemoteDescription) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          await updateDoc(callRef, { 
            answer: { type: answer.type, sdp: answer.sdp }, 
            status: 'accepted',
            acceptedAt: serverTimestamp() 
          });
        }

        if (isCaller && data.answer && !peerConnection.currentRemoteDescription) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } catch (err) {
        console.warn("Signaling processing error:", err);
      }

      if (data.status === 'ended' || data.status === 'rejected') {
        onEnd(data.status);
      }
    }, (err) => console.error("Call signaling error:", err));

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'failed') {
        peerConnection.restartIce();
      }
    };

    // Create Offer if Caller and media is ready
    const initiateCall = async () => {
      if (isCaller) {
        // Wait a bit for tracks to be ready
        setTimeout(async () => {
          try {
            const offer = await peerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: call.type === 'video'
            });
            await peerConnection.setLocalDescription(offer);
            await updateDoc(callRef, { 
              offer: { type: offer.type, sdp: offer.sdp },
              status: 'ringing'
            });
          } catch (err) {
            console.error("Offer error:", err);
          }
        }, 1000);

        // Timeout if not answered in 45s
        setTimeout(() => {
          if (peerConnection.iceConnectionState !== 'connected' && peerConnection.iceConnectionState !== 'completed') {
            handleEndCall();
          }
        }, 45000);
      }
    };

    initiateCall();

    return () => {
      unsubCandidates();
      unsubCall();
      clearInterval(durationInterval);
      peerConnection.close();
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleEndCall = async () => {
    await updateDoc(doc(db, 'calls', call.id), { status: 'ended', endedAt: serverTimestamp() });
    onEnd('ended');
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
      setVideoOff(!localStream.getVideoTracks()[0].enabled);
    }
  };

  const switchCamera = async () => {
    if (!localStream) return;
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    
    try {
      // Stop old tracks
      localStream.getTracks().forEach(t => t.stop());
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: mediaConstraints.audio,
        video: call.type === 'video' ? { ...mediaConstraints.video, facingMode: newMode } : false,
      });
      
      setLocalStream(newStream);
      setFacingMode(newMode);
      
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
      
      // Update peer connection tracks
      if (pc) {
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      }
    } catch (err) {
      console.error("Camera switch failed:", err);
    }
  };

  useEffect(() => {
    if (remoteStream) {
      const interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 50)); // Mocking audio level visuals
      }, 100);
      return () => clearInterval(interval);
    }
  }, [remoteStream]);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const SpeakerIcon = speakerMode === 'speaker' ? Volume2 : speakerMode === 'earpiece' ? Volume1 : Bluetooth;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-slate-950 text-white overflow-hidden"
    >
      {/* Incoming Call Dialog (if ringing and receiver) */}
      <AnimatePresence>
        {call.status === 'ringing' && !isCaller && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[600] bg-slate-950 flex flex-col items-center justify-center p-8"
          >
             <div className="absolute inset-0 z-0 opacity-20">
               <img src={remoteUser.photoURL || ''} className="w-full h-full object-cover blur-2xl" alt="" />
             </div>
             
             <div className="relative z-10 flex flex-col items-center gap-12 text-center">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border-4 border-emerald-500/30 p-2">
                    <img src={remoteUser.photoURL || ''} className="w-full h-full rounded-full object-cover" alt="" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 border-4 border-emerald-500 rounded-full"
                  />
                </div>
                
                <div>
                   <h2 className="text-3xl font-serif italic mb-2 tracking-widest">{remoteUser.displayName}</h2>
                   <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Incoming {call.type} Call</p>
                </div>

                <div className="flex gap-16 mt-8">
                   <button 
                     onClick={handleEndCall}
                     className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-rose-500/20 active:scale-95 transition-all"
                   >
                     <PhoneOff size={32} />
                   </button>
                   <button 
                     onClick={() => onAccept?.()}
                     className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
                   >
                     <VideoIcon size={32} />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-[100%] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"
        />
        <div 
          className="absolute inset-0 blur-[120px] opacity-40 mix-blend-screen bg-cover bg-center"
          style={{ backgroundImage: `url(${remoteUser.photoURL || 'https://picsum.photos/seed/user/800/800'})` }}
        />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 p-6 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          {errorMessage ? (
            <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }}
               className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
            >
               <X size={14} />
               {errorMessage}
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button onClick={handleEndCall} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full transition-all flex items-center justify-center">
                  <ChevronDown size={20} />
                </button>
                
                {/* Connection Sentiment */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-end gap-0.5 h-3">
                    {[1, 2, 3, 4, 5].map(bar => (
                      <div 
                        key={bar} 
                        className={`w-0.5 rounded-full transition-all duration-500 ${bar <= signalStrength ? (signalStrength > 3 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-white/10'}`}
                        style={{ height: `${bar * 20}%` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">HD Secure</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-md">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                  {t('encrypted_hint')}
                </span>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced Recording Indicator */}
          <AnimatePresence mode="wait">
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 py-2 pl-4 pr-3 rounded-2xl backdrop-blur-xl"
              >
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">مباشر • تسجيل</span>
                   <span className="text-xs font-mono font-bold text-white/90">{formatDuration(recordingTime)}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Disc className="animate-spin" size={20} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setShowQuickMessages(!showQuickMessages)}
            className="p-4 glass rounded-[2rem] hover:bg-white/10 transition-all text-indigo-400"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </header>

      {/* Quick Responses Overlay */}
      <AnimatePresence>
        {showQuickMessages && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-64 z-[200] px-6"
          >
             <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-6 rounded-[3rem] shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40">ردود سريعة ذكية</h5>
                   <button onClick={() => setShowQuickMessages(false)} className="text-white/20 hover:text-white transition-colors">
                      <X size={16} />
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     { text: 'سأعاود الاتصال بك', icon: HistoryIcon },
                     { text: 'أنا في الطريق', icon: Radio },
                     { text: 'مكالمة طارئة؟', icon: Zap },
                     { text: 'سأرسل لك الموقع', icon: Signal }
                   ].map((item, idx) => (
                     <button 
                        key={idx}
                        onClick={() => setShowQuickMessages(false)}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-right group"
                      >
                       <item.icon size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                       <span className="text-sm font-medium flex-1">{item.text}</span>
                     </button>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content (Avatar / Video) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Audio Ripple Effect */}
          <AnimatePresence>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 1.5 + (audioLevel / 50), opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                className="absolute inset-0 border border-emerald-500/30 rounded-full"
              />
            ))}
          </AnimatePresence>

          <motion.div 
            style={{ 
              scale: 1 + (audioLevel / 300),
              boxShadow: `0 0 ${20 + audioLevel}px rgba(16, 185, 129, 0.5)`
            }}
            className="w-48 h-48 rounded-full p-1 bg-gradient-to-tr from-emerald-500 to-indigo-500"
          >
            <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden relative">
              {call.type === 'video' && remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <img 
                  src={remoteUser.photoURL || 'https://picsum.photos/seed/user/200/200'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </motion.div>

          {/* Voice Wave Ring */}
          <motion.div 
            animate={{ 
              scale: 1 + (audioLevel / 200),
              opacity: 0.3 + (audioLevel / 100)
            }}
            className="absolute -inset-4 border-2 border-emerald-500/50 rounded-full pointer-events-none"
          />
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-3xl font-serif italic mb-2 tracking-wide uppercase">
            {remoteUser.displayName}
          </h2>
          <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase">
            {isConnecting ? (
              <motion.span 
                key={connectingPhase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-indigo-400 font-bold"
              >
                {getConnectingText()}
              </motion.span>
            ) : (
              <span>{call.status === 'ringing' ? 'Calling...' : formatDuration(callDuration)}</span>
            )}
          </div>
        </div>
      </main>

      {/* Picture-in-Picture (Local Video) */}
      <motion.div 
        drag
        dragMomentum={false}
        className="absolute top-24 right-6 w-32 h-44 glass-dark rounded-3xl overflow-hidden z-20 cursor-move"
      >
        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
          {videoOff ? (
            <VideoOff size={24} className="text-white/20" />
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 size={20} />
        </div>
      </motion.div>

      {/* Controls Overlay Footer */}
      <footer className="relative z-10 p-12 pb-20 flex flex-col items-center gap-8">
        <div className="bg-slate-900/40 backdrop-blur-[60px] border border-white/10 px-6 py-4 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-white/5 pr-6">
            <PillButton 
              icon={SpeakerIcon} 
              active={speakerMode !== 'speaker'} 
              small
              onClick={() => {
                const modes: ('speaker' | 'earpiece' | 'bluetooth')[] = ['speaker', 'earpiece', 'bluetooth'];
                const next = modes[(modes.indexOf(speakerMode) + 1) % modes.length];
                setSpeakerMode(next);
              }} 
            />
            
            <PillButton 
              icon={isRecording ? CircleStop : Disc}
              active={isRecording}
              variant={isRecording ? 'danger' : 'default'}
              small
              onClick={() => setIsRecording(!isRecording)}
              className={isRecording ? 'animate-pulse' : ''}
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-700 rounded-[2.5rem] shadow-[0_15px_40px_rgba(244,63,94,0.4)] flex items-center justify-center relative overflow-hidden group border-t border-white/20"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <PhoneOff size={32} className="text-white relative z-10" />
          </motion.button>

          <div className="flex items-center gap-4 border-l border-white/5 pl-6">
            <PillButton 
              icon={videoOff ? VideoOff : VideoIcon} 
              variant={videoOff ? 'default' : 'accent'}
              active={!videoOff} 
              small
              onClick={toggleVideo} 
            />
            
            <PillButton 
              icon={Camera} 
              small
              onClick={switchCamera} 
              className="group-hover:rotate-180 transition-transform duration-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-12">
          <button 
            onClick={toggleMute}
            className={`flex flex-col items-center gap-2 group transition-all`}
          >
            <div className={`p-5 rounded-3xl transition-all duration-500 ${muted ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] text-white' : 'bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white'}`}>
              {muted ? <MicOff size={28} /> : <Mic size={28} />}
            </div>
            <span className={`text-[10px] uppercase font-serif italic tracking-[0.2em] font-medium transition-colors ${muted ? 'text-rose-500' : 'text-white/30'}`}>
              {muted ? 'Muted' : 'Mic On'}
            </span>
          </button>
        </div>
      </footer>
    </motion.div>
  );
};

const PillButton = ({ 
  icon: Icon, 
  active, 
  onClick, 
  variant = 'default',
  small = false,
  className = ""
}: { 
  icon: any, 
  active?: boolean, 
  onClick?: () => void, 
  variant?: 'default' | 'danger' | 'accent',
  small?: boolean,
  className?: string
}) => {
  const bgColor = variant === 'danger' ? 'bg-rose-500' : variant === 'accent' ? 'bg-emerald-500' : 'bg-white/5';
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`
        ${small ? 'w-11 h-11' : 'w-14 h-14'} 
        rounded-2xl flex items-center justify-center transition-all duration-300 border border-white/10
        ${active ? 'bg-white !text-slate-900 shadow-xl' : `${bgColor} text-white/70 hover:text-white hover:bg-white/10`}
        ${className}
      `}
    >
      <Icon size={small ? 18 : 22} />
    </motion.button>
  );
};
