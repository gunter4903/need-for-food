import { textIncludes } from './text';

export function filterByTitle(recipes, query) {
    if (!query) {
        return recipes;
    }
    return recipes.filter((recipe) => textIncludes(recipe.title, query));
}

export function filterByCategory(recipes, category) {
    if (category === 'vegetarien') {
        return recipes.filter((recipe) => (recipe.diet || '').toLowerCase() === 'végétarien');
    }
    if (category === 'rapide') {
        return recipes.filter((recipe) => recipe.preparationTime != null && recipe.preparationTime <= 20);
    }
    if (category === 'favoris') {
        return recipes.filter((recipe) => !!recipe.favorite);
    }
    return recipes;
}

export function filterByNameOrCreator(recipes, query) {
    if (!query) {
        return recipes;
    }
    return recipes.filter(
        (recipe) =>
            textIncludes(recipe.title, query) ||
            textIncludes(recipe.creatorUsername, query) ||
            (recipe.isOwnRecipe && textIncludes('vous', query))
    );
}

export function filterByType(recipes, types) {
    if (!types || types.length === 0) {
        return recipes;
    }
    return recipes.filter((recipe) => types.includes(recipe.type) || types.includes(recipe.diet));
}
