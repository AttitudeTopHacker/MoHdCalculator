import { useState } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../../components/InputField';
import { calculateApi } from '../../api/calculateApi';
import './Tools.css';

export default function RectangleArea() {
  // Input fields matching Android form
  const [east, setEast] = useState('');
  const [west, setWest] = useState('');
  const [north, setNorth] = useState('');
  const [south, setSouth] = useState('');
  const [calculatorUnit, setCalculatorUnit] = useState('gatta'); // 'gatta' | 'foot' | 'meter'

  // Output states
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mode state: 'calc' (RESULT screen) or 'compass' (CONVERT screen)
  const [mode, setMode] = useState('calc'); 

  // Compass Visualizer unit selector
  const [visualizerUnit, setVisualizerUnit] = useState('gatta'); // 'gatta' | 'foot' | 'meter' | 'inch'
  const [visualizerData, setVisualizerData] = useState(null);

  // Conversion factors to Base Meter
  const factors = {
    gatta: 2.5146, // 99 inches * 0.0254
    foot: 0.3048,
    meter: 1.0,
    inch: 0.0254
  };

  const convertUnit = (val, from, to) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    // Convert to meters, then to target unit
    const meters = num * factors[from];
    return meters / factors[to];
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    setBreakdown(null);

    const eVal = parseFloat(east);
    const wVal = parseFloat(west);
    const nVal = parseFloat(north);
    const sVal = parseFloat(south);

    if (isNaN(eVal) || eVal <= 0) return setError('Please enter a valid positive East length');
    if (isNaN(wVal) || wVal <= 0) return setError('Please enter a valid positive West length');
    if (isNaN(nVal) || nVal <= 0) return setError('Please enter a valid positive North length');
    if (isNaN(sVal) || sVal <= 0) return setError('Please enter a valid positive South length');

    setLoading(true);
    try {
      // 1. Convert inputs to Gatta
      const eGatta = convertUnit(eVal, calculatorUnit, 'gatta');
      const wGatta = convertUnit(wVal, calculatorUnit, 'gatta');
      const nGatta = convertUnit(nVal, calculatorUnit, 'gatta');
      const sGatta = convertUnit(sVal, calculatorUnit, 'gatta');

      // 2. Sum Gatta dimensions matching Android SetEvaluate logic:
      // breath1 = East + West, length1 = North + South
      const sumBreadth = eGatta + wGatta;
      const sumLength = nGatta + sGatta;

      // 3. Call backend endpoint to get Acre / Beega / Bisha / Bisbanshi breakdown
      const res = await calculateApi.lengthBreadthBreakdown(sumLength, sumBreadth);
      if (res.data.success) {
        const data = res.data.data;
        setBreakdown({
          acre: data.part1,
          bigha: data.part2,
          biswa: data.part3,
          biswansi: data.part4
        });
      } else {
        setError(res.data.message || 'Breakdown calculation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred during calculation');
    } finally {
      setLoading(false);
    }
  };

  // Trigger conversion and switch to Compass Visualizer Mode
  const handleOpenVisualizer = async () => {
    setError('');
    const eVal = parseFloat(east);
    const wVal = parseFloat(west);
    const nVal = parseFloat(north);
    const sVal = parseFloat(south);

    if (isNaN(eVal) || eVal <= 0) return setError('Please fill all input fields before converting');
    if (isNaN(wVal) || wVal <= 0) return setError('Please fill all input fields before converting');
    if (isNaN(nVal) || nVal <= 0) return setError('Please fill all input fields before converting');
    if (isNaN(sVal) || sVal <= 0) return setError('Please fill all input fields before converting');

    // Default target visualizer unit matches the calculator unit initially
    setVisualizerUnit(calculatorUnit);
    setMode('compass');
    await fetchVisualizerBreakdown();
  };

  // Fetch breakdown for visualizer based on averages in meters
  const fetchVisualizerBreakdown = async () => {
    const eVal = parseFloat(east);
    const wVal = parseFloat(west);
    const nVal = parseFloat(north);
    const sVal = parseFloat(south);

    // Convert dimensions to meters
    const eM = convertUnit(eVal, calculatorUnit, 'meter');
    const wM = convertUnit(wVal, calculatorUnit, 'meter');
    const nM = convertUnit(nVal, calculatorUnit, 'meter');
    const sM = convertUnit(sVal, calculatorUnit, 'meter');

    const avgBreadthM = (eM + wM) / 2.0;
    const avgLengthM = (nM + sM) / 2.0;
    const sqM = avgLengthM * avgBreadthM;

    try {
      const res = await calculateApi.bighaBreakdown(sqM);
      if (res.data.success) {
        setVisualizerData({
          sqM,
          bigha: res.data.data.bigha,
          biswa: res.data.data.biswa,
          biswansi: res.data.data.biswansi
        });
      }
    } catch (err) {
      console.error('Failed to load visualizer breakdown', err);
    }
  };

  const handleClear = () => {
    setEast('');
    setWest('');
    setNorth('');
    setSouth('');
    setBreakdown(null);
    setVisualizerData(null);
    setError('');
  };

  return (
    <div className="tool-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">⏹️</span>
          <span>Area Rectangle</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="tool-welcome-badge">Shape Calculator</div>
        
        {/* Toggle Mode headers */}
        {mode === 'calc' ? (
          <>
            <h1 className="tool-title">Rectangle Area</h1>
            <p className="tool-desc">
              Enter four boundary lengths. Calculate traditional Mixed-Unit breakdowns (Acre / Beega / Bisha / Bisbanshi) using averaged bounds.
            </p>
          </>
        ) : (
          <>
            <h1 className="tool-title">Compass Visualizer</h1>
            <p className="tool-desc">
              Visual compass layout displaying boundary lengths in real-time. Change unit formats instantly below.
            </p>
          </>
        )}

        {/* Banner from decompiled Android String: 1 Acres = 6.399 Bigha */}
        <div className="formula-box" style={{ marginTop: '0', marginBottom: '24px', background: 'var(--teal-dim)', borderColor: 'var(--teal)' }}>
          <div style={{ fontWeight: '700', color: 'var(--teal)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💡 Reference Scale:</span>
            <span style={{ color: 'var(--text-primary)' }}>1 Acre = 6.399 Bigha</span>
          </div>
        </div>

        <div className="glass-card">
          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            <button 
              className={`tab-btn ${mode === 'calc' ? 'active' : ''}`}
              onClick={() => setMode('calc')}
              style={{
                background: mode === 'calc' ? 'var(--teal-dim)' : 'transparent',
                color: mode === 'calc' ? 'var(--teal)' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              📝 Calculator Mode (RESULT)
            </button>
            <button 
              className={`tab-btn ${mode === 'compass' ? 'active' : ''}`}
              onClick={handleOpenVisualizer}
              style={{
                background: mode === 'compass' ? 'var(--teal-dim)' : 'transparent',
                color: mode === 'compass' ? 'var(--teal)' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🧭 Compass Visualizer (CONVERT)
            </button>
          </div>

          {mode === 'calc' ? (
            /* CALCULATOR INPUT FORM */
            <form onSubmit={handleCalculate}>
              <div className="triangle-header-container">
                <span className="status-badge functional">Averaging Boundaries</span>
                
                {/* Unit Radio Selector */}
                <div className="triangle-radio-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input 
                      type="radio" 
                      name="calculatorUnit" 
                      value="gatta" 
                      checked={calculatorUnit === 'gatta'} 
                      onChange={() => { setCalculatorUnit('gatta'); setBreakdown(null); }}
                      style={{ accentColor: 'var(--teal)' }}
                    />
                    Gatta(99inch)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input 
                      type="radio" 
                      name="calculatorUnit" 
                      value="foot" 
                      checked={calculatorUnit === 'foot'} 
                      onChange={() => { setCalculatorUnit('foot'); setBreakdown(null); }}
                      style={{ accentColor: 'var(--teal)' }}
                    />
                    Foot
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input 
                      type="radio" 
                      name="calculatorUnit" 
                      value="meter" 
                      checked={calculatorUnit === 'meter'} 
                      onChange={() => { setCalculatorUnit('meter'); setBreakdown(null); }}
                      style={{ accentColor: 'var(--teal)' }}
                    />
                    Meter
                  </label>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="tool-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
                <div className="form-field-group">
                  <label className="field-label" htmlFor="east-len">Enter Length of East</label>
                  <div className="field-input-wrapper">
                    <InputField
                      id="east-len"
                      name="east"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={east}
                      onChange={(e) => { setEast(e.target.value); setBreakdown(null); }}
                      icon="🧭"
                    />
                    <span className="field-unit" style={{ textTransform: 'capitalize' }}>{calculatorUnit}</span>
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="west-len">Enter Length of West</label>
                  <div className="field-input-wrapper">
                    <InputField
                      id="west-len"
                      name="west"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={west}
                      onChange={(e) => { setWest(e.target.value); setBreakdown(null); }}
                      icon="🧭"
                    />
                    <span className="field-unit" style={{ textTransform: 'capitalize' }}>{calculatorUnit}</span>
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="north-len">Enter Length of North</label>
                  <div className="field-input-wrapper">
                    <InputField
                      id="north-len"
                      name="north"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={north}
                      onChange={(e) => { setNorth(e.target.value); setBreakdown(null); }}
                      icon="🧭"
                    />
                    <span className="field-unit" style={{ textTransform: 'capitalize' }}>{calculatorUnit}</span>
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="south-len">Enter Length of South</label>
                  <div className="field-input-wrapper">
                    <InputField
                      id="south-len"
                      name="south"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={south}
                      onChange={(e) => { setSouth(e.target.value); setBreakdown(null); }}
                      icon="🧭"
                    />
                    <span className="field-unit" style={{ textTransform: 'capitalize' }}>{calculatorUnit}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ color: 'var(--magenta)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '20px', textAlign: 'center' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="rectangle-buttons-container">
                <button type="submit" className="tool-btn-primary" disabled={loading} style={{ flex: 2 }}>
                  {loading ? 'Calculating...' : 'Get Result'}
                </button>
                <button type="button" className="tool-btn-secondary" onClick={handleOpenVisualizer} style={{ flex: 2 }}>
                  🧭 Convert & Visualize
                </button>
                <button 
                  type="button" 
                  className="tool-btn-secondary" 
                  onClick={handleClear}
                  style={{ flex: 1 }}
                  disabled={!east && !west && !north && !south && !breakdown}
                >
                  Clear
                </button>
              </div>
            </form>
          ) : (
            /* COMPASS VISUALIZER SCREEN */
            <div>
              {/* Visualizer Target Unit Dropdown Spinner */}
              <div className="triangle-header-container" style={{ marginBottom: '32px' }}>
                <span className="status-badge simulated">Radar Compass Mode</span>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="field-label" style={{ margin: 0, fontSize: '0.8rem' }}>Convert Display Unit:</span>
                  <select 
                    value={visualizerUnit} 
                    onChange={(e) => setVisualizerUnit(e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      padding: '4px 8px',
                      fontFamily: 'var(--font-main)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <option value="gatta">Gatta (99 inch)</option>
                    <option value="foot">Foot</option>
                    <option value="meter">Meter</option>
                    <option value="inch">Inch</option>
                  </select>
                </div>
              </div>

              {/* Radial Compass Radar graphic */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="compass-radar-wrapper">
                  {/* Outer circle accent ring */}
                  <div className="compass-inner-accent" />

                  {/* Glowing center hub */}
                  <div className="compass-center-hub">
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', trackingLetter: '1px', color: 'var(--text-muted)' }}>Display Unit</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--teal)', textTransform: 'capitalize', marginTop: '2px' }}>{visualizerUnit}</div>
                  </div>

                  {/* Compass Labels */}
                  {/* Top (North) */}
                  <div className="compass-label-north">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>NORTH</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '750', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {convertUnit(north, calculatorUnit, visualizerUnit).toFixed(2)}
                    </div>
                  </div>

                  {/* Right (East) */}
                  <div className="compass-label-east">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>EAST</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '750', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {convertUnit(east, calculatorUnit, visualizerUnit).toFixed(2)}
                    </div>
                  </div>

                  {/* Bottom (South) */}
                  <div className="compass-label-south">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>SOUTH</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '750', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {convertUnit(south, calculatorUnit, visualizerUnit).toFixed(2)}
                    </div>
                  </div>

                  {/* Left (West) */}
                  <div className="compass-label-west">
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>WEST</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '750', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {convertUnit(west, calculatorUnit, visualizerUnit).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visualizer Area Output box */}
              {visualizerData && (
                <div className="formula-box" style={{ marginTop: '36px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Calculated Square Metres:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--teal)' }}>{visualizerData.sqM.toFixed(3)} m²</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>[Bigha = {visualizerData.bigha}]</span>
                    <span>[Biswa = {visualizerData.biswa}]</span>
                    <span>[Biswansi = {visualizerData.biswansi}]</span>
                  </div>
                </div>
              )}

              {/* Back to Calculator button */}
              <button 
                type="button" 
                className="tool-btn-secondary" 
                onClick={() => setMode('calc')} 
                style={{ width: '100%', marginTop: '20px' }}
              >
                ← Back to Input Form
              </button>
            </div>
          )}

          {/* CALCULATOR RESULT SECTION */}
          {mode === 'calc' && breakdown !== null && (
            <div className="result-panel" style={{ marginTop: '28px' }}>
              <div className="result-label">Mixed-Unit Division Breakdown</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '20px' }}>
                <span>Average Breadth: {((parseFloat(east) + parseFloat(west)) / 2.0).toFixed(2)} {calculatorUnit}</span>
                <span>•</span>
                <span>Average Length: {((parseFloat(north) + parseFloat(south)) / 2.0).toFixed(2)} {calculatorUnit}</span>
              </div>

              <div className="conversion-summary-grid-four">
                <div className="conv-chip">
                  <div className="conv-chip-val" style={{ color: 'var(--teal)' }}>{breakdown.acre}</div>
                  <div className="conv-chip-lbl">Acre</div>
                </div>
                <div className="conv-chip">
                  <div className="conv-chip-val" style={{ color: 'var(--teal)' }}>{breakdown.bigha}</div>
                  <div className="conv-chip-lbl">Beega</div>
                </div>
                <div className="conv-chip">
                  <div className="conv-chip-val" style={{ color: 'var(--teal)' }}>{breakdown.biswa}</div>
                  <div className="conv-chip-lbl">Bisha</div>
                </div>
                <div className="conv-chip">
                  <div className="conv-chip-val" style={{ color: 'var(--teal)' }}>{breakdown.biswansi}</div>
                  <div className="conv-chip-lbl">Bisbanshi</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
