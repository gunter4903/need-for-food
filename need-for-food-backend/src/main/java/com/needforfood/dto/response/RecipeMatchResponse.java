package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RecipeMatchResponse {

    private RecipeResponse recipe;
    private int matchedCount;
    private int totalCount;
}
