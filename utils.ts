import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safety check for deleting files from Firebase Storage.
 * Prevents errors if the URL is an external link (like Google Profile photos).
 */
export function isFirebaseStorageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('firebasestorage.googleapis.com');
}

/**
 * Generates a sharable URL, preferring the production (shared) domain over development.
 */
export function getSharableUrl(roomId?: string, inviterName?: string): string {
  const origin = window.location.origin;
  // If it's the AIS dev environment, we point to the PREVIEW environment for sharable links
  // This ensures that the link works for other users who don't have dev access.
  let base = origin;
  
  if (origin.includes('ais-dev-')) {
    base = origin.replace('ais-dev-', 'ais-pre-');
  } else if (!origin.includes('ais-pre-') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    // If it's a custom domain or a cloud run URL, use it as is
    base = origin;
  }
  
  const params = new URLSearchParams();
  if (roomId) params.set('invite', roomId);
  if (inviterName) params.set('by', inviterName);
  
  // Tag it with a fresh timestamp to ensure link previews refresh
  params.set('v', '2'); 
  
  const search = params.toString();
  return `${base}${search ? `/?${search}` : ''}`;
}

/**
 * Utility for copying text to clipboard with clean feedback
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
};
