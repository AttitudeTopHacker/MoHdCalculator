import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { queueHistory } from '../../utils/historySync';
import './Tools.css';

export default function MapAuto() {
  const navigate = useNavigate();
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [trackingState, setTrackingState] = useState('idle'); // 'idle' | 'tracking'
  const [points, setPoints] = useState([]);
  const [area, setArea] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('Acquiring signal...');
  const [gpsAvailable, setGpsAvailable] = useState(true);

  // Floating Toast notification state
  const [toast, setToast] = useState('');
  const toastTimeoutRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const polygonRef = useRef(null);
  const currentMarkerRef = useRef(null); // Single user position marker
  const watchIdRef = useRef(null);
  const currentLatLngRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast('');
      toastTimeoutRef.current = null;
    }, 3200);
  };

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

    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!googleLoaded || !mapContainerRef.current) return;

    // Centered on New DelhiConnaught Place initially
    const center = { lat: 28.6139, lng: 77.2090 };
    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: center,
      zoom: 18,
      mapTypeId: 'hybrid', // Satellite view
      disableDefaultUI: true, // Hide default controls for a clean app feel
      zoomControl: false,
    });

    polylineRef.current = new window.google.maps.Polyline({
      strokeColor: '#FF4EA1',
      strokeOpacity: 0.9,
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
    centerOnMyLocation();

    return () => {
      clearWatch();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleLoaded]);

  const clearWatch = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const removeCurrentMarker = () => {
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null);
      currentMarkerRef.current = null;
    }
  };

  // Center on user position smoothly
  const centerOnMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    
    setGpsStatus('Acquiring location...');

    const successCallback = (position) => {
      const current = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      currentLatLngRef.current = current;
      setGpsAvailable(true);
      setGpsStatus(`GPS Active (Acc: ±${position.coords.accuracy.toFixed(0)}m)`);
      if (mapRef.current) {
        mapRef.current.panTo(new window.google.maps.LatLng(current.lat, current.lng));
        mapRef.current.setZoom(19);
      }
    };

    const errorCallback = (err) => {
      console.warn('Geolocation high accuracy lock failed, falling back...', err.message);
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (fallbackErr) => {
          console.warn('Geolocation standard lock failed:', fallbackErr.message);
          setGpsAvailable(false);
          setGpsStatus('GPS signals unavailable. Click on the map to plot mock nodes.');
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleStartTracking = () => {
    if (!googleLoaded || !mapRef.current) return;

    clearWatch();
    removeCurrentMarker();
    setPoints([]);
    setArea(0);
    polylineRef.current.setPath([]);
    polygonRef.current.setPath([]);

    setTrackingState('tracking');
    setGpsStatus('Acquiring starting position...');

    if (!navigator.geolocation) {
      setGpsStatus('GPS Geolocation API not supported.');
      setGpsAvailable(false);
      return;
    }

    const startWatching = (highAccuracy) => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const newPoint = { lat: latitude, lng: longitude };
          currentLatLngRef.current = newPoint;
          setGpsAvailable(true);
          setGpsStatus(`GPS Active (Acc: ±${accuracy.toFixed(1)}m)`);
          processNewLocation(newPoint);
        },
        (error) => {
          console.warn(`watchPosition (highAccuracy=${highAccuracy}) failed:`, error.message);
          if (highAccuracy) {
            clearWatch();
            startWatching(false);
          } else {
            setGpsStatus('GPS signal lost. Click on map to plot mock nodes.');
            setGpsAvailable(false);
          }
        },
        { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 0 }
      );
    };

    const successInitial = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const startPoint = { lat: latitude, lng: longitude };
      currentLatLngRef.current = startPoint;
      setGpsAvailable(true);
      setGpsStatus(`GPS Active (Acc: ±${accuracy.toFixed(1)}m)`);

      const googleLatLng = new window.google.maps.LatLng(startPoint.lat, startPoint.lng);
      mapRef.current.panTo(googleLatLng);
      mapRef.current.setZoom(19);

      processNewLocation(startPoint);
      startWatching(true);
    };

    const errorInitial = (err) => {
      console.warn('Initial high-accuracy geolocation failed, falling back...', err.message);
      navigator.geolocation.getCurrentPosition(
        successInitial,
        (fallbackErr) => {
          console.warn('Standard initial geolocation failed:', fallbackErr.message);
          setGpsStatus('GPS unavailable. Click on map to simulate boundary nodes.');
          setGpsAvailable(false);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      successInitial,
      errorInitial,
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const processNewLocation = (latlng) => {
    setPoints((prevPoints) => {
      // Filter duplicate or jittery coordinates
      if (prevPoints.length > 0) {
        const last = prevPoints[prevPoints.length - 1];
        const latDiff = Math.abs(last.lat - latlng.lat);
        const lngDiff = Math.abs(last.lng - latlng.lng);
        if (latDiff < 0.000002 && lngDiff < 0.000002) {
          return prevPoints;
        }
      }

      const updatedPoints = [...prevPoints, latlng];
      const googleLatLng = new window.google.maps.LatLng(latlng.lat, latlng.lng);

      // Slide camera smoothly to follow walking user
      mapRef.current.panTo(googleLatLng);

      // Toast alert on starting node set
      if (updatedPoints.length === 1) {
        showToast("Tracking started. Pin Point A set!");
      }

      // Update single user position marker (no numbered markers P1, P2...)
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setPosition(googleLatLng);
      } else {
        currentMarkerRef.current = new window.google.maps.Marker({
          position: googleLatLng,
          map: mapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF4EA1',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          title: 'Current Position'
        });
      }

      const pathLatLngs = updatedPoints.map(p => new window.google.maps.LatLng(p.lat, p.lng));
      polylineRef.current.setPath(pathLatLngs);

      // Render live polygon shaded area closed back to point A
      if (updatedPoints.length >= 3) {
        const firstPoint = new window.google.maps.LatLng(updatedPoints[0].lat, updatedPoints[0].lng);
        polygonRef.current.setPath([...pathLatLngs, firstPoint]);

        // Auto-close proximity condition (< 5m to first point)
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(firstPoint, googleLatLng);
        if (distance < 5.0 && updatedPoints.length > 3) {
          showToast("Auto-Closed Boundary Capture!");
          handleFinishCapture(updatedPoints);
          return updatedPoints;
        }
      } else {
        polygonRef.current.setPath([]);
      }

      // Live area calculation in square meters
      if (updatedPoints.length >= 3) {
        const pathLatLngsForArea = updatedPoints.map(p => new window.google.maps.LatLng(p.lat, p.lng));
        const calculated = window.google.maps.geometry.spherical.computeArea(pathLatLngsForArea);
        setArea(calculated);
      }

      return updatedPoints;
    });
  };

  const handleStopAndCalculate = () => {
    if (points.length < 3) {
      showToast("Minimum 3 points (lines) are required to form an area.");
      return;
    }
    handleFinishCapture(points);
  };

  const handleFinishCapture = (capturedPoints) => {
    clearWatch();
    removeCurrentMarker();

    const pathLatLngs = capturedPoints.map(p => new window.google.maps.LatLng(p.lat, p.lng));
    const firstPoint = new window.google.maps.LatLng(capturedPoints[0].lat, capturedPoints[0].lng);
    const closedPath = [...pathLatLngs, firstPoint];

    // Compute final area
    const finalArea = window.google.maps.geometry.spherical.computeArea(closedPath);

    // Save calculation to history locally (background synced)
    queueHistory(
      'Map Auto',
      `${capturedPoints.length} GPS Points tracked automatically`,
      `Spherical Area: ${finalArea.toFixed(2)} Sq Mt`
    );

    // Snappy direct redirect to Area Convert (no delay overlay)
    navigate('/dashboard/area-convert', {
      state: {
        initialValue: finalArea,
        initialFromUnit: 'Square Metre'
      }
    });
  };

  const handleResetMap = () => {
    clearWatch();
    removeCurrentMarker();
    setPoints([]);
    setArea(0);
    setTrackingState('idle');
    setGpsStatus('Idle');
    if (polylineRef.current) polylineRef.current.setPath([]);
    if (polygonRef.current) polygonRef.current.setPath([]);
    centerOnMyLocation();
  };

  return (
    <div className="tool-page map-fit-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">🛰️</span>
          <span>Google Map Auto Capture</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="map-wrapper">
          
          {/* Top-Floating Dashboard with GPS Status */}
          <div className="floating-status-bar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '360px',
            padding: '8px 16px',
            top: '16px',
            borderRadius: '24px',
            backdropFilter: 'blur(16px) saturate(180%)',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#fff', fontWeight: '600' }}>
              <span className={`status-dot ${trackingState === 'tracking' ? 'active' : !gpsAvailable ? 'error' : ''}`} />
              <span>{gpsStatus}</span>
            </div>
          </div>

          {/* Live glowing area metric display at right-bottom */}
          <div className="live-area-widget">
            <div style={{ fontSize: '0.58rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--teal)' }}>
              Live Area
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
              {area.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>m²</span>
            </div>
          </div>

          {/* Glowing Toast Notification Pill */}
          {toast && (
            <div className="floating-toast-alert">
              {toast}
            </div>
          )}

          {/* Map canvas element */}
          <div ref={mapContainerRef} className="map-google-element">
            {!googleLoaded && (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Loading Google Maps Services...
              </div>
            )}
          </div>

          {/* Floating Location Center Button */}
          {googleLoaded && (
            <button 
              type="button" 
              className="floating-location-btn" 
              onClick={centerOnMyLocation} 
              title="Center on my location"
              style={{ bottom: '92px' }}
            >
              🎯
            </button>
          )}

          {/* Bottom Action Button Tray */}
          {googleLoaded && (
            <div className="floating-action-btn-container" style={{ bottom: '16px' }}>
              {trackingState === 'idle' && (
                <button type="button" className="floating-action-btn start" onClick={handleStartTracking} style={{ minWidth: '180px' }}>
                  🟢 Start Tracking
                </button>
              )}

              {trackingState === 'tracking' && (
                <button type="button" className="floating-action-btn stop" onClick={handleStopAndCalculate} style={{ minWidth: '180px' }}>
                  🛑 Stop & Calculate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Float Reset Map option if points exist */}
        {points.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button type="button" className="tool-btn-secondary" style={{ padding: '8px 20px', fontSize: '0.82rem', color: 'var(--magenta)' }} onClick={handleResetMap}>
              🗑️ Reset Walk Tracker
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
