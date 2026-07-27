package com.needforfood.service;

import com.needforfood.model.entity.Recipe;

public record RecipeMatch(Recipe recipe, int matchedCount, int totalCount) {
}
