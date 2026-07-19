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
 * Stockage temporaire des ingrédients déclarés disponibles par l'utilisateur lors d'une
 * recherche "recettes à partir d'ingrédients" (fonctionnalité 5.4 du dossier).
 */
@Document(collection = "available_ingredients_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailableIngredientsSession {

    @Id
    private String id;

    // Référence vers User.id (PostgreSQL)
    @Indexed
    private Long userId;

    private List<IngredientQuantity> ingredients;

    // Références vers Recipe.id (PostgreSQL)
    private List<Long> suggestedRecipes;

    private LocalDateTime createdAt;
}
