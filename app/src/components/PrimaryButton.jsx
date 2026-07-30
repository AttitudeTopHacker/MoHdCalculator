import './PrimaryButton.css';

/**
 * Teal solid button with magenta glow outline effect.
 *
 * @param {string}   type      - 'button' | 'submit'
 * @param {function} onClick   - Click handler
 * @param {boolean}  loading   - Shows spinner when true
 * @param {boolean}  disabled  - Disables the button
 * @param {string}   className - Extra CSS classes
 */
export default function PrimaryButton({
  children,
  type = 'button',
  onClick,
  loading = false,
  disabled = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn-primary ${loading ? 'btn-primary--loading' : ''} ${className}`}
    >
      {loading ? (
        <span className="btn-spinner" aria-label="Loading…" />
      ) : (
        children
      )}
    </button>
  );
}
