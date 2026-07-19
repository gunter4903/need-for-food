package com.needforfood.model.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Historique des listes de courses générées automatiquement à partir de recettes
 * (fonctionnalité 5.5 du dossier) : quelles recettes, quels ingrédients manquants, quand.
 */
@Document(collection = "shopping_list_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShoppingListHistory {

    @Id
    private String id;

    // Référence vers User.id (PostgreSQL)
    @Indexed
    private Long userId;

    // Références vers Recipe.id (PostgreSQL)
    private List<Long> recipes;

    private List<IngredientQuantity> missingIngredients;

    private LocalDateTime generatedAt;
}
