import { normalizeText, textIncludes } from './text';

describe('normalizeText', () => {
    it('lowercases the value', () => {
        expect(normalizeText('GÉRARD')).toBe('gerard');
    });

    it('strips common French accents', () => {
        expect(normalizeText('Éléphant à crème brûlée')).toBe('elephant a creme brulee');
    });

    it('returns an empty string for null/undefined', () => {
        expect(normalizeText(null)).toBe('');
        expect(normalizeText(undefined)).toBe('');
    });
});

describe('textIncludes', () => {
    it('matches regardless of case and accents on both sides', () => {
        expect(textIncludes('Gérard', 'ge')).toBe(true);
        expect(textIncludes('Gérard', 'GE')).toBe(true);
        expect(textIncludes('Gerard', 'gé')).toBe(true);
    });

    it('returns false when the substring is absent', () => {
        expect(textIncludes('Gérard', 'julie')).toBe(false);
    });
});
