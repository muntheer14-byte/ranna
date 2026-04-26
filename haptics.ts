/**
 * Ranna Haptic Feedback Utility
 * Processes sensory vibrations based on user settings
 */

export type HapticStrength = 'light' | 'mid' | 'heavy' | 'none';

export function triggerHaptic(strength: HapticStrength = 'light') {
  if (!navigator.vibrate) return;

  const patterns: Record<string, number[]> = {
    'light': [10],
    'mid': [25],
    'heavy': [50],
    'double': [15, 30, 15],
    'success': [10, 50, 10],
    'error': [50, 50, 50],
    'warning': [30, 100, 30]
  };

  const pattern = patterns[strength] || patterns['light'];
  navigator.vibrate(pattern);
}

export function sensoryClick(userSettings?: any) {
  const strength = userSettings?.haptics?.strength || 'light';
  const enabled = userSettings?.haptics?.enabled ?? true;
  
  if (enabled) {
    triggerHaptic(strength as HapticStrength);
  }
}
