package mohd.salman.ansari.service;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AreaCalculationService {

    // ── Module 1 — Area Unit Conversion Factors ─────────────────────────────
    private static final Map<String, Double> FACTOR = Map.ofEntries(
        Map.entry("Square Metre", 1.0),
        Map.entry("Square Kilometre", 1_000_000.0),
        Map.entry("Square Centimetre", 0.0001),
        Map.entry("Square Millimetre", 0.000001),
        Map.entry("Square Feet", 0.09290304),
        Map.entry("Square Inch", 0.00064516),
        Map.entry("Square Yard", 0.83612736),
        Map.entry("Square Mile", 2589988.11),
        Map.entry("Acre", 4046.8564224),
        Map.entry("Hectare", 10000.0),
        Map.entry("Bigha", 632.420131645), // Default to 4046.8564224 / 6.399
        Map.entry("Biswa", 31.621006582),  // Bigha / 20
        Map.entry("Biswansi", 1.581050329)  // Bigha / 400
    );

    public double getFactor(String unit, Double bighaPerAcre) {
        return getFactor(unit, bighaPerAcre, null);
    }

    public double getFactor(String unit, Double bighaPerAcre, Double biswaPerBigha) {
        double b = bighaPerAcre != null ? bighaPerAcre : 6.399;
        double biswaVal = biswaPerBigha != null ? biswaPerBigha : 20.0;

        if (unit.equals("Bigha")) {
            return 4046.8564224 / b;
        }
        if (unit.equals("Biswa")) {
            return (4046.8564224 / b) / biswaVal;
        }
        if (unit.equals("Biswansi")) {
            return (4046.8564224 / b) / (biswaVal * 20.0);
        }

        Double factor = FACTOR.get(unit);
        if (factor == null) throw new IllegalArgumentException("Unknown unit: " + unit);
        return factor;
    }

    public double toBaseUnit(double value, String unit) {
        return toBaseUnit(value, unit, null, null);
    }

    public double toBaseUnit(double value, String unit, Double bighaPerAcre) {
        return toBaseUnit(value, unit, bighaPerAcre, null);
    }

    public double toBaseUnit(double value, String unit, Double bighaPerAcre, Double biswaPerBigha) {
        return value * getFactor(unit, bighaPerAcre, biswaPerBigha);
    }

    public double fromBaseUnit(double valueInSqMetres, String unit) {
        return fromBaseUnit(valueInSqMetres, unit, null, null);
    }

    public double fromBaseUnit(double valueInSqMetres, String unit, Double bighaPerAcre) {
        return fromBaseUnit(valueInSqMetres, unit, bighaPerAcre, null);
    }

    public double fromBaseUnit(double valueInSqMetres, String unit, Double bighaPerAcre, Double biswaPerBigha) {
        return valueInSqMetres / getFactor(unit, bighaPerAcre, biswaPerBigha);
    }

    public double convertArea(double value, String fromUnit, String toUnit) {
        return convertArea(value, fromUnit, toUnit, null, null);
    }

    public double convertArea(double value, String fromUnit, String toUnit, Double bighaPerAcre) {
        return convertArea(value, fromUnit, toUnit, bighaPerAcre, null);
    }

    public double convertArea(double value, String fromUnit, String toUnit, Double bighaPerAcre, Double biswaPerBigha) {
        double sqMetres = toBaseUnit(value, fromUnit, bighaPerAcre, biswaPerBigha);
        return fromBaseUnit(sqMetres, toUnit, bighaPerAcre, biswaPerBigha);
    }

    // ── Module 2 — Heron's Formula for Triangle Area ───────────────────────
    public double triangleArea(double a, double b, double c) {
        if (a <= 0 || b <= 0 || c <= 0) {
            throw new IllegalArgumentException("Triangle side lengths must be positive numbers");
        }
        if (a + b <= c || a + c <= b || b + c <= a) {
            throw new IllegalArgumentException("The given side lengths do not form a valid triangle");
        }
        double s = (a + b + c) / 2.0;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    // ── Module 3 — Bigha / Biswa / Biswansi Breakdown ──────────────────────
    public List<Integer> bighaBiswaBiswansiBreakdown(double areaInSqMetres) {
        return bighaBiswaBiswansiBreakdown(areaInSqMetres, null, null);
    }

    public List<Integer> bighaBiswaBiswansiBreakdown(double areaInSqMetres, Double bighaPerAcre) {
        return bighaBiswaBiswansiBreakdown(areaInSqMetres, bighaPerAcre, null);
    }

    public List<Integer> bighaBiswaBiswansiBreakdown(double areaInSqMetres, Double bighaPerAcre, Double biswaPerBigha) {
        List<Integer> result = new ArrayList<>();

        double bighaTotal = fromBaseUnit(areaInSqMetres, "Bigha", bighaPerAcre, biswaPerBigha);
        int bigha = (int) bighaTotal;
        result.add(bigha);

        double remainderInSqM = toBaseUnit(Math.abs(bighaTotal) - Math.abs(bigha), "Bigha", bighaPerAcre, biswaPerBigha);
        double biswaTotal = fromBaseUnit(remainderInSqM, "Biswa", bighaPerAcre, biswaPerBigha);
        int biswa = (int) biswaTotal;
        result.add(biswa);

        double remainderInSqM2 = toBaseUnit(Math.abs(biswaTotal) - Math.abs(biswa), "Biswa", bighaPerAcre, biswaPerBigha);
        int biswansi = (int) fromBaseUnit(remainderInSqM2, "Biswansi", bighaPerAcre, biswaPerBigha);
        result.add(biswansi);

        return result; // [bigha, biswa, biswansi]
    }

    // ── Module 4 — Length × Breadth Mixed-Unit Breakdown ────────────────────
    public int[] lengthBreadthBreakdown(double length, double breadth) {
        return lengthBreadthBreakdown(length, breadth, null, null);
    }

    public int[] lengthBreadthBreakdown(double length, double breadth, Double bighaPerAcre) {
        return lengthBreadthBreakdown(length, breadth, bighaPerAcre, null);
    }

    public int[] lengthBreadthBreakdown(double length, double breadth, Double bighaPerAcre, Double biswaPerBigha) {
        double area = length * breadth; // area in sq gatta
        double b = bighaPerAcre != null ? bighaPerAcre : 6.399;
        double biswaVal = biswaPerBigha != null ? biswaPerBigha : 20.0;
        double divisor = b * 400.0;

        int part1 = (int) (area / divisor);
        double rem1 = area % divisor;

        int part2 = (int) (rem1 / 400.0);
        double rem2 = rem1 % 400.0;

        double sqGattaPerBiswa = 400.0 / biswaVal;
        int part3 = (int) (rem2 / sqGattaPerBiswa);
        double rem3 = rem2 % sqGattaPerBiswa;

        double sqGattaPerBiswansi = sqGattaPerBiswa / 20.0;
        int part4 = (int) (rem3 / sqGattaPerBiswansi);

        return new int[]{ part1, part2, part3, part4 };
    }

    // ── Module 5 — Gatta length conversions ────────────────────────────────
    public double gattaToMeter(double gatta)  { return inchToMeter(gatta * 99.0); }
    public double gattaToFoot(double gatta)   { return inchToFoot(gatta * 99.0); }
    public double gattaToInch(double gatta)   { return gatta * 99.0; }
    public double inchToGatta(double inch)    { return inch / 99.0; }
    public double meterToGatta(double meter)  { return meterToInch(meter) / 99.0; }
    public double footToGatta(double foot)    { return footToInch(foot) / 99.0; }

    public double inchToMeter(double inch)  { return inch * 0.0254; }
    public double inchToFoot(double inch)   { return inch / 12.0; }
    public double footToInch(double foot)   { return foot * 12.0; }
    public double footToMeter(double foot)  { return foot * 0.3048; }
    public double meterToInch(double meter) { return meter * 39.37007874; }
    public double meterToFoot(double meter) { return meter * 3.280839895; }

    public double convertLength(double value, String fromUnit, String toUnit) {
        return convertLength(value, fromUnit, toUnit, null);
    }

    public double convertLength(double value, String fromUnit, String toUnit, Double gattaInch) {
        // Normalize input string comparison
        String from = fromUnit.toLowerCase().trim();
        String to = toUnit.toLowerCase().trim();

        if (from.equals(to)) {
            return value;
        }

        // Step 1: Convert input to inches (base unit for length logic)
        double inches;
        double inchVal = gattaInch != null ? gattaInch : 99.0;

        switch (from) {
            case "gatta":
                inches = value * inchVal;
                break;
            case "meter":
            case "metre":
                inches = meterToInch(value);
                break;
            case "foot":
            case "feet":
                inches = footToInch(value);
                break;
            case "inch":
            case "inches":
                inches = value;
                break;
            default:
                throw new IllegalArgumentException("Unknown length unit: " + from);
        }

        // Step 2: Convert from inches to target unit
        switch (to) {
            case "gatta":
                return inches / inchVal;
            case "meter":
            case "metre":
                return inchToMeter(inches);
            case "foot":
            case "feet":
                return inchToFoot(inches);
            case "inch":
            case "inches":
                return inches;
            default:
                throw new IllegalArgumentException("Unknown length unit: " + to);
        }
    }
}
