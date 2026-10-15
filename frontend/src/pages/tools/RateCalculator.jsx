import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { queueHistory } from '../../utils/historySync';
import './Tools.css';

// Units configuration
const CATEGORIES = {
  weight: {
    id: 'weight',
    name: 'Weight',
    icon: '⚖️',
    defaultPrice: '80',
    defaultQty: '1',
    defaultUnit: 'kg',
    units: [
      { id: 'kg', name: 'Kilogram (kg)', factorToGram: 1000 },
      { id: 'g', name: 'Gram (g)', factorToGram: 1 },
      { id: 'mg', name: 'Milligram (mg)', factorToGram: 0.001 },
      { id: 'quintal', name: 'Quintal (100 kg)', factorToGram: 100000 },
    ],
    chips: {
      budget: ['+10', '+50', '+100', '+500', '+1000'],
      quantity: [
        { label: '100 g', val: '100', unit: 'g' },
        { label: '250 g', val: '250', unit: 'g' },
        { label: '500 g', val: '500', unit: 'g' },
        { label: '1 kg', val: '1', unit: 'kg' },
        { label: '5 kg', val: '5', unit: 'kg' },
      ]
    }
  },
  liquid: {
    id: 'liquid',
    name: 'Liquid / Volume',
    icon: '🥛',
    defaultPrice: '65',
    defaultQty: '1',
    defaultUnit: 'L',
    units: [
      { id: 'L', name: 'Litre (L)', factorToMl: 1000 },
      { id: 'ml', name: 'Millilitre (ml)', factorToMl: 1 },
    ],
    chips: {
      budget: ['+10', '+20', '+50', '+100', '+500'],
      quantity: [
        { label: '100 ml', val: '100', unit: 'ml' },
        { label: '250 ml', val: '250', unit: 'ml' },
        { label: '500 ml', val: '500', unit: 'ml' },
        { label: '1 L', val: '1', unit: 'L' },
        { label: '2 L', val: '2', unit: 'L' },
      ]
    }
  },
  count: {
    id: 'count',
    name: 'Counting',
    icon: '🧱',
    defaultPrice: '4500',
    defaultQty: '1000',
    defaultUnit: 'bricks',
    units: [
      { id: 'bricks', name: 'Bricks (Pcs)', factorToPiece: 1 },
      { id: 'pcs', name: 'Pieces', factorToPiece: 1 },
      { id: 'dozen', name: 'Dozen (12 Pcs)', factorToPiece: 12 },
      { id: 'bag', name: 'Bag / Sack', factorToPiece: 1 },
    ],
    chips: {
      budget: ['+500', '+1000', '+5000', '+10000', '+20000'],
      quantity: [
        { label: '100 Pcs', val: '100', unit: 'bricks' },
        { label: '500 Pcs', val: '500', unit: 'bricks' },
        { label: '1000 Pcs', val: '1000', unit: 'bricks' },
        { label: '2500 Pcs', val: '2500', unit: 'bricks' },
        { label: '5000 Pcs', val: '5000', unit: 'bricks' },
      ]
    }
  }
};

