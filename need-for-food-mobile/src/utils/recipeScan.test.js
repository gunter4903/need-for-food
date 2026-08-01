import { parseRecipeText } from './recipeScan';

describe('parseRecipeText', () => {
    it('splits title, ingredients and steps using headers', () => {
        const text = [
            'Tarte aux pommes',
            'Ingrédients',
            '200g de farine',
            '3 oeufs',
            '2 tasses de sucre',
            'Préparation',
            '1. Préchauffer le four',
            '2. Mélanger les ingrédients',
        ].join('\n');

        const result = parseRecipeText(text);

        expect(result.title).toBe('Tarte aux pommes');
        expect(result.ingredients).toEqual([
            { name: 'farine', quantity: '200', unit: 'g' },
            { name: 'oeufs', quantity: '3', unit: '' },
            { name: 'sucre', quantity: '2', unit: 'tasses' },
        ]);
        expect(result.steps).toEqual(['Préchauffer le four', 'Mélanger les ingrédients']);
    });

    it('falls back to leading-digit detection when no headers are present', () => {
        const text = ['Pâtes au pesto', '500g de pâtes', 'Faire bouillir de l\'eau salée', 'Cuire les pâtes'].join('\n');

        const result = parseRecipeText(text);

        expect(result.title).toBe('Pâtes au pesto');
        expect(result.ingredients).toEqual([{ name: 'pâtes', quantity: '500', unit: 'g' }]);
        expect(result.steps).toEqual(["Faire bouillir de l'eau salée", 'Cuire les pâtes']);
    });

    it('strips list markers and bullets from step lines', () => {
        const text = ['Titre', 'Préparation', '- Étape une', '• Étape deux', '3) Étape trois'].join('\n');

        const result = parseRecipeText(text);

        expect(result.steps).toEqual(['Étape une', 'Étape deux', 'Étape trois']);
    });

    it('returns empty arrays for empty input', () => {
        expect(parseRecipeText('')).toEqual({ title: '', servings: '', ingredients: [], steps: [] });
        expect(parseRecipeText(null)).toEqual({ title: '', servings: '', ingredients: [], steps: [] });
    });

    it('extracts the number of servings from a standalone line and excludes it from steps', () => {
        const text = ['Tarte aux pommes', 'Pour 4 personnes', 'Préparation', 'Préchauffer le four'].join('\n');

        const result = parseRecipeText(text);

        expect(result.servings).toBe('4');
        expect(result.steps).toEqual(['Préchauffer le four']);
    });

    it('extracts the number of servings from an inline header ("Ingrédients (pour 4 personnes)")', () => {
        const text = ['Cookies', 'Ingrédients (pour 6 personnes)', '200g de farine'].join('\n');

        const result = parseRecipeText(text);

        expect(result.servings).toBe('6');
    });

    it('recognizes headers followed by extra text (site/livre)', () => {
        const text = [
            'Cookies moelleux',
            'Ingrédients (pour 4 personnes)',
            '200g de farine',
            'Préparation :',
            'Mélanger les ingrédients',
        ].join('\n');

        const result = parseRecipeText(text);

        expect(result.ingredients).toEqual([{ name: 'farine', quantity: '200', unit: 'g' }]);
        expect(result.steps).toEqual(['Mélanger les ingrédients']);
    });

    it('drops short noise lines picked up from surrounding website chrome', () => {
        const text = [
            'Cookies moelleux',
            'Ingrédients',
            '200g de farine',
            'Préparation',
            'A',
            'F4',
            'Préchauffer le four',
        ].join('\n');

        const result = parseRecipeText(text);

        expect(result.steps).toEqual(['Préchauffer le four']);
    });

    describe('with scope "ingredients"', () => {
        it('treats every line as an ingredient and leaves the title untouched', () => {
            const text = ['200g de farine', '3 oeufs', 'Ingrédients', 'Pour 4 personnes'].join('\n');

            const result = parseRecipeText(text, { scope: 'ingredients' });

            expect(result.title).toBe('');
            expect(result.servings).toBe('4');
            expect(result.ingredients).toEqual([
                { name: 'farine', quantity: '200', unit: 'g' },
                { name: 'oeufs', quantity: '3', unit: '' },
            ]);
            expect(result.steps).toEqual([]);
        });
    });

    describe('with scope "steps"', () => {
        it('treats every line as a step and leaves the title untouched', () => {
            const text = ['1. Préchauffer le four', '2. Mélanger', 'Préparation'].join('\n');

            const result = parseRecipeText(text, { scope: 'steps' });

            expect(result.title).toBe('');
            expect(result.ingredients).toEqual([]);
            expect(result.steps).toEqual(['Préchauffer le four', 'Mélanger']);
        });
    });
});
