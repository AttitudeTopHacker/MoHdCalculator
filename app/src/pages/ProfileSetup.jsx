import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, saveSession, logout, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Guard: must be authenticated to set up profile
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // If profile is already complete, redirect to dashboard
    if (user && user.profileSetup) {
      navigate('/dashboard');
      return;
    }
    // Prefill name from Google profile if available
    if (user) {
      setFullName(user.fullName || '');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'fullName') setFullName(value);
    if (name === 'password') setPassword(value);
    if (name === 'confirmPassword') setConfirmPassword(value);
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.profileSetup(fullName.trim(), password);
      const updatedUser = res.data.data;
      
      // Update session with updated user details
      const token = localStorage.getItem('ac_token');
      saveSession(token, updatedUser);
      
      setToast({ type: 'success', message: 'Profile configured successfully! Welcome 🎉' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete profile. Please try again.';
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="auth-page">
      <WaveBackground />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <AuthCard>
        <h1 className="auth-heading">Profile Setup</h1>
        <p className="auth-subtitle">Please complete your profile to continue</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email (Auto-filled, Read-only / Disabled) */}
          <div className="form-group">
            <InputField
              id="setup-email"
              name="email"
              type="email"
              placeholder="Email address"
              value={user.email}
              onChange={() => {}}
              icon="✉"
              disabled={true}
              autoComplete="email"
            />
            <small style={{ color: '#888', display: 'block', marginTop: '4px', paddingLeft: '8px' }}>
              Your Google email is verified and cannot be edited.
            </small>
          </div>

          {/* Full Name (Editable, pre-filled) */}
          <div className="form-group">
            <InputField
              id="setup-fullname"
              name="fullName"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={handleChange}
              icon="👤"
              error={errors.fullName}
              autoComplete="name"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <InputField
              id="setup-password"
              name="password"
              type="password"
              placeholder="Create password (min. 8 characters)"
              value={password}
              onChange={handleChange}
              icon="🔒"
              error={errors.password}
              autoComplete="new-password"
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <InputField
              id="setup-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={handleChange}
              icon="🔒"
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <PrimaryButton type="submit" loading={loading} id="setup-submit-btn">
            Save Profile
          </PrimaryButton>
        </form>

        <p className="auth-footer-text" style={{ marginTop: '24px' }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="link-secondary"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ← Cancel & Logout
          </button>
        </p>
      </AuthCard>
    </div>
  );
}
