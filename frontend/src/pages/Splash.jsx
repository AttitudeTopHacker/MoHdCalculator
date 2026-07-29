import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Splash.css';

export default function Splash() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 2200);

    const navTimer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }, 2700);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [isAuthenticated, navigate]);

  return (
    <div className={`splash-screen ${exiting ? 'splash-exit' : ''}`}>
      {/* Background particles */}
      <div className="splash-particles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`splash-particle splash-particle-${i + 1}`} />
        ))}
      </div>

      {/* Radial glow behind logo */}
      <div className="splash-glow" />

      <div className="splash-content">
        {/* Logo Mark */}
        <div className="splash-logo-container">
          <svg
            className="splash-logo"
            width="160"
            height="160"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2DE2C4" />
                <stop offset="100%" stopColor="#4F8EF7" />
              </linearGradient>
              <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F8EF7" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer Hexagon */}
            <polygon
              points="80,8 145,44 145,116 80,152 15,116 15,44"
              stroke="url(#hexGrad)"
              strokeWidth="3"
              fill="none"
              className="splash-hex-outer"
            />

            {/* Middle Hexagon */}
            <polygon
              points="80,26 127,52 127,108 80,134 33,108 33,52"
              stroke="url(#innerGrad)"
              strokeWidth="1.5"
              fill="rgba(79,142,247,0.06)"
              className="splash-hex-mid"
            />

            {/* Calculator icon inside */}
            <rect x="54" y="50" width="52" height="60" rx="6" fill="rgba(45,226,196,0.12)" stroke="url(#hexGrad)" strokeWidth="1.8" filter="url(#glow)" />

            {/* Calculator display */}
            <rect x="60" y="57" width="40" height="13" rx="3" fill="url(#hexGrad)" opacity="0.9" />

            {/* Calc buttons grid */}
            <rect x="60" y="76" width="10" height="9" rx="2" fill="rgba(255,255,255,0.3)" />
            <rect x="75" y="76" width="10" height="9" rx="2" fill="rgba(255,255,255,0.3)" />
            <rect x="90" y="76" width="10" height="9" rx="2" fill="url(#innerGrad)" />

            <rect x="60" y="90" width="10" height="9" rx="2" fill="rgba(255,255,255,0.3)" />
            <rect x="75" y="90" width="10" height="9" rx="2" fill="rgba(255,255,255,0.3)" />
            <rect x="90" y="90" width="10" height="9" rx="2" fill="rgba(255,255,255,0.3)" />

            <rect x="60" y="104" width="25" height="9" rx="2" fill="rgba(255,255,255,0.15)" />
            <rect x="90" y="104" width="10" height="9" rx="2" fill="url(#hexGrad)" opacity="0.85" />

            {/* Corner accent dots */}
            <circle cx="20" cy="20" r="3" fill="url(#hexGrad)" opacity="0.5" />
            <circle cx="140" cy="20" r="3" fill="url(#innerGrad)" opacity="0.5" />
            <circle cx="20" cy="140" r="3" fill="url(#innerGrad)" opacity="0.5" />
            <circle cx="140" cy="140" r="3" fill="url(#hexGrad)" opacity="0.5" />
          </svg>

          {/* Orbit ring */}
          <div className="splash-orbit-ring" />
        </div>

        {/* Wordmark */}
        <h1 className="splash-wordmark">
          <span className="splash-word-area">Area</span>
          <span className="splash-word-calc">Calc</span>
        </h1>

        {/* Tagline */}
        <p className="splash-tagline">Precision · Speed · Elegance</p>

        {/* Dots loader */}
        <div className="splash-dots">
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
        </div>
      </div>

      <footer className="splash-footer">
        <span className="splash-brand">msm.movin</span>
        <span className="splash-handle">@2026salmanansari</span>
      </footer>
    </div>
  );
}
