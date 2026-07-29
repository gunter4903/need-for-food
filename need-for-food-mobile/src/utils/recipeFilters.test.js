import { filterByTitle, filterByCategory, filterByNameOrCreator, filterByType } from './recipeFilters';

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

const RECIPES_WITH_CREATOR = [
    { id: 1, title: 'Pâtes au pesto', type: 'Plat', diet: 'Végétarien', creatorUsername: 'Julia' },
    { id: 2, title: 'Poulet rôti', type: 'Plat', diet: null, creatorUsername: 'Marc', isOwnRecipe: true },
    { id: 3, title: 'Smoothie mangue', type: 'Boisson', diet: 'Végan', creatorUsername: 'Julia' },
];

describe('filterByNameOrCreator', () => {
    it('returns every recipe when the query is empty', () => {
        expect(filterByNameOrCreator(RECIPES_WITH_CREATOR, '')).toEqual(RECIPES_WITH_CREATOR);
    });

    it('matches case-insensitively on a substring of the title', () => {
        expect(filterByNameOrCreator(RECIPES_WITH_CREATOR, 'PESTO')).toEqual([RECIPES_WITH_CREATOR[0]]);
    });

    it('matches case-insensitively on a substring of the creator username', () => {
        expect(filterByNameOrCreator(RECIPES_WITH_CREATOR, 'julia')).toEqual([
            RECIPES_WITH_CREATOR[0],
            RECIPES_WITH_CREATOR[2],
        ]);
    });

    it('matches a recipe by its real creator username even when it belongs to the viewer (displayed as "Vous")', () => {
        expect(filterByNameOrCreator(RECIPES_WITH_CREATOR, 'marc')).toEqual([RECIPES_WITH_CREATOR[1]]);
    });

    it('matches "vous" for recipes owned by the viewer', () => {
        expect(filterByNameOrCreator(RECIPES_WITH_CREATOR, 'vous')).toEqual([RECIPES_WITH_CREATOR[1]]);
    });

    it('returns an empty array when nothing matches', () => {
        expect(filterByNameOrCreator(RECIPES_WITH_CREATOR, 'lasagnes')).toEqual([]);
    });
});

describe('filterByType', () => {
    it('returns every recipe when no type is selected', () => {
        expect(filterByType(RECIPES_WITH_CREATOR, [])).toEqual(RECIPES_WITH_CREATOR);
        expect(filterByType(RECIPES_WITH_CREATOR, null)).toEqual(RECIPES_WITH_CREATOR);
    });

    it('matches on recipe.type', () => {
        expect(filterByType(RECIPES_WITH_CREATOR, ['Boisson'])).toEqual([RECIPES_WITH_CREATOR[2]]);
    });

    it('matches on recipe.diet', () => {
        expect(filterByType(RECIPES_WITH_CREATOR, ['Végan'])).toEqual([RECIPES_WITH_CREATOR[2]]);
    });

    it('combines several selected values with OR logic', () => {
        expect(filterByType(RECIPES_WITH_CREATOR, ['Plat', 'Végan'])).toEqual(RECIPES_WITH_CREATOR);
        expect(filterByType(RECIPES_WITH_CREATOR, ['Boisson', 'Dessert'])).toEqual([RECIPES_WITH_CREATOR[2]]);
    });

    it('returns an empty array when nothing matches', () => {
        expect(filterByType(RECIPES_WITH_CREATOR, ['Dessert'])).toEqual([]);
    });
});
