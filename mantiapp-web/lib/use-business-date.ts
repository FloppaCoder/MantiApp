'use client';
import { useSyncExternalStore } from 'react';
import { businessDate } from './scheduling';

function subscribe(notify: () => void) {
  const timer = window.setInterval(notify, 60_000);
  document.addEventListener('visibilitychange', notify);
  return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', notify); };
}
// Empty server snapshot prevents a hydration mismatch at midnight.
export function useBusinessDate() {
  return useSyncExternalStore(subscribe, businessDate, () => '');
}
