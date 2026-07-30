import axios from 'axios';
import { showToast } from '../utils/toast';

const getDynamicBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  
  // Fallback to dynamic host matching port 8080 in dev
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8080/api/v1`;
};

const BASE_URL = getDynamicBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor — Attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ac_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor — Smart Error Toast ─────────────────────────────────
// Silently skip: wakeup pings (/public/health) and history saves (/calculate/history)
const SILENT_URLS = ['/public/health', '/calculate/history'];

api.interceptors.response.use(
  (response) => response, // Success: pass through
  (error) => {
    // Check if this request should be silent (no toast)
    const url = error.config?.url || '';
    const isSilent = SILENT_URLS.some((s) => url.includes(s));
    if (isSilent) return Promise.reject(error);

    // ── Case 1: No internet / network down ──────────────────────────────────
    if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      showToast('📶 Internet connection nahi hai. Please check karein.', 'error', 5000);
      return Promise.reject(error);
    }

    // ── Case 2: Request timeout ──────────────────────────────────────────────
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      showToast('⏱ Server respond nahi kar raha. Thodi der baad try karein.', 'error', 5000);
      return Promise.reject(error);
    }

    // ── Case 3: Server responded with error ─────────────────────────────────
    if (error.response) {
      const status = error.response.status;
      // Try to get actual message from backend ApiResponse
      const serverMsg =
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.data;

      if (status === 401) {
        // 401 handled by auth flow — don't double toast
        return Promise.reject(error);
      } else if (status === 403) {
        showToast('🔒 Aapko yeh karne ki permission nahi hai.', 'error');
      } else if (status === 404) {
        showToast(typeof serverMsg === 'string' ? serverMsg : '❌ Resource nahi mila.', 'error');
      } else if (status === 429) {
        showToast('⚠️ Bahut zyada requests. Thodi der ruk kar try karein.', 'error', 6000);
      } else if (status >= 500) {
        showToast(
          typeof serverMsg === 'string'
            ? `🔴 Server Error: ${serverMsg}`
            : '🔴 Server mein problem aayi. Baad mein try karein.',
          'error',
          6000
        );
      } else if (typeof serverMsg === 'string' && serverMsg.length > 0) {
        // Any other error with a backend message — show it directly
        showToast(serverMsg, 'error');
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth Endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  signup: (data) =>
    api.post('/auth/signup', data),

  verifySignup: (email, otp) =>
    api.post('/auth/verify-signup', { email, otp }),

  resendSignupOtp: (email) =>
    api.post('/auth/resend-signup-otp', { email }),

  login: (data) =>
    api.post('/auth/login', data),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email, otp, newPassword, confirmPassword) =>
    api.post('/auth/reset-password', { email, otp, newPassword, confirmPassword }),

  profileSetup: (fullName, password) =>
    api.post('/auth/profile-setup', { fullName, password }),

  updateProfile: (data) =>
    api.put('/auth/profile', data),

  getMe: () =>
    api.get('/auth/me'),

  checkHealth: () =>
    api.get('/public/health'),

  googleNative: (idToken) =>
    api.post('/auth/google-native', { idToken }),
};

// ── Google OAuth2 ─────────────────────────────────────────────────────────────
// Redirects browser to Spring Security's OAuth2 authorization page.
export const triggerGoogleLogin = () => {
  const backendBase = BASE_URL.replace('/api/v1', '');
  window.location.href = `${backendBase}/login/oauth2/google`;
};

export default api;
