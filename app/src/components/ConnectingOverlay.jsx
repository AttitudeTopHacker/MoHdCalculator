// ── Google OAuth Connecting Overlay ──────────────────────────────────────────
// Premium animated overlay shown when user clicks "Continue with Google"
// Replaces the old "Waking up server..." message with clean branded animation.
import './ConnectingOverlay.css';

export default function ConnectingOverlay() {
  return (
    <div className="co-backdrop">
      {/* Logo mark */}
      <div className="co-logo-wrap">
        <span className="co-logo-icon">◈</span>
      </div>

      {/* Animated rings */}
      <div className="co-rings">
        <div className="co-ring co-ring--1" />
        <div className="co-ring co-ring--2" />
        <div className="co-ring co-ring--3" />
      </div>

      {/* Text */}
      <div className="co-text">
        <h2 className="co-title">Connecting to Google</h2>
        <p className="co-subtitle">Redirecting you securely...</p>
      </div>

      {/* Progress bar */}
      <div className="co-progress-track">
        <div className="co-progress-fill" />
      </div>

      {/* Floating dots */}
      <div className="co-dots">
        <span className="co-dot" />
        <span className="co-dot" />
        <span className="co-dot" />
      </div>
    </div>
  );
}
