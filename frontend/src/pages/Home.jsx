import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/adminApi';
import WaveBackground from '../components/WaveBackground';
import ConfirmModal from '../components/ConfirmModal';
import useWakeup from '../utils/useWakeup';
import './Home.css';

const FEATURES = [
  {
    icon: '⬡',
    title: 'Area Calculations',
    desc: 'Precise measurements for any shape — circle, rectangle, triangle, polygon and more.',
  },
  {
    icon: '🔐',
    title: 'Secure Auth',
    desc: 'JWT-based stateless auth with Google OAuth2 support. Your data stays yours.',
  },
  {
    icon: '☁',
    title: 'Cloud Synced',
    desc: 'All calculations saved to Supabase PostgreSQL. Access from anywhere.',
  },
  {
    icon: '⚡',
    title: 'Blazing Fast',
    desc: 'Spring Boot 4.x backend + Vite React frontend. Zero lag, premium feel.',
  },
];

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [team, setTeam] = useState([]);

  // Silently wake up Render backend in background
  useWakeup();

  useEffect(() => {
    adminApi.publicGetTeam()
      .then((res) => setTeam(res.data.data))
      .catch((err) => console.error("Error fetching team list:", err));
  }, []);

  const handleLogout = () => {
    setShowConfirm(true);
  };

  const confirmSignOut = () => {
    logout();
    setShowConfirm(false);
  };

  return (
    <div className="home">
      <WaveBackground />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="home-nav">
        <div className="nav-logo">
          <span className="nav-logo-icon">◈</span>
          <span className="nav-logo-text">AreaCalculator</span>
        </div>
        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-btn">Dashboard</Link>
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  padding: 0
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="nav-link">Login</Link>
              <Link to="/signup" className="nav-btn">Get Started</Link>
            </>
          )}
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-badge">✦ Now in Phase 1</div>

        <h1 className="hero-heading">
          Calculate Areas
          <br />
          <span className="hero-accent">with Precision.</span>
        </h1>

        <p className="hero-desc">
          A premium, full-stack area calculator with secure authentication,
          Google sign-in, and cloud storage — built for engineers and builders.
        </p>

        <div className="hero-cta">
          {isAuthenticated ? (
            <Link to="/dashboard" className="cta-primary" id="hero-dashboard-btn">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/signup" className="cta-primary" id="hero-signup-btn">
                Start for Free
              </Link>
              <Link to="/login" className="cta-secondary" id="hero-login-btn">
                Sign In →
              </Link>
            </>
          )}
        </div>

        {/* Floating stat chips */}
        <div className="hero-stats">
          <div className="stat-chip">
            <span className="stat-num">10+</span>
            <span className="stat-label">Shape Types</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">🔐</span>
            <span className="stat-label">Secure Login</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">☁</span>
            <span className="stat-label">Cloud Synced</span>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="features">
        <p className="section-eyebrow">What's inside</p>
        <h2 className="section-heading">Built Different.</h2>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Meet Our Team ────────────────────────────────────── */}
      {team.length > 0 && (
        <section className="team-section-public">
          <p className="section-eyebrow">Our Experts</p>
          <h2 className="section-heading">Meet Our Team</h2>

          <div className="team-public-grid">
            {team.map((member) => (
              <div className="team-public-card" key={member.id}>
                <div className="team-public-avatar">
                  {member.pictureUrl ? (
                    <img src={member.pictureUrl} alt={member.name} className="team-public-avatar-img" />
                  ) : (
                    member.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <h3 className="team-public-name">{member.name}</h3>
                <span className="team-public-email">{member.email}</span>
                <p className="team-public-about">{member.about || 'Team expert and contributor.'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="cta-banner-inner">
          <h2 className="cta-banner-heading">
            {isAuthenticated ? 'Welcome Back!' : 'Ready to Calculate?'}
          </h2>
          <p className="cta-banner-sub">
            {isAuthenticated
              ? 'You are logged in. Access your calculations via Dashboard.'
              : 'Sign up in seconds. No credit card required.'}
          </p>
          {isAuthenticated ? (
            <Link to="/dashboard" className="cta-primary" id="bottom-dashboard-btn">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="cta-primary" id="bottom-signup-btn">
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="home-footer">
        <span className="footer-logo">◈ AreaCalculator</span>
        <span className="footer-copy">
          Built by <strong style={{ color: 'var(--teal)' }}>Salman Ansari</strong> · 2026
        </span>
        <div className="footer-links">
          {isAuthenticated ? (
            <Link to="/dashboard" className="footer-link">Dashboard</Link>
          ) : (
            <>
              <Link to="/login"  className="footer-link">Login</Link>
              <Link to="/signup" className="footer-link">Sign Up</Link>
            </>
          )}
        </div>
      </footer>

      <ConfirmModal
        isOpen={showConfirm}
        onConfirm={confirmSignOut}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
