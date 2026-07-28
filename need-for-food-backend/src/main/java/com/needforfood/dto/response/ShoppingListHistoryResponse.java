package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ShoppingListHistoryResponse {

    private String id;
    private List<Long> recipes;
    private List<IngredientQuantityResponse> missingIngredients;
    private LocalDateTime generatedAt;
}
