import { useEffect, useRef } from 'react';
import './Toast.css';

/**
 * Slide-in toast notification.
 *
 * @param {string}  message    - Message to display
 * @param {'success'|'error'} type - Toast type (controls color)
 * @param {function} onClose   - Called when toast should dismiss
 * @param {number}  duration   - Auto-dismiss ms (default 3500)
 */
export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onClose, duration);
    return () => clearTimeout(timerRef.current);
  }, [onClose, duration]);

  if (!message) return null;

  return (
    <div className={`toast toast--${type}`} role="alert">
      <span className="toast-icon">
        {type === 'success' ? '✓' : '✕'}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
}
