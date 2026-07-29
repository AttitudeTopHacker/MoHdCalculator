import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { calculateApi } from '../../api/calculateApi';
import './Tools.css';

export default function MapDraw() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const polygonRef = useRef(null);
  const markersRef = useRef([]);

  // Load Google Maps script dynamically
  useEffect(() => {
    const callback = () => setGoogleLoaded(true);
    if (window.google && window.google.maps) {
      callback();
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!googleLoaded || !mapContainerRef.current) return;

    // Connaught Place, Delhi reference
    const center = { lat: 28.6139, lng: 77.2090 };
    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: center,
      zoom: 16,
      mapTypeId: 'hybrid', // Hybrid Satellite View
      disableDefaultUI: false,
    });

    polylineRef.current = new window.google.maps.Polyline({
      strokeColor: '#2EE6C5',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapRef.current,
    });

    polygonRef.current = new window.google.maps.Polygon({
      strokeColor: '#2EE6C5',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      fillColor: '#2EE6C5',
      fillOpacity: 0.35,
      map: mapRef.current,
    });

    // Core MapDraw logic: Add click listener to plot points directly on the map
    mapRef.current.addListener('click', (e) => {
      setError('');
      setResult(null);
      
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      
      setPoints((prev) => {
        const updated = [...prev, newPoint];
        redrawMap(updated);
        return updated;
      });
    });

    return () => {
      clearMarkers();
    };
  }, [googleLoaded]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const redrawMap = (updatedPoints) => {
    if (!mapRef.current) return;

    clearMarkers();

    const gPath = updatedPoints.map(p => new window.google.maps.LatLng(p.lat, p.lng));

    updatedPoints.forEach((p, idx) => {
      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(p.lat, p.lng),
        map: mapRef.current,
        label: {
          text: `${idx + 1}`,
          color: '#ffffff',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#FF4EA1',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 1.5,
        }
      });
      markersRef.current.push(marker);
    });

    polylineRef.current.setPath(gPath);
    polygonRef.current.setPath([]); // Clear polygon while drafting
  };

  const handleCalculateArea = () => {
    if (points.length < 3) {
      setError('Please click on the map to place at least 3 pins to form a closed polygon boundary.');
      return;
    }

    const gPath = points.map(p => new window.google.maps.LatLng(p.lat, p.lng));
    const closedPath = [...gPath, gPath[0]];

    polylineRef.current.setPath([]);
    polygonRef.current.setPath(closedPath);

    // Compute spherical area via Google Maps Utilities
    const calculatedArea = window.google.maps.geometry.spherical.computeArea(closedPath);
    setResult(calculatedArea);

    // Save calculation to history in background
    try {
      calculateApi.saveHistory(
        'Map Draw Calc',
        `${points.length} GPS Points sketched manually on grid`,
        `Spherical Area: ${calculatedArea.toFixed(2)} Sq Mt`
      );
    } catch (historyErr) {
      console.error("Failed to save history record", historyErr);
    }
  };

  const handlePopPoint = () => {
    const updated = points.slice(0, -1);
    setPoints(updated);
    setResult(null);
    setError('');
    redrawMap(updated);
  };

  const handleClear = () => {
    setPoints([]);
    setResult(null);
    setError('');
    clearMarkers();
    if (polylineRef.current) polylineRef.current.setPath([]);
    if (polygonRef.current) polygonRef.current.setPath([]);
  };

  const handleLoadDemo = () => {
    const demo = [
      { lat: 28.6139, lng: 77.2090 },
      { lat: 28.6145, lng: 77.2098 },
      { lat: 28.6138, lng: 77.2105 },
      { lat: 28.6132, lng: 77.2097 },
    ];
    setPoints(demo);
    setResult(null);
    setError('');
    redrawMap(demo);
  };

  return (
    <div className="tool-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">📐</span>
          <span>Map Draw Area Calculator</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="tool-welcome-badge">GPS Map Tool</div>
        <h1 className="tool-title">Map Draw Calc</h1>
        <p className="tool-desc">
          Click directly on the satellite map below to place boundary pins. The calculator will automatically outline the shape and compute the exact spherical area.
        </p>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="status-badge simulated">Google Maps Interactive</span>
            <button type="button" className="tool-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={handleLoadDemo}>
              📐 Draw Demo Boundary
            </button>
          </div>

          <div className="map-draw-controls">
            <span className="map-draw-pins-count">
              Pins Placed: <strong>{points.length}</strong>
            </span>
            <button type="button" className="map-control-btn" onClick={handlePopPoint} disabled={points.length === 0}>
              ❌ Undo Pin
            </button>
            <button type="button" className="map-control-btn" style={{ color: 'var(--magenta)' }} onClick={handleClear} disabled={points.length === 0}>
              🗑️ Reset Map
            </button>
            <button type="button" className="tool-btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={handleCalculateArea} disabled={points.length < 3}>
              Calculate Area
            </button>
          </div>

          {error && (
            <div style={{ color: 'var(--magenta)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '16px', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Interactive Google Map drawing canvas */}
          <div 
            ref={mapContainerRef} 
            className="map-canvas-container" 
            style={{ display: googleLoaded ? 'block' : 'flex' }}
          >
            {!googleLoaded && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Loading Google Maps Services...
              </div>
            )}
          </div>

          <div className="formula-box">
            <div style={{ fontWeight: '600' }}>Spherical Excess Mapping</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Calculates real geographic acreage using spherical trigonometry projection on Google Maps layout.
            </div>
          </div>

          {result !== null && (
            <div className="result-panel">
              <div className="result-label">Calculated Geographical Area</div>
              <div className="result-value">
                {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span style={{ fontSize: '1.4rem' }}>m²</span>
              </div>
              <div className="result-steps">
                <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Equivalent Units:</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '6px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                  <div>{(result * 10.7639).toLocaleString(undefined, { maximumFractionDigits: 1 })} Sq Ft</div>
                  <div>{(result / 4046.85).toFixed(4)} Acres</div>
                  <div>{(result / 632.32).toFixed(2)} Bigha</div>
                  <div>{(result / 31.616).toFixed(1)} Biswa</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
