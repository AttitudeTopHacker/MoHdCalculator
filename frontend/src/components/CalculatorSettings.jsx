import { useState, useEffect } from 'react';
import './CalculatorSettings.css';

export default function CalculatorSettings({ onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('ac_settings_custom') === 'true';
  });
  
  const [bighaPerAcre, setBighaPerAcre] = useState(() => {
    return localStorage.getItem('ac_bigha_per_acre') || '6.399';
  });

  const [gattaInch, setGattaInch] = useState(() => {
    return localStorage.getItem('ac_gatta_inch') || '99.0';
  });

  // Keep state synced with localStorage
  useEffect(() => {
    localStorage.setItem('ac_settings_custom', String(enabled));
    if (!enabled) {
      // Revert to defaults if disabled
      localStorage.setItem('ac_bigha_per_acre', '6.399');
      localStorage.setItem('ac_gatta_inch', '99.0');
      setBighaPerAcre('6.399');
      setGattaInch('99.0');
    } else {
      localStorage.setItem('ac_bigha_per_acre', bighaPerAcre);
      localStorage.setItem('ac_gatta_inch', gattaInch);
    }
    if (onSettingsChange) onSettingsChange();
  }, [enabled, bighaPerAcre, gattaInch, onSettingsChange]);

  const handleReset = () => {
    setBighaPerAcre('6.399');
    setGattaInch('99.0');
    setEnabled(false);
  };

  return (
    <div className="calc-settings-container">
      <button 
        type="button"
        className={`calc-settings-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>⚙️ Scale Settings</span>
        <span className="toggle-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="calc-settings-panel glass-card">
          <div className="settings-row-checkbox">
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Use Custom Regional Scale
            </label>
          </div>

          <div className={`settings-inputs-grid ${enabled ? 'active' : 'disabled'}`}>
            <div className="settings-field">
              <label>Bigha Per Acre</label>
              <div className="settings-input-wrapper">
                <input 
                  type="number"
                  step="any"
                  min="0.1"
                  value={bighaPerAcre}
                  disabled={!enabled}
                  onChange={(e) => setBighaPerAcre(e.target.value)}
                />
                <span className="settings-unit">Bigha</span>
              </div>
            </div>

            <div className="settings-field">
              <label>Gatta Length (Inches)</label>
              <div className="settings-input-wrapper">
                <input 
                  type="number"
                  step="any"
                  min="1"
                  value={gattaInch}
                  disabled={!enabled}
                  onChange={(e) => setGattaInch(e.target.value)}
                />
                <span className="settings-unit">Inch</span>
              </div>
            </div>
          </div>

          <div className="settings-footer">
            <div className="current-scale-summary">
              Current: 1 Acre = <strong>{parseFloat(bighaPerAcre)} Bigha</strong> · 1 Gatta = <strong>{parseFloat(gattaInch)} in</strong>
            </div>
            {enabled && (
              <button type="button" className="settings-reset-btn" onClick={handleReset}>
                Reset to Standard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
