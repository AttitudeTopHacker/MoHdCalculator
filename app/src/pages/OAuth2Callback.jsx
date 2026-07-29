import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * OAuth2Callback — intermediate page that reads the JWT token from URL params
 * after Google login redirects from backend.
 *
 * URL format: /oauth2/callback?token=<jwt>
 */
export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      loginWithToken(token).then((user) => {
        if (user && !user.profileSetup) {
          navigate('/profile-setup', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }).catch(() => {
        navigate('/login?error=oauth_failed', { replace: true });
      });
    } else {
      // No token — redirect to login with error
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D0D0D',
      color: '#2EE6C5',
      fontFamily: 'Poppins, sans-serif',
      fontSize: '1.1rem',
      gap: '14px',
    }}>
      <div style={{
        width: '22px', height: '22px',
        border: '2.5px solid rgba(46,230,197,0.25)',
        borderTopColor: '#2EE6C5',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      Signing you in…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
