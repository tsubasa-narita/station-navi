/**
 * Car label rules for JR lines with 増結 (additional) cars.
 * When base formation is N cars and total is M cars,
 * car numbers N+1..M are displayed as 増1..増(M-N).
 */
const AUGMENT_RULES = {
    'JR湘南新宿ライン': { 15: 11, 14: 10 },
    'JR埼京線': { 15: 10 },
};

export function getCarLabel(carNum, lineName, trainLength) {
    const rules = AUGMENT_RULES[lineName];
    if (rules && rules[trainLength]) {
        const baseCars = rules[trainLength];
        if (carNum > baseCars) {
            return `増${carNum - baseCars}`;
        }
    }
    return String(carNum);
}

export function isAugmentedLine(lineName, trainLength) {
    const rules = AUGMENT_RULES[lineName];
    return rules && rules[trainLength] ? rules[trainLength] : null;
}
