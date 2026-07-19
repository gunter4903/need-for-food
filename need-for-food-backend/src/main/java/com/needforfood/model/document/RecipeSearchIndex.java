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
 * Index de recherche dénormalisé, maintenu à partir des recettes PostgreSQL, pour accélérer
 * les recherches par type/régime/temps de préparation sans multiplier les jointures SQL.
 */
@Document(collection = "recipe_search_index")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeSearchIndex {

    @Id
    private String id;

    // Référence vers Recipe.id (PostgreSQL)
    @Indexed(unique = true)
    private Long recipeId;

    private String title;
    private String type;
    private String diet;
    private Integer preparationTime;
    private List<String> ingredients;
    private Integer popularityScore;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
