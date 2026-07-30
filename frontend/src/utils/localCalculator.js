// ── Client-Side Calculations Utility ──────────────────────────────────────────
// Mirrors Java backend AreaCalculationService for instant offline calculations.
// Supports dynamic scaling via localStorage variables (user configurable).

export const getGattaInch = () => {
  const val = localStorage.getItem('ac_gatta_inch');
  return val ? parseFloat(val) : 99.0;
};

export const getBighaPerAcre = () => {
  const val = localStorage.getItem('ac_bigha_per_acre');
  return val ? parseFloat(val) : 6.399;
};

const getAreaFactors = () => {
  const bighaPerAcre = getBighaPerAcre();
  // 1 Acre = 4046.8564224 m2. Bigha factor = Acre / BighaPerAcre
  const bighaFactor = 4046.8564224 / bighaPerAcre;
  
  return {
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
    "Bigha": bighaFactor,
    "Biswa": bighaFactor / 20.0,
    "Biswansi": bighaFactor / 400.0
  };
};

// ── Area conversions ──────────────────────────────────────────────────────────
export const convertArea = (value, fromUnit, toUnit) => {
  const factors = getAreaFactors();
  const fromFactor = factors[fromUnit];
  const toFactor = factors[toUnit];
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
  const factors = getAreaFactors();
  const bighaTotal = areaInSqMetres / factors["Bigha"];
  const bigha = Math.floor(Math.abs(bighaTotal)) * Math.sign(bighaTotal);

  const remainderInSqM = (Math.abs(bighaTotal) - Math.abs(bigha)) * factors["Bigha"];
  const biswaTotal = remainderInSqM / factors["Biswa"];
  const biswa = Math.floor(Math.abs(biswaTotal)) * Math.sign(biswaTotal);

  const remainderInSqM2 = (Math.abs(biswaTotal) - Math.abs(biswa)) * factors["Biswa"];
  const biswansi = Math.floor(remainderInSqM2 / factors["Biswansi"]);

  return { bigha, biswa, biswansi };
};

// ── Length × Breadth Mixed-Unit Breakdown (Rectangle) ──────────────────────────
export const getLengthBreadthBreakdown = (length, breadth) => {
  const area = length * breadth; // area in sq gatta
  const b = getBighaPerAcre();
  
  // 1 Acre = BighaPerAcre * 400 sq gatta. e.g. 6.4 * 400 = 2560 sq gatta
  const part1 = Math.floor(area / (b * 400.0));
  const rem1 = area % (b * 400.0);

  const part2 = Math.floor(rem1 / 400.0);
  const rem2 = rem1 % 400.0;

  const part3 = Math.floor(rem2 / 20.0);
  const part4 = Math.floor(rem2 % 20.0);

  return { part1, part2, part3, part4 };
};

// ── Gatta length conversions ──────────────────────────────────────────────────
const lengthToInch = (value, unit) => {
  const u = unit.toLowerCase().trim();
  if (u === 'gatta') return value * getGattaInch();
  if (u === 'foot' || u === 'feet') return value * 12.0;
  if (u === 'meter' || u === 'metre') return value * 39.37007874;
  if (u === 'inch' || u === 'inches') return value;
  throw new Error(`Unknown length unit: ${unit}`);
};

const inchToUnit = (inches, unit) => {
  const u = unit.toLowerCase().trim();
  if (u === 'gatta') return inches / getGattaInch();
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
