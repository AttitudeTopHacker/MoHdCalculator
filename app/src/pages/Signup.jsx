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

export default function Signup() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
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
        try {
          await GoogleAuth.signOut();
        } catch (e) {
          // Ignored if not signed in
        }
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
    if (!form.fullName)   e.fullName = 'Full name is required';
    if (!form.email)      e.email    = 'Email is required';
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authApi.signup(form);
      setToast({ type: 'success', message: 'Account created! Please check your email for the verification OTP.' });
      setTimeout(() => navigate(`/verify-signup?email=${encodeURIComponent(form.email.trim())}`), 1800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
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
        <h1 className="auth-heading">Create Account</h1>
        <p className="auth-subtitle">Join AreaCalculator today</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <InputField
              id="signup-fullname"
              name="fullName"
              type="text"
              placeholder="Full name"
              value={form.fullName}
              onChange={handleChange}
              icon="👤"
              error={errors.fullName}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <InputField
              id="signup-email"
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
              id="signup-password"
              name="password"
              type="password"
              placeholder="Password (min. 8 characters)"
              value={form.password}
              onChange={handleChange}
              icon="🔒"
              error={errors.password}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <InputField
              id="signup-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              icon="🔒"
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <PrimaryButton type="submit" loading={loading} id="signup-submit-btn">
            Create Account
          </PrimaryButton>
        </form>

        <div className="divider"><span>OR</span></div>
 
        <GoogleButton onClick={handleGoogleLogin} disabled={loading || wakingUp} />
 
        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="link-accent">Login here.</Link>
        </p>
      </AuthCard>

      {wakingUp && <ConnectingOverlay />}
    </div>
  );
}
