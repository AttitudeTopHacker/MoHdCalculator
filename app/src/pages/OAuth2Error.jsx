import { Link } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import AuthCard from '../components/AuthCard';
import PrimaryButton from '../components/PrimaryButton';
import './OAuth2Error.css';

export default function OAuth2Error() {
  return (
    <div className="auth-page oauth-error-page">
      <WaveBackground />

      <AuthCard>
        <div className="error-icon-container">
          <span className="error-icon">⚠️</span>
        </div>
        
        <h1 className="auth-heading">Sign-In Failed</h1>
        <p className="auth-subtitle">
          Authentication request could not be completed.
        </p>

        <div className="error-card-desc">
          This usually happens if the authentication session expired, if you pressed the browser back button, or if the sign-in request was duplicated.
        </div>

        <div className="error-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '24px' }}>
          <Link to="/home" style={{ textDecoration: 'none' }}>
            <PrimaryButton id="error-home-btn">
              Return to Home Page
            </PrimaryButton>
          </Link>
          <Link to="/login" className="link-secondary" style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '4px', display: 'block' }}>
            Try Sign In Again
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
