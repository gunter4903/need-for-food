package com.needforfood.model.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Objet imbriqué (pas de collection propre) réutilisé par AvailableIngredientsSession.ingredients
 * et ShoppingListHistory.missingIngredients, qui partagent exactement la même forme dans le dossier.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngredientQuantity {

    private String name;
    private Float quantity;
    private String unit;
}
