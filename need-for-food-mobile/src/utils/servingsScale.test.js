import { scaleQuantity, scaleIngredients } from './servingsScale';

describe('scaleQuantity', () => {
    it('scales a numeric quantity by the given factor', () => {
        expect(scaleQuantity(200, 0.5)).toBe(100);
        expect(scaleQuantity(3, 2)).toBe(6);
    });

    it('rounds to 2 decimals to avoid floating-point noise', () => {
        expect(scaleQuantity(1, 0.1 + 0.2)).toBe(0.3);
    });

    it('leaves non-numeric or empty quantities untouched', () => {
        expect(scaleQuantity('', 2)).toBe('');
        expect(scaleQuantity(null, 2)).toBe(null);
        expect(scaleQuantity(undefined, 2)).toBe(undefined);
    });
});

describe('scaleIngredients', () => {
    const ingredients = [
        { ingredientId: 1, name: 'farine', quantity: 200, unit: 'g' },
        { ingredientId: 2, name: 'oeufs', quantity: 3, unit: '' },
    ];

    it('scales every ingredient quantity from the original to the target servings', () => {
        const result = scaleIngredients(ingredients, 10, 2);

        expect(result).toEqual([
            { ingredientId: 1, name: 'farine', quantity: 40, unit: 'g' },
            { ingredientId: 2, name: 'oeufs', quantity: 0.6, unit: '' },
        ]);
    });

    it('returns the list unchanged when target equals original servings', () => {
        expect(scaleIngredients(ingredients, 4, 4)).toBe(ingredients);
    });

    it('returns the list unchanged when servings are missing or invalid', () => {
        expect(scaleIngredients(ingredients, null, 2)).toBe(ingredients);
        expect(scaleIngredients(ingredients, 4, null)).toBe(ingredients);
        expect(scaleIngredients(ingredients, 0, 2)).toBe(ingredients);
    });
});
