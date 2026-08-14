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

  const [biswaPerBigha, setBiswaPerBigha] = useState(() => {
    return localStorage.getItem('ac_biswa_per_bigha') || '20';
  });

  // Helper to save settings and notify parent
  const saveAndNotify = (newEnabled, newBigha, newGatta, newBiswa) => {
    localStorage.setItem('ac_settings_custom', String(newEnabled));
    localStorage.setItem('ac_bigha_per_acre', newBigha);
    localStorage.setItem('ac_gatta_inch', newGatta);
    localStorage.setItem('ac_biswa_per_bigha', newBiswa);

    if (onSettingsChange) {
      onSettingsChange({
        enabled: newEnabled,
        bighaPerAcre: parseFloat(newBigha) || 6.399,
        gattaInch: parseFloat(newGatta) || 99.0,
        biswaPerBigha: parseFloat(newBiswa) || 20.0
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
      setBiswaPerBigha('20');
      saveAndNotify(false, '6.399', '99.0', '20');
    } else {
      saveAndNotify(true, bighaPerAcre, gattaInch, biswaPerBigha);
    }
  };

  const handleBighaChange = (e) => {
    const val = e.target.value;
    setBighaPerAcre(val);
    saveAndNotify(enabled, val, gattaInch, biswaPerBigha);
  };

  const handleGattaChange = (e) => {
    const val = e.target.value;
    setGattaInch(val);
    saveAndNotify(enabled, bighaPerAcre, val, biswaPerBigha);
  };

  const handleBiswaChange = (e) => {
    const val = e.target.value;
    setBiswaPerBigha(val);
    saveAndNotify(enabled, bighaPerAcre, gattaInch, val);
  };

  const handleReset = () => {
    setBighaPerAcre('6.399');
    setGattaInch('99.0');
    setBiswaPerBigha('20');
    setEnabled(false);
    saveAndNotify(false, '6.399', '99.0', '20');
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
              <label>Biswa Per Bigha</label>
              <div className="settings-input-wrapper">
                <input 
                  type="number"
                  step="any"
                  min="0.1"
                  value={biswaPerBigha}
                  disabled={!enabled}
                  onChange={handleBiswaChange}
                />
                <span className="settings-unit">Biswa</span>
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
              Current: 1 Acre = <strong>{parseFloat(bighaPerAcre)} Bigha</strong> · 1 Bigha = <strong>{parseFloat(biswaPerBigha)} Biswa</strong> · 1 Gatta = <strong>{parseFloat(gattaInch)} in</strong>
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
