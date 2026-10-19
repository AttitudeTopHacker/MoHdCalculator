import { useState, useEffect, useMemo, useCallback } from 'react';
import './LWAdjustModal.css';

/**
 * LWAdjustModal — Full-Screen Target Area Auto-Fit / Reverse Plot Adjuster
 *
 * Allows users to lock fixed sides and input a Target Area (Acre, Bigha, Biswa, Biswanshi).
 * The unlocked sides are automatically adjusted to achieve the exact target area.
 * Full screen UI. Does NOT close on outside click. Only closes via explicit Close button or Apply.
 */
export default function LWAdjustModal({
  isOpen,
  onClose,
  initialEast = '',
  initialWest = '',
  initialNorth = '',
  initialSouth = '',
  unit = 'gatta',
  bighaScale = 6.399,
  biswaScale = 20.0,
  gattaScale = 99.0,
  initialBreakdown = null,
  onApply
}) {
  // Active unit inside modal ('gatta' | 'foot' | 'meter')
  const [activeUnit, setActiveUnit] = useState(unit || 'gatta');

  // Local Boundary values
  const [east, setEast] = useState('');
  const [west, setWest] = useState('');
  const [north, setNorth] = useState('');
  const [south, setSouth] = useState('');

  // Locked status for each side: true = Fixed/Locked, false = Auto-Fit
  const [locked, setLocked] = useState({
    east: true,
    west: true,
    north: false,
    south: false
  });

  // Target Area breakdown inputs
  const [targetAcre, setTargetAcre] = useState('0');
  const [targetBigha, setTargetBigha] = useState('1');
  const [targetBiswa, setTargetBiswa] = useState('0');
  const [targetBiswansi, setTargetBiswansi] = useState('0');

  // Sync state whenever modal is opened & handle browser back button
  useEffect(() => {
    if (isOpen) {
      setActiveUnit(unit || 'gatta');
      setEast(initialEast || '');
      setWest(initialWest || '');
      setNorth(initialNorth || '');
      setSouth(initialSouth || '');

      // Set target breakdown if provided from main screen calculation
      if (initialBreakdown) {
        setTargetAcre(String(initialBreakdown.acre ?? 0));
        setTargetBigha(String(initialBreakdown.bigha ?? 0));
        setTargetBiswa(String(initialBreakdown.biswa ?? 0));
        setTargetBiswansi(String(initialBreakdown.biswansi ?? 0));
      } else {
        setTargetAcre('0');
        setTargetBigha('1');
        setTargetBiswa('0');
        setTargetBiswansi('0');
      }

      // Default lock state: if North & South are present, lock them (auto breadth),
      // or if East & West are present, lock them
      const hasEW = initialEast && initialWest;
      const hasNS = initialNorth && initialSouth;
      if (hasNS && !hasEW) {
        setLocked({ east: false, west: false, north: true, south: true });
      } else {
        setLocked({ east: true, west: true, north: false, south: false });
      }

      // Prevent accidental page navigation when user presses browser/mobile back:
      window.history.pushState({ lwModal: true }, '');
      const handlePopState = () => {
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, initialEast, initialWest, initialNorth, initialSouth, initialBreakdown, unit, onClose]);

  // Unit conversion helper
  const convertUnit = useCallback((val, from, to) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    const gattaFactor = (gattaScale || 99.0) * 0.0254;
    const localFactors = {
      gatta: gattaFactor,
      foot: 0.3048,
      meter: 1.0,
      inch: 0.0254
    };
    const meters = num * localFactors[from];
    return meters / localFactors[to];
  }, [gattaScale]);

  // Convert entered inputs when user changes unit inside modal
  const handleUnitChange = (newUnit) => {
    if (newUnit === activeUnit) return;
    const eNum = parseFloat(east);
    const wNum = parseFloat(west);
    const nNum = parseFloat(north);
    const sNum = parseFloat(south);

    if (!isNaN(eNum) && eNum > 0) setEast(convertUnit(eNum, activeUnit, newUnit).toFixed(2));
    if (!isNaN(wNum) && wNum > 0) setWest(convertUnit(wNum, activeUnit, newUnit).toFixed(2));
    if (!isNaN(nNum) && nNum > 0) setNorth(convertUnit(nNum, activeUnit, newUnit).toFixed(2));
    if (!isNaN(sNum) && sNum > 0) setSouth(convertUnit(sNum, activeUnit, newUnit).toFixed(2));
    setActiveUnit(newUnit);
  };

  // Compute Auto-fit calculations
  const calcResult = useMemo(() => {
    const b = bighaScale || 6.399;
    const biswaVal = biswaScale || 20.0;
    const sqGattaPerBiswa = 400.0 / biswaVal;
    const sqGattaPerBiswansi = sqGattaPerBiswa / 20.0;

    const aVal = Math.max(0, parseFloat(targetAcre) || 0);
    const bgVal = Math.max(0, parseFloat(targetBigha) || 0);
    const bsVal = Math.max(0, parseFloat(targetBiswa) || 0);
    const bwVal = Math.max(0, parseFloat(targetBiswansi) || 0);

    const totalTargetSqGatta =
      aVal * (b * 400.0) +
      bgVal * 400.0 +
      bsVal * sqGattaPerBiswa +
      bwVal * sqGattaPerBiswansi;

    if (totalTargetSqGatta <= 0) {
      return { error: 'Please enter a target area greater than 0.' };
    }

    // Check count of locked fields
    const lockedCount = Object.values(locked).filter(Boolean).length;
    if (lockedCount === 4) {
      return { error: 'Please uncheck at least one side for Auto-Fit.' };
    }
    if (lockedCount === 0) {
      return { error: 'Please check the side(s) you wish to keep fixed (locked).' };
    }

    // Convert inputs from activeUnit to Gatta base for formula
    const eGatta = convertUnit(east, activeUnit, 'gatta');
    const wGatta = convertUnit(west, activeUnit, 'gatta');
    const nGatta = convertUnit(north, activeUnit, 'gatta');
    const sGatta = convertUnit(south, activeUnit, 'gatta');

    let newEast = east;
    let newWest = west;
    let newNorth = north;
    let newSouth = south;
    let summaryText = '';

    // Scenario 1: North & South are locked (Length fixed), East & West auto-fit
    if (locked.north && locked.south && !locked.east && !locked.west) {
      const sumLength = nGatta + sGatta;
      if (sumLength <= 0) {
        return { error: 'Enter positive length for North and South to auto-fit Width.' };
      }
      const reqSumBreadth = totalTargetSqGatta / sumLength;
      const sideGatta = reqSumBreadth / 2.0;
      const converted = convertUnit(sideGatta, 'gatta', activeUnit).toFixed(2);
      newEast = converted;
      newWest = converted;
      summaryText = `Auto-calculated Width (East & West): ${converted} ${activeUnit}`;
    }
    // Scenario 2: East & West are locked (Breadth fixed), North & South auto-fit
    else if (locked.east && locked.west && !locked.north && !locked.south) {
      const sumBreadth = eGatta + wGatta;
      if (sumBreadth <= 0) {
        return { error: 'Enter positive length for East and West to auto-fit Length.' };
      }
      const reqSumLength = totalTargetSqGatta / sumBreadth;
      const sideGatta = reqSumLength / 2.0;
      const converted = convertUnit(sideGatta, 'gatta', activeUnit).toFixed(2);
      newNorth = converted;
      newSouth = converted;
      summaryText = `Auto-calculated Length (North & South): ${converted} ${activeUnit}`;
    }
    // Scenario 3: Custom single or mixed side calculation
    else {
      const sumLength = nGatta + sGatta;
      const sumBreadth = eGatta + wGatta;

      if (!locked.east && locked.west && sumLength > 0) {
        const reqSumBreadth = totalTargetSqGatta / sumLength;
        const calcEGatta = reqSumBreadth - wGatta;
        if (calcEGatta <= 0) {
          return { error: 'Target area is too small for current West and Length dimensions.' };
        }
        const converted = convertUnit(calcEGatta, 'gatta', activeUnit).toFixed(2);
        newEast = converted;
        summaryText = `Auto-calculated East: ${converted} ${activeUnit}`;
      } else if (!locked.west && locked.east && sumLength > 0) {
        const reqSumBreadth = totalTargetSqGatta / sumLength;
        const calcWGatta = reqSumBreadth - eGatta;
        if (calcWGatta <= 0) {
          return { error: 'Target area is too small for current East and Length dimensions.' };
        }
        const converted = convertUnit(calcWGatta, 'gatta', activeUnit).toFixed(2);
        newWest = converted;
        summaryText = `Auto-calculated West: ${converted} ${activeUnit}`;
      } else if (!locked.north && locked.south && sumBreadth > 0) {
        const reqSumLength = totalTargetSqGatta / sumBreadth;
        const calcNGatta = reqSumLength - sGatta;
        if (calcNGatta <= 0) {
          return { error: 'Target area is too small for current South and Breadth dimensions.' };
        }
        const converted = convertUnit(calcNGatta, 'gatta', activeUnit).toFixed(2);
        newNorth = converted;
        summaryText = `Auto-calculated North: ${converted} ${activeUnit}`;
      } else if (!locked.south && locked.north && sumBreadth > 0) {
        const reqSumLength = totalTargetSqGatta / sumBreadth;
        const calcSGatta = reqSumLength - nGatta;
        if (calcSGatta <= 0) {
          return { error: 'Target area is too small for current North and Breadth dimensions.' };
        }
        const converted = convertUnit(calcSGatta, 'gatta', activeUnit).toFixed(2);
        newSouth = converted;
        summaryText = `Auto-calculated South: ${converted} ${activeUnit}`;
      } else {
        return { error: 'Please lock either both Length sides (North/South) or both Width sides (East/West).' };
      }
    }

    return {
      error: null,
      newEast,
      newWest,
      newNorth,
      newSouth,
      summaryText,
      totalTargetSqGatta
    };
  }, [east, west, north, south, locked, targetAcre, targetBigha, targetBiswa, targetBiswansi, activeUnit, bighaScale, biswaScale, convertUnit]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (calcResult.error) return;

    onApply({
      east: calcResult.newEast ?? east,
      west: calcResult.newWest ?? west,
      north: calcResult.newNorth ?? north,
      south: calcResult.newSouth ?? south,
      lockedSides: locked,
      unit: activeUnit,
      breakdown: {
        acre: parseInt(targetAcre) || 0,
        bigha: parseInt(targetBigha) || 0,
        biswa: parseInt(targetBiswa) || 0,
        biswansi: parseInt(targetBiswansi) || 0
      }
    });
    onClose();
  };

  const setModeLockBreadth = () => {
    setLocked({ east: true, west: true, north: false, south: false });
  };

  const setModeLockLength = () => {
    setLocked({ east: false, west: false, north: true, south: true });
  };

  return (
    <div className="lw-modal-overlay" role="dialog" aria-modal="true">
      <div className="lw-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Sleek Compact Header */}
        <header className="lw-modal-header">
          <div className="lw-modal-title-group">
            <span className="lw-modal-icon-badge">📐</span>
            <h2 className="lw-modal-title">L × W Adjust (Auto-Fit)</h2>
          </div>
          <button
            type="button"
            className="lw-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </header>

        {/* Scrollable Body Content */}
        <div className="lw-modal-body">
          {/* Reference Scale Banner */}
          <div className="lw-ref-banner">
            <span>💡 1 Acre = <strong>{bighaScale} Bigha</strong> · 1 Bigha = <strong>{biswaScale} Biswa</strong> · 1 Gatta = <strong>{gattaScale} in</strong></span>
          </div>

          {/* Unit Selector Row */}
          <div className="lw-unit-selector-row">
            <span className="lw-unit-label">📏 Unit:</span>
            <div className="lw-unit-radio-group">
              <label className={`lw-unit-pill ${activeUnit === 'gatta' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="modalCalculatorUnit"
                  value="gatta"
                  checked={activeUnit === 'gatta'}
                  onChange={() => handleUnitChange('gatta')}
                />
                <span>Gatta ({gattaScale} in)</span>
              </label>

              <label className={`lw-unit-pill ${activeUnit === 'foot' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="modalCalculatorUnit"
                  value="foot"
                  checked={activeUnit === 'foot'}
                  onChange={() => handleUnitChange('foot')}
                />
                <span>Foot</span>
              </label>

              <label className={`lw-unit-pill ${activeUnit === 'meter' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="modalCalculatorUnit"
                  value="meter"
                  checked={activeUnit === 'meter'}
                  onChange={() => handleUnitChange('meter')}
                />
                <span>Meter</span>
              </label>
            </div>
          </div>

          {/* Quick Mode Preset Buttons */}
          <div className="lw-quick-modes-card">
            <button
              type="button"
              className={`lw-mode-pill ${locked.east && locked.west && !locked.north && !locked.south ? 'active' : ''}`}
              onClick={setModeLockBreadth}
            >
              <span>🔒 Lock Width (East/West)</span>
              <span>➔</span>
              <span>⚡ Auto Length (North/South)</span>
            </button>
            <button
              type="button"
              className={`lw-mode-pill ${locked.north && locked.south && !locked.east && !locked.west ? 'active' : ''}`}
              onClick={setModeLockLength}
            >
              <span>🔒 Lock Length (North/South)</span>
              <span>➔</span>
              <span>⚡ Auto Width (East/West)</span>
            </button>
          </div>

          {/* Section 1: Boundary Dimensions */}
          <div>
            <div className="lw-section-header">
              <span className="lw-section-title">
                <span>🧭</span> Plot Boundaries & Side Locks
              </span>
              <span className="lw-unit-tag">{activeUnit}</span>
            </div>

            <div className="lw-boundaries-grid">
              {/* East */}
              <div className={`lw-side-card ${locked.east ? 'locked' : 'auto'}`}>
                <div className="lw-side-card-top">
                  <span className="lw-side-label">East</span>
                  <label className="lw-side-toggle-label">
                    <input
                      type="checkbox"
                      checked={locked.east}
                      onChange={(e) => setLocked((prev) => ({ ...prev, east: e.target.checked }))}
                    />
                    <span className={`lw-side-status-tag ${locked.east ? 'locked' : 'auto'}`}>
                      {locked.east ? '🔒 Fixed (Lock)' : '⚡ Auto-Fit'}
                    </span>
                  </label>
                </div>
                <div className={`lw-side-input-row ${!locked.east ? 'auto-calc' : ''}`}>
                  <input
                    type="number"
                    step="any"
                    className="lw-side-input"
                    value={!locked.east && calcResult.newEast !== undefined ? calcResult.newEast : east}
                    onChange={(e) => setEast(e.target.value)}
                    disabled={!locked.east}
                    placeholder="0.00"
                  />
                  <span className="lw-side-unit">{activeUnit}</span>
                </div>
              </div>

              {/* West */}
              <div className={`lw-side-card ${locked.west ? 'locked' : 'auto'}`}>
                <div className="lw-side-card-top">
                  <span className="lw-side-label">West</span>
                  <label className="lw-side-toggle-label">
                    <input
                      type="checkbox"
                      checked={locked.west}
                      onChange={(e) => setLocked((prev) => ({ ...prev, west: e.target.checked }))}
                    />
                    <span className={`lw-side-status-tag ${locked.west ? 'locked' : 'auto'}`}>
                      {locked.west ? '🔒 Fixed (Lock)' : '⚡ Auto-Fit'}
                    </span>
                  </label>
                </div>
                <div className={`lw-side-input-row ${!locked.west ? 'auto-calc' : ''}`}>
                  <input
                    type="number"
                    step="any"
                    className="lw-side-input"
                    value={!locked.west && calcResult.newWest !== undefined ? calcResult.newWest : west}
                    onChange={(e) => setWest(e.target.value)}
                    disabled={!locked.west}
                    placeholder="0.00"
                  />
                  <span className="lw-side-unit">{activeUnit}</span>
                </div>
              </div>

              {/* North */}
              <div className={`lw-side-card ${locked.north ? 'locked' : 'auto'}`}>
                <div className="lw-side-card-top">
                  <span className="lw-side-label">North</span>
                  <label className="lw-side-toggle-label">
                    <input
                      type="checkbox"
                      checked={locked.north}
                      onChange={(e) => setLocked((prev) => ({ ...prev, north: e.target.checked }))}
                    />
                    <span className={`lw-side-status-tag ${locked.north ? 'locked' : 'auto'}`}>
                      {locked.north ? '🔒 Fixed (Lock)' : '⚡ Auto-Fit'}
                    </span>
                  </label>
                </div>
                <div className={`lw-side-input-row ${!locked.north ? 'auto-calc' : ''}`}>
                  <input
                    type="number"
                    step="any"
                    className="lw-side-input"
                    value={!locked.north && calcResult.newNorth !== undefined ? calcResult.newNorth : north}
                    onChange={(e) => setNorth(e.target.value)}
                    disabled={!locked.north}
                    placeholder="0.00"
                  />
                  <span className="lw-side-unit">{activeUnit}</span>
                </div>
              </div>

              {/* South */}
              <div className={`lw-side-card ${locked.south ? 'locked' : 'auto'}`}>
                <div className="lw-side-card-top">
                  <span className="lw-side-label">South</span>
                  <label className="lw-side-toggle-label">
                    <input
                      type="checkbox"
                      checked={locked.south}
                      onChange={(e) => setLocked((prev) => ({ ...prev, south: e.target.checked }))}
                    />
                    <span className={`lw-side-status-tag ${locked.south ? 'locked' : 'auto'}`}>
                      {locked.south ? '🔒 Fixed (Lock)' : '⚡ Auto-Fit'}
                    </span>
                  </label>
                </div>
                <div className={`lw-side-input-row ${!locked.south ? 'auto-calc' : ''}`}>
                  <input
                    type="number"
                    step="any"
                    className="lw-side-input"
                    value={!locked.south && calcResult.newSouth !== undefined ? calcResult.newSouth : south}
                    onChange={(e) => setSouth(e.target.value)}
                    disabled={!locked.south}
                    placeholder="0.00"
                  />
                  <span className="lw-side-unit">{activeUnit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Target Area Inputs */}
          <div className="lw-target-area-card">
            <div className="lw-section-header">
              <span className="lw-section-title">
                <span>🎯</span> Desired Target Area
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Edit directly</span>
            </div>

            <div className="lw-area-grid">
              <div className="lw-area-field">
                <label>Acre</label>
                <div className="lw-area-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="lw-area-input"
                    value={targetAcre}
                    onChange={(e) => setTargetAcre(e.target.value)}
                  />
                </div>
              </div>

              <div className="lw-area-field">
                <label>Bigha (Beega)</label>
                <div className="lw-area-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="lw-area-input"
                    value={targetBigha}
                    onChange={(e) => setTargetBigha(e.target.value)}
                  />
                </div>
              </div>

              <div className="lw-area-field">
                <label>Biswa (Bisha)</label>
                <div className="lw-area-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="lw-area-input"
                    value={targetBiswa}
                    onChange={(e) => setTargetBiswa(e.target.value)}
                  />
                </div>
              </div>

              <div className="lw-area-field">
                <label>Biswansi</label>
                <div className="lw-area-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="lw-area-input"
                    value={targetBiswansi}
                    onChange={(e) => setTargetBiswansi(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Result Summary */}
          {calcResult.summaryText && !calcResult.error && (
            <div className="lw-live-result-banner">
              <span className="lw-live-result-text">✨ {calcResult.summaryText}</span>
              <span className="lw-live-result-val">Ready</span>
            </div>
          )}

          {/* Error Banner */}
          {calcResult.error && (
            <div className="lw-modal-error">
              ⚠️ {calcResult.error}
            </div>
          )}

          {/* Natural Bottom Actions (Inside Scroll Flow) */}
          <div className="lw-modal-actions">
            <button type="button" className="lw-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="lw-btn-apply"
              disabled={Boolean(calcResult.error)}
              onClick={handleApply}
            >
              ✓ Apply & Get Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
