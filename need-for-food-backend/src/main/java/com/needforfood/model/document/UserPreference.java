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

@Document(collection = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    private String id;

    // Référence vers User.id (PostgreSQL) ; pas de FK possible entre les deux bases.
    @Indexed(unique = true)
    private Long userId;

    private List<String> diet;
    private List<String> allergies;
    private List<String> dislikedIngredients;
    private List<String> favoriteRecipeTypes;
    private Integer maxPreparationTime;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
