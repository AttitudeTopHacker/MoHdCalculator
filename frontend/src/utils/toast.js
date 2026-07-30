// ── Global Toast Manager ──────────────────────────────────────────────────────
// Ek centralized event-based toast system.
// Axios interceptor aur koi bhi component is se toast trigger kar sakta hai.
//
// Usage anywhere:
//   import { showToast } from '../utils/toast';
//   showToast('Kuch galat hua!', 'error');
//   showToast('Saved!', 'success');

const TOAST_EVENT = 'ac:toast';

/**
 * Trigger a toast from anywhere — no React context needed.
 * @param {string} message
 * @param {'success'|'error'|'warning'} type
 * @param {number} duration  ms before auto-dismiss (default 4000)
 */
export const showToast = (message, type = 'error', duration = 4000) => {
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { message, type, duration } })
  );
};

export { TOAST_EVENT };
