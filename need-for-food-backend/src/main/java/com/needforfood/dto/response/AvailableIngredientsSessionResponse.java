package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class AvailableIngredientsSessionResponse {

    private String id;
    private List<IngredientQuantityResponse> ingredients;
    private List<Long> suggestedRecipeIds;
    private LocalDateTime createdAt;
}
