package com.needforfood.mapper;

import com.needforfood.dto.response.IngredientResponse;
import com.needforfood.model.entity.Ingredient;

public final class IngredientMapper {

    private IngredientMapper() {
    }

    public static IngredientResponse toResponse(Ingredient ingredient) {
        return new IngredientResponse(ingredient.getId(), ingredient.getName(), ingredient.getUnit());
    }
}