export default function RateCalculator() {
  const [category, setCategory] = useState('weight');
  const [calcMode, setCalcMode] = useState('budget'); // 'budget' (₹ -> Qty) | 'quantity' (Qty -> ₹)

  // Input states
  const [ratePrice, setRatePrice] = useState('80');
  const [rateQty, setRateQty] = useState('1');
  const [rateUnit, setRateUnit] = useState('kg');
  
  // Target inputs
  const [targetBudget, setTargetBudget] = useState('50');
  const [targetQuantity, setTargetQuantity] = useState('250');
  const [targetUnit, setTargetUnit] = useState('g');

  // Currently focused field for on-screen dialpad
  // Options: 'ratePrice' | 'rateQty' | 'targetBudget' | 'targetQuantity'
  const [activeField, setActiveField] = useState('targetBudget');

  // Feedback toast
  const [savedToast, setSavedToast] = useState(false);

  // Switch category defaults
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const catConfig = CATEGORIES[newCat];
    setRatePrice(catConfig.defaultPrice);
    setRateQty(catConfig.defaultQty);
    setRateUnit(catConfig.defaultUnit);

    if (newCat === 'weight') {
      setTargetBudget('50');
      setTargetQuantity('250');
      setTargetUnit('g');
    } else if (newCat === 'liquid') {
      setTargetBudget('30');
      setTargetQuantity('500');
      setTargetUnit('ml');
    } else {
      setTargetBudget('12000');
      setTargetQuantity('3500');
      setTargetUnit('bricks');
    }
  };

  // Switch mode
  const handleModeChange = (mode) => {
    setCalcMode(mode);
    if (mode === 'budget') {
      setActiveField('targetBudget');
    } else {
      setActiveField('targetQuantity');
    }
  };

  // Helper to read and update active field value
  const getActiveFieldValue = useCallback(() => {
    switch (activeField) {
      case 'ratePrice': return ratePrice;
      case 'rateQty': return rateQty;
      case 'targetBudget': return targetBudget;
      case 'targetQuantity': return targetQuantity;
      default: return '';
    }
  }, [activeField, ratePrice, rateQty, targetBudget, targetQuantity]);

  const updateActiveFieldValue = useCallback((newVal) => {
    switch (activeField) {
      case 'ratePrice': setRatePrice(newVal); break;
      case 'rateQty': setRateQty(newVal); break;
      case 'targetBudget': setTargetBudget(newVal); break;
      case 'targetQuantity': setTargetQuantity(newVal); break;
      default: break;
    }
  }, [activeField]);

  // Dialpad Key Action
  const handleDialpadPress = useCallback((key) => {
    const currentVal = getActiveFieldValue();

    if (key === 'CLEAR') {
      updateActiveFieldValue('');
      return;
    }

    if (key === 'BACKSPACE') {
      updateActiveFieldValue(currentVal.slice(0, -1));
      return;
    }

    if (key === 'NEXT') {
      // Cycle to next input field
      if (calcMode === 'budget') {
        const order = ['ratePrice', 'rateQty', 'targetBudget'];
        const nextIdx = (order.indexOf(activeField) + 1) % order.length;
        setActiveField(order[nextIdx]);
      } else {
        const order = ['ratePrice', 'rateQty', 'targetQuantity'];
        const nextIdx = (order.indexOf(activeField) + 1) % order.length;
        setActiveField(order[nextIdx]);
      }
      return;
    }

    // Number or decimal input
    if (key === '.') {
      if (currentVal.includes('.')) return;
      updateActiveFieldValue(currentVal ? `${currentVal}.` : '0.');
      return;
    }

    // Multiple zeros
    if (key === '00') {
      if (!currentVal || currentVal === '0') return;
      updateActiveFieldValue(`${currentVal}00`);
      return;
    }

    // Prevent leading zeros like '05'
    if (currentVal === '0') {
      updateActiveFieldValue(key);
      return;
    }

    // Standard digit
    updateActiveFieldValue(`${currentVal}${key}`);
  }, [getActiveFieldValue, updateActiveFieldValue, calcMode, activeField]);

  // Handle Quick Chip click
  const handleQuickChip = (chip) => {
    if (typeof chip === 'string' && chip.startsWith('+')) {
      const addVal = parseFloat(chip.replace('+', ''));
      const curr = parseFloat(getActiveFieldValue()) || 0;
      updateActiveFieldValue((curr + addVal).toString());
    } else if (chip.val && chip.unit) {
      setTargetQuantity(chip.val);
      setTargetUnit(chip.unit);
      setActiveField('targetQuantity');
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        handleDialpadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDialpadPress('BACKSPACE');
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleDialpadPress('CLEAR');
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleDialpadPress('NEXT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDialpadPress]);

  // Mathematical Calculation Engine
  const calculationResult = useMemo(() => {
    const p = parseFloat(ratePrice);
    const q = parseFloat(rateQty);
    if (isNaN(p) || p <= 0 || isNaN(q) || q <= 0) {
      return { error: 'Please enter a valid rate price and quantity.' };
    }

    const currentCat = CATEGORIES[category];

    // ──────────────────────────────────────────
    // Category 1: Weight (Normalized to Grams)
    // ──────────────────────────────────────────
    if (category === 'weight') {
      const rateUnitObj = currentCat.units.find(u => u.id === rateUnit) || currentCat.units[0];
      const baseTotalGrams = q * rateUnitObj.factorToGram;
      const pricePerGram = p / baseTotalGrams;
      const pricePerKg = pricePerGram * 1000;

      if (calcMode === 'budget') {
        const budget = parseFloat(targetBudget);
        if (isNaN(budget) || budget <= 0) {
          return { error: 'Please enter a valid budget amount.' };
        }
        const obtainedGrams = budget / pricePerGram;
        const obtainedKg = obtainedGrams / 1000;
        const obtainedMg = obtainedGrams * 1000;

        return {
          mode: 'budget',
          primaryValue: obtainedGrams >= 1000 
            ? `${obtainedKg.toLocaleString(undefined, { maximumFractionDigits: 3 })}` 
            : `${obtainedGrams.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          primaryUnit: obtainedGrams >= 1000 ? 'kg' : 'gram',
          secondaryText: `${obtainedKg.toFixed(3)} kg = ${obtainedGrams.toFixed(1)} g`,
          breakdown: [
            { label: 'Grams', val: `${obtainedGrams.toLocaleString(undefined, { maximumFractionDigits: 2 })} g` },
            { label: 'Kilograms', val: `${obtainedKg.toFixed(3)} kg` },
            { label: 'Milligrams', val: `${obtainedMg.toLocaleString(undefined, { maximumFractionDigits: 0 })} mg` },
            { label: 'Rate / kg', val: `₹ ${pricePerKg.toFixed(2)}` },
          ],
          formula: `(₹ ${budget} ÷ ₹ ${pricePerKg.toFixed(2)}/kg) = ${obtainedGrams.toFixed(2)} Gram`,
        };
      } else {
        // Mode: Quantity -> Price
        const targetQ = parseFloat(targetQuantity);
        if (isNaN(targetQ) || targetQ <= 0) {
          return { error: 'Please enter a valid quantity.' };
        }
        const targetUnitObj = currentCat.units.find(u => u.id === targetUnit) || currentCat.units[1];
        const targetTotalGrams = targetQ * targetUnitObj.factorToGram;
        const totalPrice = targetTotalGrams * pricePerGram;

        return {
          mode: 'quantity',
          primaryValue: `₹ ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          primaryUnit: '',
          secondaryText: `Total cost for ${targetQ} ${targetUnitObj.name}`,
          breakdown: [
            { label: 'Total Cost', val: `₹ ${totalPrice.toFixed(2)}` },
            { label: 'Per Gram Rate', val: `₹ ${pricePerGram.toFixed(4)}` },
            { label: 'Per kg Rate', val: `₹ ${pricePerKg.toFixed(2)}` },
            { label: 'Net Weight', val: `${(targetTotalGrams / 1000).toFixed(3)} kg` }
          ],
          formula: `${targetQ} ${targetUnitObj.id} × ₹ ${pricePerKg.toFixed(2)}/kg = ₹ ${totalPrice.toFixed(2)}`,
        };
      }
    }

    // ──────────────────────────────────────────
    // Category 2: Liquid (Normalized to Millilitres)
    // ──────────────────────────────────────────
    if (category === 'liquid') {
      const rateUnitObj = currentCat.units.find(u => u.id === rateUnit) || currentCat.units[0];
      const baseTotalMl = q * rateUnitObj.factorToMl;
      const pricePerMl = p / baseTotalMl;
      const pricePerLiter = pricePerMl * 1000;

      if (calcMode === 'budget') {
        const budget = parseFloat(targetBudget);
        if (isNaN(budget) || budget <= 0) {
          return { error: 'Please enter a valid budget amount.' };
        }
        const obtainedMl = budget / pricePerMl;
        const obtainedL = obtainedMl / 1000;

        return {
          mode: 'budget',
          primaryValue: obtainedMl >= 1000 
            ? `${obtainedL.toLocaleString(undefined, { maximumFractionDigits: 3 })}` 
            : `${obtainedMl.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
          primaryUnit: obtainedMl >= 1000 ? 'Litre' : 'mL',
          secondaryText: `${obtainedL.toFixed(3)} L = ${obtainedMl.toFixed(1)} mL`,
          breakdown: [
            { label: 'Millilitres', val: `${obtainedMl.toLocaleString(undefined, { maximumFractionDigits: 1 })} mL` },
            { label: 'Litres', val: `${obtainedL.toFixed(3)} L` },
            { label: 'Rate / Litre', val: `₹ ${pricePerLiter.toFixed(2)}` },
          ],
          formula: `(₹ ${budget} ÷ ₹ ${pricePerLiter.toFixed(2)}/L) = ${obtainedMl.toFixed(1)} mL`,
        };
      } else {
        const targetQ = parseFloat(targetQuantity);
        if (isNaN(targetQ) || targetQ <= 0) {
          return { error: 'Please enter a valid volume quantity.' };
        }
        const targetUnitObj = currentCat.units.find(u => u.id === targetUnit) || currentCat.units[1];
        const targetTotalMl = targetQ * targetUnitObj.factorToMl;
        const totalPrice = targetTotalMl * pricePerMl;

        return {
          mode: 'quantity',
          primaryValue: `₹ ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          primaryUnit: '',
          secondaryText: `Total cost for ${targetQ} ${targetUnitObj.name}`,
          breakdown: [
            { label: 'Total Cost', val: `₹ ${totalPrice.toFixed(2)}` },
            { label: 'Per Litre Rate', val: `₹ ${pricePerLiter.toFixed(2)}` },
            { label: 'Per mL Rate', val: `₹ ${pricePerMl.toFixed(4)}` },
            { label: 'Net Volume', val: `${(targetTotalMl / 1000).toFixed(3)} L` }
          ],
          formula: `${targetQ} ${targetUnitObj.id} × ₹ ${pricePerLiter.toFixed(2)}/L = ₹ ${totalPrice.toFixed(2)}`,
        };
      }
    }

    // ──────────────────────────────────────────
    // Category 3: Counting (Bricks, Pieces, Bags)
    // ──────────────────────────────────────────
    if (category === 'count') {
      const rateUnitObj = currentCat.units.find(u => u.id === rateUnit) || currentCat.units[0];
      const baseTotalPieces = q * rateUnitObj.factorToPiece;
      const pricePerPiece = p / baseTotalPieces;

      if (calcMode === 'budget') {
        const budget = parseFloat(targetBudget);
        if (isNaN(budget) || budget <= 0) {
          return { error: 'Please enter a valid budget amount.' };
        }
        const obtainedPieces = budget / pricePerPiece;

        return {
          mode: 'budget',
          primaryValue: `${obtainedPieces.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          primaryUnit: rateUnitObj.name.split(' ')[0],
          secondaryText: `Approx ${Math.floor(obtainedPieces).toLocaleString()} whole units`,
          breakdown: [
            { label: 'Exact Count', val: `${obtainedPieces.toFixed(2)} Pcs` },
            { label: 'Rounded Units', val: `${Math.floor(obtainedPieces)} Pcs` },
            { label: 'Rate per Piece', val: `₹ ${pricePerPiece.toFixed(2)}` },
            { label: '1000 Units Cost', val: `₹ ${(pricePerPiece * 1000).toFixed(0)}` }
          ],
          formula: `(₹ ${budget} ÷ ₹ ${p}) × ${q} = ${obtainedPieces.toFixed(2)} ${rateUnitObj.name.split(' ')[0]}`,
        };
      } else {
        const targetQ = parseFloat(targetQuantity);
        if (isNaN(targetQ) || targetQ <= 0) {
          return { error: 'Please enter a valid count / pieces quantity.' };
        }
        const targetUnitObj = currentCat.units.find(u => u.id === targetUnit) || currentCat.units[0];
        const targetTotalPieces = targetQ * targetUnitObj.factorToPiece;
        const totalPrice = targetTotalPieces * pricePerPiece;

        return {
          mode: 'quantity',
          primaryValue: `₹ ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          primaryUnit: '',
          secondaryText: `Total cost for ${targetQ} ${targetUnitObj.name}`,
          breakdown: [
            { label: 'Total Cost', val: `₹ ${totalPrice.toFixed(2)}` },
            { label: 'Rate per Single', val: `₹ ${pricePerPiece.toFixed(2)}` },
            { label: 'Cost per 1000', val: `₹ ${(pricePerPiece * 1000).toFixed(0)}` },
            { label: 'Total Pieces', val: `${targetTotalPieces.toLocaleString()} pcs` }
          ],
          formula: `(${targetQ} ÷ ${q}) × ₹ ${p} = ₹ ${totalPrice.toFixed(2)}`,
        };
      }
    }

    return { error: 'Invalid calculation' };
  }, [category, calcMode, ratePrice, rateQty, rateUnit, targetBudget, targetQuantity, targetUnit]);

  // Save to calculation history
  const handleSaveToHistory = () => {
    if (calculationResult.error) return;

    const currCat = CATEGORIES[category];
    const summary = calcMode === 'budget'
      ? `Rate: ₹${ratePrice} / ${rateQty} ${rateUnit} | Budget: ₹${targetBudget}`
      : `Rate: ₹${ratePrice} / ${rateQty} ${rateUnit} | Quantity: ${targetQuantity} ${targetUnit}`;

    const res = `${calculationResult.primaryValue} ${calculationResult.primaryUnit || ''} (${calculationResult.secondaryText || ''})`;

    queueHistory(`Calculator (${currCat.name})`, summary, res);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const currentCategoryConfig = CATEGORIES[category];

  return (
    <div className="tool-page">
      <header className="tool-header">
        <div className="tool-header-title">
          <span className="tool-header-icon">🧮</span>
          <span>Calculator</span>
        </div>
        <Link to="/dashboard" className="btn-back">
          ← Back
        </Link>
      </header>

      <main className="tool-main rate-calc-main" style={{ maxWidth: '960px' }}>
        <div className="tool-welcome-badge">Rate & Units Dialpad</div>
        <h1 className="tool-title">Calculator</h1>
        <p className="tool-desc">
          Instant unit rate calculator for Weight, Liquid, and Counting (Bricks/Pcs). Calculate cost or quantity with the built-in dialpad.
        </p>

        {/* Category Tabs: Weight, Liquid, Counting */}
        <div className="calc-category-tabs">
          {Object.values(CATEGORIES).map((cat) => (
            <button
              key={cat.id}
              type="button"
              id={`tab-${cat.id}`}
              className={`calc-category-btn ${category === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Calculation Mode Toggle */}
        <div className="calc-mode-segmented">
          <button
            type="button"
            id="mode-budget"
            className={`calc-mode-btn ${calcMode === 'budget' ? 'active' : ''}`}
            onClick={() => handleModeChange('budget')}
          >
            <div className="mode-btn-row">
              <span className="mode-btn-icon">💰</span>
              <span className="mode-btn-title">Budget ➔ Qty</span>
            </div>
            <span className="mode-btn-sub">How much will I get?</span>
          </button>
          <button
            type="button"
            id="mode-quantity"
            className={`calc-mode-btn ${calcMode === 'quantity' ? 'active' : ''}`}
            onClick={() => handleModeChange('quantity')}
          >
            <div className="mode-btn-row">
              <span className="mode-btn-icon">📦</span>
              <span className="mode-btn-title">Qty ➔ Price</span>
            </div>
            <span className="mode-btn-sub">How much will it cost?</span>
          </button>
        </div>

        <div className="rate-calc-grid">
          
          {/* 1. Live Instant Results Display Card (Order 1 on mobile, Col 2 Row 1 on desktop) */}
          <div className="rate-result-card">
            <div className="rate-result-top-bar">
              <span className="rate-result-badge">
                <span>⚡ Live Calculation</span>
              </span>
              <span className="rate-result-mode-tag">
                {calcMode === 'budget' ? 'Budget Mode' : 'Quantity Mode'}
              </span>
            </div>

            {calculationResult.error ? (
              <div style={{ color: 'var(--magenta)', fontSize: '0.92rem', padding: '16px 0', textAlign: 'center' }}>
                ⚠️ {calculationResult.error}
              </div>
            ) : (
              <>
                <div className="rate-result-prompt">
                  {calcMode === 'budget' ? 'You will receive:' : 'Total Payable Amount:'}
                </div>

                <div className="rate-result-big">
                  {calculationResult.primaryValue}
                  {calculationResult.primaryUnit && (
                    <span className="rate-result-unit">{calculationResult.primaryUnit}</span>
                  )}
                </div>

                {calculationResult.secondaryText && (
                  <div className="rate-result-subtext">
                    {calculationResult.secondaryText}
                  </div>
                )}

                {/* Multi-unit breakdown */}
                {calculationResult.breakdown && (
                  <div className="rate-breakdown-row">
                    {calculationResult.breakdown.map((item, idx) => (
                      <div key={idx} className="rate-breakdown-chip">
                        <div className="chip-label">{item.label}</div>
                        <div className="chip-val">{item.val}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Calculation formula explanation */}
                {calculationResult.formula && (
                  <div className="rate-formula-display">
                    <span className="formula-tag">Formula:</span>
                    <span>{calculationResult.formula}</span>
                  </div>
                )}

                {/* History Action Row */}
                <div className="rate-history-action-row">
                  <button
                    type="button"
                    className="tool-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    onClick={handleSaveToHistory}
                  >
                    💾 Save Result
                  </button>
                  {savedToast && (
                    <span style={{ color: 'var(--teal)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      ✓ Saved to history!
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 2. Interactive Inputs Card (Order 2 on mobile, Col 1 Row 1 on desktop) */}
          <div className="rate-inputs-card glass-card">
            
            {/* Base Rate Input Row */}
            <div style={{ marginBottom: '12px' }}>
              <div className="rate-section-title" style={{ color: 'var(--teal)' }}>
                1. Base Rate
              </div>
              
              <div className="rate-base-inputs-row">
                {/* Rate Price */}
                <div 
                  id="field-rate-price"
                  className={`calc-interactive-field ${activeField === 'ratePrice' ? 'active-field' : ''}`}
                  onClick={() => setActiveField('ratePrice')}
                >
                  <div className="calc-field-top">
                    <span>Rate Price (₹)</span>
                    {activeField === 'ratePrice' ? (
                      <span className="field-badge-editing">Active</span>
                    ) : (
                      <span className="field-badge-hint">Tap</span>
                    )}
                  </div>
                  <div className="calc-field-main">
                    <div className="calc-field-value">
                      <span>₹ {ratePrice || '0'}</span>
                      {activeField === 'ratePrice' && <span className="calc-cursor" />}
                    </div>
                  </div>
                </div>

                {/* Rate Quantity with Unit Dropdown */}
                <div 
                  id="field-rate-qty"
                  className={`calc-interactive-field ${activeField === 'rateQty' ? 'active-field' : ''}`}
                  onClick={() => setActiveField('rateQty')}
                >
                  <div className="calc-field-top">
                    <span>Per Qty</span>
                    <select 
                      value={rateUnit} 
                      onChange={(e) => setRateUnit(e.target.value)}
                      className="calc-select-dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {currentCategoryConfig.units.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="calc-field-main">
                    <div className="calc-field-value">
                      <span>{rateQty || '0'}</span>
                      {activeField === 'rateQty' && <span className="calc-cursor" />}
                    </div>
                    <span className="calc-field-unit">{rateUnit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Input based on Mode */}
            <div>
              <div className="rate-section-title" style={{ color: 'var(--magenta)' }}>
                {calcMode === 'budget' ? '2. Target Budget' : '2. Required Quantity'}
              </div>

              {calcMode === 'budget' ? (
                /* Budget Input */
                <div 
                  id="field-target-budget"
                  className={`calc-interactive-field ${activeField === 'targetBudget' ? 'active-field' : ''}`}
                  onClick={() => setActiveField('targetBudget')}
                >
                  <div className="calc-field-top">
                    <span>Total Budget Amount</span>
                    {activeField === 'targetBudget' ? (
                      <span className="field-badge-editing">Active</span>
                    ) : (
                      <span className="field-badge-hint">Tap</span>
                    )}
                  </div>
                  <div className="calc-field-main">
                    <div className="calc-field-value target-highlight-val">
                      <span>₹ {targetBudget || '0'}</span>
                      {activeField === 'targetBudget' && <span className="calc-cursor" />}
                    </div>
                    <span className="calc-field-unit">Rupees (₹)</span>
                  </div>
                </div>
              ) : (
                /* Quantity Input with Unit selector */
                <div 
                  id="field-target-quantity"
                  className={`calc-interactive-field ${activeField === 'targetQuantity' ? 'active-field' : ''}`}
                  onClick={() => setActiveField('targetQuantity')}
                >
                  <div className="calc-field-top">
                    <span>Quantity Needed</span>
                    <select 
                      value={targetUnit} 
                      onChange={(e) => setTargetUnit(e.target.value)}
                      className="calc-select-dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {currentCategoryConfig.units.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="calc-field-main">
                    <div className="calc-field-value target-highlight-val">
                      <span>{targetQuantity || '0'}</span>
                      {activeField === 'targetQuantity' && <span className="calc-cursor" />}
                    </div>
                    <span className="calc-field-unit">{targetUnit}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 3. Dialpad & Quick Chips Card (Order 3 on mobile, Col 1 Row 2 on desktop) */}
          <div className="rate-dialpad-card dialpad-card">
            {/* Quick Chips Row */}
            <div className="quick-chips-bar">
              <span className="quick-chips-label">Quick:</span>
              {(calcMode === 'budget' 
                ? currentCategoryConfig.chips.budget 
                : currentCategoryConfig.chips.quantity
              ).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => handleQuickChip(chip)}
                >
                  {typeof chip === 'string' ? `₹ ${chip}` : chip.label}
                </button>
              ))}
            </div>

            {/* Number Keys Grid */}
            <div className="dialpad-grid-layout">
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('7')}>7</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('8')}>8</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('9')}>9</button>
              <button type="button" className="dialpad-key action-backspace" onClick={() => handleDialpadPress('BACKSPACE')} aria-label="Backspace">⌫</button>

              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('4')}>4</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('5')}>5</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('6')}>6</button>
              <button type="button" className="dialpad-key action-clear" onClick={() => handleDialpadPress('CLEAR')}>C</button>

              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('1')}>1</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('2')}>2</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('3')}>3</button>
              <button type="button" className="dialpad-key action-plus-hundred" onClick={() => handleQuickChip('+100')}>+100</button>

              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('0')}>0</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('00')}>00</button>
              <button type="button" className="dialpad-key" onClick={() => handleDialpadPress('.')}>.</button>
              <button type="button" className="dialpad-key action-next" onClick={() => handleDialpadPress('NEXT')}>Next ➔</button>
            </div>
          </div>

          {/* 4. Quick Context / Guide Card (Order 4 on mobile, Col 2 Row 2 on desktop) */}
          <div className="rate-guide-card glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span>💡 Market & Construction Guide</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {category === 'weight' && 'Quickly determine exact grams and kilograms for grocery, farm produce, or building materials (iron/cement) for any budget.'}
              {category === 'liquid' && 'Instantly calculate milliliters (mL) and liters for milk, oils, paint, or chemical supplies based on your budget.'}
              {category === 'count' && 'Accurately estimate total bricks, tiles, or cement bags along with unit price for construction material orders.'}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}


