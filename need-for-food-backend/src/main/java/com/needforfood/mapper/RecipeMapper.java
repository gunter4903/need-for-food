package com.needforfood.mapper;

import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.response.RecipeIngredientResponse;
import com.needforfood.dto.response.RecipeResponse;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeIngredient;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class RecipeMapper {

    private RecipeMapper() {
    }

    public static Recipe toEntity(RecipeRequest request) {
        // Listes volontairement mutables (pas Stream.toList()) : Hibernate peut adopter
        // directement la collection fournie comme backing store de la PersistentBag, et une
        // liste immuable ferait échouer un futur clear()/add() (ex. RecipeService#updateRecipe).
        List<RecipeIngredient> ingredients = new ArrayList<>(request.getIngredients().stream()
                .map(ri -> RecipeIngredient.builder()
                        .ingredient(Ingredient.builder()
                                .name(ri.getIngredientName())
                                .unit(ri.getUnit())
                                .build())
                        .quantity(ri.getQuantity())
                        .build())
                .toList());

        List<PreparationStep> steps = new ArrayList<>(request.getSteps().stream()
                .map(description -> PreparationStep.builder().description(description).build())
                .toList());

        return Recipe.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .diet(request.getDiet())
                .preparationTime(request.getPreparationTime())
                .ingredients(ingredients)
                .steps(steps)
                .build();
    }

    public static RecipeResponse toResponse(Recipe recipe) {
        List<RecipeIngredientResponse> ingredients = recipe.getIngredients().stream()
                .map(ri -> new RecipeIngredientResponse(
                        ri.getIngredient().getId(),
                        ri.getIngredient().getName(),
                        ri.getIngredient().getUnit(),
                        ri.getQuantity()))
                .toList();

        List<String> steps = recipe.getSteps().stream()
                .sorted(Comparator.comparing(PreparationStep::getStepNumber))
                .map(PreparationStep::getDescription)
                .toList();

        return new RecipeResponse(
                recipe.getId(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getType(),
                recipe.getDiet(),
                recipe.getPreparationTime(),
                recipe.getCreatedAt(),
                recipe.getUser().getId(),
                ingredients,
                steps);
    }
}
