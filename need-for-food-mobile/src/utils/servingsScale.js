export function scaleQuantity(quantity, factor) {
    if (quantity == null || quantity === '') return quantity;
    const num = Number(quantity);
    if (Number.isNaN(num)) return quantity;
    return Math.round(num * factor * 100) / 100;
}

export function scaleIngredients(ingredients, originalServings, targetServings) {
    if (!originalServings || originalServings <= 0 || !targetServings || targetServings === originalServings) {
        return ingredients;
    }
    const factor = targetServings / originalServings;
    return (ingredients || []).map((ingredient) => ({
        ...ingredient,
        quantity: scaleQuantity(ingredient.quantity, factor),
    }));
}
