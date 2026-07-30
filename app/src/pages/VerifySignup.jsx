import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function VerifySignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  // 60-second resend timer
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifySignup(email, otp.trim());
      const { token, user } = res.data.data;
      saveSession(token, user);
      setToast({ type: 'success', message: 'Verification successful! Welcome 🎉' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      await authApi.resendSignupOtp(email);
      setToast({ type: 'success', message: 'Verification OTP has been resent to your email!' });
      setTimer(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setToast({ type: 'error', message: msg });
    } finally {
      setResending(false);
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
        <h1 className="auth-heading">Verify Email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit OTP code to <strong style={{ color: 'var(--teal)' }}>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <InputField
              id="verify-otp"
              name="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              icon="🔢"
              error={error}
              autoComplete="one-time-code"
            />
          </div>

          <PrimaryButton type="submit" loading={loading} id="verify-submit-btn">
            Verify & Login
          </PrimaryButton>
        </form>

        <p className="auth-footer-text">
          Didn&apos;t receive code?{' '}
          {timer > 0 ? (
            <span style={{ color: 'var(--magenta)' }}>Resend in {timer}s</span>
          ) : (
            <button
              onClick={handleResend}
              className="link-accent resend-btn"
              disabled={resending}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          )}
        </p>

        <p className="auth-footer-text" style={{ marginTop: '16px' }}>
          <Link to="/signup" className="link-secondary">← Back to Register</Link>
        </p>
      </AuthCard>
    </div>
  );
}
