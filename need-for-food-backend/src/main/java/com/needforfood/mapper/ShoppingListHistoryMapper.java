package com.needforfood.mapper;

import com.needforfood.dto.response.ShoppingListHistoryResponse;
import com.needforfood.model.document.ShoppingListHistory;

public final class ShoppingListHistoryMapper {

    private ShoppingListHistoryMapper() {
    }

    public static ShoppingListHistoryResponse toResponse(ShoppingListHistory history) {
        return new ShoppingListHistoryResponse(
                history.getId(),
                history.getRecipes(),
                IngredientQuantityMapper.toResponses(history.getMissingIngredients()),
                history.getGeneratedAt());
    }
}
