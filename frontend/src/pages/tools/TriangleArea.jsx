import { useState } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../../components/InputField';
import { calculateApi } from '../../api/calculateApi';
import './Tools.css';

export default function TriangleArea() {
  const [sideA, setSideA] = useState('');
  const [sideB, setSideB] = useState('');
  const [sideC, setSideC] = useState('');
  const [unit, setUnit] = useState('gatta'); // 'gatta' | 'foot' | 'meter'
  const [result, setResult] = useState(null);
  const [isValidationError, setIsValidationError] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const convertToMeters = (val, currentUnit) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    if (currentUnit === 'gatta') {
      // 1 Gatta = 99 inches = 99 * 0.0254 meters = 2.5146 meters
      return num * 2.5146;
    }
    if (currentUnit === 'foot') {
      // 1 Foot = 0.3048 meters
      return num * 0.3048;
    }
    return num; // meter
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    setIsValidationError(false);
    setResult(null);

    const rawA = parseFloat(sideA);
    const rawB = parseFloat(sideB);
    const rawC = parseFloat(sideC);

    if (isNaN(rawA) || rawA <= 0) {
      setError('Please enter a valid positive length for Side A');
      return;
    }
    if (isNaN(rawB) || rawB <= 0) {
      setError('Please enter a valid positive length for Side B');
      return;
    }
    if (isNaN(rawC) || rawC <= 0) {
      setError('Please enter a valid positive length for Side C');
      return;
    }

    // Convert to base unit meters for triangle validation and calculations
    const a = convertToMeters(rawA, unit);
    const b = convertToMeters(rawB, unit);
    const c = convertToMeters(rawC, unit);

    // Verify Triangle Inequality Theorem in base meters
    if (a + b <= c || a + c <= b || b + c <= a) {
      setError('Invalid side lengths! The sum of any two sides must be strictly greater than the third side (a + b > c).');
      setIsValidationError(true);
      return;
    }

    setLoading(true);
    try {
      // 1. Calculate Triangle Area (Heron's Formula in square meters)
      const areaRes = await calculateApi.triangleArea(a, b, c);
      if (areaRes.data.success) {
        const areaSqM = areaRes.data.data.areaSqUnits;

        // 2. Fetch traditional Bigha / Biswa / Biswansi breakdown
        const breakdownRes = await calculateApi.bighaBreakdown(areaSqM);
        if (breakdownRes.data.success) {
          const breakdown = breakdownRes.data.data;
          setResult({
            areaSqM,
            bigha: breakdown.bigha,
            biswa: breakdown.biswa,
            biswansi: breakdown.biswansi
          });
        } else {
          setError(breakdownRes.data.message || 'Breakdown calculation failed');
        }
      } else {
        setError(areaRes.data.message || 'Triangle calculation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Calculation failed. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSideA('');
    setSideB('');
    setSideC('');
    setResult(null);
    setError('');
    setIsValidationError(false);
  };

  return (
    <div className="tool-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">🔺</span>
          <span>Area Triangle</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="tool-welcome-badge">Shape Calculator</div>
        <h1 className="tool-title">Area of Triangle</h1>
        
        {/* Banner from decompiled Android String: 1 Acres = 6.399 Bigha */}
        <div className="formula-box" style={{ marginTop: '0', marginBottom: '24px', background: 'var(--teal-dim)', borderColor: 'var(--teal)' }}>
          <div style={{ fontWeight: '700', color: 'var(--teal)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💡 Reference Scale:</span>
            <span style={{ color: 'var(--text-primary)' }}>1 Acre = 6.399 Bigha</span>
          </div>
        </div>

        <div className="glass-card">
          <div className="triangle-header-container">
            <span className="status-badge functional">Heron's Formula Logic</span>
            
            {/* Unit Radio Group matching android selector */}
            <div className="triangle-radio-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input 
                  type="radio" 
                  name="unit" 
                  value="gatta" 
                  checked={unit === 'gatta'} 
                  onChange={() => { setUnit('gatta'); setResult(null); }}
                  style={{ accentColor: 'var(--teal)' }}
                />
                Gatta (99inch)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input 
                  type="radio" 
                  name="unit" 
                  value="foot" 
                  checked={unit === 'foot'} 
                  onChange={() => { setUnit('foot'); setResult(null); }}
                  style={{ accentColor: 'var(--teal)' }}
                />
                Foot
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input 
                  type="radio" 
                  name="unit" 
                  value="meter" 
                  checked={unit === 'meter'} 
                  onChange={() => { setUnit('meter'); setResult(null); }}
                  style={{ accentColor: 'var(--teal)' }}
                />
                Meter
              </label>
            </div>
          </div>

          <form onSubmit={handleCalculate}>
            <div className="tool-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <div className="form-field-group">
                <label className="field-label" htmlFor="side-a">Enter Length of A</label>
                <div className="field-input-wrapper">
                  <InputField
                    id="side-a"
                    name="sideA"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={sideA}
                    onChange={(e) => { setSideA(e.target.value); if (result) setResult(null); }}
                    icon="📏"
                  />
                  <span className="field-unit" style={{ textTransform: 'capitalize' }}>{unit}</span>
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="side-b">Enter Length of B</label>
                <div className="field-input-wrapper">
                  <InputField
                    id="side-b"
                    name="sideB"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={sideB}
                    onChange={(e) => { setSideB(e.target.value); if (result) setResult(null); }}
                    icon="📏"
                  />
                  <span className="field-unit" style={{ textTransform: 'capitalize' }}>{unit}</span>
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="side-c">Enter Length of C</label>
                <div className="field-input-wrapper">
                  <InputField
                    id="side-c"
                    name="sideC"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={sideC}
                    onChange={(e) => { setSideC(e.target.value); if (result) setResult(null); }}
                    icon="📏"
                  />
                  <span className="field-unit" style={{ textTransform: 'capitalize' }}>{unit}</span>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ color: 'var(--magenta)', fontSize: '0.85rem', fontWeight: '500', textAlign: 'center' }}>
                  ⚠️ {error}
                </div>
                {isValidationError && (
                  <button 
                    type="button" 
                    onClick={() => setShowInstruction(true)}
                    style={{
                      border: '1px dashed var(--teal)',
                      background: 'rgba(46, 230, 197, 0.06)',
                      color: 'var(--teal)',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    💡 Bad/Irregular Shape? Split & Measure Guide
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" className="tool-btn-primary" disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Calculating...' : 'Calculate Area'}
              </button>
              <button 
                type="button" 
                className="tool-btn-secondary" 
                onClick={handleClear}
                style={{ flex: 1 }}
                disabled={!sideA && !sideB && !sideC && !result}
              >
                Clear
              </button>
            </div>
          </form>

          {result !== null && (
            <div className="result-panel" style={{ marginTop: '28px' }}>
              <div className="result-label">Calculated Area</div>
              
              {/* Main Square Metre display */}
              <div className="result-value">
                {result.areaSqM.toFixed(2)} <span style={{ fontSize: '1.4rem' }}>m²</span>
              </div>

              {/* Bigha/Biswa breakdown outputs matching Android UI */}
              <div className="result-steps" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px' }}>Traditional Unit breakdown:</div>
                <div className="conversion-summary-grid-three">
                  <div className="conv-chip">
                    <div className="conv-chip-val" style={{ color: 'var(--teal)' }}>{result.bigha}</div>
                    <div className="conv-chip-lbl">Bigha</div>
                  </div>
                  <div className="conv-chip">
                    <div className="conv-chip-val" style={{ color: 'var(--teal)' }}>{result.biswa}</div>
                    <div className="conv-chip-lbl">Biswa</div>
                  </div>
                  <div className="conv-chip">
                    <div className="conv-chip-val" style={{ color: 'var(--teal)' }}>{result.biswansi}</div>
                    <div className="conv-chip-lbl">Biswansi</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showInstruction && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(8, 8, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '460px',
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid rgba(46, 230, 197, 0.25)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            color: 'var(--text-primary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--teal)', fontSize: '1.1rem', fontWeight: '700' }}>
                📐 Irregular Land Measurement Guide
              </h3>
              <button 
                type="button" 
                onClick={() => setShowInstruction(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '12px' }}>
                Agar aapke zameen (land plot) ki dimensions aisi hain jo ek seedha (valid) triangle nahi banati hain (jaise ek side baaki dono se bahut lambi hai), toh use <strong>Irregular/Bad Shape</strong> kaha jata hai.
              </p>
              <p style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Iska area nikalne ke liye yeh steps follow karein:
              </p>
              
              <ol style={{ paddingLeft: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>1. Tukdo me baatein (Divide into parts):</strong> Apne pure bad-shape area ko aasan geometric shapes me divide kar lein (jaise Rectangles, Squares ya chote Triangles).
                </li>
                <li>
                  <strong>2. Rectangle parts ka area napein:</strong> Jo hissa rectangular ya square ban raha hai, use <Link to="/dashboard/rectangle-area" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Rectangle Tool</Link> ka use karke measure karein.
                </li>
                <li>
                  <strong>3. Triangle parts ka area napein:</strong> Jo hissa triangular (teekha/kona) ban raha hai, use <span style={{ color: 'var(--teal)', fontWeight: '600' }}>Triangle Tool</span> ka use karke measure karein.
                </li>
                <li>
                  <strong>4. Total Area Sum karein:</strong> Sabhi alag-alag tukdo (shapes) ke calculated areas ko aapas me jod (add) dein. Isse aapko pure irregular land ka exact correct area mil jayega!
                </li>
              </ol>
            </div>

            <button 
              type="button" 
              className="tool-btn-primary" 
              onClick={() => setShowInstruction(false)}
              style={{ marginTop: '8px', width: '100%' }}
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
