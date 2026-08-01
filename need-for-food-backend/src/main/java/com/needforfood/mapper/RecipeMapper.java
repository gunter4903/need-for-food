package com.needforfood.mapper;

import com.needforfood.dto.request.RecipeRequest;
import com.needforfood.dto.response.RecipeImageResponse;
import com.needforfood.dto.response.RecipeIngredientResponse;
import com.needforfood.dto.response.RecipeMatchResponse;
import com.needforfood.dto.response.RecipeResponse;
import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeImage;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.service.RecipeMatch;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class RecipeMapper {

    private RecipeMapper() {
    }

    public static Recipe toEntity(RecipeRequest request) {
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
                .difficulty(request.getDifficulty())
                .preparationTime(request.getPreparationTime())
                .servings(request.getServings())
                .ingredients(ingredients)
                .steps(steps)
                .build();
    }

    public static RecipeResponse toResponse(Recipe recipe) {
        return toResponse(recipe, false);
    }

    public static RecipeResponse toResponse(Recipe recipe, boolean favorite) {
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

        List<RecipeImageResponse> images = recipe.getImages().stream()
                .sorted(Comparator.comparing(RecipeImage::getPosition))
                .map(img -> new RecipeImageResponse(img.getId(), img.getUrl(), img.getPosition()))
                .toList();

        return new RecipeResponse(
                recipe.getId(),
                recipe.getTitle(),
                recipe.getDescription(),
                recipe.getType(),
                recipe.getDiet(),
                recipe.getDifficulty(),
                images,
                recipe.getPreparationTime(),
                recipe.getServings(),
                recipe.getCreatedAt(),
                recipe.getUser().getId(),
                recipe.getUser().getUsername(),
                recipe.getUser().getAvatarUrl(),
                ingredients,
                steps,
                favorite);
    }

    public static RecipeMatchResponse toMatchResponse(RecipeMatch match, boolean favorite) {
        return new RecipeMatchResponse(toResponse(match.recipe(), favorite), match.matchedCount(), match.totalCount());
    }
}
