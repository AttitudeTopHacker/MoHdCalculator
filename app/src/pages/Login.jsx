import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import GoogleButton from '../components/GoogleButton';
import Toast from '../components/Toast';
import ConnectingOverlay from '../components/ConnectingOverlay';
import { authApi, triggerGoogleLogin } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export default function Login() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [wakingUp, setWakingUp] = useState(false);

  const handleGoogleLogin = async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      setLoading(true);
      try {
        GoogleAuth.initialize();
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        if (!idToken) throw new Error("Google authentication didn't return an ID token.");

        const res = await authApi.googleNative(idToken);
        const { token, user } = res.data.data;
        saveSession(token, user);
        navigate('/dashboard');
      } catch (err) {
        console.error("Native Google login failed", err);
        const errMsg = err.response?.data?.message || err.message || 'Google Sign-In failed.';
        setToast({ type: 'error', message: errMsg });
      } finally {
        setLoading(false);
      }
    } else {
      setWakingUp(true);
      try {
        await authApi.checkHealth();
      } catch (err) {
        console.warn("Backend health check failed or timed out", err);
      }
      triggerGoogleLogin();
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { token, user } = res.data.data;
      saveSession(token, user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <WaveBackground />

      <header className="auth-header">
        <Link to="/" className="auth-logo">MoHd Calculator</Link>
        <Link to="/" className="auth-home-btn">
          <span>🏠 Home</span>
        </Link>
      </header>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <AuthCard>
        <h1 className="auth-heading">Welcome!</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <InputField
              id="login-email"
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              icon="✉"
              error={errors.email}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <InputField
              id="login-password"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              icon="🔒"
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          <div className="auth-forgot">
            <Link to="/forgot-password" className="link-secondary">
              Forgot Password?
            </Link>
          </div>

          <PrimaryButton type="submit" loading={loading} id="login-submit-btn">
            Login
          </PrimaryButton>
        </form>

        <div className="divider"><span>OR</span></div>
 
        <GoogleButton onClick={handleGoogleLogin} disabled={loading || wakingUp} />
 
        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="link-accent">Register here.</Link>
        </p>
      </AuthCard>

      {wakingUp && <ConnectingOverlay />}
    </div>
  );
}
