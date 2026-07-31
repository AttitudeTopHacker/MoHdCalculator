import { useEffect, useRef, useState } from 'react';
import './PullToRefresh.css';

/**
 * PullToRefresh — scroll bottom pe pull karke hold karo to page reload
 * Works on Android WebView & mobile browsers.
 */
export default function PullToRefresh() {
  const [pullProgress, setPullProgress] = useState(0); // 0 to 1
  const [triggered, setTriggered] = useState(false);
  const touchStartY = useRef(null);
  const isDragging = useRef(false);

  const THRESHOLD = 80; // px pull required to trigger refresh

  useEffect(() => {
    const isAtBottom = () => {
      const el = document.scrollingElement || document.documentElement;
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    };

    const onTouchStart = (e) => {
      if (isAtBottom()) {
        touchStartY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!isDragging.current || touchStartY.current === null) return;
      const dy = touchStartY.current - e.touches[0].clientY; // positive = pull up
      if (dy > 0) {
        const progress = Math.min(dy / THRESHOLD, 1);
        setPullProgress(progress);
      } else {
        setPullProgress(0);
        isDragging.current = false;
      }
    };

    const onTouchEnd = () => {
      if (pullProgress >= 1 && !triggered) {
        setTriggered(true);
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setPullProgress(0);
      }
      isDragging.current = false;
      touchStartY.current = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullProgress, triggered]);

  if (pullProgress === 0 && !triggered) return null;

  return (
    <div
      className="ptr-container"
      style={{ opacity: triggered ? 1 : pullProgress }}
    >
      <div
        className={`ptr-spinner ${triggered ? 'ptr-spinning' : ''}`}
        style={{
          transform: `rotate(${triggered ? 0 : pullProgress * 270}deg) scale(${0.6 + pullProgress * 0.4})`,
        }}
      >
        ↻
      </div>
      <span className="ptr-label">
        {triggered ? 'Reconnecting...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull up to refresh'}
      </span>
    </div>
  );
}
