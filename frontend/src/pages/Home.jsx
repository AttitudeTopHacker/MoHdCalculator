import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/adminApi';
import SlidingBackground from '../components/SlidingBackground';
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
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);

  // Silently wake up Render backend in background
  useWakeup();

  // ── Typewriter cycling accent words ──
  const ACCENT_WORDS = ['Triangles', 'Rectangles', 'Polygons', 'Land Plots', 'Any Shape'];
  const [accentIdx, setAccentIdx] = useState(0);
  const [fadeAnim, setFadeAnim] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setAccentIdx(i => (i + 1) % ACCENT_WORDS.length);
        setFadeAnim(true);
      }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Always show shimmer while fetching
    setLoading(true);

    // Load cached team data immediately (offline support)
    const cached = localStorage.getItem('cached_team');
    if (cached) {
      try { setTeam(JSON.parse(cached)); } catch (_) {}
    }

    adminApi.publicGetTeam()
      .then((res) => {
        if (res.data && res.data.data && res.data.data.length > 0) {
          setTeam(res.data.data);
          localStorage.setItem('cached_team', JSON.stringify(res.data.data));
        }
        setLoading(false); // Data fetched (even if empty), stop shimmer
      })
      .catch((err) => {
        console.error("Error fetching team list:", err);
        if (cached) {
          // Offline but has cache — show cached, stop shimmer
          setLoading(false);
        }
        // Offline + no cache: keep shimmer running (loading stays true)
      });
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
      <SlidingBackground />

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
        <div className="hero-badge">✦ Instant · Secure · Cloud-Synced</div>

        <h1 className="hero-heading">
          Measure
          <span
            className="hero-accent"
            style={{
              opacity: fadeAnim ? 1 : 0,
              transform: fadeAnim ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              display: 'block'
            }}
          >
            {ACCENT_WORDS[accentIdx]}
          </span>
          <span className="hero-heading-sub">with Precision.</span>
        </h1>

        <p className="hero-desc">
          The smartest land & area calculator — supports{' '}
          <span className="hero-keyword">Bigha · Biswa · Gatta</span>,
          maps, triangles, rectangles and more.{' '}
          <span className="hero-keyword">Offline-first</span> calculations,{' '}
          <span className="hero-keyword">Google sign-in</span> & cloud history.
        </p>

        <div className="hero-cta">
          {isAuthenticated ? (
            <Link to="/dashboard" className="cta-primary" id="hero-dashboard-btn">
              Open Dashboard →
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
            <span className="stat-num">⚡</span>
            <span className="stat-label">Instant Results</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">🔐</span>
            <span className="stat-label">Secure Login</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">🗺️</span>
            <span className="stat-label">Map Support</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">🌾</span>
            <span className="stat-label">Bigha / Biswa</span>
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
      {(loading || team.length > 0) && (
        <section className="team-section-public">
          <p className="section-eyebrow">Our Experts</p>
          <h2 className="section-heading">Meet Our Team</h2>

          {loading ? (
            <div className="team-public-grid">
              {[1].map((n) => (
                <div className="team-skeleton-card" key={n}>
                  <div className="team-skeleton-avatar shimmer-bg" />
                  <div className="team-skeleton-text team-skeleton-title shimmer-bg" />
                  <div className="team-skeleton-text team-skeleton-subtitle shimmer-bg" />
                  <div className="team-skeleton-text team-skeleton-desc shimmer-bg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="team-public-grid">
              {team.map((member) => (
                <div className="team-public-card" key={member.id}>
                  <div className="team-public-avatar">
                    {member.pictureUrl ? (
                      <img src={member.pictureUrl} alt={member.name} className="team-public-avatar-img" referrerPolicy="no-referrer" />
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
          )}
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
          <Link to="/about" className="footer-link">About</Link>
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
