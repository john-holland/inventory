// Unit conversion test
const UNIT_CONVERSIONS = {
    // Weight conversions
    kgToLbs: (kg) => kg * 2.20462,
    lbsToKg: (lbs) => lbs / 2.20462,
    
    // Length conversions
    mToInches: (m) => m * 39.3701,
    inchesToM: (inches) => inches / 39.3701,
    
    // Volume conversions (for shipping calculations)
    m3ToFt3: (m3) => m3 * 35.3147,
    ft3ToM3: (ft3) => ft3 / 35.3147
};

describe('Unit Conversion Tests', () => {
    test('should convert kilograms to pounds correctly', () => {
        expect(UNIT_CONVERSIONS.kgToLbs(1)).toBeCloseTo(2.20462, 5);
        expect(UNIT_CONVERSIONS.kgToLbs(5)).toBeCloseTo(11.0231, 4);
        expect(UNIT_CONVERSIONS.kgToLbs(0.5)).toBeCloseTo(1.10231, 5);
    });

    test('should convert pounds to kilograms correctly', () => {
        expect(UNIT_CONVERSIONS.lbsToKg(2.20462)).toBeCloseTo(1, 5);
        expect(UNIT_CONVERSIONS.lbsToKg(11.0231)).toBeCloseTo(5, 4);
        expect(UNIT_CONVERSIONS.lbsToKg(1.10231)).toBeCloseTo(0.5, 5);
    });

    test('should convert meters to inches correctly', () => {
        expect(UNIT_CONVERSIONS.mToInches(1)).toBeCloseTo(39.3701, 4);
        expect(UNIT_CONVERSIONS.mToInches(0.5)).toBeCloseTo(19.685, 3);
        expect(UNIT_CONVERSIONS.mToInches(0.0254)).toBeCloseTo(1, 4);
    });

    test('should convert inches to meters correctly', () => {
        expect(UNIT_CONVERSIONS.inchesToM(39.3701)).toBeCloseTo(1, 4);
        expect(UNIT_CONVERSIONS.inchesToM(19.685)).toBeCloseTo(0.5, 3);
        expect(UNIT_CONVERSIONS.inchesToM(1)).toBeCloseTo(0.0254, 4);
    });

    test('should handle dimension string conversion', () => {
        const convertDimensions = (dimensions, useMetric) => {
            if (!useMetric) return dimensions;
            
            const dims = dimensions.split('x').map(d => d.trim());
            if (dims.length === 3) {
                const convertedDims = dims.map(d => 
                    UNIT_CONVERSIONS.mToInches(parseFloat(d))
                );
                return convertedDims.join(' x ');
            }
            return dimensions;
        };

        expect(convertDimensions('1 x 0.5 x 0.3', true)).toBe('39.3701 x 19.685 x 11.811');
        expect(convertDimensions('39.3701 x 19.685 x 11.811', false)).toBe('39.3701 x 19.685 x 11.811');
    });
}); 