import { filterByTitle, filterByCategory } from './recipeFilters';

const RECIPES = [
    { id: 1, title: 'Pâtes au pesto', diet: 'Végétarien', preparationTime: 15 },
    { id: 2, title: 'Poulet rôti', diet: null, preparationTime: 90 },
    { id: 3, title: 'Salade César', diet: 'Végétarien', preparationTime: 45 },
    { id: 4, title: 'Curry rapide', diet: null, preparationTime: 20 },
];

describe('filterByTitle', () => {
    it('returns every recipe when the query is empty', () => {
        expect(filterByTitle(RECIPES, '')).toEqual(RECIPES);
    });

    it('matches case-insensitively on a substring of the title', () => {
        expect(filterByTitle(RECIPES, 'PÂTES')).toEqual([RECIPES[0]]);
        expect(filterByTitle(RECIPES, 'poulet')).toEqual([RECIPES[1]]);
    });

    it('returns an empty array when nothing matches', () => {
        expect(filterByTitle(RECIPES, 'lasagnes')).toEqual([]);
    });
});

describe('filterByCategory', () => {
    it('returns every recipe for the "populaire" category (no filter applied)', () => {
        expect(filterByCategory(RECIPES, 'populaire')).toEqual(RECIPES);
    });

    it('keeps only recipes whose diet is "Végétarien" for the "vegetarien" category', () => {
        expect(filterByCategory(RECIPES, 'vegetarien')).toEqual([RECIPES[0], RECIPES[2]]);
    });

    it('keeps only recipes with preparationTime <= 20 for the "rapide" category', () => {
        expect(filterByCategory(RECIPES, 'rapide')).toEqual([RECIPES[0], RECIPES[3]]);
    });

    it('excludes recipes with no preparationTime from the "rapide" category', () => {
        const withoutTime = [{ id: 5, title: 'Mystère', diet: null, preparationTime: null }];
        expect(filterByCategory(withoutTime, 'rapide')).toEqual([]);
    });
});
