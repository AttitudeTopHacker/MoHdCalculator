import { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { isTokenExpired } from '../utils/token';

const AuthContext = createContext(null);

const TOKEN_KEY = 'ac_token';
const USER_KEY  = 'ac_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved && isTokenExpired(saved)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return saved;
  });
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken || isTokenExpired(savedToken)) {
      return null;
    }
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  /** Store token + user in state and localStorage */
  const saveSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  /** Called after Google OAuth2 redirect — token comes from URL query param */
  const loginWithToken = useCallback(async (rawToken) => {
    localStorage.setItem(TOKEN_KEY, rawToken);
    setToken(rawToken);
    try {
      const res = await authApi.getMe();
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      return userData;
    } catch (e) {
      // Token might be invalid — clear session
      logout();
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, saveSession, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
