package com.needforfood.mapper;

import com.needforfood.dto.response.ShoppingListItemResponse;
import com.needforfood.dto.response.ShoppingListResponse;
import com.needforfood.model.entity.ShoppingList;

import java.util.List;

public final class ShoppingListMapper {

    private ShoppingListMapper() {
    }

    public static ShoppingListResponse toResponse(ShoppingList list) {
        List<ShoppingListItemResponse> items = list.getItems().stream()
                .map(item -> new ShoppingListItemResponse(
                        item.getIngredient().getId(),
                        item.getIngredient().getName(),
                        item.getIngredient().getUnit(),
                        item.getQuantity(),
                        item.isChecked()))
                .toList();

        return new ShoppingListResponse(list.getId(), list.getName(), list.getCreatedAt(), list.getUser().getId(), items);
    }
}
