import { useEffect, useRef, useState } from 'react';
import './PullToRefresh.css';

/**
 * PullToRefresh — page ke top pe pull down karo to reload/reconnect
 * Standard mobile pull-to-refresh pattern.
 */
export default function PullToRefresh() {
  const [pullProgress, setPullProgress] = useState(0); // 0 to 1
  const [triggered, setTriggered] = useState(false);
  const touchStartY = useRef(null);
  const isDragging = useRef(false);

  const THRESHOLD = 80; // px pull required to trigger refresh

  useEffect(() => {
    const isAtTop = () => {
      const el = document.scrollingElement || document.documentElement;
      return el.scrollTop <= 0;
    };

    const onTouchStart = (e) => {
      if (isAtTop()) {
        touchStartY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!isDragging.current || touchStartY.current === null) return;
      const dy = e.touches[0].clientY - touchStartY.current; // positive = pull down
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
        {triggered ? 'Reconnecting...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull down to refresh'}
      </span>
    </div>
  );
}
