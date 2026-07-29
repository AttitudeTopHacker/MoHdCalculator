import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import GoogleButton from '../components/GoogleButton';
import Toast from '../components/Toast';
import { authApi, triggerGoogleLogin } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

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
    setWakingUp(true);
    try {
      await authApi.checkHealth();
    } catch (err) {
      console.warn("Backend health check failed or timed out", err);
    }
    triggerGoogleLogin();
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

      {wakingUp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          color: '#fff',
          fontFamily: 'inherit'
        }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(46, 230, 197, 0.1)',
            borderTop: '4px solid var(--teal)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px', color: 'var(--teal)' }}>
            Waking up server...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '320px', textAlign: 'center', margin: '0 20px', lineHeight: '1.4' }}>
            Please wait. Render is spinning up the database and services. This will take a moment. 🚀
          </p>
        </div>
      )}
    </div>
  );
}
