import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, User, Radar } from 'lucide-react';

export const NearbyRadar = () => {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScanning(false);
      setNearbyUsers([
        { id: 1, name: 'Sami', distance: '0.4 km', avatar: 'S' },
        { id: 2, name: 'Laila', distance: '1.2 km', avatar: 'L' },
        { id: 3, name: 'Karim', distance: '2.5 km', avatar: 'K' },
      ]);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950/50 relative overflow-hidden">
      {/* Radar Animation */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 border-2 border-violet-500/30 rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 2], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="absolute inset-0 border-2 border-violet-500/20 rounded-full"
        />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-t-2 border-l-2 border-violet-500/50 rounded-full"
        />
        <div className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] z-10">
          <Navigation className="text-white fill-white" />
        </div>

        {/* Nearby Users Dots */}
        {!scanning && nearbyUsers.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute z-20"
            style={{
              top: `${20 + i * 25}%`,
              right: `${10 + i * 30}%`
            }}
          >
            <div className="group relative">
              <div className="w-10 h-10 bg-white/10 glass rounded-xl flex items-center justify-center font-bold border-emerald-500/50 border">
                {user.avatar}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-zinc-900 border border-white/10 px-2 py-1 rounded-lg text-[10px]">
                {user.name} ({user.distance})
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
          {scanning ? <Radar className="animate-spin-slow text-violet-400" /> : <MapPin size={20} className="text-emerald-400" />}
          {scanning ? 'Scanning for nearby users...' : 'Users found nearby'}
        </h2>
        <p className="text-sm text-white/40">Discover people within 5 miles of your current location.</p>
      </div>

      <AnimatePresence>
        {!scanning && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full mt-8 flex flex-col gap-2"
          >
            {nearbyUsers.map(user => (
              <div key={user.id} className="ranna-card-glass p-4 rounded-3xl flex items-center justify-between border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold">{user.avatar}</div>
                  <span className="font-bold text-sm">{user.name}</span>
                </div>
                <span className="text-[10px] text-white/40">{user.distance}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
