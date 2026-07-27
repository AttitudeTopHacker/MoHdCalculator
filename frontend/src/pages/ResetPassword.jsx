import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { authApi } from '../api/authApi';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [done,    setDone]    = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.newPassword || form.newPassword.length < 8)
      e.newPassword = 'Password must be at least 8 characters';
    if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    return e;
  };

  // Token missing from URL
  if (!token) {
    return (
      <div className="auth-page">
        <WaveBackground />
        <AuthCard>
          <div className="auth-success-state">
            <div className="success-icon" style={{ color: 'var(--magenta)' }}>⚠</div>
            <h1 className="auth-heading" style={{ fontSize: '1.5rem' }}>Invalid Link</h1>
            <p className="auth-subtitle">
              This reset link is missing or malformed. Please request a new one.
            </p>
            <Link to="/forgot-password" className="link-accent">Request New Link</Link>
          </div>
        </AuthCard>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(token, form.newPassword, form.confirmPassword);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. The link may have expired.';
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

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
        {!done ? (
          <>
            <h1 className="auth-heading">Set New Password</h1>
            <p className="auth-subtitle">Enter your new password below.</p>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <InputField
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  placeholder="New password (min. 8 characters)"
                  value={form.newPassword}
                  onChange={handleChange}
                  icon="🔒"
                  error={errors.newPassword}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <InputField
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  icon="🔒"
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />
              </div>

              <PrimaryButton type="submit" loading={loading} id="reset-submit-btn">
                Reset Password
              </PrimaryButton>
            </form>
          </>
        ) : (
          <div className="auth-success-state">
            <div className="success-icon">✓</div>
            <h2 className="auth-heading" style={{ fontSize: '1.6rem' }}>Password Reset!</h2>
            <p className="auth-subtitle">
              Your password has been updated. Redirecting you to login…
            </p>
          </div>
        )}
      </AuthCard>
    </div>
  );
}
