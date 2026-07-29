import { useEffect, useRef } from 'react';
import './WaveBackground.css';

/**
 * Animated low-opacity SVG wave lines drawn on a canvas — matches PRD dark theme.
 */
export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawWave = (yBase, amplitude, wavelength, speed, alpha) => {
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= canvas.width; x += 4) {
        const y = yBase + Math.sin((x / wavelength) + t * speed) * amplitude;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(46, 230, 197, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const h = canvas.height;

      // Bottom waves
      drawWave(h * 0.92, 18, 320, 0.4, 0.06);
      drawWave(h * 0.88, 22, 280, 0.3, 0.04);
      drawWave(h * 0.95, 14, 260, 0.5, 0.03);

      // Top corner waves
      drawWave(h * 0.08, 12, 300, 0.35, 0.05);
      drawWave(h * 0.04, 16, 350, 0.25, 0.03);

      t += 0.008;
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="wave-canvas" />;
}
