import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { AuthProvider, useAuth } from './context/AuthContext';
import Toast from './components/Toast';
import { TOAST_EVENT } from './utils/toast';
import Splash from './pages/Splash';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifySignup from './pages/VerifySignup';
import ProfileSetup from './pages/ProfileSetup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import OAuth2Callback from './pages/OAuth2Callback';
import OAuth2Error from './pages/OAuth2Error';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import MapAuto from './pages/tools/MapAuto';
import MapManual from './pages/tools/MapManual';
import MapDraw from './pages/tools/MapDraw';
import TriangleArea from './pages/tools/TriangleArea';
import RectangleArea from './pages/tools/RectangleArea';
import AreaConvert from './pages/tools/AreaConvert';
import ConvertSqMt from './pages/tools/ConvertSqMt';
import LengthConvert from './pages/tools/LengthConvert';

// ── Global Toast Listener ─────────────────────────────────────────────────────
// Listens to 'ac:toast' CustomEvents fired by axios interceptor or showToast()
// and renders the Toast component at the root level for the whole app.
function GlobalToastListener() {
  const [toast, setToast] = useState(null);

  const handleToast = useCallback((e) => {
    setToast(e.detail);
  }, []);

  useEffect(() => {
    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, [handleToast]);

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onClose={() => setToast(null)}
    />
  );
}

/**
 * ProtectedRoute:
 * 1. If not logged in -> redirect to /login
 * 2. If logged in but email unverified -> redirect to /verify-signup
 * 3. If logged in and verified, but profile setup pending -> force /profile-setup
 * 4. If logged in and setup complete, but trying to access /profile-setup -> redirect to /dashboard
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.verified) {
    return <Navigate to={`/verify-signup?email=${encodeURIComponent(user.email)}`} replace />;
  }

  if (user && !user.profileSetup && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  if (user && user.profileSetup && location.pathname === '/profile-setup') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * PublicOnlyRoute:
 * Prevents logged-in users from visiting login, signup, forgot password, home page, etc.
 * 1. If unverified -> redirect to /verify-signup
 * 2. If verified but profile setup pending -> redirect to /profile-setup
 * 3. If verified and setup complete -> redirect to /dashboard
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated && user) {
    if (!user.verified) {
      if (location.pathname !== '/verify-signup') {
        return <Navigate to={`/verify-signup?email=${encodeURIComponent(user.email)}`} replace />;
      }
    } else if (!user.profileSetup) {
      if (location.pathname !== '/profile-setup') {
        return <Navigate to="/profile-setup" replace />;
      }
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !(user.admin || user.isAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppDeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const setupListener = async () => {
      await CapApp.addListener('appUrlOpen', (event) => {
        const url = event.url;
        if (url.startsWith('com.msmmovin.areacalculator://')) {
          // Close Chrome Custom Tab if open
          Browser.close().catch(() => {});
          
          // Extract route path and search params
          const pathPart = url.replace('com.msmmovin.areacalculator://', '');
          const [route, search] = pathPart.split('?');
          
          if (route === 'oauth2/callback') {
            navigate(`/${route}?${search || ''}`, { replace: true });
          }
        }
      });
    };

    setupListener();

    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppDeepLinkHandler />
      <AuthProvider>
        {/* Global toast — listens to all axios errors + showToast() calls */}
        <GlobalToastListener />

        <Routes>
          {/* Splash Screen */}
          <Route path="/" element={<Splash />} />

          {/* Home / Landing */}
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />

          {/* Auth routes */}
          <Route path="/login"           element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup"          element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route path="/verify-signup"   element={<PublicOnlyRoute><VerifySignup /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
          <Route path="/reset-password"  element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

          {/* Google OAuth2 callback & error */}
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route path="/oauth2/error" element={<OAuth2Error />} />

          {/* Protected routes */}
          <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/dashboard/map-auto" element={<ProtectedRoute><MapAuto /></ProtectedRoute>} />
          <Route path="/dashboard/map-manual" element={<ProtectedRoute><MapManual /></ProtectedRoute>} />
          <Route path="/dashboard/map-draw" element={<ProtectedRoute><MapDraw /></ProtectedRoute>} />
          <Route path="/dashboard/triangle-area" element={<ProtectedRoute><TriangleArea /></ProtectedRoute>} />
          <Route path="/dashboard/rectangle-area" element={<ProtectedRoute><RectangleArea /></ProtectedRoute>} />
          <Route path="/dashboard/area-convert" element={<ProtectedRoute><AreaConvert /></ProtectedRoute>} />
          <Route path="/dashboard/convert-sq-mt" element={<ProtectedRoute><ConvertSqMt /></ProtectedRoute>} />
          <Route path="/dashboard/length-convert" element={<ProtectedRoute><LengthConvert /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

