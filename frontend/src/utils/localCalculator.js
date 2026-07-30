// ── Client-Side Calculations Utility ──────────────────────────────────────────
// Mirrors Java backend AreaCalculationService for instant offline calculations.

const AREA_FACTORS = {
  "Square Metre": 1.0,
  "Square Kilometre": 1000000.0,
  "Square Centimetre": 0.0001,
  "Square Millimetre": 0.000001,
  "Square Feet": 0.09290304,
  "Square Inch": 0.00064516,
  "Square Yard": 0.83612736,
  "Square Mile": 2589988.11,
  "Acre": 4046.8564224,
  "Hectare": 10000.0,
  "Bigha": 632.3213660000052,
  "Biswa": 31.61606830000026,
  "Biswansi": 1.580803415000013
};

// ── Area conversions ──────────────────────────────────────────────────────────
export const convertArea = (value, fromUnit, toUnit) => {
  const fromFactor = AREA_FACTORS[fromUnit];
  const toFactor = AREA_FACTORS[toUnit];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown area unit: ${fromUnit} or ${toUnit}`);
  }
  const sqMetres = value * fromFactor;
  return sqMetres / toFactor;
};

// ── Heron's Formula for Triangle Area ─────────────────────────────────────────
export const calculateTriangleArea = (a, b, c) => {
  if (a <= 0 || b <= 0 || c <= 0) {
    throw new Error("Triangle side lengths must be positive numbers");
  }
  if (a + b <= c || a + c <= b || b + c <= a) {
    throw new Error("The given side lengths do not form a valid triangle");
  }
  const s = (a + b + c) / 2.0;
  return Math.sqrt(s * (s - a) * (s - b) * (s - c));
};

// ── Bigha / Biswa / Biswansi Breakdown ────────────────────────────────────────
export const getBighaBreakdown = (areaInSqMetres) => {
  const bighaTotal = areaInSqMetres / AREA_FACTORS["Bigha"];
  const bigha = Math.floor(Math.abs(bighaTotal)) * Math.sign(bighaTotal);

  const remainderInSqM = (Math.abs(bighaTotal) - Math.abs(bigha)) * AREA_FACTORS["Bigha"];
  const biswaTotal = remainderInSqM / AREA_FACTORS["Biswa"];
  const biswa = Math.floor(Math.abs(biswaTotal)) * Math.sign(biswaTotal);

  const remainderInSqM2 = (Math.abs(biswaTotal) - Math.abs(biswa)) * AREA_FACTORS["Biswa"];
  const biswansi = Math.floor(remainderInSqM2 / AREA_FACTORS["Biswansi"]);

  return { bigha, biswa, biswansi };
};

// ── Length × Breadth Mixed-Unit Breakdown (Rectangle) ──────────────────────────
export const getLengthBreadthBreakdown = (length, breadth) => {
  const area = length * breadth;
  
  const part1 = Math.floor(area / 2559.9997975712663);
  const rem1 = area % 2559.9997975712663;

  const part2 = Math.floor(rem1 / 400.0);
  const rem2 = rem1 % 400.0;

  const part3 = Math.floor(rem2 / 20.0);
  const part4 = Math.floor(rem2 % 20.0);

  return { part1, part2, part3, part4 };
};

// ── Gatta length conversions ──────────────────────────────────────────────────
const lengthToInch = (value, unit) => {
  const u = unit.toLowerCase().trim();
  if (u === 'gatta') return value * 99.0;
  if (u === 'foot' || u === 'feet') return value * 12.0;
  if (u === 'meter' || u === 'metre') return value * 39.37007874;
  if (u === 'inch' || u === 'inches') return value;
  throw new Error(`Unknown length unit: ${unit}`);
};

const inchToUnit = (inches, unit) => {
  const u = unit.toLowerCase().trim();
  if (u === 'gatta') return inches / 99.0;
  if (u === 'foot' || u === 'feet') return inches / 12.0;
  if (u === 'meter' || u === 'metre') return inches * 0.0254;
  if (u === 'inch' || u === 'inches') return inches;
  throw new Error(`Unknown length unit: ${unit}`);
};

export const convertLength = (value, fromUnit, toUnit) => {
  if (fromUnit.toLowerCase().trim() === toUnit.toLowerCase().trim()) return value;
  const inches = lengthToInch(value, fromUnit);
  return inchToUnit(inches, toUnit);
};
