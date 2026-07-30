import { useState } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../../components/InputField';
import { convertLength, getGattaInch } from '../../utils/localCalculator';
import { queueHistory } from '../../utils/historySync';
import CalculatorSettings from '../../components/CalculatorSettings';
import './Tools.css';

const LENGTH_UNITS = {
  Gatta: { name: 'Gatta', symbol: 'Gatta' },
  Meter: { name: 'Meters', symbol: 'm' },
  Foot: { name: 'Feet', symbol: 'ft' },
  Inch: { name: 'Inches', symbol: 'in' },
};

export default function LengthConvert() {
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState('Gatta');
  const [toUnit, setToUnit] = useState('Meter');
  const [result, setResult] = useState(null);
  const [quickConversions, setQuickConversions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setQuickConversions(null);

    const val = parseFloat(value);
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid non-negative value to convert');
      return;
    }

    setLoading(true);
    try {
      // 1. Convert current selection locally
      const resVal = convertLength(val, fromUnit, toUnit);
      setResult(resVal);
      
      // Save calculation to history locally (background synced)
      queueHistory(
        'Length Conversion',
        `${val} ${fromUnit}`,
        `${resVal.toFixed(4)} ${toUnit}`
      );

      // 2. Fetch all other conversions locally for quick display
      const displayKeys = ["Gatta", "Meter", "Foot", "Inch"];
      const convResults = displayKeys.map((key) => {
        const converted = convertLength(val, fromUnit, key);
        return {
          key,
          name: LENGTH_UNITS[key].name,
          symbol: LENGTH_UNITS[key].symbol,
          value: converted
        };
      });
      setQuickConversions(convResults);

    } catch (err) {
      setError(err.message || 'Error executing length conversion');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setValue('');
    setResult(null);
    setQuickConversions(null);
    setError('');
  };

  return (
    <div className="tool-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">📏</span>
          <span>Length & Gatta Converter</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="tool-welcome-badge">Convert Tool</div>
        <h1 className="tool-title">Length Convert</h1>
        <p className="tool-desc">
          Convert length measurements including standard surveying units like Gatta (99 inches rope/chain measurement), Meters, Feet, and Inches.
        </p>

        {/* Global Settings Panel */}
        <CalculatorSettings onSettingsChange={() => { setResult(null); setQuickConversions(null); }} />

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="status-badge functional">⚡ Local Calculation</span>
          </div>

          <form onSubmit={handleConvert}>
            <div className="tool-form-grid-three">
              <div className="form-field-group">
                <label className="field-label" htmlFor="len-val">Length Value</label>
                <div className="field-input-wrapper">
                  <InputField
                    id="len-val"
                    name="value"
                    type="number"
                    step="any"
                    placeholder="Enter value"
                    value={value}
                    onChange={(e) => { setValue(e.target.value); if (result) setResult(null); }}
                    icon="🔢"
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label">From</label>
                <select
                  value={fromUnit}
                  onChange={(e) => { setFromUnit(e.target.value); setResult(null); setQuickConversions(null); }}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-input)',
                    borderRadius: 'var(--radius-input)',
                    color: 'var(--text-primary)',
                    padding: '13px 16px',
                    fontFamily: 'var(--font-main)',
                    height: '51px'
                  }}
                >
                  {Object.entries(LENGTH_UNITS).map(([key, unit]) => (
                    <option key={key} value={key}>{unit.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label">To</label>
                <select
                  value={toUnit}
                  onChange={(e) => { setToUnit(e.target.value); setResult(null); setQuickConversions(null); }}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-input)',
                    borderRadius: 'var(--radius-input)',
                    color: 'var(--text-primary)',
                    padding: '13px 16px',
                    fontFamily: 'var(--font-main)',
                    height: '51px'
                  }}
                >
                  {Object.entries(LENGTH_UNITS).map(([key, unit]) => (
                    <option key={key} value={key}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--magenta)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '20px', textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="tool-btn-primary" disabled={loading}>
                {loading ? 'Converting...' : 'Convert Length'}
              </button>
              <button 
                type="button" 
                className="tool-btn-secondary" 
                onClick={handleClear}
                disabled={!value && !result && !quickConversions}
              >
                Clear
              </button>
            </div>
          </form>

          {result !== null && (
            <div className="result-panel">
              <div className="result-label">Conversion Result</div>
              <div className="result-value">
                {parseFloat(result.toFixed(6))} <span style={{ fontSize: '1.4rem' }}>{LENGTH_UNITS[toUnit].symbol}</span>
              </div>
              <div className="result-steps">
                <div>
                  {value} {fromUnit} = {parseFloat(result.toFixed(6))} {toUnit}
                </div>
              </div>
            </div>
          )}

          {quickConversions && (
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="field-label" style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--teal)' }}>
                All Conversions at a Glance
              </h3>
              <div className="conversion-summary-grid-four">
                {quickConversions.map((conv) => (
                  <div className="conv-chip" key={conv.key} style={{ border: conv.key === toUnit ? '1px solid var(--teal)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="conv-chip-val" style={{ color: conv.key === toUnit ? 'var(--teal)' : 'var(--text-primary)' }}>
                      {parseFloat(conv.value.toFixed(4))}
                    </div>
                    <div className="conv-chip-lbl">{conv.symbol}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
