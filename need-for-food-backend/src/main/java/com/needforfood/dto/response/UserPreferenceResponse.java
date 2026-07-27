package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class UserPreferenceResponse {

    private Long userId;
    private List<String> diet;
    private List<String> allergies;
    private List<String> dislikedIngredients;
    private List<String> favoriteRecipeTypes;
    private Integer maxPreparationTime;
}
