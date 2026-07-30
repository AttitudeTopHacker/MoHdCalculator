// ── Render Backend Warm-Up Hook ───────────────────────────────────────────────
// Silently pings /public/health as soon as any page loads so Render's free
// server is awake before the user actually needs it (login, history, etc.)
//
// Usage:  import useWakeup from '../utils/useWakeup';
//         useWakeup();   ← call inside any page component

import { useEffect } from 'react';
import { authApi } from '../api/authApi';

const STORAGE_KEY = 'ac_wakeup_ts';
const COOLDOWN_MS = 4 * 60 * 1000; // 4 minutes — Render sleeps after ~5 min

const useWakeup = () => {
  useEffect(() => {
    // Check last ping time so we don't spam on every navigation
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    const now = Date.now();

    if (now - last < COOLDOWN_MS) return; // Already pinged recently, skip

    // Fire-and-forget: silent background ping, user never sees this
    authApi.checkHealth()
      .then(() => {
        localStorage.setItem(STORAGE_KEY, String(now));
        console.log('🟢 Render backend is awake.');
      })
      .catch(() => {
        // Silently ignore — server might take time to wake, next request will retry
        console.log('🟡 Render wakeup ping sent (server may be starting up...)');
      });
  }, []); // Run once per component mount
};

export default useWakeup;
