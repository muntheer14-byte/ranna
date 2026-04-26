import { useState, useEffect } from 'react';
import { User, Room, Message } from '../types';
import { mockDb } from './mockFirebase';

/**
 * Ranna Design Bypass Controller
 * Manages the "Super Supernatural" features and mock data state during design phase.
 */

export interface DesignState {
  isGhostMode: boolean;
  isNeuralGuardActive: boolean;
  encryptionLevel: 'standard' | 'neural' | 'quantum';
  isDesigning: boolean;
}

const DEFAULT_STATE: DesignState = {
  isGhostMode: false,
  isNeuralGuardActive: true,
  encryptionLevel: 'neural',
  isDesigning: true
};

// Singleton-ish state for the design session
let designState = { ...DEFAULT_STATE };
const listeners: ((s: DesignState) => void)[] = [];

export const useRannaDesign = () => {
  const [state, setState] = useState<DesignState>(designState);

  useEffect(() => {
    const cb = (s: DesignState) => setState({ ...s });
    listeners.push(cb);
    return () => {
      const idx = listeners.indexOf(cb);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const updateState = (newState: Partial<DesignState>) => {
    designState = { ...designState, ...newState };
    listeners.forEach(l => l(designState));
  };

  return { ...state, updateState };
};

/**
 * Injects mock data if the user is in mock mode
 */
export const injectMockData = (userId: string, setter: (rooms: Room[]) => void) => {
  const rooms = mockDb.getRooms(userId);
  setter(rooms);
};

export const injectMockMessages = (roomId: string, setter: (msgs: Message[]) => void) => {
  const msgs = mockDb.getMessages(roomId);
  setter(msgs);
};
