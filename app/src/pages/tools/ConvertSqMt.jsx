import { useState } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../../components/InputField';
import { getBighaBreakdown, convertArea } from '../../utils/localCalculator';
import { queueHistory } from '../../utils/historySync';
import './Tools.css';

export default function ConvertSqMt() {
  const [sqm, setSqm] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [equivalents, setEquivalents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    setBreakdown(null);
    setEquivalents(null);

    const val = parseFloat(sqm);
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid non-negative Square Meters value');
      return;
    }

    setLoading(true);
    try {
      // 1. Compute Bigha Breakdown locally
      const breakdownData = getBighaBreakdown(val);
      
      // 2. Compute conversions locally
      const gaj = convertArea(val, "Square Metre", "Square Yard").toFixed(2);
      const sqft = convertArea(val, "Square Metre", "Square Feet").toFixed(2);
      const acres = convertArea(val, "Square Metre", "Acre").toFixed(4);
      const hectares = convertArea(val, "Square Metre", "Hectare").toFixed(4);

      setBreakdown(breakdownData);
      setEquivalents({ gaj, sqft, acres, hectares });

      // Save calculation to history locally (background synced)
      queueHistory(
        'SQ_MT Convert',
        `${val} Sq Mt`,
        `Breakdown: ${breakdownData.bigha} Bigha, ${breakdownData.biswa} Biswa, ${breakdownData.biswansi} Biswansi`
      );
    } catch (err) {
      setError(err.message || 'Error occurred during calculation');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSqm('');
    setBreakdown(null);
    setEquivalents(null);
    setError('');
  };

  return (
    <div className="tool-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">🏢</span>
          <span>SQ_MT To Easy Converter</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="tool-main">
        <div className="tool-welcome-badge">Convert Tool</div>
        <h1 className="tool-title">SQ_MT Convert To Easy</h1>
        <p className="tool-desc">
          Convert Square Meters (m²) into the traditional regional land divisions (Bigha, Biswa, Biswansi) and standard international units via Spring Boot calculations.
        </p>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="status-badge functional">Backend REST Connected</span>
          </div>

          <form onSubmit={handleCalculate}>
            <div className="tool-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-field-group">
                <label className="field-label" htmlFor="sqm-input">Area in Square Meters (m²)</label>
                <div className="field-input-wrapper">
                  <InputField
                    id="sqm-input"
                    name="sqm"
                    type="number"
                    step="any"
                    placeholder="Enter square meters"
                    value={sqm}
                    onChange={(e) => { setSqm(e.target.value); if (breakdown) setBreakdown(null); }}
                    icon="🏢"
                  />
                  <span className="field-unit">m²</span>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--magenta)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '20px', textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="tool-btn-primary" disabled={loading}>
                {loading ? 'Converting...' : 'Convert To Easy Units'}
              </button>
              <button 
                type="button" 
                className="tool-btn-secondary" 
                onClick={handleClear}
                disabled={!sqm && !breakdown}
              >
                Clear
              </button>
            </div>
          </form>

          {breakdown && equivalents && (
            <div style={{ marginTop: '32px' }}>
              <div className="result-panel">
                <div className="result-label">Standard Equivalents</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px', margin: '12px 0' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--teal)' }}>{parseFloat(equivalents.gaj).toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sq Yards (Gaj)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--teal)' }}>{parseFloat(equivalents.sqft).toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Square Feet</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--teal)' }}>{parseFloat(equivalents.acres).toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Acres</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--teal)' }}>{parseFloat(equivalents.hectares).toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Hectares</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                {/* Bigha Biswa Panel */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 78, 161, 0.25)', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ color: 'var(--magenta)', fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid rgba(255, 78, 161, 0.15)', paddingBottom: '8px', fontWeight: '700' }}>
                    Mixed-Unit Bigha Breakdown
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{breakdown.bigha}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>BIGHA</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{breakdown.biswa}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>BISWA</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{breakdown.biswansi}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>BISWANSI</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                    Mixed Breakdown: <strong>{breakdown.bigha} Bigha, {breakdown.biswa} Biswa, {breakdown.biswansi} Biswansi</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="formula-box" style={{ marginTop: '24px' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--teal)' }}>Subcontinental Mixed-Unit Constants:</div>
            <div style={{ fontSize: '0.8rem' }}>• 1 Bigha = 632.3213 m²</div>
            <div style={{ fontSize: '0.8rem' }}>• 1 Biswa = 31.6160 m² (1 Bigha = 20 Biswa)</div>
            <div style={{ fontSize: '0.8rem' }}>• 1 Biswansi = 1.5808 m² (1 Biswa = 20 Biswansi)</div>
          </div>
        </div>
      </main>
    </div>
  );
}
