import './AuthCard.css';

/**
 * Shared card container — teal border, glass-dark fill, generous padding.
 * Used by Login, Signup, and ForgotPassword pages for visual consistency.
 */
export default function AuthCard({ children, className = '' }) {
  return (
    <div className={`auth-card ${className}`}>
      {children}
    </div>
  );
}
