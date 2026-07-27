package com.needforfood.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserPreferenceRequest {

    private List<String> diet;
    private List<String> allergies;
    private List<String> dislikedIngredients;
    private List<String> favoriteRecipeTypes;
    private Integer maxPreparationTime;
}
