import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Splash.css';

export default function Splash() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-glow"></div>
      
      <div className="splash-content">
        {/* Stylized M Monogram Logo Mark */}
        <div className="splash-logo-container">
          <svg className="splash-logo" width="170" height="170" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="leftLegGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#888888" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
              <linearGradient id="rightLegGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#888888" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
              <linearGradient id="centerVGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF9800" />
                <stop offset="100%" stopColor="#1E88E5" />
              </linearGradient>
            </defs>

            {/* Left arch leg */}
            <path d="M40 160 C40 80, 52 40, 75 40 C85 40, 90 55, 90 80 L90 160 H76 L76 80 C76 65, 72 55, 66 55 C58 55, 54 80, 54 110 L54 160 H40 Z" fill="url(#leftLegGrad)" />
            
            {/* Right arch leg */}
            <path d="M160 160 C160 80, 148 40, 125 40 C115 40, 110 55, 110 80 L110 160 H124 L124 80 C124 65, 128 55, 134 55 C142 55, 146 80, 146 110 L146 160 H160 Z" fill="url(#rightLegGrad)" />
            
            {/* Center V leg */}
            <path d="M82 50 L100 125 L118 50 H132 L107 145 C104 153, 96 153, 93 145 L68 50 H82 Z" fill="url(#centerVGrad)" />
          </svg>
        </div>

        {/* Wordmark */}
        <h1 className="splash-wordmark">MSM</h1>

        {/* Tagline */}
        <p className="splash-tagline">M SALMAN MOVIN</p>

        {/* Indeterminate circular spinner */}
        <div className="splash-spinner-container">
          <div className="splash-spinner"></div>
        </div>
      </div>

      {/* Footer copyright info */}
      <footer className="splash-footer">
        © 2024 Salman Ansari Enterprises
      </footer>
    </div>
  );
}
