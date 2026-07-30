import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../../components/InputField';
import { queueHistory } from '../../utils/historySync';
import './Tools.css';

export default function MapManual() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [points, setPoints] = useState([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const polygonRef = useRef(null);
  const markersRef = useRef([]);
  const controlsRef = useRef(null);

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

    // Delhi center reference initially
    const center = { lat: 28.6139, lng: 77.2090 };
    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: center,
      zoom: 16,
      mapTypeId: 'hybrid', // Hybrid satellite view only
      mapTypeControl: false, // Disables Map/Satellite terrain controls
      streetViewControl: false, // Disables Pegman street view man icon
      fullscreenControl: true, // Show fullscreen icon
      fullscreenControlOptions: {
        position: window.google.maps.ControlPosition.BOTTOM_LEFT // Moves fullscreen button to the bottom
      },
      disableDefaultUI: false,
    });

    if (controlsRef.current) {
      mapRef.current.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(controlsRef.current);
    }

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

    // Auto-locate user on initial page load / refresh
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = new window.google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );
          if (mapRef.current) {
            mapRef.current.setCenter(userLoc);
            mapRef.current.setZoom(18); // Zoom in closer
          }
        },
        (err) => {
          console.warn("Initial user tracking failed:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    // Tap/Click to plot listener
    mapRef.current.addListener('click', (e) => {
      setError('');
      setResult(null);

      const clickedLat = parseFloat(e.latLng.lat().toFixed(6));
      const clickedLng = parseFloat(e.latLng.lng().toFixed(6));

      // Fill form values
      setLat(clickedLat.toString());
      setLng(clickedLng.toString());

      // Add to path
      setPoints((prev) => [...prev, { lat: clickedLat, lng: clickedLng }]);
    });

    return () => {
      clearMarkers();
    };
  }, [googleLoaded]);

  // Reactive redraw whenever points list updates
  useEffect(() => {
    if (googleLoaded && mapRef.current) {
      redrawMap(points);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, googleLoaded]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const redrawMap = (updatedPoints) => {
    if (!mapRef.current) return;

    clearMarkers();

    const gPath = updatedPoints.map(p => new window.google.maps.LatLng(p.lat, p.lng));

    // Draw markers
    updatedPoints.forEach((p, idx) => {
      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(p.lat, p.lng),
        map: mapRef.current,
        label: {
          text: `P${idx + 1}`,
          color: '#ffffff',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF4EA1',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      });
      markersRef.current.push(marker);
    });

    // Update lines
    polylineRef.current.setPath(gPath);
    polygonRef.current.setPath([]); // Reset closed polygon back to paths
  };

  const handleAddPoint = (e) => {
    e.preventDefault();
    setError('');

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      setError('Please enter a valid Latitude (-90 to 90)');
      return;
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      setError('Please enter a valid Longitude (-180 to 180)');
      return;
    }

    setPoints((prev) => [...prev, { lat: latitude, lng: longitude }]);
    setLat('');
    setLng('');
    setResult(null);
  };

  const handleCalculateArea = () => {
    if (points.length < 3) {
      setError('You need at least 3 points to form a closed polygon for area calculation.');
      return;
    }

    const gPath = points.map(p => new window.google.maps.LatLng(p.lat, p.lng));
    const closedPath = [...gPath, gPath[0]];

    // Close on map
    polylineRef.current.setPath([]);
    polygonRef.current.setPath(closedPath);

    // Compute spherical area via Google Maps Utilities
    const calculatedArea = window.google.maps.geometry.spherical.computeArea(closedPath);
    setResult(calculatedArea);

    // Save calculation to history locally (background synced)
    queueHistory(
      'Map Manual',
      `${points.length} GPS Points mapped manually`,
      `Spherical Area: ${calculatedArea.toFixed(2)} Sq Mt`
    );
  };

  const handleClear = () => {
    setPoints([]);
    setLat('');
    setLng('');
    setResult(null);
    setError('');
    clearMarkers();
    if (polylineRef.current) polylineRef.current.setPath([]);
    if (polygonRef.current) polygonRef.current.setPath([]);
  };

  const handlePopPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
    setResult(null);
    setError('');
  };

  return (
    <div className="tool-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">✍️</span>
          <span>Map Manual Coordinates</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="tool-welcome-badge">GPS Map Tool</div>
        <h1 className="tool-title">Map Manual</h1>
        <p className="tool-desc">
          Enter GPS coordinates manually or click directly on the Google Map below to pinpoint boundary coordinates. Compute the exact spherical area.
        </p>

        <div className="glass-card">
          <div className="map-manual-header">
            <span className="status-badge simulated">Google Maps Integration</span>
            <div className="map-manual-header-buttons">
              <button 
                type="button" 
                className="tool-btn-secondary" 
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.78rem',
                  background: showManualForm ? 'var(--teal-dim)' : 'transparent',
                  borderColor: 'var(--teal)',
                  color: showManualForm ? 'var(--teal)' : 'var(--text-secondary)'
                }} 
                onClick={() => setShowManualForm(!showManualForm)}
              >
                {showManualForm ? '🛰️ Hide Inputs' : '🛰️ Add Coordinates Manually'}
              </button>
              <button 
                type="button" 
                className="tool-btn-primary" 
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                onClick={handleCalculateArea}
                disabled={points.length < 3}
              >
                📐 Calculate Area
              </button>
            </div>
          </div>

          {showManualForm && (
            <form onSubmit={handleAddPoint} style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
              <div className="tool-form-grid">
                <div className="form-field-group">
                  <label className="field-label" htmlFor="manual-lat">Latitude</label>
                  <div className="field-input-wrapper">
                    <InputField
                      id="manual-lat"
                      name="lat"
                      type="number"
                      step="any"
                      placeholder="e.g. 28.6139"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      icon="🛰️"
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="manual-lng">Longitude</label>
                  <div className="field-input-wrapper">
                    <InputField
                      id="manual-lng"
                      name="lng"
                      type="number"
                      step="any"
                      placeholder="e.g. 77.2090"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      icon="🛰️"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" className="tool-btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  📍 Add Pin Coordinate
                </button>
              </div>
            </form>
          )}

          {error && (
            <div style={{ color: 'var(--magenta)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '20px', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google Map Wrapper */}
          <div style={{ position: 'relative', marginTop: '20px', marginBottom: '20px' }}>
            {/* Custom Google Maps controls overlay - pushed into Google Maps DOM on init to show in fullscreen */}
            <div ref={controlsRef}>
              {points.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', padding: '10px' }}>
                  <button 
                    type="button" 
                    style={{
                      fontSize: '0.74rem',
                      background: 'rgba(30, 30, 30, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }} 
                    onClick={handlePopPoint}
                  >
                    ❌ Remove Last Pin
                  </button>
                  <button 
                    type="button" 
                    style={{
                      fontSize: '0.74rem',
                      background: 'rgba(229, 57, 53, 0.9)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }} 
                    onClick={handleClear}
                  >
                    🗑️ Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Google Map Canvas */}
            <div 
              ref={mapContainerRef} 
              className="map-canvas-container" 
              style={{ height: '400px', display: googleLoaded ? 'block' : 'flex' }}
            >
              {!googleLoaded && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Loading Google Maps Services...
                </div>
              )}
            </div>
          </div>

          <div className="formula-box">
            <div style={{ fontWeight: '600' }}>Coordinate Area Mapping</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
              Tip: You can **click directly on the satellite map** to drop pins and capture exact coordinates automatically!
            </div>
          </div>

          {result !== null && (
            <div className="result-panel">
              <div className="result-label">Calculated Area</div>
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
