import { useState } from 'react';
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

  // Helper to save settings and notify parent
  const saveAndNotify = (newEnabled, newBigha, newGatta) => {
    localStorage.setItem('ac_settings_custom', String(newEnabled));
    localStorage.setItem('ac_bigha_per_acre', newBigha);
    localStorage.setItem('ac_gatta_inch', newGatta);

    if (onSettingsChange) {
      onSettingsChange({
        enabled: newEnabled,
        bighaPerAcre: parseFloat(newBigha) || 6.399,
        gattaInch: parseFloat(newGatta) || 99.0
      });
    }
  };

  const handleToggleEnabled = (e) => {
    const isChecked = e.target.checked;
    setEnabled(isChecked);
    if (!isChecked) {
      // Revert to standard defaults
      setBighaPerAcre('6.399');
      setGattaInch('99.0');
      saveAndNotify(false, '6.399', '99.0');
    } else {
      saveAndNotify(true, bighaPerAcre, gattaInch);
    }
  };

  const handleBighaChange = (e) => {
    const val = e.target.value;
    setBighaPerAcre(val);
    saveAndNotify(enabled, val, gattaInch);
  };

  const handleGattaChange = (e) => {
    const val = e.target.value;
    setGattaInch(val);
    saveAndNotify(enabled, bighaPerAcre, val);
  };

  const handleReset = () => {
    setBighaPerAcre('6.399');
    setGattaInch('99.0');
    setEnabled(false);
    saveAndNotify(false, '6.399', '99.0');
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
                onChange={handleToggleEnabled}
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
                  onChange={handleBighaChange}
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
                  onChange={handleGattaChange}
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
