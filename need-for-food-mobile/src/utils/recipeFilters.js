export function filterByTitle(recipes, query) {
    if (!query) {
        return recipes;
    }
    const needle = query.toLowerCase();
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(needle));
}

export function filterByCategory(recipes, category) {
    if (category === 'vegetarien') {
        return recipes.filter((recipe) => (recipe.diet || '').toLowerCase() === 'végétarien');
    }
    if (category === 'rapide') {
        return recipes.filter((recipe) => recipe.preparationTime != null && recipe.preparationTime <= 20);
    }
    return recipes;
}
