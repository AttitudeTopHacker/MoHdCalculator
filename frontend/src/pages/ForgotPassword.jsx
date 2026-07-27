import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { authApi } from '../api/authApi';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [step, setStep] = useState(1); // 1 = request OTP, 2 = verify OTP & reset
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: 'Please enter your email address.' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setToast({ type: 'success', message: 'If an account exists, a 6-digit reset OTP has been sent!' });
      setStep(2);
    } catch {
      setToast({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!otp.trim() || otp.trim().length !== 6) errs.otp = 'Please enter a valid 6-digit OTP';
    if (!newPassword || newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword, confirmPassword);
      setToast({ type: 'success', message: 'Password updated successfully! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. Please check the OTP code.';
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
        {step === 1 ? (
          <>
            <h1 className="auth-heading">Forgot Password?</h1>
            <p className="auth-subtitle">
              Enter your email and we&apos;ll send you a 6-digit OTP.
            </p>

            <form onSubmit={handleRequestOtp} className="auth-form" noValidate>
              <div className="form-group">
                <InputField
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                  icon="✉"
                  error={errors.email}
                  autoComplete="email"
                />
              </div>

              <PrimaryButton type="submit" loading={loading} id="forgot-submit-btn">
                Send Reset OTP
              </PrimaryButton>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-heading">Reset Password</h1>
            <p className="auth-subtitle">
              Enter the 6-digit OTP sent to <strong style={{ color: 'var(--teal)' }}>{email}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="auth-form" noValidate>
              {/* OTP Input */}
              <div className="form-group">
                <InputField
                  id="reset-otp"
                  name="otp"
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors((prev) => ({ ...prev, otp: '' })); }}
                  icon="🔢"
                  error={errors.otp}
                  autoComplete="one-time-code"
                />
              </div>

              {/* New Password */}
              <div className="form-group">
                <InputField
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  placeholder="New password (min. 8 characters)"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrors((prev) => ({ ...prev, newPassword: '' })); }}
                  icon="🔒"
                  error={errors.newPassword}
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <InputField
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: '' })); }}
                  icon="🔒"
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />
              </div>

              <PrimaryButton type="submit" loading={loading} id="reset-submit-btn">
                Reset Password
              </PrimaryButton>
            </form>

            <button
              className="link-accent resend-btn"
              onClick={handleRequestOtp}
              disabled={loading}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '16px' }}
            >
              Resend OTP
            </button>
          </>
        )}

        <p className="auth-footer-text" style={{ marginTop: '24px' }}>
          <Link to="/login" className="link-secondary">← Back to Login</Link>
        </p>
      </AuthCard>
    </div>
  );
}
