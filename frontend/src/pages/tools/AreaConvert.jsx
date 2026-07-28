import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import InputField from '../../components/InputField';
import { calculateApi } from '../../api/calculateApi';
import './Tools.css';

const UNITS = {
  "Square Metre": { name: 'Square Metres', symbol: 'm²' },
  "Square Kilometre": { name: 'Square Kilometres', symbol: 'km²' },
  "Square Centimetre": { name: 'Square Centimetres', symbol: 'cm²' },
  "Square Millimetre": { name: 'Square Millimetres', symbol: 'mm²' },
  "Square Feet": { name: 'Square Feet', symbol: 'ft²' },
  "Square Inch": { name: 'Square Inches', symbol: 'in²' },
  "Square Yard": { name: 'Square Yards', symbol: 'yd²' },
  "Square Mile": { name: 'Square Miles', symbol: 'mi²' },
  "Acre": { name: 'Acres', symbol: 'ac' },
  "Hectare": { name: 'Hectares', symbol: 'ha' },
  "Bigha": { name: 'Bigha', symbol: 'Bigha' },
  "Biswa": { name: 'Biswa', symbol: 'Biswa' },
  "Biswansi": { name: 'Biswansi', symbol: 'Biswansi' },
};

export default function AreaConvert() {
  const location = useLocation();
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState('Square Metre');
  const [toUnit, setToUnit] = useState('Square Feet');
  const [result, setResult] = useState(null);
  const [quickConversions, setQuickConversions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Primary conversion executor
  const runConversion = async (val, from, to) => {
    setError('');
    setResult(null);
    setQuickConversions(null);
    setLoading(true);
    try {
      // 1. Primary conversion
      const res = await calculateApi.convert(val, from, to);
      if (res.data.success) {
        setResult(res.data.data.result);
      } else {
        setError(res.data.message || 'Conversion failed');
        setLoading(false);
        return;
      }

      // 2. Fetch all key conversions at a glance
      const displayKeys = ["Square Metre", "Square Feet", "Square Yard", "Acre", "Hectare", "Bigha"];
      const promises = displayKeys.map(async (key) => {
        const itemRes = await calculateApi.convert(val, from, key);
        return {
          key,
          name: UNITS[key].name,
          symbol: UNITS[key].symbol,
          value: itemRes.data.data.result
        };
      });

      const convResults = await Promise.all(promises);
      setQuickConversions(convResults);

    } catch (err) {
      setError(err.response?.data?.message || 'Error executing conversion on the server');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = (e) => {
    e.preventDefault();
    const val = parseFloat(value);
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid non-negative value to convert');
      return;
    }
    runConversion(val, fromUnit, toUnit);
  };

  // Catch navigation state parameters (e.g. redirected from MapAuto Capture)
  useEffect(() => {
    if (location.state?.initialValue !== undefined) {
      const val = parseFloat(location.state.initialValue);
      const from = location.state.initialFromUnit || 'Square Metre';
      
      setValue(val.toString());
      setFromUnit(from);
      
      // Auto trigger conversion
      runConversion(val, from, toUnit);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
          <span className="tool-header-icon">🔄</span>
          <span>Area Unit Converter</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="tool-welcome-badge">Convert Tool</div>
        <h1 className="tool-title">Area Convert</h1>
        <p className="tool-desc">
          Convert seamlessly between international and regional area units. Calculations are processed through the Spring Boot unit conversion engine.
        </p>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="status-badge functional">Backend REST Connected</span>
          </div>
          <form onSubmit={handleConvert}>
            <div className="tool-form-grid-three">
              <div className="form-field-group">
                <label className="field-label" htmlFor="conv-value">Value</label>
                <div className="field-input-wrapper">
                  <InputField
                    id="conv-value"
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
                  {Object.entries(UNITS).map(([key, unit]) => (
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
                  {Object.entries(UNITS).map(([key, unit]) => (
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
                {loading ? 'Converting...' : 'Convert Unit'}
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
                {result.toLocaleString(undefined, { maximumFractionDigits: 6 })} <span style={{ fontSize: '1.4rem' }}>{UNITS[toUnit].symbol}</span>
              </div>
              <div className="result-steps">
                <div>
                  {value} {UNITS[fromUnit].name} = {result.toLocaleString(undefined, { maximumFractionDigits: 6 })} {UNITS[toUnit].name}
                </div>
              </div>
            </div>
          )}

          {quickConversions && (
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="field-label" style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--teal)' }}>
                Common Conversions at a Glance
              </h3>
              <div className="conversion-summary-grid">
                {quickConversions.map((conv) => (
                  <div className="conv-chip" key={conv.key} style={{ border: conv.key === toUnit ? '1px solid var(--teal)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="conv-chip-val" style={{ color: conv.key === toUnit ? 'var(--teal)' : 'var(--text-primary)' }}>
                      {conv.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
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
