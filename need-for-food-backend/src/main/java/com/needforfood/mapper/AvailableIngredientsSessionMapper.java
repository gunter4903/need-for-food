package com.needforfood.mapper;

import com.needforfood.dto.response.AvailableIngredientsSessionResponse;
import com.needforfood.model.document.AvailableIngredientsSession;

public final class AvailableIngredientsSessionMapper {

    private AvailableIngredientsSessionMapper() {
    }

    public static AvailableIngredientsSessionResponse toResponse(AvailableIngredientsSession session) {
        return new AvailableIngredientsSessionResponse(
                session.getId(),
                IngredientQuantityMapper.toResponses(session.getIngredients()),
                session.getSuggestedRecipes(),
                session.getCreatedAt());
    }
}
