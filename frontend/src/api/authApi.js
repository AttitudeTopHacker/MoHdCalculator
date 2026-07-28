import axios from 'axios';

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

// Attach JWT to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ac_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
};

// ── Google OAuth2 ─────────────────────────────────────────────────────────────
// Redirects browser to Spring Security's OAuth2 authorization page.
export const triggerGoogleLogin = () => {
  const backendBase = BASE_URL.replace('/api/v1', '');
  window.location.href = `${backendBase}/oauth2/authorization/google`;
};

export default api;
